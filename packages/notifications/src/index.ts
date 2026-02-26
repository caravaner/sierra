export type { EmailMessage, EmailSendResult, EmailProvider } from "./interfaces/email-provider";
export type {
  StoredPushSubscription,
  PushPayload,
  PushSendResult,
  PushProvider,
} from "./interfaces/push-provider";

export { ConsoleEmailProvider } from "./providers/email/console";
export { ResendEmailProvider } from "./providers/email/resend";
export { ConsolePushProvider } from "./providers/push/console";
export { WebPushProvider } from "./providers/push/web-push";

export { welcomeEmail } from "./templates/welcome";
export { passwordResetEmail } from "./templates/password-reset";
export { orderPlacedEmail } from "./templates/order-placed";
export { orderStatusChangedEmail } from "./templates/order-status-changed";
export { subscriptionCreatedEmail } from "./templates/subscription-created";
export { subscriptionReminderEmail } from "./templates/subscription-reminder";

export { NotificationService } from "./notification-service";
export { getNotificationService } from "./factory";
