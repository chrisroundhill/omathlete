#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
test_root=$(mktemp -d)
trap 'rm -rf "$test_root"' EXIT

export XDG_STATE_HOME="$test_root/state"
export XDG_CACHE_HOME="$test_root/cache"

mkdir -p "$XDG_STATE_HOME/omarchy/settings"

results=$("$repo_dir/bin/omathlete" search chiefs)
jq -e 'any(.[]; .sport == "nfl" and .teamId == "12" and .teamName == "Kansas City Chiefs")' \
  <<<"$results" >/dev/null

"$repo_dir/bin/omathlete" follow nfl 3
jq -e 'any(.teams[]; .sport == "nfl" and .teamId == "3")' \
  "$XDG_STATE_HOME/omarchy/settings/omathlete.json" >/dev/null

"$repo_dir/bin/omathlete" follow mlb 16

output=$("$repo_dir/bin/omathlete" detail --no-cache)
jq -e '
  .schemaVersion == 1
  and .spoilersHidden == false
  and .stale == false
  and (.teams | length) == 2
  and .primary.sport == "mlb"
  and .primary.teamAbbrev == "CHC"
  and .teams[0].teamAbbrev == "CHI"
  and (.teams[0].teamLogo | test("^https://a\\.espncdn\\.com/"))
  and (.teams[0].teamColor | test("^#[0-9A-Fa-f]{6}$"))
  and (.teams[0].teamAlternateColor == "" or (.teams[0].teamAlternateColor | test("^#[0-9A-Fa-f]{6}$")))
  and .teams[0].stale == false
  and (.teams[0] | has("current"))
  and (.teams[0] | has("upcoming"))
  and (.teams[0].upcoming != null)
  and (.teams[0].schedule | type) == "array"
  and (.teams[0].schedule | length) <= 5
  and (.teams[0].schedule | map(select(.kind == "upcoming")) | length) == 3
  and all(.teams[0].schedule[]; has("kind") and has("when") and has("gameUrl"))
  and (.teams[0].schedule | map(select(.kind == "upcoming" and .broadcast != "")) | length) >= 1
  and any(.teams[]; .sport == "mlb"
    and (.upcoming != null)
    and (.schedule | map(select(.kind == "upcoming")) | length) == 3
    and all(.schedule[]; (.when | test("^Wed, Dec 31") | not))
    and all(.schedule[] | select(.gameUrl != ""); .gameUrl | test("^https://www\\.espn\\.com/mlb/")))
' <<<"$output" >/dev/null

slate=$("$repo_dir/bin/omathlete" slate --no-cache)
jq -e '
  (.games | type) == "array"
  and (.leagues | type) == "array"
  and (.games | length) > 0
  and ([.games[] | .sport] | all(. == "nfl" or . == "mlb"))
  and ([.games[] | (.sport + ":" + .id)] | length)
    == ([.games[] | (.sport + ":" + .id)] | unique | length)
  and all(.games[]; has("homeTeam") and has("awayTeam") and has("state")
    and has("when") and has("gameUrl"))
' <<<"$slate" >/dev/null

"$repo_dir/bin/omathlete" toggle-spoilers
jq -e '.spoilersHidden == true' \
  "$XDG_STATE_HOME/omarchy/settings/omathlete.json" >/dev/null
jq -e '.spoilersHidden == true' < <("$repo_dir/bin/omathlete" slate) >/dev/null

printf 'Omathlete smoke test passed.\n'
