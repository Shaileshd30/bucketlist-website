begin;

create table if not exists public.custom_booking_installments (
  id uuid primary key default gen_random_uuid(),
  custom_booking_id uuid not null
    references public.custom_bookings(id) on delete cascade,
  installment_number integer not null,
  label text not null,
  amount numeric(12, 2) not null,
  due_date date,
  paid_amount numeric(12, 2) not null default 0,
  status text not null default 'PENDING',
  razorpay_payment_link_id text unique,
  razorpay_payment_link_url text,
  payment_link_expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint custom_booking_installment_number_unique
    unique (custom_booking_id, installment_number),
  constraint custom_booking_installment_number_check
    check (installment_number between 1 and 10),
  constraint custom_booking_installment_label_check
    check (length(trim(label)) between 1 and 80),
  constraint custom_booking_installment_amount_check
    check (amount > 0),
  constraint custom_booking_installment_paid_amount_check
    check (paid_amount >= 0 and paid_amount <= amount),
  constraint custom_booking_installment_status_check
    check (status in ('PENDING', 'LINK_CREATED', 'PAID', 'FAILED', 'CANCELLED')),
  constraint custom_booking_installment_link_check
    check (
      (razorpay_payment_link_id is null and razorpay_payment_link_url is null)
      or
      (razorpay_payment_link_id is not null and razorpay_payment_link_url is not null)
    )
);

create index if not exists custom_booking_installments_booking_idx
on public.custom_booking_installments (custom_booking_id, installment_number);

create index if not exists custom_booking_installments_due_idx
on public.custom_booking_installments (due_date)
where status in ('PENDING', 'LINK_CREATED');

drop trigger if exists set_custom_booking_installments_updated_at
on public.custom_booking_installments;

create trigger set_custom_booking_installments_updated_at
before update on public.custom_booking_installments
for each row execute function public.update_updated_at_column();

alter table public.custom_booking_installments enable row level security;

revoke all on table public.custom_booking_installments
from public, anon, authenticated;

grant select, insert, update, delete
on table public.custom_booking_installments
to service_role;

alter table public.custom_booking_payments
  add column if not exists installment_id uuid
  references public.custom_booking_installments(id);

insert into public.custom_booking_installments (
  custom_booking_id,
  installment_number,
  label,
  amount,
  due_date,
  paid_amount,
  status,
  razorpay_payment_link_id,
  razorpay_payment_link_url,
  payment_link_expires_at,
  paid_at
)
select
  b.id,
  1,
  'Installment 1',
  b.advance_amount,
  null,
  least(b.amount_paid, b.advance_amount),
  case
    when b.amount_paid >= b.advance_amount then 'PAID'
    when b.razorpay_payment_link_id is not null then 'LINK_CREATED'
    else 'PENDING'
  end,
  b.razorpay_payment_link_id,
  b.razorpay_payment_link_url,
  b.payment_link_expires_at,
  case when b.amount_paid >= b.advance_amount then b.updated_at else null end
from public.custom_bookings b
on conflict (custom_booking_id, installment_number) do nothing;

insert into public.custom_booking_installments (
  custom_booking_id,
  installment_number,
  label,
  amount,
  due_date,
  paid_amount,
  status,
  paid_at
)
select
  b.id,
  2,
  'Installment 2',
  b.total_amount - b.advance_amount,
  b.balance_due_date,
  greatest(0, b.amount_paid - b.advance_amount),
  case
    when b.amount_paid >= b.total_amount then 'PAID'
    else 'PENDING'
  end,
  case when b.amount_paid >= b.total_amount then b.updated_at else null end
from public.custom_bookings b
where b.total_amount > b.advance_amount
on conflict (custom_booking_id, installment_number) do nothing;

update public.custom_booking_payments p
set installment_id = i.id
from public.custom_booking_installments i
where p.installment_id is null
  and i.custom_booking_id = p.custom_booking_id
  and i.razorpay_payment_link_id = p.provider_payment_link_id;

