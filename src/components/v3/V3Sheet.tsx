import { useEffect, useRef } from "react";

import { useIsDesktop } from "@/hooks/useIsDesktop";
import { v3colors } from "@/theme/v3";

/**
 * One component, two presentations, per WEB_AND_HOST_PLAN.md:
 *
 *   "Bottom sheets (Register, My mic tracker) become a right-side drawer 440px
 *    wide on desktop. Map or page stays visible behind it."
 *
 * Phone: a sheet rising from the bottom, leaving the 54px of page the boards
 * show above it (Main.dc.html's sheets are `top: 54px; bottom: 0`).
 * Desktop: a 440px drawer on the right, full height.
 *
 * Both close on Escape and on a click outside, and both trap initial focus so
 * a keyboard user lands inside the dialog rather than behind it.
 */

interface Props {
  open: boolean;
  onClose: () => void;
  /** Read out as the dialog's name. */
  label: string;
  children: React.ReactNode;
  /** The sheet's own background. The tracker uses a warmer off-white. */
  background?: string;
}

export function V3Sheet({ open, onClose, label, children, background }: Props) {
  const isDesktop = useIsDesktop();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    // Move focus into the panel, and stop the page behind it scrolling.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 font-dmsans">
      <button
        type="button"
        aria-label={`Close ${label}`}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{ background: "rgba(18,26,51,.38)" }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={
          isDesktop
            ? "absolute inset-y-0 right-0 w-[440px] overflow-y-auto shadow-2xl outline-none"
            : "absolute inset-x-0 bottom-0 top-[54px] overflow-y-auto rounded-t-[34px] outline-none"
        }
        style={{ background: background ?? v3colors.white }}
      >
        {/* The grab handle only makes sense on the phone sheet. */}
        {!isDesktop && (
          <div
            aria-hidden="true"
            className="mx-auto mt-2.5 h-[5px] w-10 rounded-full"
            style={{ background: v3colors.borderField }}
          />
        )}
        {children}
      </div>
    </div>
  );
}

export default V3Sheet;
