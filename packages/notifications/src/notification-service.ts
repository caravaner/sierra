import type { EmailProvider } from "./interfaces/email-provider";
import type { PushProvider, StoredPushSubscription, PushPayload } from "./interfaces/push-provider";
import { welcomeEmail } from "./templates/welcome";
import { passwordResetEmail } from "./templates/password-reset";
import { orderPlacedEmail } from "./templates/order-placed";
import { orderStatusChangedEmail } from "./templates/order-status-changed";
import { subscriptionCreatedEmail } from "./templates/subscription-created";
import { subscriptionReminderEmail } from "./templates/subscription-reminder";

type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface SubscriptionItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export class NotificationService {
  constructor(
    private readonly email: EmailProvider,
    private readonly push: PushProvider | null = null,
  ) {}

  async sendWelcome(to: string, data: { name: string; shopUrl: string }) {
    const template = welcomeEmail(data);
    await this.email.send({ to, ...template });
  }

  async sendPasswordReset(
    to: string,
    data: { name: string; resetLink: string; expiresInMinutes?: number },
  ) {
    const template = passwordResetEmail(data);
    await this.email.send({ to, ...template });
  }

  async sendOrderPlaced(
    to: string,
    data: {
      name: string;
      orderId: string;
      items: OrderItem[];
      totalAmount: number;
      shippingAddress: string;
      orderUrl?: string;
    },
  ) {
    const template = orderPlacedEmail(data);
    await this.email.send({ to, ...template });
  }

  async sendOrderStatusChanged(
    to: string,
    data: {
      name: string;
      orderId: string;
      newStatus: OrderStatus;
      orderUrl?: string;
    },
  ) {
    const template = orderStatusChangedEmail(data);
    await this.email.send({ to, ...template });
  }

  async sendSubscriptionCreated(
    to: string,
    data: {
      name: string;
      subscriptionId: string;
      intervalDays: number;
      nextDeliveryAt: Date;
      items: SubscriptionItem[];
      manageUrl?: string;
    },
  ) {
    const template = subscriptionCreatedEmail(data);
    await this.email.send({ to, ...template });
  }

  async sendSubscriptionReminder(
    to: string,
    data: {
      name: string;
      deliveryDate: Date;
      items: Array<{ name: string; quantity: number }>;
      manageUrl?: string;
    },
  ) {
    const template = subscriptionReminderEmail(data);
    await this.email.send({ to, ...template });
  }

  async sendPushNotification(
    subscription: StoredPushSubscription,
    payload: PushPayload,
  ) {
    if (!this.push) return;
    await this.push.send(subscription, payload);
  }
}
