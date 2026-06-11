import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach Wonwoo Yoon, author of AVAULT. Objections and corrections welcome.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <div className="border-b-2 border-rule-dark pb-2">
        <h1 className="font-sans text-sm font-bold tracking-[0.14em] uppercase">Contact</h1>
      </div>
      <div className="prose-avault mt-6 max-w-prose">
        <p>
          AVAULT is written by one person, and one person reads the mail:{" "}
          <a href="mailto:thinkartist1@gmail.com">thinkartist1@gmail.com</a>.
        </p>
        <p>
          Three kinds of mail are especially welcome. A factual correction, which will be
          acknowledged in the column it corrects. A stronger objection than the one the column
          engaged, which may earn a Reopening. And a story you believe deserves a verdict.
        </p>
        <p>
          If you received an outreach note from AVAULT and want no more, reply with
          &quot;no more emails&quot;. That is honored permanently, the first time, no questions.
        </p>
      </div>
    </div>
  );
}
