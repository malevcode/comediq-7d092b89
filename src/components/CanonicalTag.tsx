import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const CANONICAL_ORIGIN = "https://comediq.us";

/** True when the app is being served from a preview/staging *.lovable.app host. */
export function isNonCanonicalHost() {
  if (typeof window === "undefined") return false;
  return window.location.hostname.endsWith(".lovable.app");
}

/** Absolute canonical URL for a path, always on the canonical domain. */
export function canonicalUrlFor(pathname: string) {
  const path = pathname === "/" ? "" : pathname.replace(/\/+$/, "");
  return `${CANONICAL_ORIGIN}${path}`;
}

function setTag(selector: string, create: () => HTMLElement) {
  let el = document.head.querySelector(selector) as HTMLElement | null;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
}

/**
 * Keeps exactly one self-referencing <link rel="canonical"> in the head on
 * every route, always pointing at the comediq.us version of the page.
 * On *.lovable.app hosts it also injects a noindex robots tag so preview
 * builds never compete with the canonical domain in search results.
 */
const CanonicalTag = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Remove any stray canonicals so only ours remains.
    document.head
      .querySelectorAll('link[rel="canonical"]:not([data-canonical="app"])')
      .forEach((el) => el.remove());

    const link = setTag('link[rel="canonical"][data-canonical="app"]', () => {
      const el = document.createElement("link");
      el.setAttribute("rel", "canonical");
      el.setAttribute("data-canonical", "app");
      return el;
    });
    link.setAttribute("href", canonicalUrlFor(pathname));

    if (isNonCanonicalHost()) {
      const robots = setTag('meta[name="robots"][data-canonical="app"]', () => {
        const el = document.createElement("meta");
        el.setAttribute("name", "robots");
        el.setAttribute("data-canonical", "app");
        return el;
      });
      robots.setAttribute("content", "noindex, nofollow");
    }
  }, [pathname]);

  return null;
};

export default CanonicalTag;