create or replace function public.confirm_custom_booking_payment(
  p_custom_booking_id uuid,
  p_provider_payment_link_id text,
  p_provider_payment_id text,
  p_amount numeric,
  p_currency text,
  p_provider_response jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.custom_bookings%rowtype;
  v_installment public.custom_booking_installments%rowtype;
  v_payment public.custom_booking_payments%rowtype;
  v_payment_id bigint;
  v_new_amount_paid numeric(12, 2);
  v_reason text;
begin
  if p_custom_booking_id is null
     or coalesce(trim(p_provider_payment_link_id), '') = ''
     or coalesce(trim(p_provider_payment_id), '') = ''
  then
    raise exception 'Booking, payment-link and payment IDs are required.';
  end if;

  if p_amount is null
     or p_amount::text in ('NaN', 'Infinity', '-Infinity')
     or p_amount <= 0
     or p_amount <> round(p_amount, 2)
  then
    raise exception 'A positive payment amount in whole paise is required.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('custom-razorpay-payment:' || p_provider_payment_id, 0)
  );

  select * into v_booking
  from public.custom_bookings
  where id = p_custom_booking_id
  for update;

  if not found then raise exception 'Custom booking was not found.'; end if;

  select * into v_payment
  from public.custom_booking_payments
  where provider_payment_id = p_provider_payment_id
  for update;

  if found then
    if v_payment.custom_booking_id is distinct from p_custom_booking_id
       or v_payment.provider_payment_link_id is distinct from p_provider_payment_link_id
       or v_payment.amount is distinct from p_amount
       or v_payment.currency is distinct from p_currency
    then
      raise exception 'Existing payment does not match the supplied booking, link, amount or currency.';
    end if;

    return jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'customBookingId', v_booking.id,
      'bookingReference', v_booking.booking_reference,
      'paymentId', v_payment.id,
      'amountPaid', v_booking.amount_paid,
      'balanceAmount', v_booking.balance_amount
    );
  end if;

  select * into v_installment
  from public.custom_booking_installments
  where custom_booking_id = v_booking.id
    and razorpay_payment_link_id = p_provider_payment_link_id
  for update;

  if not found then
    v_reason := 'CUSTOM_INSTALLMENT_LINK_NOT_FOUND';
  elsif p_currency <> 'INR' then
    v_reason := 'CUSTOM_PAYMENT_CURRENCY_MISMATCH';
  elsif v_booking.booking_status in ('CANCELLED', 'COMPLETED', 'MANUAL_REVIEW') then
    v_reason := 'CUSTOM_BOOKING_NOT_PAYABLE';
  elsif v_booking.payment_status in ('REFUNDED', 'PARTIALLY_REFUNDED') then
    v_reason := 'CUSTOM_BOOKING_REFUND_REQUIRES_REVIEW';
  elsif v_installment.status = 'PAID' then
    v_reason := 'CUSTOM_INSTALLMENT_ALREADY_PAID';
  elsif p_amount <> v_installment.amount - v_installment.paid_amount then
    v_reason := 'CUSTOM_INSTALLMENT_AMOUNT_MISMATCH';
  end if;

  if v_reason is not null then
    if v_booking.booking_status not in ('CANCELLED', 'COMPLETED') then
      update public.custom_bookings
      set booking_status = 'MANUAL_REVIEW'
      where id = v_booking.id;
    end if;

    return jsonb_build_object(
      'ok', false,
      'manualReview', true,
      'reason', v_reason,
      'customBookingId', v_booking.id,
      'bookingReference', v_booking.booking_reference
    );
  end if;

  insert into public.custom_booking_payments (
    custom_booking_id,
    installment_id,
    provider,
    provider_payment_link_id,
    provider_payment_id,
    amount,
    currency,
    status,
    provider_response
  ) values (
    v_booking.id,
    v_installment.id,
    'RAZORPAY',
    p_provider_payment_link_id,
    p_provider_payment_id,
    p_amount,
    'INR',
    'CAPTURED',
    coalesce(p_provider_response, '{}'::jsonb)
  ) returning id into v_payment_id;

  update public.custom_booking_installments
  set
    paid_amount = amount,
    status = 'PAID',
    paid_at = now()
  where id = v_installment.id;

  select coalesce(sum(p.amount), 0)
  into v_new_amount_paid
  from public.custom_booking_payments p
  where p.custom_booking_id = v_booking.id
    and p.status = 'CAPTURED';

  if v_new_amount_paid > v_booking.total_amount then
    raise exception 'Payment exceeds the booking total.';
  end if;

  update public.custom_bookings
  set
    amount_paid = v_new_amount_paid,
    booking_status = 'CONFIRMED',
    payment_status = case
      when v_new_amount_paid = total_amount then 'PAID'
      else 'ADVANCE_PAID'
    end
  where id = v_booking.id
  returning * into v_booking;

  return jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'customBookingId', v_booking.id,
    'bookingReference', v_booking.booking_reference,
    'installmentId', v_installment.id,
    'installmentNumber', v_installment.installment_number,
    'paymentId', v_payment_id,
    'amountPaid', v_booking.amount_paid,
    'balanceAmount', v_booking.balance_amount
  );
end;
$$;

revoke all on function public.confirm_custom_booking_payment(
  uuid, text, text, numeric, text, jsonb
) from public, anon, authenticated;

grant execute on function public.confirm_custom_booking_payment(
  uuid, text, text, numeric, text, jsonb
) to service_role;

commit;
