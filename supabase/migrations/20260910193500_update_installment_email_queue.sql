begin;

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

    select to_jsonb(p) into v_payment
    from public.payments p
    where p.id = NEW.id;

    if v_payment is null or v_payment->>'status' <> 'CAPTURED' then
      return null;
    end if;

    select to_jsonb(b) into v_booking
    from public.bookings b
    where b.booking_id = v_payment->>'booking_id';

    if v_booking is null then
      raise exception 'Email queue: regular booking not found.';
    end if;

    if v_booking->>'payment_status' <> 'PAID'
       or v_booking->>'booking_status' not in ('CONFIRMED', 'MANUAL_REVIEW')
    then
      return null;
    end if;

    v_reference := v_booking->>'booking_id';
    v_package_name := v_booking->>'trip_title';

    select tb.balance_due_date into v_balance_due_date
    from public.trip_batches tb
    where tb.id = (v_booking->>'batch_id')::uuid;

    select coalesce(sum(p.amount), 0) into v_amount_paid
    from public.payments p
    where p.booking_id = v_reference
      and p.status = 'CAPTURED';

    v_balance_amount := greatest(
      0,
      (v_booking->>'total_amount')::numeric - v_amount_paid
    );

  elsif TG_TABLE_NAME = 'custom_booking_payments' then
    v_booking_type := 'CUSTOM';

    select to_jsonb(p) into v_payment
    from public.custom_booking_payments p
    where p.id = NEW.id;

    if v_payment is null or v_payment->>'status' <> 'CAPTURED' then
      return null;
    end if;

    select to_jsonb(b) into v_booking
    from public.custom_bookings b
    where b.id = (v_payment->>'custom_booking_id')::uuid;

    if v_booking is null then
      raise exception 'Email queue: custom booking not found.';
    end if;

    if v_booking->>'booking_status' not in ('CONFIRMED', 'MANUAL_REVIEW') then
      return null;
    end if;

    v_reference := v_booking->>'booking_reference';
    v_package_name := v_booking->>'package_name';
    v_amount_paid := (v_booking->>'amount_paid')::numeric;
    v_balance_amount := (v_booking->>'balance_amount')::numeric;

    select i.due_date into v_balance_due_date
    from public.custom_booking_installments i
    where i.custom_booking_id = (v_payment->>'custom_booking_id')::uuid
      and i.status in ('PENDING', 'LINK_CREATED')
    order by i.installment_number
    limit 1;

  else
    raise exception 'Unsupported email trigger table.';
  end if;

  if coalesce(v_payment->>'provider_payment_id', '') = '' then
    raise exception 'Email queue: provider payment ID missing.';
  end if;

  v_email_kind := case
    when v_booking->>'booking_status' = 'CONFIRMED' then 'BOOKING_CONFIRMED'
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
  ) values (
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
      'travelStartDate', coalesce(
        v_booking->>'travel_start_date',
        v_booking->>'departure_date'
      ),
      'travelEndDate', coalesce(
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
  ) on conflict do nothing;

  return null;
end;
$$;

revoke all on function public.enqueue_booking_payment_email()
from public, anon, authenticated;

commit;
