"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/i18n/language-provider";

const SEEN_KEY = "firehouse-admin-seen-orders";

// A short two-tone chime, synthesised rather than fetched: no asset to ship,
// no request to fail, and it works the moment the page loads.
function playChime() {
  try {
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
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

    // Free the hardware once the sound has finished.
    setTimeout(() => void ctx.close(), 800);
  } catch {
    // Autoplay policy, no audio device, or a browser that refuses to build a
    // context. The badge and the desktop notification still fire.
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

/**
 * Watches a list of order numbers and announces the ones this browser has not
 * shown before: a chime, a desktop notification, and a count the page can put
 * in the tab title.
 *
 * "Seen" is per-browser on purpose. Two staff phones watching the same board
 * should both be alerted; this is a doorbell, not a shared inbox.
 */
export function useNewOrderAlert(orderNumbers: string[], enabled: boolean) {
  const { isArabic } = useLanguage();
  const [unseenCount, setUnseenCount] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const seenRef = useRef<Set<string> | null>(null);
  // The first poll after mount is the existing backlog, not new arrivals —
  // announcing it would chime once per order every time the page is opened.
  const primedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    if (seenRef.current === null) {
      seenRef.current = readSeen();
    }
    const seen = seenRef.current;

    const fresh = orderNumbers.filter((orderNumber) => !seen.has(orderNumber));
    if (fresh.length === 0) {
      primedRef.current = true;
      return;
    }

    fresh.forEach((orderNumber) => seen.add(orderNumber));
    writeSeen(seen);

    if (!primedRef.current) {
      primedRef.current = true;
      return;
    }

    setUnseenCount((count) => count + fresh.length);

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
  }, [orderNumbers, enabled, soundOn, isArabic]);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  return {
    unseenCount,
    clearUnseen: useCallback(() => setUnseenCount(0), []),
    soundOn,
    toggleSound: useCallback(() => setSoundOn((on) => !on), []),
    requestPermission,
    notificationPermission:
      typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  };
}
