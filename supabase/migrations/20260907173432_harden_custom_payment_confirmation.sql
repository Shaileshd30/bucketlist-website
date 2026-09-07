create or replace function
  public.confirm_custom_booking_payment(
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
  v_payment public.custom_booking_payments%rowtype;
  v_payment_id bigint;
  v_new_amount_paid numeric(12, 2);
  v_reason text;
begin
  if p_custom_booking_id is null then
    raise exception 'Custom booking ID is required.';
  end if;

  if coalesce(trim(p_provider_payment_link_id), '') = '' then
    raise exception 'Provider payment link ID is required.';
  end if;

  if coalesce(trim(p_provider_payment_id), '') = '' then
    raise exception 'Provider payment ID is required.';
  end if;

  if p_amount is null
     or p_amount::text in ('NaN', 'Infinity', '-Infinity')
     or p_amount <= 0
     or p_amount <> round(p_amount, 2)
  then
    raise exception 'A positive payment amount in whole paise is required.';
  end if;

  if coalesce(p_currency, '') = '' then
    raise exception 'Payment currency is required.';
  end if;

  /*
   * Serialize processing for the same provider payment ID,
   * including attempts referencing different bookings.
   * The lock is released when this transaction ends.
   */
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'custom-razorpay-payment:' || p_provider_payment_id,
      0
    )
  );

  select *
  into v_booking
  from public.custom_bookings
  where id = p_custom_booking_id
  for update;

  if not found then
    raise exception 'Custom booking was not found.';
  end if;

  /*
   * Check payment history before current booking status
   * or advance due. Neither should invalidate a genuine retry.
   */
  select *
  into v_payment
  from public.custom_booking_payments
  where provider_payment_id = p_provider_payment_id
  for update;

  if found then
    if v_payment.custom_booking_id
         is distinct from p_custom_booking_id
       or v_payment.provider
         is distinct from 'RAZORPAY'
       or v_payment.provider_payment_link_id
         is distinct from p_provider_payment_link_id
       or v_payment.amount
         is distinct from p_amount
       or v_payment.currency
         is distinct from p_currency
    then
      raise exception
        'Existing payment does not match the supplied booking, link, amount or currency.';
    end if;

    /*
     * Do not modify either record, including refunded
     * payments or subsequently completed/cancelled bookings.
     */
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

  /*
   * Validate a new payment against the locked booking.
   */
  if v_booking.razorpay_payment_link_id
       is distinct from p_provider_payment_link_id
  then
    raise exception 'Payment link does not match the booking.';
  end if;

  if p_currency <> 'INR' then
    v_reason := 'CUSTOM_PAYMENT_CURRENCY_MISMATCH';

  elsif v_booking.booking_status in ('CANCELLED', 'COMPLETED') then
    v_reason := 'CUSTOM_BOOKING_NOT_PAYABLE';

  elsif v_booking.booking_status = 'MANUAL_REVIEW' then
    v_reason := 'CUSTOM_BOOKING_REQUIRES_REVIEW';

  elsif v_booking.payment_status in (
    'REFUNDED', 'PARTIALLY_REFUNDED'
  ) then
    v_reason := 'CUSTOM_BOOKING_REFUND_REQUIRES_REVIEW';

  elsif v_booking.advance_amount - v_booking.amount_paid <= 0 then
    v_reason := 'CUSTOM_ADVANCE_ALREADY_PAID';

  elsif p_amount <>
        v_booking.advance_amount - v_booking.amount_paid then
    v_reason := 'CUSTOM_PAYMENT_AMOUNT_MISMATCH';
  end if;

  if v_reason is not null then
    /*
     * Preserve terminal booking states. For other states,
     * make the issue visible to the administrator.
     */
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

  v_new_amount_paid := v_booking.amount_paid + p_amount;

  if v_new_amount_paid > v_booking.total_amount then
    raise exception 'Payment exceeds the booking total.';
  end if;

  insert into public.custom_booking_payments (
    custom_booking_id,
    provider,
    provider_payment_link_id,
    provider_payment_id,
    amount,
    currency,
    status,
    provider_response
  )
  values (
    v_booking.id,
    'RAZORPAY',
    p_provider_payment_link_id,
    p_provider_payment_id,
    p_amount,
    'INR',
    'CAPTURED',
    coalesce(p_provider_response, '{}'::jsonb)
  )
  returning id into v_payment_id;

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
    'paymentId', v_payment_id,
    'amountPaid', v_booking.amount_paid,
    'balanceAmount', v_booking.balance_amount
  );
end;
$$;

revoke all on function
  public.confirm_custom_booking_payment(
    uuid, text, text, numeric, text, jsonb
  )
from public, anon, authenticated;

grant execute on function
  public.confirm_custom_booking_payment(
    uuid, text, text, numeric, text, jsonb
  )
to service_role;