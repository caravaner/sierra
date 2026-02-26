import { APP_NAME } from "@sierra/shared";

export function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#18181b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:#18181b;padding:24px 32px;border-radius:8px 8px 0 0;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">${APP_NAME}</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:32px;border-left:1px solid #e4e4e7;border-right:1px solid #e4e4e7;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f4f4f5;padding:24px 32px;border-radius:0 0 8px 8px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#71717a;">
                &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);
}

export type EmailTemplate = { subject: string; html: string; text: string };
