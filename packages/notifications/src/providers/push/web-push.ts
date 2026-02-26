import webpush from "web-push";
import type { PushPayload, PushProvider, PushSendResult, StoredPushSubscription } from "../../interfaces/push-provider";

export class WebPushProvider implements PushProvider {
  readonly name = "web-push";

  constructor(vapidPublicKey: string, vapidPrivateKey: string, vapidSubject: string) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  }

  async send(subscription: StoredPushSubscription, payload: PushPayload): Promise<PushSendResult> {
    const pushSubscription: webpush.PushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    try {
      await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
      return { endpoint: subscription.endpoint, status: "sent" };
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      if (error.statusCode === 410 || error.statusCode === 404) {
        return { endpoint: subscription.endpoint, status: "gone" };
      }
      return {
        endpoint: subscription.endpoint,
        status: "failed",
        error: error.message ?? "Unknown error",
      };
    }
  }
}
