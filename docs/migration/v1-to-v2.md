# API migration guide: v1 to v2

> Status: placeholder. API v2 has not been introduced yet. This document defines the migration workflow to use when the first breaking v2 change is proposed.

Lily Backend uses URL path versioning. Additive changes continue to ship under v1; a v2 route surface is introduced only when a breaking change requires clients to migrate.

## Migration workflow

1. Create `src/routes/v2/index.ts` with the v2 router and its version-specific route wiring.
2. Mount the v2 router alongside v1 in `src/app.ts` (for example, `app.use("/api/v2", apiV2Router)`).
3. Keep the existing v1 routes unchanged for backward compatibility during the migration window.
4. Document every client-facing breaking change in this guide, including old and new request/response examples and any required client action.
5. Announce the v1 deprecation timeline in [`CHANGELOG.md`](../../CHANGELOG.md), preserving the minimum six-month notice period described in the README.

## Breaking-change inventory

No v1-to-v2 breaking changes have been announced yet.

When v2 work begins, add one section per change using this template:

### `<endpoint or behavior>`

- **v1 behavior:** Describe the current contract.
- **v2 behavior:** Describe the breaking replacement.
- **Client action:** Explain exactly what callers must change.
- **Deprecation date:** Link to the matching changelog entry.

## Rollout checklist

- [ ] v2 router exists and is mounted alongside v1.
- [ ] v1 remains available and behavior-compatible during the notice period.
- [ ] Breaking changes and client actions are documented here.
- [ ] `CHANGELOG.md` announces the deprecation timeline.
- [ ] README versioning links still resolve to this guide and the changelog.
