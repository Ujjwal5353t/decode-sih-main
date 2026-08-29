"use client";

/**
 * The VidyaSetu logo lockup — the single source of the brand mark site-wide.
 *
 * The artwork is a complete lockup: mark, "VidyaSetu" wordmark and the
 * LEARN • GROW • BELONG tagline are all baked into the one file. So this
 * renders that image and nothing else — pairing it with a separate text
 * wordmark would print the brand name twice.
 *
 * Resilience: if `/logo.png` is missing or unreadable, the component falls
 * back to the previously shipped artwork rather than leaving a broken image
 * in the header. That matters because a half-written or empty file is easy to
 * end up with, and the navbar is the first thing anyone sees.
 *
 * `w-auto` against a fixed height class keeps the natural aspect ratio — a
 * parent can never stretch or squash the logo.
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/logo.png";
/** Last-known-good artwork, used only if LOGO_SRC fails to load. */
const LOGO_FALLBACK = "/vidyasetu-logo.png";

/** Intrinsic pixels of the artwork — drives srcset and layout reservation.
 *  Only the ratio matters once `w-auto` takes over. */
const LOGO_INTRINSIC = { width: 707, height: 353 };

type LogoSize = "sm" | "md" | "lg" | "xl";

/**
 * Deliberately generous. The lockup carries a two-line tagline beneath the
 * wordmark, so a good share of its height is fine print — the whole thing has
 * to run tall for "VidyaSetu" itself to read at a confident size.
 */
const SIZES: Record<LogoSize, string> = {
  sm: "h-12 sm:h-14",
  md: "h-[60px] sm:h-[70px] lg:h-20",
  lg: "h-16 sm:h-20 lg:h-24",
  xl: "h-24 sm:h-28 md:h-32 lg:h-36",
};

export function BrandLogo({
  href = "/",
  size = "md",
  priority = false,
  className,
}: {
  /** Pass null to render a non-navigating lockup (e.g. already inside a link). */
  href?: string | null;
  size?: LogoSize;
  priority?: boolean;
  className?: string;
}) {
  const [src, setSrc] = useState(LOGO_SRC);

  const lockup = (
    <Image
      src={src}
      alt=""
      width={LOGO_INTRINSIC.width}
      height={LOGO_INTRINSIC.height}
      aria-hidden="true"
      priority={priority}
      onError={() => {
        if (src !== LOGO_FALLBACK) setSrc(LOGO_FALLBACK);
      }}
      className={cn(
        "brand-logo-img w-auto object-contain transition-transform duration-300 ease-out group-hover:scale-[1.03]",
        SIZES[size]
      )}
    />
  );

  const shared = cn("group inline-flex shrink-0 items-center", className);

  if (href === null) {
    return <span className={shared}>{lockup}</span>;
  }

  return (
    <Link href={href} className={shared} aria-label="VidyaSetu — Go to home">
      {lockup}
    </Link>
  );
}
