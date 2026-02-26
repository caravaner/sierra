import type { EmailMessage, EmailProvider, EmailSendResult } from "../../interfaces/email-provider";

export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const to = Array.isArray(message.to) ? message.to.join(", ") : message.to;
    console.log("\n📧 [ConsoleEmailProvider] ─────────────────────────────────");
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${message.subject}`);
    if (message.from) console.log(`  From:    ${message.from}`);
    console.log("  ──────────────────────────────────────────────────────────");
    console.log(message.text ?? "(no plain-text body)");
    console.log("──────────────────────────────────────────────────────────\n");

    return { messageId: `console-${Date.now()}` };
  }
}
