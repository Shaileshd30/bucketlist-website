begin;

create table public.booking_email_outbox (
  id uuid primary key default gen_random_uuid(),

  booking_type text not null
    check (booking_type in ('REGULAR', 'CUSTOM')),

  payment_record_id bigint not null,
  provider_payment_id text not null,
  booking_reference text not null,
  recipient_email text not null,

  email_kind text not null
    check (
      email_kind in (
        'BOOKING_CONFIRMED',
        'PAYMENT_UNDER_REVIEW'
      )
    ),

  payload jsonb not null
    check (jsonb_typeof(payload) = 'object'),

  status text not null default 'PENDING'
    check (
      status in (
        'PENDING',
        'PROCESSING',
        'SENT',
        'FAILED'
      )
    ),

  attempts integer not null default 0
    check (attempts >= 0),

  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  lock_token uuid,
  sent_at timestamptz,
  last_error text,
  smtp_message_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint booking_email_payment_record_unique
    unique (booking_type, payment_record_id),

  constraint booking_email_provider_payment_unique
    unique (provider_payment_id)
);

create index booking_email_outbox_pending_idx
on public.booking_email_outbox (
  next_attempt_at,
  created_at
)
where status in ('PENDING', 'PROCESSING');

alter table public.booking_email_outbox
  enable row level security;

revoke all on table public.booking_email_outbox
from public, anon, authenticated;

grant select, insert, update
on table public.booking_email_outbox
to service_role;

/*
 * Deferred triggers read the final payment and booking rows.
 * No email is sent from inside the database transaction.
 */
create or replace function public.enqueue_booking_payment_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment jsonb;
  v_booking jsonb;
  v_booking_type text;
  v_reference text;
  v_package_name text;
  v_email_kind text;
  v_balance_due_date date;
  v_amount_paid numeric;
  v_balance_amount numeric;
begin
  if TG_TABLE_NAME = 'payments' then
    v_booking_type := 'REGULAR';

    select to_jsonb(p)
    into v_payment
    from public.payments p
    where p.id = NEW.id;

    if v_payment is null
       or v_payment->>'status' <> 'CAPTURED'
    then
      return null;
    end if;

    select to_jsonb(b)
    into v_booking
    from public.bookings b
    where b.booking_id = v_payment->>'booking_id';

    if v_booking is null then
      raise exception 'Email queue: regular booking not found.';
    end if;

    /*
     * Queue only after payment has reached a final
     * confirmation outcome in the booking transaction.
     */
    if v_booking->>'payment_status' <> 'PAID'
       or v_booking->>'booking_status'
          not in ('CONFIRMED', 'MANUAL_REVIEW')
    then
      return null;
    end if;

    v_reference := v_booking->>'booking_id';
    v_package_name := v_booking->>'trip_title';

    select tb.balance_due_date
    into v_balance_due_date
    from public.trip_batches tb
    where tb.id = (v_booking->>'batch_id')::uuid;

    select coalesce(sum(p.amount), 0)
    into v_amount_paid
    from public.payments p
    where p.booking_id = v_reference
      and p.status = 'CAPTURED';

    v_balance_amount :=
      greatest(
        0,
        (v_booking->>'total_amount')::numeric
          - v_amount_paid
      );

  elsif TG_TABLE_NAME = 'custom_booking_payments' then
    v_booking_type := 'CUSTOM';

    select to_jsonb(p)
    into v_payment
    from public.custom_booking_payments p
    where p.id = NEW.id;

    if v_payment is null
       or v_payment->>'status' <> 'CAPTURED'
    then
      return null;
    end if;

    select to_jsonb(b)
    into v_booking
    from public.custom_bookings b
    where b.id =
      (v_payment->>'custom_booking_id')::uuid;

    if v_booking is null then
      raise exception 'Email queue: custom booking not found.';
    end if;

    if v_booking->>'booking_status'
       not in ('CONFIRMED', 'MANUAL_REVIEW')
    then
      return null;
    end if;

    v_reference := v_booking->>'booking_reference';
    v_package_name := v_booking->>'package_name';
    v_balance_due_date :=
      (v_booking->>'balance_due_date')::date;
    v_amount_paid :=
      (v_booking->>'amount_paid')::numeric;
    v_balance_amount :=
      (v_booking->>'balance_amount')::numeric;

  else
    raise exception 'Unsupported email trigger table.';
  end if;

  if coalesce(v_payment->>'provider_payment_id', '') = '' then
    raise exception 'Email queue: provider payment ID missing.';
  end if;

  v_email_kind :=
    case
      when v_booking->>'booking_status' = 'CONFIRMED'
        then 'BOOKING_CONFIRMED'
      else 'PAYMENT_UNDER_REVIEW'
    end;

  insert into public.booking_email_outbox (
    booking_type,
    payment_record_id,
    provider_payment_id,
    booking_reference,
    recipient_email,
    email_kind,
    payload
  )
  values (
    v_booking_type,
    NEW.id,
    v_payment->>'provider_payment_id',
    v_reference,
    v_booking->>'email',
    v_email_kind,
    jsonb_build_object(
      'customerName', v_booking->>'customer_name',
      'bookingReference', v_reference,
      'packageName', v_package_name,
      'bookingType', v_booking_type,
      'bookingStatus', v_booking->>'booking_status',
      'travelStartDate',
        coalesce(
          v_booking->>'travel_start_date',
          v_booking->>'departure_date'
        ),
      'travelEndDate',
        coalesce(
          v_booking->>'travel_end_date',
          v_booking->>'return_date'
        ),
      'travelers', (v_booking->>'travelers')::integer,
      'totalAmount', (v_booking->>'total_amount')::numeric,
      'amountReceived', (v_payment->>'amount')::numeric,
      'amountPaid', v_amount_paid,
      'balanceAmount', v_balance_amount,
      'balanceDueDate', v_balance_due_date,
      'currency', v_payment->>'currency',
      'providerPaymentId', v_payment->>'provider_payment_id'
    )
  )
  on conflict do nothing;

  return null;
end;
$$;

revoke all on function
  public.enqueue_booking_payment_email()
from public, anon, authenticated;

/*
 * These triggers affect future inserts/updates only.
 * They do not scan or email historical bookings.
 */
create constraint trigger regular_payment_email_queue
after insert or update on public.payments
deferrable initially deferred
for each row
when (NEW.status = 'CAPTURED')
execute function public.enqueue_booking_payment_email();

create constraint trigger custom_payment_email_queue
after insert or update on public.custom_booking_payments
deferrable initially deferred
for each row
when (NEW.status = 'CAPTURED')
execute function public.enqueue_booking_payment_email();

commit;