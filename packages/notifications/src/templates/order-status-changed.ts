import { APP_NAME } from "@sierra/shared";
import { baseTemplate, type EmailTemplate } from "./base";

type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_MESSAGES: Record<OrderStatus, string> = {
  PENDING: "Your order has been received and is awaiting confirmation.",
  CONFIRMED: "Your order has been confirmed and will be processed shortly.",
  PROCESSING: "Your order is being prepared for delivery.",
  SHIPPED: "Your order is on its way! Expect delivery soon.",
  DELIVERED: "Your order has been delivered. Enjoy!",
  CANCELLED: "Your order has been cancelled. If you have questions, please contact us.",
};

interface OrderStatusChangedData {
  name: string;
  orderId: string;
  newStatus: OrderStatus;
  orderUrl?: string;
}

export function orderStatusChangedEmail(data: OrderStatusChangedData): EmailTemplate {
  const firstName = data.name.split(" ")[0] ?? data.name;
  const statusLabel = STATUS_LABELS[data.newStatus] ?? data.newStatus;
  const statusMessage = STATUS_MESSAGES[data.newStatus] ?? "";

  const statusColor =
    data.newStatus === "DELIVERED"
      ? "#16a34a"
      : data.newStatus === "CANCELLED"
        ? "#dc2626"
        : data.newStatus === "SHIPPED"
          ? "#2563eb"
          : "#18181b";

  const orderButton = data.orderUrl
    ? `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:#18181b;border-radius:6px;padding:12px 24px;">
          <a href="${data.orderUrl}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
            View Order
          </a>
        </td>
      </tr>
    </table>`
    : "";

  const html = baseTemplate(`
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#18181b;">
      Order update
    </h1>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#3f3f46;">
      Hi ${firstName}, here&apos;s an update on your order.
    </p>
    <div style="margin:0 0 24px;padding:16px;background:#f4f4f5;border-radius:6px;">
      <p style="margin:0 0 4px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">Order #${data.orderId.slice(-8).toUpperCase()}</p>
      <p style="margin:0;font-size:20px;font-weight:700;color:${statusColor};">${statusLabel}</p>
    </div>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#3f3f46;">
      ${statusMessage}
    </p>
    ${orderButton}
  `);

  return {
    subject: `Order update: ${statusLabel} — #${data.orderId.slice(-8).toUpperCase()}`,
    html,
    text: `Hi ${firstName},\n\nYour order #${data.orderId.slice(-8).toUpperCase()} is now: ${statusLabel}\n\n${statusMessage}`,
  };
}
