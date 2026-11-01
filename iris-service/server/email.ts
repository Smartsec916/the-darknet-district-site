// Transactional email through Brevo's HTTPS API (https://developers.brevo.com).
//
// This is deliberately not a general mailer: the recipient is never an argument.
// Mail goes to REPORT_RECIPIENT from the server's environment and nowhere else, so
// no request, token or code path can use it to send mail to anyone else.
import { log } from "./logger";

export interface EmailAttachment { name: string; content: string } // content is UTF-8 text
export interface OutgoingEmail { subject: string; text: string; attachments?: EmailAttachment[] }

export class EmailError extends Error {
  // Set when the provider asked us to wait (HTTP Retry-After), in milliseconds
  retryAfterMs?: number;

  constructor(
    message: string,
    // true: the provider rejected or never received it, so sending again is safe
    readonly retryable: boolean,
    // true: the request may have been delivered (timeout, dropped connection after sending)
    readonly ambiguous = false,
    readonly status?: number,
  ) {
    super(message);
    this.name = "EmailError";
  }
}

export interface EmailConfig { apiKey: string; sender: string; senderName: string; recipient: string; apiUrl: string }

const DEFAULT_API_URL = "https://api.brevo.com/v3/smtp/email";
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

export function emailConfig(): EmailConfig | null {
  const apiKey = process.env.BREVO_API_KEY || "";
  const sender = process.env.REPORT_SENDER_EMAIL || "";
  const recipient = process.env.REPORT_RECIPIENT || "";
  if (!apiKey || !EMAIL_RE.test(sender) || !EMAIL_RE.test(recipient)) return null;
  const apiUrl = process.env.BREVO_API_URL || DEFAULT_API_URL;
  // The API key is sent to this URL, so it must be HTTPS (plain HTTP only for local tests)
  const url = new URL(apiUrl);
  const local = url.hostname === "127.0.0.1" || url.hostname === "localhost";
  if (url.protocol !== "https:" && !local) return null;
  return {
    apiKey, sender, recipient, apiUrl,
    senderName: process.env.REPORT_SENDER_NAME || "Iris — The Darknet District",
  };
}

export async function sendReportEmail(email: OutgoingEmail, timeoutMs = 25_000): Promise<string> {
  const config = emailConfig();
  if (!config) throw new EmailError("email is not configured", false);
  const body: Record<string, unknown> = {
    sender: { email: config.sender, name: config.senderName },
    to: [{ email: config.recipient }],
    subject: email.subject,
    textContent: email.text,
  };
  if (email.attachments?.length) {
    body.attachment = email.attachments.map(a => ({
      name: a.name,
      content: Buffer.from(a.content, "utf8").toString("base64"),
    }));
  }
  let response: Response;
  try {
    response = await fetch(config.apiUrl, {
      method: "POST",
      headers: { "api-key": config.apiKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err: any) {
    const code = err?.cause?.code ?? err?.code;
    // Refused or unresolved connections never reached the provider
    if (code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "EAI_AGAIN") {
      throw new EmailError(`could not reach the email provider (${code})`, true);
    }
    throw new EmailError(`email request did not complete (${err?.name ?? "error"}); delivery unknown`, false, true);
  }
  if (response.status >= 200 && response.status < 300) {
    const data: any = await response.json().catch(() => ({}));
    return String(data.messageId ?? "");
  }
  // The provider's error text can echo request details, so only the status is kept
  const retryable = response.status === 429 || response.status >= 500;
  log("warn", "email_provider_rejected", { status: response.status });
  const error = new EmailError(`email provider returned HTTP ${response.status}`, retryable, false, response.status);
  // When the provider is rate limiting it says how long to wait
  const wait = Number(response.headers.get("retry-after"));
  if (Number.isFinite(wait) && wait >= 0) error.retryAfterMs = wait * 1000;
  throw error;
}
