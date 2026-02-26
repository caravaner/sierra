import { ConsoleEmailProvider } from "./providers/email/console";
import { ResendEmailProvider } from "./providers/email/resend";
import { ConsolePushProvider } from "./providers/push/console";
import { WebPushProvider } from "./providers/push/web-push";
import { NotificationService } from "./notification-service";
import type { EmailProvider } from "./interfaces/email-provider";
import type { PushProvider } from "./interfaces/push-provider";

function createEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER ?? "console";

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL ?? "noreply@example.com";
    if (!apiKey) throw new Error("RESEND_API_KEY is required when EMAIL_PROVIDER=resend");
    return new ResendEmailProvider(apiKey, from);
  }

  return new ConsoleEmailProvider();
}

function createPushProvider(): PushProvider | null {
  const provider = process.env.PUSH_PROVIDER ?? "console";

  if (provider === "web-push") {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";
    if (!publicKey || !privateKey) {
      throw new Error("VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are required when PUSH_PROVIDER=web-push");
    }
    return new WebPushProvider(publicKey, privateKey, subject);
  }

  if (provider === "none") return null;

  return new ConsolePushProvider();
}

export function getNotificationService(): NotificationService {
  return new NotificationService(createEmailProvider(), createPushProvider());
}
