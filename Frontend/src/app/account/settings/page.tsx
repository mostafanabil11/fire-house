"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { updateProfile, changePassword } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/error-message";
import type { User } from "@/types/user";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace("/login?next=/account/settings");
    }
  }, [userLoading, user, router]);

  if (userLoading || !user) {
    return null;
  }

  return <AccountSettingsForm key={user._id} user={user} />;
}

function AccountSettingsForm({ user }: { user: User }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const profileMutation = useMutation({
    mutationFn: () => updateProfile({ firstName, lastName }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["auth", "profile"], updated);
      toast.success("Profile updated");
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, "Could not update profile"));
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () => changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      queryClient.setQueryData(["auth", "profile"], null);
      toast.success("Password changed — please sign in again");
      router.push("/login");
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, "Could not change password"));
    },
  });

  const isGoogleAccount = user.authProvider === "google";

  return (
    <div className="page-shell py-stack-xl">
      <Link href="/account/orders" className="mb-6 inline-block text-[13px] text-muted-foreground underline">
        ← Back to order history
      </Link>

      <h1 className="mb-10 font-heading text-headline-sm font-bold text-foreground md:text-headline-md">
        Account Settings
      </h1>

      <div className="mx-auto max-w-xl space-y-6">
        <section aria-labelledby="profile-heading" className="surface p-5 sm:p-7">
          <h2 id="profile-heading" className="mb-1 font-heading text-headline-sm font-bold text-foreground">
            Profile
          </h2>
          <p className="mb-6 text-[13px] text-muted-foreground">{user.email}</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              profileMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-2 block text-[12px] font-semibold tracking-[0.1em] text-foreground uppercase"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="form-field"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="mb-2 block text-[12px] font-semibold tracking-[0.1em] text-foreground uppercase"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="form-field"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileMutation.isPending || (!firstName.trim() || !lastName.trim())}
              className="action-primary"
            >
              {profileMutation.isPending ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </section>

        <section aria-labelledby="password-heading" className="surface p-5 sm:p-7">
          <h2 id="password-heading" className="mb-1 font-heading text-headline-sm font-bold text-foreground">
            Password
          </h2>

          {isGoogleAccount ? (
            <p className="text-[13px] text-muted-foreground">
              You sign in with Google, so there&apos;s no separate password to change here.
            </p>
          ) : (
            <>
              <p className="mb-6 text-[13px] text-muted-foreground">
                Changing your password will sign you out everywhere, including this device.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  passwordMutation.mutate();
                }}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="mb-2 block text-[12px] font-semibold tracking-[0.1em] text-foreground uppercase"
                  >
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="form-field"
                  />
                </div>
                <div>
                  <label
                    htmlFor="newPassword"
                    className="mb-2 block text-[12px] font-semibold tracking-[0.1em] text-foreground uppercase"
                  >
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-field"
                  />
                  <p className="mt-2 text-[12px] text-muted-foreground">
                    At least 6 characters, with an uppercase letter, a lowercase letter, and a number.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={passwordMutation.isPending || !currentPassword || !newPassword}
                  className="action-primary"
                >
                  {passwordMutation.isPending ? "Changing…" : "Change Password"}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
