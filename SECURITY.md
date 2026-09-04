# Security policy

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability. Use GitHub's
private vulnerability reporting for this repository. Include the affected
version, reproduction steps, and expected impact. If private reporting is not
enabled yet, wait until it is available rather than publishing exploit details.

## Security model

Omathlete runs as the current desktop user. It does not request elevated
privileges, accept inbound connections, collect telemetry, or store account
credentials. It writes only its preference and short-lived cache files under
the user's XDG state and cache directories.

Network requests are limited to ESPN's HTTPS site API and image CDN. Links
opened from game rows must use ESPN's HTTPS website origin. Provider data and
local state are validated before their values become file paths, colors, image
sources, or browser targets.

Provider JSON responses retain a 12-second-or-shorter deadline and are rejected
before parsing if their decompressed body exceeds 8 MiB. Cached and derived
responses have smaller type-specific byte limits. Team catalogs, merged event
feeds, team schedules, league slates, text fields, and the final JSON emitted to
the shell are also explicitly bounded.

ESPN's site API is undocumented and may change. Team and league names and logos
remain the property of their respective owners; their inclusion does not imply
affiliation or endorsement.

## Supported versions

Until the first stable release, security fixes are applied only to the latest
version on the `main` branch.
