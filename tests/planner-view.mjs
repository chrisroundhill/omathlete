import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(),'omathlete-planner-view-'));
try {
  const source = fs.readFileSync(new URL('../PlannerView.qml',import.meta.url),'utf8');
  fs.writeFileSync(path.join(tmp,'PlannerView.qml'),source.replace('import qs.Commons',
    'import "Theme.js" as Style\nimport "Colors.js" as Color'));
  fs.copyFileSync(new URL('../PanelLogic.js',import.meta.url),path.join(tmp,'PanelLogic.js'));
  fs.writeFileSync(path.join(tmp,'Theme.js'),'var font={family:"sans-serif",caption:12,body:14,subtitle:16}; var cornerRadius=2; function space(n){return n;}');
  fs.writeFileSync(path.join(tmp,'Colors.js'),'var foreground="#ffffff"; var background="#101010"; var accent="#ffaa44"; var urgent="#ff8888";');
  fs.writeFileSync(path.join(tmp,'tst_planner.qml'),`
import QtQuick
import QtTest
Item {
  width:240; height:560
  PlannerView {
    id:p
    anchors.fill:parent
    isHidden:function(game){ return true }
    rows:[{id:"1",sport:"mlb",homeTeam:"CHC",awayTeam:"SEA",homeScore:"99",awayScore:"88",
      state:"post",detail:"Final",date:"2026-09-05T18:00:00Z",day:"Sat · Sep 5",broadcast:"FOX",saved:true,reminder:"Off"},
      {id:"2",sport:"mlb",homeTeam:"NYY",awayTeam:"BOS",state:"pre",date:"2026-09-05T19:00:00Z",
      day:"Sat · Sep 5",broadcast:"",saved:false,reminder:"15m before"}]
  }
  SignalSpy {id:watchSpy; target:p; signalName:"watchGame"}
  SignalSpy {id:reminderSpy; target:p; signalName:"remindGame"}
  SignalSpy {id:backSpy; target:p; signalName:"back"}
  TestCase {
    name:"PlannerKeyboardAndSpoilers"
    when:windowShown
    function texts(item) {
      var text = item.text === undefined ? "" : String(item.text)
      for(var i=0;i<item.children.length;i++) text += " " + texts(item.children[i])
      return text
    }
    function test_planner() {
      p.forceActiveFocus()
      wait(100)
      verify(texts(p).indexOf("88–99") < 0,"Hidden scores must not appear in delegate text")
      keyClick(Qt.Key_V)
      wait(30)
      verify(texts(p).indexOf("88–99") >= 0,"Explicit reveal should show selected result")
      keyClick(Qt.Key_J)
      wait(30)
      compare(p.selectedIndex,1)
      verify(texts(p).indexOf("88–99") < 0,"Moving selection must clear reveal")
      keyClick(Qt.Key_W)
      compare(watchSpy.count,1)
      compare(watchSpy.signalArguments[0][0].id,"2")
      keyClick(Qt.Key_B)
      compare(reminderSpy.count,1)
      keyClick(Qt.Key_Escape)
      compare(backSpy.count,1)
      compare(p.width,240)
    }
  }
}
`);
  const result = spawnSync(process.env.QMLTESTRUNNER || '/usr/lib/qt6/bin/qmltestrunner',
    ['-input',tmp,'-platform','offscreen'],{encoding:'utf8',timeout:20000,
      env:{...process.env,QT_QUICK_BACKEND:'software',QT_QPA_PLATFORMTHEME:'',QML_DISABLE_DISK_CACHE:'1'}});
  process.stdout.write(result.stdout || '');
  if(result.stderr) process.stderr.write(result.stderr);
  assert.equal(result.status,0,String(result.error || 'Planner Qt test failed'));
} finally { fs.rmSync(tmp,{recursive:true,force:true}); }
