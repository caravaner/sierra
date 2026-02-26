import type { PushPayload, PushProvider, PushSendResult, StoredPushSubscription } from "../../interfaces/push-provider";

export class ConsolePushProvider implements PushProvider {
  readonly name = "console";

  async send(subscription: StoredPushSubscription, payload: PushPayload): Promise<PushSendResult> {
    console.log("\n🔔 [ConsolePushProvider] ──────────────────────────────────");
    console.log(`  Endpoint: ${subscription.endpoint}`);
    console.log(`  Title:    ${payload.title}`);
    console.log(`  Body:     ${payload.body}`);
    if (payload.url) console.log(`  URL:      ${payload.url}`);
    console.log("──────────────────────────────────────────────────────────\n");

    return { endpoint: subscription.endpoint, status: "sent" };
  }
}
