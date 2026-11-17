"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/i18n/language-provider";
import { canConfirm } from "@/lib/staff-orders";
import type { Order } from "@/types/order";

const SEEN_KEY = "firehouse-admin-seen-orders";
const SOUND_KEY = "firehouse-admin-sound";

export type AlertableOrder = Pick<
  Order,
  "orderNumber" | "fulfillmentStatus" | "paymentStatus" | "paymentMethod"
>;

// One audio context for the page, not one per chime. Browsers create a
// context "suspended" until the page has had a tap or a key press, and a new
// context made inside a timer never gets one — which is why the old chime
// could be silent. This one is made on the first gesture and resumed then.
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (audioContext) return audioContext;
  try {
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    audioContext = new AudioCtx();
  } catch {
    return null;
  }
  return audioContext;
}

function hasUserActivation(): boolean {
  const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } })
    .userActivation;
  // Browsers without the API predate the autoplay rules that need it.
  return activation ? activation.hasBeenActive : true;
}

// A short two-tone chime, synthesised rather than fetched: no asset to ship,
// no request to fail, and it works the moment the page loads.
function playChime() {
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "running") return;
  try {
    const now = ctx.currentTime;
    [880, 1320].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      const start = now + index * 0.18;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);

      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.24);
    });
  } catch {
    // No audio device. The badge and the notification still fire.
  }
}

function readSeen(): Set<string> {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeSeen(seen: Set<string>) {
  try {
    // Bounded: the team leaves this screen open for weeks, and an unbounded
    // list of every order they have ever seen would grow without limit.
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-300)));
  } catch {
    // Private mode or storage disabled — the alert degrades to firing again
    // after a reload, which is far better than not firing at all.
  }
}

function readSoundOn(): boolean {
  try {
    return window.localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export type NotificationPermissionState = NotificationPermission | "unsupported";

function readPermission(): NotificationPermissionState {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

/**
 * Watches the waiting orders and announces the ones this browser has not
 * shown before: a chime, a desktop notification, and a count the page can put
 * in the tab title.
 *
 * Only orders staff can act on count. A card order waiting on the customer's
 * bank is not news yet; it rings when the payment lands and it becomes one.
 *
 * "Seen" is per-browser on purpose. Two staff phones watching the same board
 * should both be alerted; this is a doorbell, not a shared inbox.
 */
export function useNewOrderAlert(orders: AlertableOrder[], ready: boolean) {
  const { isArabic } = useLanguage();
  const [unseenCount, setUnseenCount] = useState(0);
  const [freshNumbers, setFreshNumbers] = useState<string[]>([]);
  const [soundOn, setSoundOn] = useState(readSoundOn);
  const [unlocked, setUnlocked] = useState(hasUserActivation);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionState>(readPermission);
  const seenRef = useRef<Set<string> | null>(null);
  // The first loaded page is the existing backlog, not new arrivals —
  // announcing it would ring once per order every time the page is opened.
  const primedRef = useRef(false);

  // The first tap or key press anywhere is what lets the page make a sound.
  useEffect(() => {
    function unlock() {
      const ctx = getAudioContext();
      void ctx?.resume().then(() => setUnlocked(true));
      setUnlocked(true);
    }
    if (unlocked) {
      void getAudioContext()?.resume();
    }
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [unlocked]);

  useEffect(() => {
    if (!ready) return;

    if (seenRef.current === null) {
      seenRef.current = readSeen();
    }
    const seen = seenRef.current;

    const fresh = orders
      .filter(canConfirm)
      .map((order) => order.orderNumber)
      .filter((orderNumber) => !seen.has(orderNumber));

    if (!primedRef.current) {
      primedRef.current = true;
      fresh.forEach((orderNumber) => seen.add(orderNumber));
      if (fresh.length > 0) writeSeen(seen);
      return;
    }
    if (fresh.length === 0) return;

    fresh.forEach((orderNumber) => seen.add(orderNumber));
    writeSeen(seen);

    setUnseenCount((count) => count + fresh.length);
    setFreshNumbers((current) => [...current, ...fresh]);

    if (soundOn) playChime();

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const title = isArabic
        ? fresh.length === 1
          ? `طلب جديد ${fresh[0]}`
          : `${fresh.length} طلبات جديدة`
        : fresh.length === 1
          ? `New order ${fresh[0]}`
          : `${fresh.length} new orders`;
      try {
        // A tag means a second alert replaces the first rather than stacking
        // twelve notifications during a rush.
        new Notification(title, {
          body: isArabic ? "افتح لوحة التحكم لتأكيده." : "Open the dashboard to confirm it.",
          tag: "new-order",
        });
      } catch {
        // Some browsers only allow notifications from a service worker.
      }
    }
  }, [orders, ready, soundOn, isArabic]);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    setNotificationPermission(readPermission());
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn((on) => {
      const next = !on;
      try {
        window.localStorage.setItem(SOUND_KEY, next ? "on" : "off");
      } catch {
        // The choice lasts until reload instead.
      }
      return next;
    });
  }, []);

  return {
    unseenCount,
    freshNumbers,
    clearUnseen: useCallback(() => {
      setUnseenCount(0);
      setFreshNumbers([]);
    }, []),
    dismissFresh: useCallback(
      (orderNumber: string) =>
        setFreshNumbers((current) => current.filter((number) => number !== orderNumber)),
      [],
    ),
    soundOn,
    toggleSound,
    // Sound is wanted but the browser has not been given the tap it needs.
    soundBlocked: soundOn && !unlocked,
    requestPermission,
    notificationPermission,
  };
}
