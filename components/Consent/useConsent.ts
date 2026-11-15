"use client";

import { useSyncExternalStore } from "react";
import { getConsent, getServerConsent, subscribeConsent } from "@/lib/consent";

/** The reader's consent choices; re-renders when they change. */
export const useConsent = () => useSyncExternalStore(subscribeConsent, getConsent, getServerConsent);
