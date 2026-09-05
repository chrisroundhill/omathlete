// Shared by the panel and deterministic interaction tests. Times are milliseconds.
function refreshInterval(teams, opened, now) {
  if (opened) return 60000;
  for (var i = 0; i < teams.length; i++) {
    var start = teams[i].upcoming ? Date.parse(teams[i].upcoming.date) : NaN;
    if (isFinite(start) && start - now <= 15 * 60000 && now - start <= 6 * 3600000)
      return 60000;
  }
  return 5 * 60000;
}

function countdown(date, now) {
  var start = Date.parse(date);
  if (!isFinite(start)) return "TBD";
  var remaining = start - now;
  if (remaining <= 0) return "Starting";
  if (remaining < 3600000) return Math.ceil(remaining / 60000) + "m";
  if (remaining < 86400000) return Math.ceil(remaining / 3600000) + "h";
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(start).getDay()];
}

function gameKey(game) {
  return game ? String(game.id || game.gameUrl || (game.date + ":" + game.opponent)) : "";
}

function selectedGameIndex(schedule, key, previousIndex) {
  for (var i = 0; i < schedule.length; i++)
    if (gameKey(schedule[i]) === key) return i;
  return Math.max(0, Math.min(previousIndex, schedule.length - 1));
}

function statusText(game, hidden) {
  if (!game) return "";
  if (!hidden) return game.detail || "Scheduled";
  // Provider descriptions can contain winners, aggregate scores and shootouts.
  return game.state === "in" ? "Live" : game.state === "post" ? "Final" : "Scheduled";
}

function freshness(item, now) {
  if (!item) return "";
  var updated = Number(item.updatedAt || 0);
  if (!updated) return item.stale ? "Couldn't load games · r to retry" : "";
  var minutes = Math.max(0, Math.floor((now / 1000 - updated) / 60));
  var age = minutes < 1 ? "just now" : minutes < 60 ? minutes + "m ago"
    : minutes < 1440 ? Math.floor(minutes / 60) + "h ago" : Math.floor(minutes / 1440) + "d ago";
  return (item.stale ? "Cached · updated " : "Updated ") + age;
}

function preferences(state) {
  return {spoilersHidden: state.spoilersHidden === true, sortMode: state.sortMode || "manual",
    pinnedTeam: state.pinnedTeam || null, teams: (state.teams || []).slice()};
}

function teamKey(team) {
  return team ? team.sport + ":" + team.teamId : "";
}

function applyPreference(state, action) {
  var next = preferences(state);
  var command = action.command;
  var key = command[1] + ":" + command[2];
  var index = -1;
  for (var i = 0; i < next.teams.length; i++)
    if (teamKey(next.teams[i]) === key) index = i;
  switch (command[0]) {
  case "toggle-spoilers": next.spoilersHidden = !next.spoilersHidden; break;
  case "cycle-sort":
    next.sortMode = next.sortMode === "manual" ? "next" : next.sortMode === "next" ? "league" : "manual";
    break;
  case "toggle-pin":
    if (index >= 0) next.pinnedTeam = teamKey(next.pinnedTeam) === key ? null
      : {sport: command[1], teamId: command[2]};
    break;
  case "move":
    var to = index + Number(command[3]);
    if (next.sortMode === "manual" && index >= 0 && to >= 0 && to < next.teams.length) {
      var team = next.teams[index]; next.teams[index] = next.teams[to]; next.teams[to] = team;
    }
    break;
  case "remove":
    if (index >= 0) next.teams.splice(index, 1);
    if (teamKey(next.pinnedTeam) === key) next.pinnedTeam = null;
    break;
  case "follow":
    if (index < 0 && next.teams.length < 12 && action.team) next.teams.push(action.team);
    break;
  }
  return next;
}

function projectedPreferences(saved, pending) {
  var result = preferences(saved);
  for (var i = 0; i < pending.length; i++) result = applyPreference(result, pending[i]);
  return result;
}
