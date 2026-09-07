export type CustomBookingStatus =
  | "DRAFT"
  | "AWAITING_ADVANCE"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "MANUAL_REVIEW";

export type CustomPaymentStatus =
  | "PENDING"
  | "LINK_CREATED"
  | "ADVANCE_PAID"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type CustomBooking = {
  id: string;
  bookingReference: string;
  packageName: string;
  customerName: string;
  phone: string;
  email: string;
  travelStartDate?: string;
  travelEndDate?: string;
  travelers: number;
  totalAmount: number;
  advanceAmount: number;
  amountPaid: number;
  balanceAmount: number;
  balanceDueDate?: string;
  bookingStatus: CustomBookingStatus;
  paymentStatus: CustomPaymentStatus;
  razorpayPaymentLinkId?: string;
  razorpayPaymentLinkUrl?: string;
  paymentLinkExpiresAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomBookingInput = {
  packageName: string;
  customerName: string;
  phone: string;
  email: string;
  travelStartDate?: string;
  travelEndDate?: string;
  travelers: number;
  totalAmount: number;
  advanceAmount: number;
  balanceDueDate?: string;
  notes?: string;
};