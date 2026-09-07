/*
 * Atomically confirm a captured Razorpay
 * payment for a custom booking.
 *
 * The provider payment ID makes webhook
 * retries idempotent.
 */
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
  v_booking
    public.custom_bookings%rowtype;

  v_existing_payment_id bigint;

  v_expected_amount numeric(12, 2);
  v_new_amount_paid numeric(12, 2);
begin
  if (
    p_provider_payment_link_id is null
    or length(
      trim(
        p_provider_payment_link_id
      )
    ) = 0
  ) then
    raise exception
      'Provider payment link ID is required.';
  end if;

  if (
    p_provider_payment_id is null
    or length(
      trim(
        p_provider_payment_id
      )
    ) = 0
  ) then
    raise exception
      'Provider payment ID is required.';
  end if;

  if (
    p_amount is null
    or p_amount <= 0
  ) then
    raise exception
      'Payment amount must be positive.';
  end if;

  if (
    upper(
      coalesce(
        p_currency,
        ''
      )
    ) <> 'INR'
  ) then
    raise exception
      'Payment currency must be INR.';
  end if;

  /*
   * Lock the booking so simultaneous webhook
   * deliveries cannot confirm it twice.
   */
  select *
  into v_booking
  from public.custom_bookings
  where id =
    p_custom_booking_id
  for update;

  if not found then
    raise exception
      'Custom booking was not found.';
  end if;

  /*
   * A cancelled or completed booking should
   * never receive a new advance payment.
   */
  if (
    v_booking.booking_status in (
      'CANCELLED',
      'COMPLETED'
    )
  ) then
    raise exception
      'Custom booking cannot receive payment.';
  end if;

  /*
   * Ensure the signed webhook belongs to the
   * payment link stored against this booking.
   */
  if (
    v_booking.razorpay_payment_link_id
      is distinct from
    p_provider_payment_link_id
  ) then
    raise exception
      'Payment link does not match the booking.';
  end if;

  /*
   * Razorpay can deliver the same webhook more
   * than once. Return success without applying
   * the amount twice.
   */
  select id
  into v_existing_payment_id
  from public.custom_booking_payments
  where provider_payment_id =
    p_provider_payment_id;

  if found then
    return jsonb_build_object(
      'ok',
      true,

      'idempotent',
      true,

      'customBookingId',
      v_booking.id,

      'bookingReference',
      v_booking.booking_reference,

      'paymentId',
      v_existing_payment_id,

      'amountPaid',
      v_booking.amount_paid,

      'balanceAmount',
      v_booking.balance_amount
    );
  end if;

  /*
   * The current link is specifically for the
   * unpaid portion of the agreed advance.
   */
  v_expected_amount :=
    v_booking.advance_amount -
    v_booking.amount_paid;

  if (
    v_expected_amount <= 0
  ) then
    raise exception
      'No advance payment is due.';
  end if;

  if (
    p_amount <>
    v_expected_amount
  ) then
    raise exception
      'Payment amount does not match the advance due.';
  end if;

  v_new_amount_paid :=
    v_booking.amount_paid +
    p_amount;

  if (
    v_new_amount_paid >
    v_booking.total_amount
  ) then
    raise exception
      'Payment exceeds the booking total.';
  end if;

  insert into
    public.custom_booking_payments (
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
    coalesce(
      p_provider_response,
      '{}'::jsonb
    )
  )
  returning id
  into v_existing_payment_id;

  update public.custom_bookings
  set
    amount_paid =
      v_new_amount_paid,

    booking_status =
      case
        when v_new_amount_paid >=
          advance_amount
        then 'CONFIRMED'
        else 'AWAITING_ADVANCE'
      end,

    payment_status =
      case
        when v_new_amount_paid >=
          total_amount
        then 'PAID'
        when v_new_amount_paid >=
          advance_amount
        then 'ADVANCE_PAID'
        else 'LINK_CREATED'
      end
  where id =
    v_booking.id;

  return jsonb_build_object(
    'ok',
    true,

    'idempotent',
    false,

    'customBookingId',
    v_booking.id,

    'bookingReference',
    v_booking.booking_reference,

    'paymentId',
    v_existing_payment_id,

    'amountPaid',
    v_new_amount_paid,

    'balanceAmount',
    v_booking.total_amount -
      v_new_amount_paid
  );
end;
$$;

revoke all on function
  public.confirm_custom_booking_payment(
    uuid,
    text,
    text,
    numeric,
    text,
    jsonb
  )
from public;

grant execute on function
  public.confirm_custom_booking_payment(
    uuid,
    text,
    text,
    numeric,
    text,
    jsonb
  )
to service_role;