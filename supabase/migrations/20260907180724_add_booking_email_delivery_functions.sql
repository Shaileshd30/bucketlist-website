begin;

/*
 * Claim one email at a time.
 * SKIP LOCKED allows concurrent workers to select
 * different jobs without waiting for each other.
 */
create or replace function public.claim_booking_email()
returns setof public.booking_email_outbox
language plpgsql
security definer
set search_path = ''
as $$
begin
  /*
   * Stop retrying exhausted jobs whose workers
   * disappeared before recording an outcome.
   */
  update public.booking_email_outbox
  set
    status = 'FAILED',
    locked_at = null,
    lock_token = null,
    last_error = 'Delivery attempts exhausted after worker timeout.',
    updated_at = now()
  where status = 'PROCESSING'
    and locked_at < now() - interval '10 minutes'
    and attempts >= 5;

  return query
  with candidate as (
    select q.id
    from public.booking_email_outbox q
    where q.attempts < 5
      and (
        (
          q.status = 'PENDING'
          and q.next_attempt_at <= now()
        )
        or
        (
          q.status = 'PROCESSING'
          and q.locked_at < now() - interval '10 minutes'
        )
      )
    order by q.next_attempt_at, q.created_at, q.id
    limit 1
    for update skip locked
  )
  update public.booking_email_outbox q
  set
    status = 'PROCESSING',
    attempts = q.attempts + 1,
    locked_at = now(),
    lock_token = gen_random_uuid(),
    updated_at = now()
  from candidate c
  where q.id = c.id
  returning q.*;
end;
$$;

/*
 * Record SMTP acceptance.
 * SENT means the SMTP server accepted the email;
 * it does not guarantee inbox delivery.
 */
create or replace function public.complete_booking_email(
  p_email_id uuid,
  p_lock_token uuid,
  p_smtp_message_id text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  if coalesce(trim(p_smtp_message_id), '') = '' then
    raise exception 'SMTP message ID is required.';
  end if;

  update public.booking_email_outbox
  set
    status = 'SENT',
    sent_at = now(),
    smtp_message_id = left(p_smtp_message_id, 500),
    last_error = null,
    locked_at = null,
    lock_token = null,
    updated_at = now()
  where id = p_email_id
    and status = 'PROCESSING'
    and lock_token = p_lock_token;

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

/*
 * Retry temporary failures with increasing delays.
 * Permanent failures or five unsuccessful attempts
 * require administrator attention.
 */
create or replace function public.fail_booking_email(
  p_email_id uuid,
  p_lock_token uuid,
  p_error text,
  p_retryable boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  update public.booking_email_outbox
  set
    status = case
      when p_retryable is true and attempts < 5
        then 'PENDING'
      else 'FAILED'
    end,

    next_attempt_at = now() +
      case
        when attempts = 1 then interval '1 minute'
        when attempts = 2 then interval '5 minutes'
        when attempts = 3 then interval '15 minutes'
        else interval '1 hour'
      end,

    last_error = left(
      coalesce(
        nullif(trim(p_error), ''),
        'Email delivery failed.'
      ),
      1000
    ),

    locked_at = null,
    lock_token = null,
    updated_at = now()
  where id = p_email_id
    and status = 'PROCESSING'
    and lock_token = p_lock_token;

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

revoke all on function public.claim_booking_email()
from public, anon, authenticated;

revoke all on function public.complete_booking_email(
  uuid, uuid, text
)
from public, anon, authenticated;

revoke all on function public.fail_booking_email(
  uuid, uuid, text, boolean
)
from public, anon, authenticated;

grant execute on function public.claim_booking_email()
to service_role;

grant execute on function public.complete_booking_email(
  uuid, uuid, text
)
to service_role;

grant execute on function public.fail_booking_email(
  uuid, uuid, text, boolean
)
to service_role;

commit;