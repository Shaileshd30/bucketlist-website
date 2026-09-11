import PDFDocument from "pdfkit";

export type VoucherInstallment = {
  label: string;
  amount: number;
  dueDate?: string | null;
  paidAmount: number;
  status: string;
  paidAt?: string | null;
};

export type VoucherPayment = {
  providerPaymentId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

export type CustomBookingVoucherData = {
  bookingReference: string;
  packageName: string;
  customerName: string;
  phone: string;
  email: string;
  travelers: number;
  travelStartDate?: string | null;
  travelEndDate?: string | null;
  bookingStatus: string;
  paymentStatus: string;
  totalAmount: number;
  amountPaid: number;
  balanceAmount: number;
  issuedAt?: string;
  installments: VoucherInstallment[];
  payments: VoucherPayment[];
};

const GREEN = "#17251d";
const ORANGE = "#f97316";
const CREAM = "#f5f3ee";
const MUTED = "#68746d";
const LINE = "#e4dfd6";

function money(value: number) {
  return `INR ${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function date(value?: string | null) {
  if (!value) return "Not specified";
  const normalized = value.slice(0, 10);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${normalized}T00:00:00Z`));
}

function clean(value: string, maximum = 180) {
  return value.replace(/[\r\n\t]+/g, " ").trim().slice(0, maximum);
}

