export interface StoredPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

export interface PushSendResult {
  endpoint: string;
  status: "sent" | "gone" | "failed";
  error?: string;
}

export interface PushProvider {
  readonly name: string;
  send(subscription: StoredPushSubscription, payload: PushPayload): Promise<PushSendResult>;
}
