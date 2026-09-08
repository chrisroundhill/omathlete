# 0.1.2 release checklist

Work stays on `dev` until the release is deliberately promoted. This document
does not authorize a merge, push, tag, GitHub release, or marketplace submission.

## Automated gates

Last local verification: 2026-09-08. Deterministic suites, live ESPN smoke,
shell syntax, manifest check, QML lint, and whitespace checks passed. A focused
review checked response/output limits, planner-state validation, browser target
restrictions, and notification argument handling; the tracked-file scan found
no matching private-key or common access-token patterns. This is not an audit.

- Shell syntax and manifest contract from `.github/workflows/ci.yml`.
- Every deterministic test listed in README, including bar geometry and planner selection.
- QML lint against the installed Omarchy shell modules.
- Optional live ESPN smoke test: `tests/smoke.sh` (uses isolated state/cache).
- `git diff --check` and review of the release diff for secrets or local paths.

## Desktop and media gates

- [ ] Check Agenda with a crowded list and the active theme; traverse using only the keyboard.
- [ ] Remove first/middle/last Watch Later entries; selection remains visible and results stay protected.
- [ ] Verify reminder Off / 15m before / At start, quiet hours, and no duplicate notification after reload.
- [ ] Confirm compact horizontal spacing and a usable vertical stale indicator.
- [x] Capture updated `preview.png` with no private desktop content (user supplied, 2026-09-08).
- [ ] Capture an additional Agenda screenshot (optional promotional material).
- [ ] Record a short keyboard-only demonstration; include spoiler mode and reminders.

The updated preview shows the current home view and compact horizontal bar.
Do not publish a whole-desktop capture containing unrelated applications.

## Promotion

1. Complete the gates and finalize the changelog.
2. Set `manifest.json` to 0.1.2 on `dev` when the candidate is accepted.
3. Push `dev` and open a reviewed PR into `main`.
4. After merge, tag the accepted main commit and create the GitHub release.
5. Follow the marketplace's current exact-commit update/approval process.

Keep `main` stable while any marketplace review of its current commit is pending.
Security checks are regression evidence, not a security certification.
