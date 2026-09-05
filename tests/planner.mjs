import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const repo = fileURLToPath(new URL('../', import.meta.url));
const logic = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(repo, 'PanelLogic.js'), 'utf8'), logic);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'omathlete-planner-'));
const now = Date.parse('2026-09-05T17:00:00Z') / 1000;
const env = {...process.env, TZ:'America/Chicago', XDG_STATE_HOME:path.join(tmp,'state'),
  XDG_CACHE_HOME:path.join(tmp,'cache'), OMATHLETE_TESTING:'1', OMATHLETE_NOW:String(now),
  OMATHLETE_NOTIFY_LOG:path.join(tmp,'notifications.log')};
const statePath = path.join(env.XDG_STATE_HOME,'omarchy/settings/omathlete.json');
const cachePath = path.join(env.XDG_CACHE_HOME,'omarchy/omathlete/mlb-16.json');
const team = {sport:'mlb',teamId:'16',teamName:'Chicago Cubs',teamAbbrev:'CHC'};
const game = {id:'401234',date:new Date((now+900)*1000).toISOString(),homeTeam:'CHC',awayTeam:'SEA',
  isHome:true,opponent:'SEA',teamScore:'9',opponentScore:'1',state:'pre',detail:'Scheduled',broadcast:'FOX',gameUrl:'https://www.espn.com/mlb/game/_/gameId/401234'};
function cache(event = game, at = now) {
  fs.writeFileSync(cachePath,JSON.stringify({...team,current:event,upcoming:event,schedule:[event],agenda:[event],updatedAt:at}));
  fs.utimesSync(cachePath,at,at);
}
function run(args, extra={}) {
  const result = spawnSync(path.join(repo,'bin/omathlete'),args,{env:{...env,...extra},encoding:'utf8',timeout:20000});
  assert.equal(result.status,0,result.stderr);
  return JSON.parse(result.stdout);
}
try {
  fs.mkdirSync(path.dirname(statePath),{recursive:true});
  fs.mkdirSync(path.dirname(cachePath),{recursive:true});
  fs.writeFileSync(statePath,JSON.stringify({schemaVersion:1,spoilersHidden:false,teams:[team]}));
  cache();
  const initial = run(['state']);
  assert.equal(initial.teams.length,1);
  assert.deepEqual(initial.watchLater,[]);
  assert.deepEqual(initial.reminders,[]);
  assert.equal(initial.quietHours,true);
  let state = run(['watch-game','mlb',game.id]);
  assert.equal(state.watchLater.length,1);
  assert.equal(state.watchLater[0].teamScore,undefined,'Queue stores metadata, not results');
  assert.ok(logic.protectedGame(game,'mlb',state));
  state = run(['cycle-sort']);
  assert.equal(state.watchLater.length,1,'Unrelated settings preserve the queue');
  state = run(['remind-game','mlb',game.id]);
  assert.equal(state.reminders[0].leadMinutes,15);
  assert.equal(run(['check-reminders']).sent,1);
  assert.equal(run(['check-reminders']).sent,0,'Restarted checker must not send twice');
  const notice = fs.readFileSync(env.OMATHLETE_NOTIFY_LOG,'utf8');
  assert.ok(notice.includes('SEA @ CHC') && notice.includes('FOX'));
  assert.ok(!notice.includes('9–1') && !notice.includes('Scheduled'));
  assert.equal(run(['remind-game','mlb',game.id]).reminders[0].leadMinutes,0);
  cache({...game,state:'in'},now+900);
  assert.equal(run(['check-reminders'],{OMATHLETE_NOW:String(now+900)}).sent,1,'Start-time reminder works after live transition');
  assert.deepEqual(run(['remind-game','mlb',game.id]).reminders,[]);

  // Quiet hours and stale/missed deadlines do not produce a catch-up burst.
  const night = Date.parse('2026-09-06T04:00:00Z')/1000;
  cache({...game,date:new Date((night+900)*1000).toISOString()},night);
  run(['remind-game','mlb',game.id]);
  assert.equal(run(['check-reminders'],{OMATHLETE_NOW:String(night)}).sent,0);
  run(['toggle-quiet']);
  assert.equal(run(['check-reminders'],{OMATHLETE_NOW:String(night)}).sent,1);
  cache({...game,date:new Date((night+3600)*1000).toISOString()},night);
  assert.equal(run(['check-reminders'],{OMATHLETE_NOW:String(night+2700)}).sent,0,'Old cache is not used');
  cache({...game,date:new Date((night+900)*1000).toISOString()},night+400);
  assert.equal(run(['check-reminders'],{OMATHLETE_NOW:String(night+400)}).sent,0,'Missed reminder is not delivered late');
  assert.deepEqual(run(['watch-game','mlb',game.id]).watchLater,[]);

  // Both followed teams in a fixture yield one agenda row, with correctly oriented scores.
  const rows = logic.agendaGames([{...team,agenda:[game]},
    {sport:'mlb',teamId:'12',teamAbbrev:'SEA',agenda:[{...game,isHome:false,teamScore:'1',opponentScore:'9'}]}]);
  assert.equal(rows.length,1);
  assert.equal(rows[0].homeScore,'9');
  assert.equal(rows[0].awayScore,'1');
  const saved = {...logic.preferences(initial),watchLater:[{...game,sport:'mlb'}]};
  assert.equal(logic.plannerRows([],saved,0,true,now*1000)[0].state,'unknown','Saved game survives disappearing from provider window');
  assert.ok(logic.protectedGame(game,'mlb',saved));
  assert.ok(logic.protectedGame(game,'mlb',{...initial,spoilersHidden:true}));
  assert.ok(!logic.protectedGame(game,'mlb',initial));
  const bounds = logic.agendaRange(3,now*1000);
  assert.ok(now*1000 >= bounds[0] && now*1000 < bounds[1]);
  const weekend = logic.agendaRange(2,now*1000);
  assert.equal(new Date(weekend[0]).getDay(),6);
  assert.equal(new Date(weekend[1]).getDay(),1);

  // Optional planner fields are sanitized without discarding legacy favorite teams.
  fs.writeFileSync(statePath,JSON.stringify({...initial,watchLater:[{...game,sport:'../../bad'}],reminders:'bad'}));
  const clean = run(['state']);
  assert.equal(clean.teams.length,1);
  assert.deepEqual(clean.watchLater,[]);
  assert.deepEqual(clean.reminders,[]);
  const detail = run(['detail','--no-cache'],{OMATHLETE_CURL_BIN:path.join(repo,'tests/fixture-curl'),OMATHLETE_FIXTURE_CURRENT_DATES:'1'});
  assert.equal(detail.teams[0].agenda.length,2,'Provider normalization exposes the agenda window separately from detail rows');
  assert.ok(detail.teams[0].agenda.every(game => game.homeTeam && game.awayTeam && game.id));
  assert.ok(detail.teams[0].schedule.length <= 5);
  console.log('Omathlete planner and reminder tests passed.');
} finally { fs.rmSync(tmp,{recursive:true,force:true}); }
