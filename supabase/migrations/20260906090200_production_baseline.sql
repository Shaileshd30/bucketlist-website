SET local check_function_bodies = off;

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "authenticated";

CREATE SEQUENCE "public"."payments_id_seq" AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1 NO CYCLE;

CREATE TABLE "public"."admin_login_attempts" (
  "client_key"        text                     NOT NULL,
  "failed_attempts"   integer                  NOT NULL DEFAULT 0,
  "window_started_at" timestamp with time zone NOT NULL DEFAULT now(),
  "blocked_until"     timestamp with time zone,
  "updated_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "admin_login_attempts_client_key_not_blank_check" CHECK ((btrim(client_key) <> ''::text)),
  CONSTRAINT "admin_login_attempts_failed_attempts_check" CHECK ((failed_attempts >= 0)),
  CONSTRAINT "admin_login_attempts_pkey" PRIMARY KEY (client_key),
  CONSTRAINT "admin_login_attempts_timestamp_order_check" CHECK (((updated_at >= window_started_at) AND ((blocked_until IS NULL) OR (blocked_until >= window_started_at))))
);

ALTER TABLE "public"."admin_login_attempts"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."booking_number_counters" (
  "booking_date" date                     NOT NULL,
  "last_number"  integer                  NOT NULL,
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "booking_number_counters_pkey" PRIMARY KEY (booking_date),
  CONSTRAINT "booking_number_counters_positive_check" CHECK ((last_number > 0))
);

