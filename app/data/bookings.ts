export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export type Booking = {
  id: string;
  bookingId: string;

  // Trip
  tripId: string;
  tripSlug: string;
  tripTitle: string;

  // Batch
  batchId: string;
  departureDate: string;
  returnDate?: string;

  // Customer
  customerName: string;
  phone: string;
  email: string;

  // Booking
  travelers: number;

  pricePerPerson: number;
  subtotal: number;

  // Coupon
  couponCode?: string;
  discountAmount: number;

  // Final amount
  totalAmount: number;

  // Payment
  paymentMode: "FULL" | "ADVANCE";
  amountPayableNow: number;
    // Razorpay payment information
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  paymentCreatedAt?: string;
  paymentConfirmedAt?: string;

  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;

  createdAt: string;
  updatedAt: string;
};