

## Fix: Share text and domain

**Two problems:**
1. The clipboard fallback (`copyToClipboard`) only copies the raw URL with no blurb — unlike `navigator.share` which includes the text. Most desktop browsers don't support `navigator.share`, so users get just the bare link.
2. `window.location.origin` returns whatever domain the app is currently running on (preview = lovable.app). It should use the production domain `comediq.us`.

**Changes in `src/components/mic/MicActionBar.tsx`:**

1. **Hardcode production domain** — Replace `window.location.origin` with `https://comediq.us` so share links always point to the real site regardless of environment.

2. **Include blurb in clipboard copy** — Change `copyToClipboard` to copy `Check out ${micName} on Comediq! ${url}` instead of just the URL.

```tsx
// Line 100: Use production domain
const url = `https://comediq.us/mics/${encodeURIComponent(micName.toLowerCase().replace(/\s+/g, '-'))}`;

// Line 120: Copy full message, not just URL
await navigator.clipboard.writeText(`Check out ${micName} on Comediq! ${url}`);
```

Single file edit, two lines changed.

