# Omathlete

**Your teams. Right on time.**

Omathlete is a keyboard-first sports widget for the Omarchy Quattro bar. It
shows upcoming games, live and recent scores, and broadcast information for
the teams you follow. Spoiler mode is global and persists across shell
restarts.

## Install

```sh
omarchy plugin add https://github.com/chrisroundhill/omathlete.git --enable
```

The plugin ID is `io.github.chrisroundhill.omathlete`.

## Use

- Click the bar widget to open or close it.
- Press `/` to open native team search, then type any team name.
- Press `j`/`k` on favorites or the arrow keys in search to move.
- Press `o` on My Teams to cycle `Manual`, `Next Game`, and `League` sorting.
- In Manual sorting, press `Shift+j`/`Shift+k` to reorder favorites.
- Press `p` to pin the selected team to the idle bar. Live games still take priority.
- Press Enter in search to follow the selected team.
- Press Enter on a favorite to see its latest result and next three games.
- In team details, press `o` to open the selected game on ESPN and `h` or
  Escape to go back.
- Press `a` to temporarily show today's full slate for the leagues represented
  by your favorite teams. Press `a` again to return to My Teams.
- Press `x` or Delete to unfollow the selected team.
- Press `s` to persistently hide or show scores.
- Press `r` to refresh now.
- Press Escape to close.
- Middle-click the bar widget to refresh without opening it.

The bar prioritizes live favorite games, then the earliest upcoming game
across all favorites. Multiple live games rotate every six seconds. Horizontal
bars use a stable-width scoreboard label; vertical bars show the Omathlete
scoreboard mark without text. While a game is live, only the affected teams are
refreshed every 15 seconds. A changed score receives a brief, non-animated
highlight unless spoiler mode is enabled.

Sorting changes only the current view. Manual order is retained when viewing
teams by next game or league, and the selected sort mode, manual order, and idle
bar pin persist across shell restarts.

Omathlete currently supports NFL, NBA, WNBA, MLB, NHL, college football,
men's college basketball, the Premier League, and MLS.

## Requirements and data

Omathlete uses `curl`, `jq`, and `omarchy-menu-select`, which ship with a stock
Omarchy installation. It makes direct HTTPS requests to ESPN's undocumented
site JSON API. No account, API key, backend, telemetry, package installation,
or elevated privilege is used.

Preferences are stored in:

```text
~/.local/state/omarchy/settings/omathlete.json
```

Short-lived schedule responses are stored in:

```text
~/.cache/omarchy/omathlete/
```

ESPN's site API is not a supported public developer contract and may change.
Team and league names and logos belong to their respective owners. See
[SECURITY.md](SECURITY.md) for the security model and private reporting policy.

## Develop

Saved files inside an installed user plugin are discovered by the Omarchy
shell. To force discovery or inspect failures:

```sh
omarchy-shell shell rescanPlugins
omarchy plugin list --json
qs log -p "$OMARCHY_PATH/shell" --tail 100
```

Run deterministic provider coverage and the optional live integration check:

```sh
tests/provider-fixtures.sh
tests/smoke.sh
```

## License

MIT
