"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { setFolderHeader } from "@/lib/folderHeader";
import { isBusy } from "@/lib/transition";

/**
 * hidden — at the title, or scrolling back up
 * shown  — scrolling down through the folder's content
 * merge  — at the bottom: the card folds into the button ("keep scrolling")
 */
export type NextState = "hidden" | "shown" | "merge";

/** How close to the end of the page counts as "the bottom". */
const BOTTOM_ZONE = 100;
/** Extra scrolling (px of wheel travel) needed at the bottom to go on to the next folder. */
const OVERSCROLL = 1500;
/** One wheel/touch event can add at most this much, so a single flick can't skip the wait. */
const MAX_STEP = 100;
/**
 * Phones and tablets: finger travel (px) at the bottom that fills the button.
 * About a third of a phone screen: one or two short swipes.
 */
const TOUCH_TRAVEL = 170;
/** Finger moving back up by more than this (px) cancels the progress; less is jitter. */
const TOUCH_CANCEL = 24;

/**
 * Scroll behaviour of an open folder:
 *  - tells the header when the reader has scrolled past the title;
 *  - says whether the "next folder" card and button are hidden, shown or merged;
 *  - at the bottom, turns further scrolling into progress (written to the
 *    `--progress` CSS variable on the widget) and calls `onNext` when it fills.
 */
export function useFolderScroll(root: RefObject<HTMLElement | null>, title: string, onNext?: () => void): NextState {
  const [state, setState] = useState<NextState>("hidden");
  const onNextRef = useRef(onNext);
  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setFolderHeader({ title, active: false });

    let lastY = window.scrollY;
    let goingDown = true;
    let amount = 0;
    let fired = false;
    let touchY = 0;
    let frame = 0;

    const limit = () => document.documentElement.scrollHeight - window.innerHeight;
    const atBottom = () => limit() > 0 && window.scrollY >= limit() - BOTTOM_ZONE;
    const widget = () => el.querySelector<HTMLElement>("[data-next-widget]");
    const setProgress = (value: number) => widget()?.style.setProperty("--progress", value.toFixed(3));

    const measure = () => {
      frame = 0;
      const y = window.scrollY;
      if (Math.abs(y - lastY) > 2) {
        goingDown = y > lastY;
        lastY = y;
      }
      const header = document.querySelector("[data-site-header]");
      const headerHeight = header ? header.getBoundingClientRect().height : 56;
      const content = el.querySelector("[data-case-content]");
      // Past the title = the folder's content has reached the header.
      const past = content ? content.getBoundingClientRect().top <= headerHeight + 1 : false;
      const bottom = past && atBottom();

      setFolderHeader({ active: past });
      if (!bottom && amount) {
        amount = 0;
        setProgress(0);
      }
      setState(bottom ? "merge" : past && goingDown ? "shown" : "hidden");
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    // At the bottom the page can't scroll any further, so wheel and touch
    // travel is counted instead and shown as progress in the button.
    // `amount` is a share of the way (0..1), so wheel and touch fill at their own pace.
    const push = (share: number, cap: number) => {
      if (fired || isBusy() || !onNextRef.current || !atBottom()) return;
      if (share > 0) amount += Math.min(share, cap);
      else if (share < 0) amount = 0;
      const progress = Math.min(amount, 1);
      setProgress(progress);
      if (progress >= 1) {
        fired = true;
        onNextRef.current();
      }
    };
    const onWheel = (e: WheelEvent) => push(e.deltaY / OVERSCROLL, MAX_STEP / OVERSCROLL);
    let touchUp = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
      touchUp = 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const d = touchY - y; // > 0: finger moving up = scrolling on
      touchY = y;
      if (d >= 0) {
        touchUp = 0;
        push(d / TOUCH_TRAVEL, 0.25);
      } else if ((touchUp -= d) > TOUCH_CANCEL) {
        push(-1, 0);
      }
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    schedule();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      setProgress(0);
      setFolderHeader({ active: false });
    };
  }, [root, title]);

  return state;
}
