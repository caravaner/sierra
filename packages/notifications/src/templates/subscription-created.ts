import { APP_NAME } from "@sierra/shared";
import { baseTemplate, formatAmount, type EmailTemplate } from "./base";

interface SubscriptionItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface SubscriptionCreatedData {
  name: string;
  subscriptionId: string;
  intervalDays: number;
  nextDeliveryAt: Date;
  items: SubscriptionItem[];
  manageUrl?: string;
}

export function subscriptionCreatedEmail(data: SubscriptionCreatedData): EmailTemplate {
  const firstName = data.name.split(" ")[0] ?? data.name;

  const intervalLabel =
    data.intervalDays === 7
      ? "weekly"
      : data.intervalDays === 14
        ? "every 2 weeks"
        : data.intervalDays === 30
          ? "monthly"
          : `every ${data.intervalDays} days`;

  const nextDelivery = new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(data.nextDeliveryAt));

  const itemRows = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding:6px 0;font-size:14px;color:#3f3f46;">${item.name}</td>
      <td style="padding:6px 0;font-size:14px;color:#3f3f46;text-align:center;">${item.quantity}</td>
      <td style="padding:6px 0;font-size:14px;color:#3f3f46;text-align:right;">${formatAmount(item.unitPrice)}/ea</td>
    </tr>`
    )
    .join("");

  const manageButton = data.manageUrl
    ? `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:#18181b;border-radius:6px;padding:12px 24px;">
          <a href="${data.manageUrl}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
            Manage Subscription
          </a>
        </td>
      </tr>
    </table>`
    : "";

  const html = baseTemplate(`
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#18181b;">
      Subscription confirmed!
    </h1>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#3f3f46;">
      Hi ${firstName}, your subscription is set up and ready to go. Fresh deliveries ${intervalLabel}, straight to your door.
    </p>
    <div style="margin:0 0 24px;padding:16px;background:#f4f4f5;border-radius:6px;">
      <p style="margin:0 0 4px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">Next delivery</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:#18181b;">${nextDelivery}</p>
    </div>
    <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#18181b;">Your subscription includes:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <thead>
        <tr>
          <th style="padding:6px 0;font-size:12px;font-weight:600;color:#71717a;text-align:left;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e4e4e7;">Item</th>
          <th style="padding:6px 0;font-size:12px;font-weight:600;color:#71717a;text-align:center;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e4e4e7;">Qty</th>
          <th style="padding:6px 0;font-size:12px;font-weight:600;color:#71717a;text-align:right;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e4e4e7;">Price</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    ${manageButton}
    <p style="margin:0;font-size:14px;color:#71717a;">
      You can pause or cancel your subscription at any time from your account.
    </p>
  `);

  const itemLines = data.items
    .map((i) => `  - ${i.name} x${i.quantity}`)
    .join("\n");

  return {
    subject: `Subscription confirmed — ${intervalLabel} deliveries`,
    html,
    text: `Hi ${firstName},\n\nYour subscription is confirmed! You'll receive fresh deliveries ${intervalLabel}.\n\nNext delivery: ${nextDelivery}\n\nItems:\n${itemLines}\n\nYou can manage your subscription from your account at any time.`,
  };
}
