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
    answer: "Enter your delivery area at checkout to confirm whether your address is currently supported.",
  },
  {
    question: "How much is delivery?",
    answer:
      "The delivery fee is shown clearly at checkout after you enter your delivery area.",
  },
  {
    question: "Can I cancel my order?",
    answer: (
      <>
        Yes, while the restaurant has not started preparing it — open the order in{" "}
        <Link href="/account/orders" className="text-foreground underline">
          Order History
        </Link>{" "}
        and select Cancel. If preparation has already started, contact the restaurant directly through our{" "}
        <Link href="/shipping-returns" className="text-foreground underline">
          delivery information
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
          Order History
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
    answer: "Yes. Add item-specific notes while customizing a dish and general order notes during checkout.",
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
    <div className="mx-auto w-full max-w-(--spacing-container-max) px-margin-mobile py-stack-xl md:px-margin-desktop">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-12 font-heading text-headline-sm font-bold text-foreground md:text-headline-md">
          Frequently Asked Questions
        </h1>

        <div className="divide-y divide-border border-t border-b border-border">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14px] font-medium text-foreground marker:content-none">
                {faq.question}
                <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>

        <p className="mt-10 text-[13px] text-muted-foreground">
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
