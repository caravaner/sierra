import { APP_NAME } from "@sierra/shared";
import { baseTemplate, type EmailTemplate } from "./base";

interface PasswordResetData {
  name: string;
  resetLink: string;
  expiresInMinutes?: number;
}

export function passwordResetEmail(data: PasswordResetData): EmailTemplate {
  const firstName = data.name.split(" ")[0] ?? data.name;
  const expiresIn = data.expiresInMinutes ?? 60;
  const expiresLabel = expiresIn >= 60 ? `${expiresIn / 60} hour` : `${expiresIn} minutes`;

  const html = baseTemplate(`
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#18181b;">
      Reset your password
    </h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3f3f46;">
      Hi ${firstName}, we received a request to reset the password for your ${APP_NAME} account.
      Click the button below to choose a new password.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:#18181b;border-radius:6px;padding:12px 24px;">
          <a href="${data.resetLink}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:14px;color:#71717a;">
      This link expires in <strong>${expiresLabel}</strong>.
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#71717a;">
      If you can&apos;t click the button, copy and paste this link into your browser:
    </p>
    <p style="margin:0 0 24px;font-size:12px;word-break:break-all;color:#3f3f46;background:#f4f4f5;padding:12px;border-radius:4px;">
      ${data.resetLink}
    </p>
    <p style="margin:0;font-size:14px;color:#71717a;">
      If you didn&apos;t request a password reset, you can safely ignore this email.
      Your password will remain unchanged.
    </p>
  `);

  return {
    subject: `Reset your ${APP_NAME} password`,
    html,
    text: `Hi ${firstName},\n\nWe received a request to reset your ${APP_NAME} password.\n\nReset your password here: ${data.resetLink}\n\nThis link expires in ${expiresLabel}.\n\nIf you didn't request this, you can safely ignore this email.`,
  };
}
