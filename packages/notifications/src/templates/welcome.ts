import { APP_NAME } from "@sierra/shared";
import { baseTemplate, type EmailTemplate } from "./base";

interface WelcomeData {
  name: string;
  shopUrl: string;
}

export function welcomeEmail(data: WelcomeData): EmailTemplate {
  const firstName = data.name.split(" ")[0] ?? data.name;

  const html = baseTemplate(`
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#18181b;">
      Welcome to ${APP_NAME}, ${firstName}!
    </h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3f3f46;">
      Your account is ready. Browse our products and place your first order — we deliver fresh to your door.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:#18181b;border-radius:6px;padding:12px 24px;">
          <a href="${data.shopUrl}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
            Start Shopping
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:24px 0 0;font-size:14px;color:#71717a;">
      If you didn&apos;t create this account, you can safely ignore this email.
    </p>
  `);

  return {
    subject: `Welcome to ${APP_NAME}!`,
    html,
    text: `Welcome to ${APP_NAME}, ${firstName}!\n\nYour account is ready. Visit ${data.shopUrl} to start shopping.\n\nIf you didn't create this account, you can safely ignore this email.`,
  };
}
