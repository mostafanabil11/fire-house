import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordContent } from "./reset-password-content";
import { RESTAURANT } from "@/config/restaurant";

export const metadata: Metadata = {
  title: `Reset Password — ${RESTAURANT.name}`,
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
