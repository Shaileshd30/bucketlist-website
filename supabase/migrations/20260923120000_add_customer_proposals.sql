begin;
create table public.customer_proposals (
 id uuid primary key default gen_random_uuid(),
 custom_booking_id uuid not null references public.custom_bookings(id) on delete cascade,
 revision integer not null,
 token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
 booking_snapshot jsonb not null,
 content jsonb not null,
 quotation_updated_at timestamptz not null,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 viewed_at timestamptz,
 revoked_at timestamptz,
 accepted_at timestamptz,
 accepted_name text,
 accepted_option_id text,
 unique(custom_booking_id,revision)
);
alter table public.customer_proposals enable row level security;
revoke all on public.customer_proposals from public,anon,authenticated;
grant select,insert,update on public.customer_proposals to service_role;

create function public.proposal_booking_snapshot(b public.custom_bookings) returns jsonb
language sql immutable set search_path=public,pg_temp as $$
 select jsonb_build_object('reference',b.booking_reference,'title',b.package_name,
 'customer',b.customer_name,'travellers',b.travelers,'start',b.travel_start_date,
 'end',b.travel_end_date,'total',b.total_amount);
$$;
revoke all on function public.proposal_booking_snapshot(public.custom_bookings) from public,anon,authenticated;
grant execute on function public.proposal_booking_snapshot(public.custom_bookings) to service_role;

create function public.issue_customer_proposal(p_booking_id uuid,p_hash text,p_updated_at timestamptz)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare b public.custom_bookings; q public.custom_booking_quotations; p public.customer_proposals; expiry timestamptz;
begin
 select * into b from public.custom_bookings where id=p_booking_id for update;
 if not found or b.booking_status in ('CANCELLED','COMPLETED','MANUAL_REVIEW') then raise exception 'Booking unavailable'; end if;
 select * into q from public.custom_booking_quotations where custom_booking_id=p_booking_id for update;
 if not found or q.updated_at is distinct from p_updated_at then raise exception 'Quotation changed. Reload and try again.'; end if;
 expiry:=((q.content->>'validUntil')::date+1)::timestamp at time zone 'Asia/Kolkata';
 if expiry<=now() then raise exception 'Extend quotation validity before sharing.'; end if;
 update public.customer_proposals set revoked_at=now() where custom_booking_id=p_booking_id and revoked_at is null;
 insert into public.customer_proposals(custom_booking_id,revision,token_hash,booking_snapshot,content,quotation_updated_at,expires_at)
 values(p_booking_id,(select coalesce(max(revision),0)+1 from public.customer_proposals where custom_booking_id=p_booking_id),
 p_hash,public.proposal_booking_snapshot(b),q.content,q.updated_at,expiry) returning * into p;
 return jsonb_build_object('id',p.id,'revision',p.revision,'expiresAt',p.expires_at);
end; $$;

-- Locks serialize acceptance with booking/quotation edits and link replacement.
-- Acceptance records agreement only: it never changes booking totals or payment state.
create function public.access_customer_proposal(p_hash text,p_action text default 'read',p_option text default '',p_name text default '')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare p public.customer_proposals; b public.custom_bookings; q public.custom_booking_quotations; booking_id uuid;
begin
 select custom_booking_id into booking_id from public.customer_proposals where token_hash=p_hash;
 if not found then return jsonb_build_object('error','This proposal link is unavailable.'); end if;
 select * into b from public.custom_bookings where id=booking_id for update;
 select * into q from public.custom_booking_quotations where custom_booking_id=booking_id for update;
 select * into p from public.customer_proposals where token_hash=p_hash for update;
 if p.revoked_at is not null or p.expires_at<=now() or b.booking_status in ('CANCELLED','COMPLETED','MANUAL_REVIEW') then
 return jsonb_build_object('error','This proposal has expired or is no longer available. Please contact your travel team.'); end if;
 if q.updated_at is distinct from p.quotation_updated_at or public.proposal_booking_snapshot(b) is distinct from p.booking_snapshot then
 return jsonb_build_object('error','Your proposal has been updated. Please request a new link from your travel team.'); end if;
 if p_action='accept' then
  if length(btrim(p_name)) not between 2 and 120 then return jsonb_build_object('error','Enter your full name.'); end if;
  if jsonb_array_length(coalesce(p.content->'options','[]'::jsonb))=0 then
   if p_option<>'' then return jsonb_build_object('error','Choose a listed package.'); end if;
  elsif not exists(select 1 from jsonb_array_elements(p.content->'options') o where o->>'id'=p_option and o->>'included'='true') then
   return jsonb_build_object('error','Choose a listed package.');
  end if;
  if p.accepted_at is not null and p.accepted_option_id is distinct from p_option then
   return jsonb_build_object('error','This revision was already accepted. Contact your travel team to change your choice.'); end if;
  if p.accepted_at is null then
   update public.customer_proposals set accepted_at=now(),accepted_name=btrim(p_name),accepted_option_id=p_option where id=p.id returning * into p;
  end if;
 elsif p_action<>'read' then return jsonb_build_object('error','Unsupported action.'); end if;
 if p.viewed_at is null then update public.customer_proposals set viewed_at=now() where id=p.id; end if;
 return jsonb_build_object('bookingId',booking_id,'booking',p.booking_snapshot,'content',p.content,'revision',p.revision,
 'expiresAt',p.expires_at,'acceptedAt',p.accepted_at,'acceptedOptionId',p.accepted_option_id,'acceptedName',p.accepted_name,
 'paid',b.amount_paid,'balance',b.balance_amount,'bookingStatus',b.booking_status);
end; $$;
revoke all on function public.issue_customer_proposal(uuid,text,timestamptz) from public,anon,authenticated;
revoke all on function public.access_customer_proposal(text,text,text,text) from public,anon,authenticated;
grant execute on function public.issue_customer_proposal(uuid,text,timestamptz) to service_role;
grant execute on function public.access_customer_proposal(text,text,text,text) to service_role;
commit;
