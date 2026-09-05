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

## Remove

Disable and remove the plugin with:

```sh
omarchy plugin remove io.github.chrisroundhill.omathlete
```

Removal leaves your preferences and short-lived cache in place so reinstalling
does not discard your followed teams. To remove that data as well, delete:

```text
~/.local/state/omarchy/settings/omathlete.json
~/.local/state/omarchy/settings/omathlete-reminders.json
~/.cache/omarchy/omathlete/
```

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
- Press `g` for your sports agenda or `l` for your watch-later queue.
- Press Escape to close.
- Middle-click the bar widget to refresh without opening it.

The bar prioritizes live favorite games, then the earliest upcoming game
across all favorites. Multiple live games rotate every six seconds. Horizontal
bars use a stable-width scoreboard label; vertical bars show the Omathlete
scoreboard mark without text. While a game is live, only the affected teams are
refreshed every 15 seconds. A changed score receives a brief, non-animated
highlight unless spoiler mode is enabled.

With the panel closed, schedules refresh every five minutes, increasing to
once a minute within 15 minutes of the next game. Countdown labels update
locally every 15 seconds. Open team details continue updating as games go live
or finish, preserving your selected game when its position changes.

Spoiler, sort, and pin changes appear immediately and save independently of
network refreshes. Hidden scores also replace provider status descriptions
with generic labels so result summaries cannot reveal a winner.

Each team shows when its data was last updated. Provider failures preserve
cached games, and unavailable data is distinguished from an empty schedule.
Partial team-search refreshes retain the failed leagues' previous entries.

Favorites display cached games first, then update individually as requests
finish. Teams without cached data appear as loading placeholders. Full Slate
fetches up to three leagues concurrently and creates rows as you scroll.
Refreshes preserve the selected team/game and its position in the viewport.

## Agenda, watch later, and reminders

The agenda shows followed teams' games for Today, Tomorrow, Weekend
(Saturday–Sunday), or Seven Days. Press `1`–`4` to select a period and Tab
to switch between the agenda and watch-later queue. Dates use your local
timezone. A matchup between two followed teams appears once. Coverage depends
on ESPN's available schedules; the agenda is capped at 32 games per team.

Press `w` on an agenda or team-detail game to save it for later. Its scores and revealing
status descriptions stay hidden throughout the widget, including the bar,
until you mark it watched/remove it with `w`. Global spoiler mode still takes
precedence. In the planner, `v` explicitly reveals only the selected result;
moving to another game or closing the planner clears that temporary reveal.
Saved games remain in the queue even after leaving the schedule window. If a
result is no longer cached, `o` opens its ESPN page (which may show spoilers).

Reminders are **off by default**. Press `b` on a game to cycle Off → 15 minutes
before → At start → Off. Reminder messages contain only the matchup, local
start time, and broadcast—not scores. `q` toggles the default local quiet window
of 10 p.m.–8 a.m. Both lists hold up to 32 games.

Reminders run only while the desktop shell/plugin is running, using recently
cached schedules. Delivery is deduplicated across shell restarts. Reminders
missed by more than two minutes are skipped, so resuming the desktop does not
produce a backlog. Removing a followed team stops its cache refreshes and may
prevent its saved reminders from being delivered.

Sorting changes only the current view. Manual order is retained when viewing
teams by next game or league, and the selected sort mode, manual order, and idle
bar pin persist across shell restarts.

Omathlete currently supports NFL, NBA, WNBA, MLB, NHL, college football,
men's college basketball, the Premier League, and MLS.

## Requirements and data

Omathlete uses `curl`, `jq`, `flock` (util-linux), and `omarchy-menu-select`, which ship with a stock
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
bash tests/reliability.sh
node tests/panel-logic.mjs
node tests/loading.mjs
node tests/slate-view.mjs
node tests/planner.mjs
node tests/planner-view.mjs
tests/smoke.sh
```

Node.js is needed only for development tests, not to run the plugin.
The slate rendering test also uses Qt 6's `qmltestrunner` and QtTest module;
set `QMLTESTRUNNER` if the executable is installed at a nonstandard path.

## License

MIT
