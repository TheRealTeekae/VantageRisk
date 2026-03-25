# TODOS

Deferred work from /plan-ceo-review (2026-03-25). Items are ordered by priority.

---

## P2 — Should Do

### Type extraction data properly
**What:** Add `PolicyExtraction`, `LossRunExtraction`, and `MarketDataExtraction` TypeScript
interfaces to `types/index.ts` matching the JSON shapes defined in `lib/anthropic.ts`.
Update `Engagement.extractedData` to use these instead of `unknown[]`.

**Why:** Currently the compiler provides no safety on extracted data shapes. Prompt changes
or schema drift will silently produce wrong reports with no compile-time warning.

**Pros:** Catches schema drift at compile time; makes report generation code safer to refactor.
**Cons:** Requires keeping types in sync with prompts manually.

**Context:** The JSON shapes are already fully specified in the system prompts in
`lib/anthropic.ts` (lines 9-135). This is a transcription exercise. Types should live in
`types/index.ts` alongside the existing domain types.

**Effort:** S (human) → S (CC)
**Depends on:** Nothing. Can be done anytime.

---

### PDF text extraction fallback (pdf-parse)
**What:** Add `pdf-parse` as a text-extraction fallback for scanned PDFs with no text layer.
If Claude's native document API returns a response where >80% of fields are null, re-attempt
extraction using extracted text via `pdf-parse`.

**Why:** Older loss runs and some policy documents are scanned images. Claude's vision-based
document API may return mostly-null extraction for these, producing incomplete reports.
`@types/pdf-parse` is already in devDependencies, suggesting this was planned.

**Pros:** Better coverage for real client documents; graceful degradation.
**Cons:** Adds a dependency; fallback logic adds complexity to `extractDocumentData()`.

**Context:** `lib/anthropic.ts:260-275` handles the PDF buffer path. The fallback would
try text extraction first, then native doc if text is empty, or vice versa.

**Effort:** M (human) → S (CC)
**Depends on:** Async extraction (so the fallback retry doesn't block the upload).

---

## P3 — Defer Until Needed

### Admin list pagination
**What:** Add cursor-based pagination to `listEngagements()` and the `/api/reports` GET
endpoint. Admin page gets a "Load more" button or infinite scroll.

**Why:** At 100+ engagements, the current in-memory sort-and-return-all will be slow
and the admin list will be unusable.

**Pros:** Scalable admin UX; reduces payload size.
**Cons:** Minor complexity in the store interface.

**Context:** `lib/store.ts:29-33` is the function to modify. The KV migration (coming soon)
is a good time to add pagination since the interface is changing anyway.

**Effort:** S (human) → S (CC)
**Depends on:** Persistence (Vercel KV) — easier to implement pagination with KV than Map.

---

## PR2 Bundle Items

### Migrate rate limiter from in-memory Map to Vercel KV
**What:** Replace the `Map<ip, { count, resetAt }>` in `lib/auth.ts` with Vercel KV-backed
rate limiting so the counter persists across cold starts and function instances.

**Why:** The current in-memory rate limiter resets on every cold start. A determined attacker
can trigger cold starts (by waiting for idle timeout) to reset the counter and get unlimited
login attempts. KV makes the limit persistent.

**Pros:** Persistent across restarts; works across multiple function instances; minimal code change.
**Cons:** Requires KV to be available (PR2 dependency).

**Context:** `lib/auth.ts` — the `loginAttempts` Map. In PR2, swap `Map.get/set` for
`kv.get/set` with the same key structure (`rate:login:{ip}`). TTL can be set directly on the
KV entry (15 minutes) instead of checking `resetAt` manually.

**Effort:** S (human) → S (CC)
**Depends on:** Vercel KV migration (PR2).
