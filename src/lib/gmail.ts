// Gmail sending helper for AVAULT outreach (Phase 2) — SMTP with an App Password.
//
// Sends as the sending account (channel.wonwoo@gmail.com) over Gmail SMTP using a
// Google "App Password" (no OAuth, no Cloud Console, no token expiry).
//
// Required env:
//   OUTREACH_FROM         e.g. "Wonwoo Yoon <channel.wonwoo@gmail.com>"
//   GMAIL_USER            the sending address, e.g. channel.wonwoo@gmail.com
//   GMAIL_APP_PASSWORD    16-char app password from https://myaccount.google.com/apppasswords
//                         (requires 2-Step Verification enabled on the account)

import nodemailer from "nodemailer";

interface SendArgs {
  to: string;
  subject: string;
  body: string;
}

export function gmailConfigured(): boolean {
  return Boolean(
    process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD && process.env.OUTREACH_FROM
  );
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransport() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER as string,
        // App passwords are shown with spaces ("abcd efgh ijkl mnop"); strip them.
        pass: (process.env.GMAIL_APP_PASSWORD as string).replace(/\s/g, ""),
      },
    });
  }
  return transporter;
}

/** Send one plain-text email via Gmail SMTP. Returns the SMTP message id. */
export async function sendGmail({ to, subject, body }: SendArgs): Promise<string> {
  const info = await getTransport().sendMail({
    from: process.env.OUTREACH_FROM as string,
    to,
    subject,
    text: body,
  });
  return info.messageId ?? "sent";
}
