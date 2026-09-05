# Omathlete roadmap

## Product promise

Omathlete answers: when does my team play, where can I watch, and what is the
score? It should be fast enough to summon, read, and dismiss without leaving
the keyboard.

## MVP

- Follow individual teams through a searchable picker.
- Show a favorite team's recent/live game and next game.
- Include local start time and broadcast network when ESPN provides it.
- Keep spoiler mode global and persistent.
- Support keyboard and pointer interaction.
- Cache briefly, preserve stale results during provider failures, and refresh
  automatically while the panel is open.
- Require no account, API key, backend, daemon, package installation, or
  elevated privilege.

Initial leagues: NFL, NBA, WNBA, MLB, NHL, college football, men's college
basketball, Premier League, and MLS.

## Next slices

1. Accessibility verification.
2. Optional game context such as venue and team records.

## Completed slices

- Team marks and theme-safe team accents.
- Provider fixtures for every supported league and offline/error cases.
- Targeted live refresh and reduced-motion score-change feedback.
- Reversible favorite sorting, manual ordering, and idle bar priority.
- Background kickoff discovery, local countdowns, and refreshing open details.
- Immediate preferences with serialized saves independent of provider requests.
- Atomic game caches, partial-catalog recovery, and per-team data age.

## Deliberately deferred

- Following entire leagues
- Standings and calendar views
- Notifications
- Play-by-play and betting lines
- Additional providers and non-team sports
- Account sync