ALTER TABLE "public"."booking_number_counters"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."bookings" (
  "id"                 text                     NOT NULL,
  "booking_id"         text                     NOT NULL,
  "trip_id"            text                     NOT NULL,
  "batch_id"           text                     NOT NULL,
  "trip_slug"          text                     NOT NULL,
  "trip_title"         text                     NOT NULL,
  "departure_date"     date                     NOT NULL,
  "return_date"        date,
  "customer_name"      text                     NOT NULL,
  "phone"              text                     NOT NULL,
  "email"              text                     NOT NULL,
  "travelers"          integer                  NOT NULL,
  "price_per_person"   numeric(12,2)            NOT NULL,
  "subtotal"           numeric(12,2)            NOT NULL,
  "coupon_code"        text,
  "discount_amount"    numeric(12,2)            NOT NULL DEFAULT 0,
  "total_amount"       numeric(12,2)            NOT NULL,
  "payment_mode"       text                     NOT NULL,
  "amount_payable_now" numeric(12,2)            NOT NULL,
  "balance_amount"     numeric(12,2)            NOT NULL DEFAULT 0,
  "booking_status"     text                     NOT NULL DEFAULT 'PENDING'::text,
  "payment_status"     text                     NOT NULL DEFAULT 'PENDING'::text,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "terms_accepted_at"  timestamp with time zone,
  "terms_version"      text,
  CONSTRAINT "bookings_amount_payable_now_check" CHECK ((amount_payable_now >= (0)::numeric)),
  CONSTRAINT "bookings_balance_amount_check" CHECK ((balance_amount >= (0)::numeric)),
  CONSTRAINT "bookings_balance_calculation_check" CHECK ((balance_amount = (total_amount - amount_payable_now))),
  CONSTRAINT "bookings_booking_id_key" UNIQUE (booking_id),
  CONSTRAINT "bookings_booking_status_check"
    CHECK ((booking_status = ANY (ARRAY['PENDING'::text, 'CONFIRMED'::text, 'CANCELLED'::text, 'COMPLETED'::text, 'MANUAL_REVIEW'::text]))),
  CONSTRAINT "bookings_coupon_code_not_blank_check" CHECK (((coupon_code IS NULL) OR (btrim(coupon_code) <> ''::text))),
  CONSTRAINT "bookings_customer_format_check" CHECK (((created_at < '2026-09-05 17:16:14.653+00'::timestamp
    with time zone) OR
    (((char_length(btrim(customer_name)) >= 2) AND (char_length(btrim(customer_name)) <= 100)) AND (phone ~ '^[0-9]{10,15}$'::text) AND (char_length(email) <= 254) AND (email ~
    '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'::text) AND (email = lower(email))))),
  CONSTRAINT "bookings_date_range_check" CHECK (((return_date IS NULL) OR (return_date >= departure_date))),
  CONSTRAINT "bookings_discount_amount_check" CHECK ((discount_amount >= (0)::numeric)),
  CONSTRAINT "bookings_discount_not_above_subtotal_check" CHECK ((discount_amount <= subtotal)),
  CONSTRAINT "bookings_payable_not_above_total_check" CHECK ((amount_payable_now <= total_amount)),
  CONSTRAINT "bookings_payment_configuration_check"
    CHECK
    ((((payment_mode = 'FULL'::text) AND (amount_payable_now = total_amount) AND (balance_amount = (0)::numeric)) OR ((payment_mode = 'ADVANCE'::text) AND (amount_payable_now >
    (0)::numeric) AND (amount_payable_now < total_amount) AND (balance_amount > (0)::numeric)))),
  CONSTRAINT "bookings_payment_mode_check" CHECK ((payment_mode = ANY (ARRAY['FULL'::text, 'ADVANCE'::text]))),
  CONSTRAINT "bookings_payment_status_check" CHECK ((payment_status = ANY (ARRAY['PENDING'::text, 'PAID'::text, 'FAILED'::text, 'REFUNDED'::text, 'PARTIALLY_REFUNDED'::text]))),
  CONSTRAINT "bookings_pkey" PRIMARY KEY (id),
  CONSTRAINT "bookings_price_per_person_check" CHECK ((price_per_person >= (0)::numeric)),
  CONSTRAINT "bookings_required_text_not_blank_check"
    CHECK
    (((btrim(id) <> ''::text) AND (btrim(booking_id) <> ''::text) AND (btrim(trip_id) <> ''::text) AND (btrim(batch_id) <> ''::text) AND (btrim(trip_slug) <> ''::text) AND
    (btrim(trip_title) <> ''::text) AND (btrim(customer_name) <> ''::text) AND (btrim(phone) <> ''::text) AND (btrim(email) <> ''::text))),
  CONSTRAINT "bookings_subtotal_calculation_check" CHECK ((subtotal = (price_per_person * (travelers)::numeric))),
  CONSTRAINT "bookings_subtotal_check" CHECK ((subtotal >= (0)::numeric)),
  CONSTRAINT "bookings_terms_consent_check" CHECK (((created_at < '2026-09-05 17:16:14.653+00'::timestamp with time zone) OR ((terms_accepted_at IS
    NOT NULL) AND (terms_accepted_at <= created_at) AND (terms_version IS NOT NULL) AND (btrim(terms_version) <> ''::text)))),
  CONSTRAINT "bookings_total_amount_check" CHECK ((total_amount >= (0)::numeric)),
  CONSTRAINT "bookings_total_calculation_check" CHECK ((total_amount = (subtotal - discount_amount))),
  CONSTRAINT "bookings_travelers_check" CHECK ((travelers > 0))
);

ALTER TABLE "public"."bookings"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."coupon_trips" (
  "coupon_id" text NOT NULL,
  "trip_id"   text NOT NULL,
  CONSTRAINT "coupon_trips_pkey" PRIMARY KEY (coupon_id, trip_id)
);

