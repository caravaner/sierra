import { APP_NAME } from "@sierra/shared";
import { baseTemplate, formatAmount, type EmailTemplate } from "./base";

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface OrderPlacedData {
  name: string;
  orderId: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: string;
  orderUrl?: string;
}

export function orderPlacedEmail(data: OrderPlacedData): EmailTemplate {
  const firstName = data.name.split(" ")[0] ?? data.name;

  const itemRows = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 0;font-size:14px;color:#3f3f46;border-bottom:1px solid #f4f4f5;">${item.name}</td>
      <td style="padding:8px 0;font-size:14px;color:#3f3f46;border-bottom:1px solid #f4f4f5;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 0;font-size:14px;color:#3f3f46;border-bottom:1px solid #f4f4f5;text-align:right;">${formatAmount(item.unitPrice * item.quantity)}</td>
    </tr>`
    )
    .join("");

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
      Order confirmed!
    </h1>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#3f3f46;">
      Hi ${firstName}, thank you for your order. We&apos;ve received it and will start processing soon.
    </p>
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">
      Order #${data.orderId.slice(-8).toUpperCase()}
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <thead>
        <tr>
          <th style="padding:8px 0;font-size:12px;font-weight:600;color:#71717a;text-align:left;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e4e4e7;">Item</th>
          <th style="padding:8px 0;font-size:12px;font-weight:600;color:#71717a;text-align:center;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e4e4e7;">Qty</th>
          <th style="padding:8px 0;font-size:12px;font-weight:600;color:#71717a;text-align:right;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e4e4e7;">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:12px 0 0;font-size:14px;font-weight:700;color:#18181b;">Total</td>
          <td style="padding:12px 0 0;font-size:14px;font-weight:700;color:#18181b;text-align:right;">${formatAmount(data.totalAmount)}</td>
        </tr>
      </tfoot>
    </table>
    <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#18181b;">Delivering to:</p>
    <p style="margin:0 0 24px;font-size:14px;color:#3f3f46;">${data.shippingAddress}</p>
    ${orderButton}
    <p style="margin:0;font-size:14px;color:#71717a;">
      We&apos;ll send you another email when your order ships.
    </p>
  `);

  const itemLines = data.items
    .map((i) => `  - ${i.name} x${i.quantity}: ${formatAmount(i.unitPrice * i.quantity)}`)
    .join("\n");

  return {
    subject: `Order confirmed — #${data.orderId.slice(-8).toUpperCase()}`,
    html,
    text: `Hi ${firstName},\n\nThank you for your order!\n\nOrder #${data.orderId.slice(-8).toUpperCase()}\n\n${itemLines}\n\nTotal: ${formatAmount(data.totalAmount)}\n\nDelivering to: ${data.shippingAddress}\n\nWe'll send you another email when your order ships.`,
  };
}
