import { APP_NAME } from "@sierra/shared";
import { baseTemplate, formatAmount, type EmailTemplate } from "./base";

interface SubscriptionItem {
  name: string;
  quantity: number;
}

interface SubscriptionReminderData {
  name: string;
  deliveryDate: Date;
  items: SubscriptionItem[];
  manageUrl?: string;
}

export function subscriptionReminderEmail(data: SubscriptionReminderData): EmailTemplate {
  const firstName = data.name.split(" ")[0] ?? data.name;

  const deliveryLabel = new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(data.deliveryDate));

  const itemList = data.items
    .map(
      (item) => `
    <li style="margin:0 0 4px;font-size:14px;color:#3f3f46;">${item.name} &times; ${item.quantity}</li>`
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
      Delivery coming up!
    </h1>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#3f3f46;">
      Hi ${firstName}, just a heads-up — your next delivery is scheduled for <strong>${deliveryLabel}</strong>.
    </p>
    <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#18181b;">You&apos;ll be receiving:</p>
    <ul style="margin:0 0 24px;padding-left:20px;">
      ${itemList}
    </ul>
    ${manageButton}
    <p style="margin:0;font-size:14px;color:#71717a;">
      Need to make changes? You can update or pause your subscription before your delivery date.
    </p>
  `);

  const itemLines = data.items.map((i) => `  - ${i.name} x${i.quantity}`).join("\n");

  return {
    subject: `Reminder: delivery on ${deliveryLabel}`,
    html,
    text: `Hi ${firstName},\n\nYour next delivery is on ${deliveryLabel}.\n\nItems:\n${itemLines}\n\nNeed to make changes? Manage your subscription from your account.`,
  };
}
