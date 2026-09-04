#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
test_root=$(mktemp -d)
trap 'rm -rf "$test_root"' EXIT

export XDG_STATE_HOME="$test_root/state"
export XDG_CACHE_HOME="$test_root/cache"
export OMATHLETE_TESTING=1
export OMATHLETE_CURL_BIN="$repo_dir/tests/fixture-curl"
mkdir -p "$XDG_STATE_HOME/omarchy/settings"

jq -cn --slurpfile teams "$repo_dir/tests/fixtures/provider-teams.json" \
  '{schemaVersion:1,spoilersHidden:false,teams:($teams[0] | map({sport,teamId,teamName,teamAbbrev}))}' \
  >"$XDG_STATE_HOME/omarchy/settings/omathlete.json"

output=$("$repo_dir/bin/omathlete" detail --no-cache)
jq -e '
  (.teams | length) == 9
  and ([.teams[].sport] | sort) == (["cbb","cfb","epl","mlb","mls","nba","nfl","nhl","wnba"] | sort)
  and all(.teams[];
    .stale == false
    and .current.state == "in"
    and .current.teamScore == "14"
    and .upcoming.broadcast == "TEST"
    and (.teamLogo | test("^https://a\\.espncdn\\.com/"))
    and (.teamColor | test("^#[0-9a-fA-F]{6}$")))
' <<<"$output" >/dev/null

live_refresh=$("$repo_dir/bin/omathlete" detail --live nfl:3)
jq -e '(.teams | length) == 9 and .teams[0].current.state == "in"' \
  <<<"$live_refresh" >/dev/null

offline=$(OMATHLETE_FIXTURE_FAILURE=1 "$repo_dir/bin/omathlete" detail --no-cache)
jq -e '.stale == true and (.teams | length) == 9 and all(.teams[]; .stale == true)' \
  <<<"$offline" >/dev/null

rm -f "$XDG_CACHE_HOME/omarchy/omathlete"/*.json
malformed=$(OMATHLETE_FIXTURE_MALFORMED=1 "$repo_dir/bin/omathlete" detail --no-cache)
jq -e '.teams == [] and .stale == false' <<<"$malformed" >/dev/null

printf '%s\n' '{"schemaVersion":1,"spoilersHidden":false,"teams":[{"sport":"nfl","teamId":"../../escape","teamName":"Bad","teamAbbrev":"BAD"}]}' \
  >"$XDG_STATE_HOME/omarchy/settings/omathlete.json"
jq -e '.teams == []' < <("$repo_dir/bin/omathlete" state) >/dev/null

printf 'Omathlete provider fixtures passed.\n'
