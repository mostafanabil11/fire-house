import type { Metadata } from "next";
import Link from "next/link";
import { RESTAURANT } from "@/config/restaurant";

export const metadata: Metadata = {
  title: `FAQ — ${RESTAURANT.name}`,
  description: `Answers to common questions about ordering, delivery, and payments at ${RESTAURANT.name}.`,
};

const FAQS: { question: string; answer: React.ReactNode }[] = [
  {
    question: "What payment methods do you accept?",
    answer: "Cash on Delivery and card payments (Visa, Mastercard, Meeza) processed securely by Paymob.",
  },
  {
    question: "Where do you deliver?",
    answer: "Add your full delivery address at checkout. The restaurant reviews your address when confirming the order.",
  },
  {
    question: "How much is delivery?",
    answer:
      "The delivery fee is shown at checkout before you place your order. Eligible orders may qualify for free delivery.",
  },
  {
    question: "Can I cancel my order?",
    answer: (
      <>
        Yes, while the restaurant has not started preparing it — open the order in{" "}
        <Link href="/account/orders" className="text-foreground underline">
          Order history
        </Link>{" "}
        and select Cancel. If preparation has already started, contact the restaurant directly through our{" "}
        <Link href="/contact" className="text-foreground underline">
          help
        </Link>{" "}
        page instead.
      </>
    ),
  },
  {
    question: "How do I track my order?",
    answer: (
      <>
        Use your order number and email on the tracking page, or open the order in{" "}
        <Link href="/account/orders" className="text-foreground underline">
          Order history
        </Link>
        .
      </>
    ),
  },
  {
    question: "How do I use a coupon code?",
    answer: "Enter it in the coupon field in your cart or at checkout — the discount is applied instantly.",
  },
  {
    question: "Can I add a note for the kitchen?",
    answer: "Yes. Add item-specific notes while customizing a dish, before adding it to your order.",
  },
  {
    question: "I forgot my password — what do I do?",
    answer: (
      <>
        Select &ldquo;Forgot password?&rdquo; on the{" "}
        <Link href="/login" className="text-foreground underline">
          sign-in page
        </Link>{" "}
        to get a reset link by email.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <div className="page-shell">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">Help centre</p>
        <h1 className="mt-2 mb-10 font-heading text-3xl sm:text-4xl text-foreground">
          Frequently asked questions
        </h1>

        <div className="grid gap-3">
          {FAQS.map((faq) => (
            <details key={faq.question} className="surface group px-5 py-4 sm:px-6">
              <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-foreground marker:content-none">
                {faq.question}
                <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Still have a question?{" "}
          <Link href="/contact" className="text-foreground underline">
            Get in touch
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