ALTER TABLE "public"."coupon_trips"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."coupons" (
  "id"                     text                     NOT NULL,
  "code"                   text                     NOT NULL,
  "description"            text,
  "discount_type"          text                     NOT NULL,
  "discount_value"         numeric(12,2)            NOT NULL,
  "minimum_booking_amount" numeric(12,2),
  "maximum_discount"       numeric(12,2),
  "valid_from"             date,
  "valid_until"            date,
  "usage_limit"            integer,
  "used_count"             integer                  NOT NULL DEFAULT 0,
  "status"                 text                     NOT NULL DEFAULT 'ACTIVE'::text,
  "scope"                  text                     NOT NULL DEFAULT 'ALL_TRIPS'::text,
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"             timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "coupons_check" CHECK (((valid_until IS NULL) OR (valid_from IS NULL) OR (valid_until >= valid_from))),
  CONSTRAINT "coupons_code_key" UNIQUE (code),
  CONSTRAINT "coupons_code_normalized_check" CHECK (((btrim(code) <> ''::text) AND (code = upper(btrim(code))))),
  CONSTRAINT "coupons_discount_type_check" CHECK ((discount_type = ANY (ARRAY['PERCENTAGE'::text, 'FIXED_AMOUNT'::text]))),
  CONSTRAINT "coupons_discount_value_positive_check" CHECK ((discount_value > (0)::numeric)),
  CONSTRAINT "coupons_maximum_discount_check" CHECK ((maximum_discount >= (0)::numeric)),
  CONSTRAINT "coupons_minimum_booking_amount_check" CHECK ((minimum_booking_amount >= (0)::numeric)),
  CONSTRAINT "coupons_percentage_value_check" CHECK (((discount_type <> 'PERCENTAGE'::text) OR (discount_value <= (100)::numeric))),
  CONSTRAINT "coupons_pkey" PRIMARY KEY (id),
  CONSTRAINT "coupons_scope_check" CHECK ((scope = ANY (ARRAY['ALL_TRIPS'::text, 'SELECTED_TRIPS'::text]))),
  CONSTRAINT "coupons_status_check" CHECK ((status = ANY (ARRAY['ACTIVE'::text, 'INACTIVE'::text]))),
  CONSTRAINT "coupons_usage_count_within_limit_check" CHECK (((usage_limit IS NULL) OR (used_count <= usage_limit))),
  CONSTRAINT "coupons_usage_limit_check" CHECK (((usage_limit IS NULL) OR (usage_limit > 0))),
  CONSTRAINT "coupons_used_count_check" CHECK ((used_count >= 0))
);

ALTER TABLE "public"."coupons"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."payments" (
  "id"                  bigint                   NOT NULL DEFAULT nextval('public.payments_id_seq'::regclass),
  "booking_id"          text                     NOT NULL,
  "provider"            text                     NOT NULL DEFAULT 'RAZORPAY'::text,
  "provider_order_id"   text,
  "provider_payment_id" text,
  "provider_signature"  text,
  "amount"              numeric(12,2)            NOT NULL,
  "currency"            text                     NOT NULL DEFAULT 'INR'::text,
  "status"              text                     NOT NULL DEFAULT 'CREATED'::text,
  "payment_type"        text                     NOT NULL DEFAULT 'BOOKING'::text,
  "provider_response"   jsonb,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "payments_amount_positive_check" CHECK ((amount > (0)::numeric)),
  CONSTRAINT "payments_captured_details_check" CHECK (((status <> 'CAPTURED'::text) OR ((provider_order_id IS NOT NULL) AND (provider_payment_id IS
    NOT NULL) AND (provider_signature IS NOT NULL)))),
  CONSTRAINT "payments_currency_check" CHECK ((currency = 'INR'::text)),
  CONSTRAINT "payments_payment_type_check" CHECK ((payment_type = ANY (ARRAY['BOOKING'::text, 'BALANCE'::text, 'REFUND'::text]))),
  CONSTRAINT "payments_pkey" PRIMARY KEY (id),
  CONSTRAINT "payments_provider_check" CHECK ((provider = 'RAZORPAY'::text)),
  CONSTRAINT "payments_provider_order_id_key" UNIQUE (provider_order_id),
  CONSTRAINT "payments_provider_payment_id_key" UNIQUE (provider_payment_id),
  CONSTRAINT "payments_status_check"
    CHECK ((status = ANY (ARRAY['CREATED'::text, 'AUTHORIZED'::text, 'CAPTURED'::text, 'FAILED'::text, 'REFUNDED'::text, 'PARTIALLY_REFUNDED'::text])))
);

