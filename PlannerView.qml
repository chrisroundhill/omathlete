import QtQuick
import qs.Commons
import "PanelLogic.js" as Logic

Item {
  id: root
  property var rows: []
  property int range: 0
  property bool watchLater: false
  property bool quietHours: true
  property var isHidden: function(game) { return false }
  property int selectedIndex: 0
  property string selectedKey: ""
  property string revealedKey: ""
  property bool reconciling: false
  property string warning: ""
  signal chooseRange(int value)
  signal chooseQueue(bool value)
  signal watchGame(var game)
  signal remindGame(var game)
  signal quietToggle()
  signal launch(var game)
  signal back()
  signal refresh()
  signal spoilersToggle()

  function selectedGame() { return rows[selectedIndex] || null }
  function reveal() {
    var game = selectedGame()
    if (game) revealedKey = revealedKey === Logic.gameKey(game) ? "" : Logic.gameKey(game)
  }
  onVisibleChanged: {
    revealedKey = ""
    if (visible) Qt.callLater(function() { root.forceActiveFocus() })
  }
  onSelectedIndexChanged: {
    if (!reconciling) {
      selectedKey = Logic.gameKey(selectedGame())
      revealedKey = ""
      gameList.positionViewAtIndex(selectedIndex, ListView.Contain)
    }
  }
  onRowsChanged: {
    var oldY = gameList.contentY
    reconciling = true
    selectedIndex = Logic.selectedGameIndex(rows, selectedKey, selectedIndex)
    selectedKey = Logic.gameKey(selectedGame())
    if (revealedKey !== selectedKey) revealedKey = ""
    Qt.callLater(function() { gameList.contentY = oldY; gameList.returnToBounds(); root.reconciling = false })
  }
  Keys.onPressed: function(event) {
    var game = selectedGame()
    if (event.key === Qt.Key_J || event.key === Qt.Key_Down) selectedIndex = Math.min(rows.length - 1, selectedIndex + 1)
    else if (event.key === Qt.Key_K || event.key === Qt.Key_Up) selectedIndex = Math.max(0, selectedIndex - 1)
    else if (event.key === Qt.Key_W && game) root.watchGame(game)
    else if (event.key === Qt.Key_B && game) root.remindGame(game)
    else if (event.key === Qt.Key_V) root.reveal()
    else if (event.key === Qt.Key_O && game) root.launch(game)
    else if (event.key === Qt.Key_Q) root.quietToggle()
    else if (event.key === Qt.Key_R) root.refresh()
    else if (event.key === Qt.Key_S) root.spoilersToggle()
    else if (event.key === Qt.Key_Tab) root.chooseQueue(!watchLater)
    else if (event.key >= Qt.Key_1 && event.key <= Qt.Key_4) root.chooseRange(event.key - Qt.Key_1)
    else if (event.key === Qt.Key_Escape || event.key === Qt.Key_H) root.back()
    else return
    event.accepted = true
  }

  component Action: Rectangle {
    property string label: ""
    property bool active: false
    signal clicked()
    height: Style.space(30)
    color: active ? Color.accent : Qt.rgba(1, 1, 1, 0.08)
    radius: Style.cornerRadius
    Text {
      anchors.fill: parent
      anchors.margins: Style.space(4)
      text: parent.label
      textFormat: Text.PlainText
      color: parent.active ? Color.background : Color.foreground
      font.pixelSize: Style.font.caption
      font.family: Style.font.family
      horizontalAlignment: Text.AlignHCenter
      verticalAlignment: Text.AlignVCenter
      elide: Text.ElideRight
    }
    MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor; onClicked: parent.clicked() }
  }

  Column {
    id: header
    anchors.top: parent.top
    anchors.left: parent.left
    anchors.right: parent.right
    spacing: Style.space(6)
    Text {
      text: root.watchLater ? "Watch later · protected results" : "Your sports agenda"
      color: Color.foreground
      font.family: Style.font.family
      font.pixelSize: Style.font.subtitle
      font.bold: true
      width: parent.width
      wrapMode: Text.WordWrap
    }
    Row {
      width: parent.width
      spacing: Style.space(6)
      Action { width: (parent.width - parent.spacing) / 2; label: "Agenda"; active: !root.watchLater; onClicked: root.chooseQueue(false) }
      Action { width: (parent.width - parent.spacing) / 2; label: "Watch later"; active: root.watchLater; onClicked: root.chooseQueue(true) }
    }
    Row {
      visible: !root.watchLater
      width: parent.width
      spacing: Style.space(4)
      Repeater {
        model: ["Today", "Tomorrow", "Weekend", "7 days"]
        Action {
          required property string modelData
          required property int index
          width: (header.width - Style.space(12)) / 4
          label: modelData
          active: root.range === index
          onClicked: root.chooseRange(index)
        }
      }
    }
    Action {
      width: parent.width
      label: root.quietHours ? "Quiet hours: 10 PM–8 AM · on" : "Quiet hours: off"
      onClicked: root.quietToggle()
    }
    Text {
      width: parent.width
      text: root.warning || "Reminders are per-game and off until you choose one."
      color: root.warning ? Color.urgent : Color.foreground
      wrapMode: Text.WordWrap
      font.family: Style.font.family
      font.pixelSize: Style.font.caption
    }
  }
  ListView {
    id: gameList
    anchors.top: header.bottom
    anchors.topMargin: Style.space(8)
    anchors.bottom: parent.bottom
    anchors.left: parent.left
    anchors.right: parent.right
    clip: true
    reuseItems: true
    currentIndex: root.selectedIndex
    highlightFollowsCurrentItem: false
    model: root.rows
    spacing: Style.space(6)
    section.property: "day"
    section.delegate: Text {
      required property string section
      text: section
      color: Color.accent
      font.family: Style.font.family
      font.pixelSize: Style.font.caption
      padding: Style.space(4)
    }
    Text {
      anchors.top: parent.top
      width: parent.width
      visible: root.rows.length === 0
      text: root.watchLater ? "No saved games. Press w on an agenda game to protect its result."
        : "No games found for this period. Schedules may still be loading or unavailable."
      color: Color.foreground
      wrapMode: Text.WordWrap
      font.pixelSize: Style.font.body
    }
    delegate: Rectangle {
      id: card
      required property var modelData
      required property int index
      readonly property bool hiddenResult: root.isHidden(modelData) && root.revealedKey !== Logic.gameKey(modelData)
      width: gameList.width
      height: details.implicitHeight + Style.space(16)
      color: index === root.selectedIndex ? Qt.rgba(1,1,1,0.1) : "transparent"
      border.width: index === root.selectedIndex ? 1 : 0
      border.color: Color.accent
      radius: Style.cornerRadius
      MouseArea {
        anchors.fill: parent
        onClicked: root.selectedIndex = card.index
      }
      Column {
        id: details
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.margins: Style.space(8)
        y: Style.space(8)
        spacing: Style.space(4)
        Text {
          width: parent.width
          text: card.modelData.awayTeam + " @ " + card.modelData.homeTeam + " · " + card.modelData.sport.toUpperCase()
          textFormat: Text.PlainText
          color: Color.foreground
          font.family: Style.font.family
          font.pixelSize: Style.font.body
          font.bold: true
          elide: Text.ElideRight
        }
        Text {
          width: parent.width
          text: new Date(card.modelData.date).toLocaleTimeString(Qt.locale(), "h:mm AP")
            + (card.modelData.broadcast ? " · " + card.modelData.broadcast : "")
          textFormat: Text.PlainText
          color: Color.foreground
          font.pixelSize: Style.font.caption
          wrapMode: Text.WordWrap
        }
        Text {
          width: parent.width
          text: card.hiddenResult ? "Result protected" : card.modelData.state === "unknown" ? "Result unavailable · open ESPN"
            : Logic.statusText(card.modelData, false)
              + (card.modelData.state !== "pre" && card.modelData.awayScore !== undefined
                ? " · " + card.modelData.awayScore + "–" + card.modelData.homeScore : "")
          textFormat: Text.PlainText
          color: Color.foreground
          font.pixelSize: Style.font.caption
          wrapMode: Text.WordWrap
        }
        Row {
          width: parent.width
          spacing: Style.space(4)
          Action {
            width: (parent.width - parent.spacing) / 2
            label: card.modelData.saved ? "Watched / remove" : "Watch later"
            onClicked: { root.selectedIndex = card.index; root.watchGame(card.modelData) }
          }
          Action {
            width: (parent.width - parent.spacing) / 2
            label: "Bell: " + card.modelData.reminder
            onClicked: { root.selectedIndex = card.index; root.remindGame(card.modelData) }
          }
        }
        Row {
          width: parent.width
          spacing: Style.space(4)
          Action {
            width: (parent.width - parent.spacing) / 2
            label: card.hiddenResult ? "Reveal this result" : "Hide result"
            visible: root.isHidden(card.modelData)
            onClicked: { root.selectedIndex = card.index; root.reveal() }
          }
          Action {
            width: (parent.width - parent.spacing) / 2
            label: "Open ESPN"
            onClicked: root.launch(card.modelData)
          }
        }
      }
    }
  }
}
