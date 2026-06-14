// Gmail API sending helper for AVAULT outreach (Phase 2).
//
// Sends as the sending account (channel.wonwoo@gmail.com) using an OAuth2
// refresh token with the single scope https://www.googleapis.com/auth/gmail.send.
// No external dependencies: token refresh + REST send are done with fetch.
//
// Required env:
//   OUTREACH_FROM             e.g. "Wonwoo Yoon <channel.wonwoo@gmail.com>"
//   GOOGLE_OAUTH_CLIENT_ID
//   GOOGLE_OAUTH_CLIENT_SECRET
//   GMAIL_REFRESH_TOKEN       refresh token for the sending account (gmail.send scope)

interface SendArgs {
  to: string;
  subject: string;
  body: string;
}

export function gmailConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
      process.env.GMAIL_REFRESH_TOKEN &&
      process.env.OUTREACH_FROM
  );
}

function base64url(input: string): string {
  return Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// RFC 2047 encode a header value only when it contains non-ASCII characters.
function encodeHeader(value: string): string {
  const hasNonAscii = value.split("").some((ch) => ch.charCodeAt(0) > 127);
  if (!hasNonAscii) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf-8").toString("base64")}?=`;
}

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID as string,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET as string,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN as string,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`oauth token refresh failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("oauth token refresh returned no access_token");
  return json.access_token;
}

/** Send one plain-text email via the Gmail API. Returns the Gmail message id. */
export async function sendGmail({ to, subject, body }: SendArgs): Promise<string> {
  const from = process.env.OUTREACH_FROM as string;
  const token = await getAccessToken();

  const mime = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
  ].join("\r\n");

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ raw: base64url(mime) }),
    }
  );
  if (!res.ok) {
    throw new Error(`gmail send failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { id?: string };
  return json.id ?? "sent";
}
