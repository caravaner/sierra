import { Resend } from "resend";
import type { EmailMessage, EmailProvider, EmailSendResult } from "../../interfaces/email-provider";

export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";
  private readonly client: Resend;
  private readonly defaultFrom: string;

  constructor(apiKey: string, defaultFrom: string) {
    this.client = new Resend(apiKey);
    this.defaultFrom = defaultFrom;
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const { data, error } = await this.client.emails.send({
      from: message.from ?? this.defaultFrom,
      to: Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo,
    });

    if (error || !data) {
      throw new Error(`Resend send failed: ${error?.message ?? "unknown error"}`);
    }

    return { messageId: data.id };
  }
}