export function createCustomBookingVoucher(
  booking: CustomBookingVoucherData,
  logoPath?: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({
      size: "A4",
      margin: 0,
      info: {
        Title: `Booking voucher ${clean(booking.bookingReference, 80)}`,
        Author: "Bucketlist Adventure",
        Subject: "Custom travel booking and payment summary",
      },
    });
    const chunks: Buffer[] = [];

    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("error", reject);
    document.on("end", () => resolve(Buffer.concat(chunks)));

    const pageWidth = document.page.width;
    const contentX = 44;
    const contentWidth = pageWidth - 88;

    const addPage = () => {
      document.addPage({ size: "A4", margin: 0 });
      document.rect(0, 0, pageWidth, document.page.height).fill(CREAM);
      document.rect(0, 0, 8, document.page.height).fill(ORANGE);
      document.fillColor(GREEN).font("Helvetica-Bold").fontSize(9)
        .text("BUCKETLIST ADVENTURE", contentX, 28);
      document.fillColor(MUTED).font("Helvetica").fontSize(8)
        .text(clean(booking.bookingReference, 80), contentX, 42);
    };

    const ensureSpace = (required: number, y: number) => {
      if (y + required <= document.page.height - 56) return y;
      addPage();
      return 74;
    };

    const sectionHeading = (label: string, y: number) => {
      document.fillColor(ORANGE).font("Helvetica-Bold").fontSize(8)
        .text(label.toUpperCase(), contentX, y, { characterSpacing: 1.7 });
      return y + 20;
    };

    document.rect(0, 0, pageWidth, document.page.height).fill(CREAM);
    document.roundedRect(24, 24, pageWidth - 48, 158, 22).fill(GREEN);
    document.rect(24, 164, pageWidth - 48, 18).fill(ORANGE);

    if (logoPath) {
      try {
        document.image(logoPath, 44, 44, { fit: [132, 65] });
      } catch {
        // The voucher remains valid if a deployment omits the optional logo file.
      }
    }

    document.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9)
      .text("BOOKING VOUCHER", 250, 48, { width: 296, align: "right", characterSpacing: 1.5 });
    document.fontSize(23).text(clean(booking.packageName), 224, 77, {
      width: 322,
      align: "right",
      lineGap: 3,
    });
    document.fillColor("#d8e1dc").font("Helvetica").fontSize(9)
      .text(`Reference: ${clean(booking.bookingReference, 80)}`, 250, 139, { width: 296, align: "right" });

    let y = 212;
    y = sectionHeading("Traveller and journey", y);

    const detailRows: Array<[string, string, string, string]> = [
      ["Traveller", clean(booking.customerName), "Travellers", String(booking.travelers)],
      ["Phone", clean(booking.phone), "Email", clean(booking.email)],
      ["Travel starts", date(booking.travelStartDate), "Travel ends", date(booking.travelEndDate)],
      ["Booking status", clean(booking.bookingStatus), "Payment status", clean(booking.paymentStatus)],
    ];

    document.roundedRect(contentX, y, contentWidth, 126, 14).fill("#ffffff");
    detailRows.forEach((row, index) => {
      const rowY = y + 14 + index * 28;
      if (index > 0) document.moveTo(contentX + 14, rowY - 4).lineTo(contentX + contentWidth - 14, rowY - 4).strokeColor(LINE).stroke();
      document.fillColor(MUTED).font("Helvetica").fontSize(8).text(row[0], contentX + 16, rowY, { width: 72 });
      document.fillColor(GREEN).font("Helvetica-Bold").fontSize(9).text(row[1], contentX + 90, rowY, { width: 150, ellipsis: true });
      document.fillColor(MUTED).font("Helvetica").fontSize(8).text(row[2], contentX + 266, rowY, { width: 72 });
      document.fillColor(GREEN).font("Helvetica-Bold").fontSize(9).text(row[3], contentX + 340, rowY, { width: 158, ellipsis: true });
    });
    y += 150;

    y = sectionHeading("Payment summary", y);
    const summary = [
      ["Package total", money(booking.totalAmount)],
      ["Amount received", money(booking.amountPaid)],
      [booking.balanceAmount === 0 ? "Payment" : "Balance remaining", booking.balanceAmount === 0 ? "PAID IN FULL" : money(booking.balanceAmount)],
    ];
    const summaryWidth = contentWidth / 3;
    summary.forEach(([label, value], index) => {
      const x = contentX + index * summaryWidth;
      document.roundedRect(x + (index ? 5 : 0), y, summaryWidth - 10, 70, 12)
        .fill(index === 2 ? GREEN : "#ffffff");
      document.fillColor(index === 2 ? "#cfd8d3" : MUTED).font("Helvetica").fontSize(8)
        .text(label, x + 14, y + 14, { width: summaryWidth - 30 });
      document.fillColor(index === 2 ? "#ffffff" : GREEN).font("Helvetica-Bold").fontSize(13)
        .text(value, x + 14, y + 34, { width: summaryWidth - 30, ellipsis: true });
    });
    y += 98;

    y = ensureSpace(100, y);
    y = sectionHeading("Installment schedule", y);
    document.fillColor(MUTED).font("Helvetica-Bold").fontSize(8)
      .text("INSTALLMENT", contentX + 12, y)
      .text("DUE DATE", contentX + 205, y)
      .text("AMOUNT", contentX + 320, y)
      .text("STATUS", contentX + 430, y);
    y += 17;

    for (const installment of booking.installments) {
      y = ensureSpace(42, y);
      document.roundedRect(contentX, y, contentWidth, 34, 8).fill("#ffffff");
      document.fillColor(GREEN).font("Helvetica-Bold").fontSize(9)
        .text(clean(installment.label, 70), contentX + 12, y + 11, { width: 180, ellipsis: true });
      document.fillColor(MUTED).font("Helvetica").fontSize(9)
        .text(date(installment.dueDate), contentX + 205, y + 11, { width: 100 })
        .text(money(installment.amount), contentX + 320, y + 11, { width: 100 });
      document.fillColor(installment.status === "PAID" ? "#15803d" : ORANGE)
        .font("Helvetica-Bold").fontSize(8)
        .text(clean(installment.status, 20), contentX + 430, y + 11, { width: 70, align: "right" });
      y += 40;
    }

    if (booking.payments.length > 0) {
      y = ensureSpace(90, y + 10);
      y = sectionHeading("Payment receipts", y);
      for (const payment of booking.payments) {
        y = ensureSpace(34, y);
        document.fillColor(GREEN).font("Helvetica-Bold").fontSize(8)
          .text(clean(payment.providerPaymentId, 60), contentX, y, { width: 240, ellipsis: true });
        document.fillColor(MUTED).font("Helvetica").fontSize(8)
          .text(date(payment.createdAt), contentX + 250, y, { width: 100 })
          .text(money(payment.amount), contentX + 365, y, { width: 135, align: "right" });
        document.moveTo(contentX, y + 18).lineTo(contentX + contentWidth, y + 18).strokeColor(LINE).stroke();
        y += 27;
      }
    }

    const footerY = document.page.height - 114;
    if (y + 18 > footerY) {
      addPage();
      y = 82;
    } else {
      y = footerY;
    }
    document.roundedRect(contentX, y, contentWidth, 68, 12).fill(GREEN);
    document.fillColor("#ffffff").font("Helvetica-Bold").fontSize(11)
      .text("We Plan It. You Live It.", contentX + 16, y + 14);
    document.fillColor("#d8e1dc").font("Helvetica").fontSize(7.5)
      .text("This voucher records payments received for the booking shown above. Package inclusions and cancellation terms remain subject to the confirmed proposal.", contentX + 16, y + 34, { width: contentWidth - 32, lineGap: 2 });

    document.fillColor(MUTED).font("Helvetica").fontSize(8)
      .text("bucketlistadventure.in  |  +91 92255 31257  |  bookings@bucketlistadventure.in", contentX, document.page.height - 34, { width: contentWidth, align: "center" });

    document.end();
  });
}
