/**
 * The local Supabase stack catches every email it sends in Mailpit (http://127.0.0.1:54324), so tests
 * can read login codes as a customer would read them from their inbox.
 */
const MAILPIT_URL = process.env.E2E_MAILPIT_URL ?? "http://127.0.0.1:54324";

interface MailSummary {
  ID: string;
  Created: string;
  To: { Address: string }[];
}

/** The newest email to `email` sent after `after` (text and HTML), waiting up to 10 seconds. */
export async function latestEmail(email: string, after: Date): Promise<{ text: string; html: string }> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const response = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}&limit=5`);
    const { messages } = (await response.json()) as { messages: MailSummary[] };
    const latest = messages.find((message) => new Date(message.Created) >= new Date(after.getTime() - 1000));
    if (latest) {
      const message = (await (await fetch(`${MAILPIT_URL}/api/v1/message/${latest.ID}`)).json()) as { Text: string; HTML: string };
      return { text: message.Text, html: message.HTML };
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No email was sent to ${email}`);
}

/** The 6-digit code in the newest login email to `email` sent after `after`. Waits up to 10 seconds. */
export async function latestLoginCode(email: string, after: Date): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const response = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}&limit=5`);
    const { messages } = (await response.json()) as { messages: MailSummary[] };
    const latest = messages.find((message) => new Date(message.Created) >= new Date(after.getTime() - 1000));
    if (latest) {
      const message = (await (await fetch(`${MAILPIT_URL}/api/v1/message/${latest.ID}`)).json()) as { Text: string };
      const code = /\b(\d{6})\b/.exec(message.Text)?.[1];
      if (code) return code;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No login code was emailed to ${email}`);
}
