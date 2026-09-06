create table public.api_rate_limits (
  rate_key text primary key,
  request_count integer not null default 0,
  window_started_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint api_rate_limits_key_not_blank_check
    check (
      btrim(rate_key) <> ''
      and char_length(rate_key) <= 128
    ),

  constraint api_rate_limits_request_count_check
    check (request_count >= 0),

  constraint api_rate_limits_timestamp_order_check
    check (updated_at >= window_started_at)
);

alter table public.api_rate_limits
  enable row level security;

revoke all
  on table public.api_rate_limits
  from public, anon, authenticated;

create or replace function public.consume_api_rate_limit(
  p_rate_key text,
  p_max_requests integer,
  p_window_seconds integer
)
returns table (
  is_allowed boolean,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_now timestamp with time zone := now();
begin
  if
    p_rate_key is null
    or btrim(p_rate_key) = ''
    or char_length(p_rate_key) > 128
    or p_max_requests <= 0
    or p_window_seconds <= 0
  then
    raise exception 'Invalid rate-limit parameters';
  end if;

  return query
  with updated_limit as (
    insert into public.api_rate_limits as limits (
      rate_key,
      request_count,
      window_started_at,
      updated_at
    )
    values (
      p_rate_key,
      1,
      v_now,
      v_now
    )
    on conflict (rate_key)
    do update set
      request_count =
        case
          when limits.window_started_at <=
            v_now - make_interval(
              secs => p_window_seconds
            )
            then 1
          else limits.request_count + 1
        end,

      window_started_at =
        case
          when limits.window_started_at <=
            v_now - make_interval(
              secs => p_window_seconds
            )
            then v_now
          else limits.window_started_at
        end,

      updated_at = v_now

    returning
      request_count,
      window_started_at
  )
  select
    updated_limit.request_count <=
      p_max_requests,

    case
      when updated_limit.request_count <=
        p_max_requests
        then 0
      else greatest(
        1,
        ceil(
          extract(
            epoch from (
              updated_limit.window_started_at
              + make_interval(
                  secs => p_window_seconds
                )
              - v_now
            )
          )
        )::integer
      )
    end
  from updated_limit;
end;
$function$;

alter function public.consume_api_rate_limit(
  text,
  integer,
  integer
) owner to postgres;

revoke all
  on function public.consume_api_rate_limit(
    text,
    integer,
    integer
  )
  from public, anon, authenticated;

grant execute
  on function public.consume_api_rate_limit(
    text,
    integer,
    integer
  )
  to postgres, service_role;