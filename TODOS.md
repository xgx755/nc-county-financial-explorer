# TODOS — NC County Financial Explorer

---

## P2 — Web Share API (mobile native share)

**What:** On mobile devices, replace the clipboard copy path in the Share & Export dropdown with `navigator.share()` — the iOS/Android native share sheet (email, Messages, AirDrop, copy link). Falls back to clipboard on desktop browsers where `navigator.share` is not available.

**Why:** Budget directors using the tool on their phone get a much better sharing experience — one tap opens the native share sheet instead of copy/paste. Clipboard copy on mobile works but is clunkier than the native flow.

**Pros:** Native iOS/Android share sheet is faster and more familiar. Zero new dependencies — feature-detected at runtime.

**Cons:** `navigator.share` is only available over HTTPS and on supported browsers. Need to verify GitHub Pages URL (`https://xgx755.github.io/nc-county-financials/`) qualifies.

**Context:** Deferred from Phase 1 scope review (2026-04-15). The Share & Export dropdown was being built with clipboard copy. Adding `navigator.share` is a small enhancement to wire in after Phase 1 ships and is validated.

**How to implement:**
```js
if (navigator.share) {
  navigator.share({ title: `NC County Financial Explorer — ${county.name}`, url: window.location.href })
    .catch(err => console.error('Share failed:', err));
} else {
  navigator.clipboard.writeText(window.location.href)
    .then(() => { setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); })
    .catch(() => prompt("Copy this link:", window.location.href));
}
```

**Effort:** XS (human: ~1hr / CC: ~5 min)
**Priority:** P2 — after Phase 1 validated
**Depends on:** Phase 1 Share & Export dropdown shipped and tested
