import type { Metadata } from "next";
import Link from "next/link";
import { RESTAURANT } from "@/config/restaurant";

export const metadata: Metadata = {
  title: `Privacy Policy — ${RESTAURANT.name}`,
  description: `How ${RESTAURANT.name} collects, uses, and protects your personal information.`,
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-(--spacing-container-max) px-margin-mobile py-stack-xl md:px-margin-desktop">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 font-heading text-headline-sm font-bold text-foreground md:text-headline-md">
          Privacy Policy
        </h1>
        <p className="mb-12 text-[13px] text-muted-foreground">Last updated August 2026</p>

        <div className="space-y-10 text-[14px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 font-heading text-headline-sm font-bold text-foreground">Information We Collect</h2>
            <p>
              When you create an account, we collect your name, email address, and password (stored as a
              one-way hash — we never see or store it in plain text). When you place an order, we also collect
              the delivery address and phone number you provide. If you sign in with Google, we receive your
              name and email from your Google account instead of a password.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-headline-sm font-bold text-foreground">How We Use It</h2>
            <p>
              Your information is used to prepare and deliver orders, send order confirmations and status
              updates, keep your account signed in securely, and apply coupons you choose to redeem. We do not
              sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-headline-sm font-bold text-foreground">Payment Information</h2>
            <p>
              Card payments are processed by Paymob, our payment provider. Your card number and details are
              entered directly into Paymob&apos;s secure payment form — our servers never receive or
              store your full card number.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-headline-sm font-bold text-foreground">Cookies</h2>
            <p>
              We use essential cookies to keep you signed in (httpOnly authentication cookies that JavaScript
              cannot read) and to remember items in your bag if you&apos;re not signed in. We don&apos;t use
              third-party advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-headline-sm font-bold text-foreground">Your Choices</h2>
            <p>
              You can review and update your name from{" "}
              <Link href="/account/settings" className="text-foreground underline">
                Account Settings
              </Link>{" "}
              at any time, and view your full order history from your account. To request deletion of your
              account or data, contact us using the details on our{" "}
              <Link href="/contact" className="text-foreground underline">
                Contact
              </Link>{" "}
              page.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-headline-sm font-bold text-foreground">Contact</h2>
            <p>
              Questions about this policy can be sent through our{" "}
              <Link href="/contact" className="text-foreground underline">contact page</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
