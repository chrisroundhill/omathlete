import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const logic = vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('../PanelLogic.js', import.meta.url), 'utf8'), logic);
const now = Date.parse('2026-09-05T18:00:00Z');
const team = {sport: 'mlb', teamId: '16', teamAbbrev: 'CHC',
  upcoming: {id: 'game-1', date: new Date(now + 3600000).toISOString()}};
assert.equal(logic.refreshInterval([team], false, now), 300000);
assert.equal(logic.refreshInterval([team], false, now + 50 * 60000), 60000);
assert.equal(logic.refreshInterval([team], false, now + 61 * 60000), 60000);
assert.equal(logic.refreshInterval([team], true, now), 60000);
assert.equal(logic.refreshInterval([], false, now), 300000);
assert.equal(logic.countdown(team.upcoming.date, now), '1h');
assert.equal(logic.countdown(team.upcoming.date, now + 50 * 60000), '10m');
assert.equal(logic.countdown(team.upcoming.date, now + 61 * 60000), 'Starting');
assert.equal(logic.countdown('invalid', now), 'TBD');

for (const state of ['in', 'post', 'pre']) {
  const status = logic.statusText({state, detail: 'Cubs win 4–2 on penalties'}, true);
  assert.ok(!/Cubs|win|4|2|penalties/.test(status));
}
assert.equal(logic.freshness({stale: true, updatedAt: now / 1000 - 240}, now), 'Cached · updated 4m ago');
assert.match(logic.freshness({stale: true}, now), /Couldn't load/);

// Exercise the actual panel methods with controllable process/timer substitutes.
const source = fs.readFileSync(new URL('../Panel.qml', import.meta.url), 'utf8');
const calls = [];
const panel = vm.createContext({Logic: logic, console,
  Qt: {callLater: callback => calls.push(callback)},
  report: {teams: [team]}, savedPreferences: {teams: [team], spoilersHidden: false},
  preferences: {teams: [team], spoilersHidden: false, sortMode: 'manual'},
  preferencesReady: true, preferenceQueue: [],
  selectedIndex: 0, pendingSelectionKey: '', gameSelectedIndex: 0,
  detailTeamKey: {sport: 'mlb', teamId: '16'},
  detailProcess: {running: true}, preferenceProcess: {running: false},
  scoreFlashTimer: {restart() {}}, scoreFlashTeams: {},
  refreshPending: false, forceRefreshPending: false, backend: '/test/backend',
  lastRefreshAt: 0, busy: false, errorMessage: ''});
panel.root = panel;
for (const match of source.matchAll(/^  function \w+\([^\n]*\) \{[\s\S]*?^  \}/gm))
  vm.runInContext(match[0], panel);
Object.defineProperties(panel, {
  teams: {get: () => panel.sortedTeams(panel.report.teams || [])},
  sortMode: {get: () => panel.preferences.sortMode || 'manual'},
  pinnedTeam: {get: () => panel.preferences.pinnedTeam || null},
  spoilersHidden: {get: () => !panel.preferencesReady || panel.preferences.spoilersHidden},
  detailTeam: {get: () => panel.findTeam(panel.detailTeamKey)}
});

// A slow network request cannot delay local changes or overwrite them on completion.
panel.toggleSpoilers();
assert.equal(panel.spoilersHidden, true);
panel.cycleSort();
panel.togglePinSelected();
assert.equal(panel.sortMode, 'next');
assert.equal(panel.pinnedTeam.teamId, '16');
assert.equal(panel.preferenceQueue.length, 3);
assert.equal(panel.preferenceProcess.command[1], 'toggle-spoilers');
panel.adoptReport({spoilersHidden: false, sortMode: 'manual', pinnedTeam: null, teams: [team]});
assert.equal(panel.spoilersHidden, true);
assert.equal(panel.sortMode, 'next');
assert.equal(panel.pinnedTeam.teamId, '16');

// Completing the first save must preserve later optimistic changes.
panel.finishPreference(0, logic.applyPreference(panel.savedPreferences, panel.preferenceQueue[0]));
assert.equal(panel.spoilersHidden, true);
assert.equal(panel.sortMode, 'next');
assert.equal(panel.pinnedTeam.teamId, '16');

// A failed save rolls back that action while later pending actions stay applied.
panel.finishPreference(1, null);
assert.equal(panel.sortMode, 'manual');
assert.equal(panel.spoilersHidden, true);
assert.equal(panel.pinnedTeam.teamId, '16');
assert.match(panel.errorMessage, /Could not save/);

// A queued force refresh is remembered while the network process is occupied.
panel.refresh(true);
assert.equal(panel.refreshPending, true);
assert.equal(panel.forceRefreshPending, true);

// The actual closed-panel timer starts a request at the background deadline.
panel.opened = false;
panel.fullSlateOpen = false;
panel.detailProcess.running = false;
panel.lastRefreshAt = Date.now() - 300000;
panel.tick();
assert.equal(panel.detailProcess.running, true);
assert.equal(panel.detailProcess.command[1], 'detail');

// Details resolve fresh objects and follow a selected game across kickoff/reordering.
panel.report = {teams: [{...team, schedule: [{id: 'older'}, {...team.upcoming}]}]};
panel.gameSelectedIndex = 1;
const live = {...team.upcoming, state: 'in', teamScore: '1', opponentScore: '0'};
panel.adoptReport({teams: [{...team, current: live, schedule: [live, {id: 'older'}]}]});
assert.equal(panel.detailTeam.current.teamScore, '1');
assert.equal(panel.gameSelectedIndex, 0);
panel.adoptReport({teams: [{...team, current: {...live, teamScore: '2'}, schedule: [{...live, teamScore: '2'}]}]});
assert.equal(panel.detailTeam.schedule[0].teamScore, '2');
assert.equal(panel.gameSelectedIndex, 0);
assert.equal(logic.selectedGameIndex([], 'removed', 3), 0);

console.log('Omathlete panel interaction tests passed.');