ALTER TABLE "public"."payments"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."trip_batches" (
  "id"               text                     NOT NULL,
  "trip_id"          text                     NOT NULL,
  "departure_date"   date                     NOT NULL,
  "return_date"      date                     NOT NULL,
  "price"            numeric(12,2)            NOT NULL,
  "total_seats"      integer                  NOT NULL,
  "booked_seats"     integer                  NOT NULL DEFAULT 0,
  "payment_mode"     text                     NOT NULL,
  "advance_amount"   numeric(12,2)            NOT NULL DEFAULT 0,
  "balance_due_date" date,
  "status"           text                     NOT NULL DEFAULT 'DRAFT'::text,
  "visibility"       text                     NOT NULL DEFAULT 'PUBLIC'::text,
  "booking_enabled"  boolean                  NOT NULL DEFAULT true,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "trip_batches_advance_amount_check" CHECK ((advance_amount >= (0)::numeric)),
  CONSTRAINT "trip_batches_advance_not_above_price_check" CHECK ((advance_amount <= price)),
  CONSTRAINT "trip_batches_booked_seats_check" CHECK ((booked_seats >= 0)),
  CONSTRAINT "trip_batches_check" CHECK ((booked_seats <= total_seats)),
  CONSTRAINT "trip_batches_date_range_check" CHECK ((return_date >= departure_date)),
  CONSTRAINT "trip_batches_payment_configuration_check"
    CHECK
    ((((payment_mode = 'FULL'::text) AND (balance_due_date IS NULL)) OR ((payment_mode = 'ADVANCE'::text) AND (advance_amount > (0)::numeric) AND (advance_amount < price) AND
    (balance_due_date IS NOT NULL) AND (balance_due_date = (departure_date - 7))))),
  CONSTRAINT "trip_batches_payment_mode_check" CHECK ((payment_mode = ANY (ARRAY['FULL'::text, 'ADVANCE'::text]))),
  CONSTRAINT "trip_batches_pkey" PRIMARY KEY (id),
  CONSTRAINT "trip_batches_price_check" CHECK ((price >= (0)::numeric)),
  CONSTRAINT "trip_batches_status_check" CHECK ((status = ANY (ARRAY['DRAFT'::text, 'OPEN'::text, 'FULL'::text, 'CLOSED'::text, 'CANCELLED'::text, 'COMPLETED'::text]))),
  CONSTRAINT "trip_batches_total_seats_check" CHECK ((total_seats >= 0)),
  CONSTRAINT "trip_batches_visibility_check" CHECK ((visibility = ANY (ARRAY['PUBLIC'::text, 'PRIVATE'::text, 'HIDDEN'::text])))
);

ALTER TABLE "public"."trip_batches"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."trips" (
  "id"                 text                     NOT NULL,
  "slug"               text                     NOT NULL,
  "title"              text                     NOT NULL,
  "trip_type"          text                     NOT NULL,
  "category"           text                     NOT NULL,
  "highlight"          text,
  "subtitle"           text,
  "summary"            text,
  "cta"                text,
  "difficulty"         text,
  "start_point"        text,
  "duration_days"      integer,
  "group_size"         text,
  "description"        text,
  "overview"           text,
  "image"              text,
  "gallery"            jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "itinerary"          jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "includes"           jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "not_includes"       jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "pickup_points"      jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "things_to_carry"    jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "medical_disclaimer" jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "rules"              jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "featured"           boolean                  NOT NULL DEFAULT false,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "archived"           boolean                  NOT NULL DEFAULT false,
  "travel_category"    text,
  "destination"        text,
  "upcoming"           boolean                  NOT NULL DEFAULT false,
  CONSTRAINT "trips_active_classification_check" CHECK (((archived = true) OR ((travel_category IS NOT NULL) AND (btrim(travel_category) <> ''::text) AND (destination IS
    NOT NULL) AND (btrim(destination) <> ''::text)))),
  CONSTRAINT "trips_archived_visibility_check" CHECK (((NOT archived) OR ((NOT featured) AND (NOT upcoming)))),
  CONSTRAINT "trips_duration_positive_check" CHECK (((duration_days IS NULL) OR (duration_days > 0))),
  CONSTRAINT "trips_json_arrays_check"
    CHECK
    (((jsonb_typeof(gallery) = 'array'::text) AND (jsonb_typeof(itinerary) = 'array'::text) AND (jsonb_typeof(includes) = 'array'::text) AND (jsonb_typeof(not_includes) =
    'array'::text) AND (jsonb_typeof(pickup_points) = 'array'::text) AND (jsonb_typeof(things_to_carry) = 'array'::text) AND (jsonb_typeof(medical_disclaimer) = 'array'::text) AND
    (jsonb_typeof(rules) = 'array'::text))),
  CONSTRAINT "trips_pkey" PRIMARY KEY (id),
  CONSTRAINT "trips_required_text_not_blank_check" CHECK (((btrim(id) <> ''::text) AND (btrim(slug) <> ''::text) AND (btrim(title) <> ''::text) AND (btrim(category) <> ''::text))),
  CONSTRAINT "trips_slug_format_check" CHECK ((slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text)),
  CONSTRAINT "trips_slug_key" UNIQUE (slug),
  CONSTRAINT "trips_travel_category_check"
    CHECK (((travel_category IS NULL) OR (travel_category = ANY (ARRAY['Treks & Adventures'::text, 'Domestic Tours'::text, 'International Tours'::text])))),
  CONSTRAINT "trips_trip_type_check" CHECK ((trip_type = ANY (ARRAY['Fixed Departure'::text, 'Custom Trip'::text, 'Corporate'::text])))
);

