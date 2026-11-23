import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const CANONICAL_ORIGIN = "https://comediq.com";

/** True when the app is being served from a preview/staging *.lovable.app host. */
export function isNonCanonicalHost() {
  if (typeof window === "undefined") return false;
  return window.location.hostname.endsWith(".lovable.app");
}

/**
 * /classic/... serves the pre-v3 pages at a second address, so every one of
 * them is a duplicate of a canonical page (/classic/perform of /perform, and
 * so on). They are kept reachable on purpose, but they must not compete with
 * the real pages in search results.
 *
 * robots.txt also disallows /classic; this covers the case where a crawler has
 * already followed a link to one.
 */
export function isDuplicateAddress(pathname: string) {
  return pathname === "/classic" || pathname.startsWith("/classic/");
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
 * every route, always pointing at the comediq.com version of the page.
 * On *.lovable.app hosts it also injects a noindex robots tag so preview
 * builds never compete with the canonical domain in search results.
 */
const CanonicalTag = () => {
  const { pathname, search } = useLocation();
  const page = parseInt(new URLSearchParams(search).get("page") || "1", 10);

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
    // Paginated listing pages self-reference their own page (?page=N, N > 1).
    link.setAttribute("href", canonicalUrlFor(pathname) + (page > 1 ? `?page=${page}` : ""));

    const robotsTag = () =>
      setTag('meta[name="robots"][data-canonical="app"]', () => {
        const el = document.createElement("meta");
        el.setAttribute("name", "robots");
        el.setAttribute("data-canonical", "app");
        return el;
      });

    if (isNonCanonicalHost()) {
      robotsTag().setAttribute("content", "noindex, nofollow");
    } else if (isDuplicateAddress(pathname)) {
      // follow, not nofollow: the links on a classic page point at canonical
      // pages, and those are worth crawling.
      robotsTag().setAttribute("content", "noindex, follow");
    } else {
      // Leaving a stale noindex behind would quietly de-index a real page.
      document.head
        .querySelectorAll('meta[name="robots"][data-canonical="app"]')
        .forEach((el) => el.remove());
    }
  }, [pathname, page]);

  return null;
};

export default CanonicalTag;