ALTER TABLE "public"."trips"
  ENABLE ROW LEVEL SECURITY;

ALTER SEQUENCE "public"."payments_id_seq" OWNED BY "public"."payments"."id";

CREATE OR REPLACE FUNCTION public.confirm_paid_booking (
  p_booking_id          text,
  p_provider_order_id   text,
  p_provider_payment_id text,
  p_provider_signature  text,
  p_provider_response   jsonb
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
  v_booking public.bookings%rowtype;
  v_batch public.trip_batches%rowtype;
  v_payment public.payments%rowtype;
  v_coupon public.coupons%rowtype;

  v_new_booked_seats integer;
  v_available_seats integer;
begin

  /*
   * ---------------------------------------------------------
   * 1. LOCK BOOKING
   * ---------------------------------------------------------
   */

  select *
  into v_booking
  from public.bookings
  where booking_id = p_booking_id
  for update;

  if not found then
    raise exception 'BOOKING_NOT_FOUND';
  end if;


  /*
   * ---------------------------------------------------------
   * 2. IDEMPOTENCY
   * ---------------------------------------------------------
   */

  if
    v_booking.payment_status = 'PAID'
    and
    v_booking.booking_status = 'CONFIRMED'
  then

    select *
    into v_batch
    from public.trip_batches
    where id = v_booking.batch_id;

    return jsonb_build_object(
      'ok', true,
      'alreadyConfirmed', true,
      'bookingId', v_booking.booking_id,
      'paymentStatus', v_booking.payment_status,
      'bookingStatus', v_booking.booking_status,
      'totalSeats', v_batch.total_seats,
      'bookedSeats', v_batch.booked_seats,
      'availableSeats',
        greatest(
          0,
          v_batch.total_seats - v_batch.booked_seats
        )
    );

  end if;


  /*
   * A captured payment that has already been placed into
   * MANUAL_REVIEW must also be idempotent.
   *
   * Duplicate Razorpay webhook deliveries or repeated
   * verification requests must not retry seat reservation
   * or increment coupon usage.
   */

  if
    v_booking.payment_status = 'PAID'
    and
    v_booking.booking_status = 'MANUAL_REVIEW'
  then

    select *
    into v_batch
    from public.trip_batches
    where id = v_booking.batch_id;

    return jsonb_build_object(
      'ok', false,
      'alreadyConfirmed', true,
      'manualReview', true,
      'reason', 'ALREADY_IN_MANUAL_REVIEW',
      'bookingId', v_booking.booking_id,
      'paymentStatus', v_booking.payment_status,
      'bookingStatus', v_booking.booking_status,
      'totalSeats', v_batch.total_seats,
      'bookedSeats', v_batch.booked_seats,
      'availableSeats',
        greatest(
          0,
          v_batch.total_seats - v_batch.booked_seats
        ),
      'requestedSeats',
        v_booking.travelers
    );

  end if;


  /*
   * ---------------------------------------------------------
   * 3. LOCK PAYMENT
   * ---------------------------------------------------------
   */

  select *
  into v_payment
  from public.payments
  where booking_id = p_booking_id
    and provider = 'RAZORPAY'
    and provider_order_id = p_provider_order_id
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'PAYMENT_ORDER_NOT_FOUND';
  end if;


  /*
   * ---------------------------------------------------------
   * 4. LOCK DEPARTURE
   * ---------------------------------------------------------
   */

  select *
  into v_batch
  from public.trip_batches
  where id = v_booking.batch_id
  for update;

  if not found then
    raise exception 'BATCH_NOT_FOUND';
  end if;


  /*
   * ---------------------------------------------------------
   * 5. RECHECK SEAT AVAILABILITY
   * ---------------------------------------------------------
   */

  v_available_seats :=
    greatest(
      0,
      v_batch.total_seats -
      coalesce(v_batch.booked_seats, 0)
    );

  if v_available_seats < v_booking.travelers then

    update public.payments
    set
      provider_payment_id = p_provider_payment_id,
      provider_signature = p_provider_signature,
      status = 'CAPTURED',
      provider_response = p_provider_response
    where id = v_payment.id;

    update public.bookings
    set
      payment_status = 'PAID',
      booking_status = 'MANUAL_REVIEW',
      updated_at = now()
    where id = v_booking.id;

    return jsonb_build_object(
      'ok', false,
      'manualReview', true,
      'reason', 'INSUFFICIENT_SEATS',
      'bookingId', v_booking.booking_id,
      'totalSeats', v_batch.total_seats,
      'bookedSeats', v_batch.booked_seats,
      'availableSeats', v_available_seats,
      'requestedSeats', v_booking.travelers
    );

  end if;


  /*
   * ---------------------------------------------------------
   * 6. LOCK + RECHECK COUPON
   * ---------------------------------------------------------
   *
   * If this paid booking used a coupon, lock that coupon row.
   * Concurrent confirmations using the same coupon will
   * therefore be serialized.
   */

  if
    v_booking.coupon_code is not null
    and
    btrim(v_booking.coupon_code) <> ''
  then

    select *
    into v_coupon
    from public.coupons
    where upper(code) =
      upper(
        btrim(
          v_booking.coupon_code
        )
      )
    for update;

    if not found then

      update public.payments
      set
        provider_payment_id = p_provider_payment_id,
        provider_signature = p_provider_signature,
        status = 'CAPTURED',
        provider_response = p_provider_response
      where id = v_payment.id;

      update public.bookings
      set
        payment_status = 'PAID',
        booking_status = 'MANUAL_REVIEW',
        updated_at = now()
      where id = v_booking.id;

      return jsonb_build_object(
        'ok', false,
        'manualReview', true,
        'reason', 'COUPON_NOT_FOUND',
        'bookingId', v_booking.booking_id
      );

    end if;


    /*
     * Recheck usage limit while coupon row is locked.
     *
     * NULL usage_limit means unlimited.
     */

    if
      v_coupon.usage_limit is not null
      and
      coalesce(v_coupon.used_count, 0) >= v_coupon.usage_limit
    then

      update public.payments
      set
        provider_payment_id = p_provider_payment_id,
        provider_signature = p_provider_signature,
        status = 'CAPTURED',
        provider_response = p_provider_response
      where id = v_payment.id;

      update public.bookings
      set
        payment_status = 'PAID',
        booking_status = 'MANUAL_REVIEW',
        updated_at = now()
      where id = v_booking.id;

      return jsonb_build_object(
        'ok', false,
        'manualReview', true,
        'reason', 'COUPON_USAGE_LIMIT_REACHED',
        'bookingId', v_booking.booking_id,
        'couponCode', v_booking.coupon_code
      );

    end if;

  end if;


  /*
   * ---------------------------------------------------------
   * 7. RESERVE SEATS
   * ---------------------------------------------------------
   */

  v_new_booked_seats :=
    coalesce(
      v_batch.booked_seats,
      0
    ) +
    v_booking.travelers;

  update public.trip_batches
  set
    booked_seats = v_new_booked_seats,

    status =
      case
        when v_new_booked_seats >= total_seats
          then 'FULL'
        else status
      end,

    booking_enabled =
      case
        when v_new_booked_seats >= total_seats
          then false
        else booking_enabled
      end

  where id = v_batch.id;


  /*
   * ---------------------------------------------------------
   * 8. INCREMENT COUPON USAGE
   * ---------------------------------------------------------
   */

  if
    v_booking.coupon_code is not null
    and
    btrim(v_booking.coupon_code) <> ''
  then

    update public.coupons
    set
      used_count =
        coalesce(used_count, 0) + 1,

      updated_at = now()

    where id = v_coupon.id;

  end if;


  /*
   * ---------------------------------------------------------
   * 9. MARK PAYMENT CAPTURED
   * ---------------------------------------------------------
   */

  update public.payments
  set
    provider_payment_id = p_provider_payment_id,
    provider_signature = p_provider_signature,
    status = 'CAPTURED',
    provider_response = p_provider_response

  where id = v_payment.id;


  /*
   * ---------------------------------------------------------
   * 10. CONFIRM BOOKING
   * ---------------------------------------------------------
   */

  update public.bookings
  set
    payment_status = 'PAID',
    booking_status = 'CONFIRMED',
    updated_at = now()

  where id = v_booking.id;


  /*
   * ---------------------------------------------------------
   * 11. RETURN RESULT
   * ---------------------------------------------------------
   */

  return jsonb_build_object(
    'ok', true,

    'alreadyConfirmed', false,

    'bookingId',
      v_booking.booking_id,

    'tripTitle',
      v_booking.trip_title,

    'travelers',
      v_booking.travelers,

    'amountPaid',
      v_booking.amount_payable_now,

    'paymentStatus',
      'PAID',

    'bookingStatus',
      'CONFIRMED',

    'totalSeats',
      v_batch.total_seats,

    'bookedSeats',
      v_new_booked_seats,

    'availableSeats',
      greatest(
        0,
        v_batch.total_seats -
        v_new_booked_seats
      )
  );

end;
$function$;

CREATE OR REPLACE FUNCTION public.generate_next_booking_id()
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
  v_booking_date date :=
    (now() at time zone 'Asia/Kolkata')::date;

  v_next_number integer;
begin
  insert into public.booking_number_counters (
    booking_date,
    last_number,
    updated_at
  )
  values (
    v_booking_date,
    1,
    now()
  )
  on conflict (booking_date)
  do update set
    last_number =
      booking_number_counters.last_number + 1,
    updated_at = now()
  returning last_number
  into v_next_number;

  if v_next_number > 9999 then
    raise exception
      'Daily booking number limit exceeded';
  end if;

  return
    'BLA-' ||
    to_char(
      v_booking_date,
      'YYMMDD'
    ) ||
    '-' ||
    lpad(
      v_next_number::text,
      4,
      '0'
    );
end;
$function$;

CREATE OR REPLACE FUNCTION public.record_admin_login_failure (
  p_client_key     text,
  p_max_attempts   integer,
  p_window_minutes integer,
  p_block_minutes  integer
)
  RETURNS TABLE (
    failed_attempts integer,
    blocked_until   timestamp with time zone
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog', 'public'
  AS $function$
declare
  v_now timestamp with time zone := now();
begin
  if btrim(p_client_key) = ''
     or p_max_attempts <= 0
     or p_window_minutes <= 0
     or p_block_minutes <= 0 then
    raise exception 'Invalid rate-limit parameters';
  end if;

  return query
  insert into public.admin_login_attempts as attempts (
    client_key,
    failed_attempts,
    window_started_at,
    blocked_until,
    updated_at
  )
  values (
    p_client_key,
    1,
    v_now,
    case
      when 1 >= p_max_attempts
        then v_now + make_interval(mins => p_block_minutes)
      else null
    end,
    v_now
  )
  on conflict (client_key)
  do update set
    failed_attempts =
      case
        when attempts.window_started_at <
          v_now - make_interval(mins => p_window_minutes)
          then 1
        else attempts.failed_attempts + 1
      end,

    window_started_at =
      case
        when attempts.window_started_at <
          v_now - make_interval(mins => p_window_minutes)
          then v_now
        else attempts.window_started_at
      end,

    blocked_until =
      case
        when (
          case
            when attempts.window_started_at <
              v_now - make_interval(mins => p_window_minutes)
              then 1
            else attempts.failed_attempts + 1
          end
        ) >= p_max_attempts
          then v_now + make_interval(mins => p_block_minutes)
        else null
      end,

    updated_at = v_now
  returning
    attempts.failed_attempts,
    attempts.blocked_until;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_batch_capacity()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN

    IF NEW.booked_seats > NEW.total_seats THEN
        RAISE EXCEPTION
        'Booked seats cannot exceed total seats';
    END IF;

    RETURN NEW;

END;
$function$;

ALTER TABLE "public"."coupon_trips"
  ADD CONSTRAINT "coupon_trips_coupon_id_fkey" FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE;

ALTER TABLE "public"."payments"
  ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id) ON DELETE CASCADE;

ALTER TABLE "public"."bookings"
  ADD CONSTRAINT "bookings_batch_id_fkey" FOREIGN KEY (batch_id) REFERENCES public.trip_batches(id);

ALTER TABLE "public"."bookings"
  ADD CONSTRAINT "bookings_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.trips(id);

ALTER TABLE "public"."coupon_trips"
  ADD CONSTRAINT "coupon_trips_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;

ALTER TABLE "public"."trip_batches"
  ADD CONSTRAINT "trip_batches_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;

CREATE INDEX admin_login_attempts_blocked_until_idx ON public.admin_login_attempts USING btree (blocked_until);

CREATE INDEX idx_bookings_batch ON public.bookings USING btree (batch_id);

CREATE INDEX idx_bookings_created_at ON public.bookings USING btree (created_at DESC);

CREATE INDEX idx_bookings_email ON public.bookings USING btree (email);

CREATE INDEX idx_bookings_phone ON public.bookings USING btree (phone);

CREATE INDEX idx_bookings_trip ON public.bookings USING btree (trip_id);

CREATE INDEX idx_coupon_trips_trip ON public.coupon_trips USING btree (trip_id);

CREATE INDEX idx_payments_booking ON public.payments USING btree (booking_id);

CREATE INDEX idx_trip_batches_departure ON public.trip_batches USING btree (departure_date);

CREATE INDEX idx_trip_batches_public_open ON public.trip_batches USING btree (status, visibility, booking_enabled);

CREATE INDEX idx_trip_batches_trip ON public.trip_batches USING btree (trip_id);

CREATE INDEX trips_archived_idx ON public.trips USING btree (archived);

CREATE TRIGGER update_admin_login_attempts_updated_at
  BEFORE UPDATE ON public.admin_login_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trip_batches_updated_at
  BEFORE UPDATE ON public.trip_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER validate_trip_batch_capacity
  BEFORE INSERT OR UPDATE ON public.trip_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_batch_capacity();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON COLUMN "public"."bookings"."terms_accepted_at" IS 'Timestamp when the customer accepted the booking terms';

COMMENT ON COLUMN "public"."bookings"."terms_version" IS 'Version of the booking terms accepted by the customer';

REVOKE ALL ON FUNCTION "public"."confirm_paid_booking"(text, text, text, text, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."confirm_paid_booking"(text, text, text, text, jsonb) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."generate_next_booking_id"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."generate_next_booking_id"() TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."record_admin_login_failure"(text, integer, integer, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."record_admin_login_failure"(text, integer, integer, integer) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."update_updated_at_column"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."update_updated_at_column"() TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."validate_batch_capacity"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."validate_batch_capacity"() TO "postgres", "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."payments_id_seq" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."admin_login_attempts" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."booking_number_counters" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bookings" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."coupon_trips" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."coupons" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."payments" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."trip_batches" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."trips" TO "postgres", "service_role";

