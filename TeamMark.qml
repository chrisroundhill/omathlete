import QtQuick
import qs.Commons

Item {
  id: root

  property string abbreviation: ""
  property string logoUrl: ""
  property color accentColor: Color.accent
  property int markSize: Style.space(36)

  width: markSize
  height: markSize

  onLogoUrlChanged: logo.useOptimizedSource = true

  Rectangle {
    anchors.fill: parent
    radius: width / 2
    color: Qt.rgba(root.accentColor.r, root.accentColor.g, root.accentColor.b, 0.14)
    border.width: 1
    border.color: Qt.rgba(root.accentColor.r, root.accentColor.g, root.accentColor.b, 0.7)
  }

  function getLogoSource(url) {
    if (!url) return ""
    var str = String(url)
    if (str.indexOf("/soccer/") !== -1 || str.indexOf("/countries/") !== -1) return str
    if (logo.useOptimizedSource) return str.replace("/500/", "/500/scoreboard/")
    return str
  }

  Image {
    id: logo
    property bool useOptimizedSource: true
    anchors.fill: parent
    anchors.margins: Style.space(3)
    source: root.getLogoSource(root.logoUrl)
    sourceSize: Qt.size(width * 2, height * 2)
    asynchronous: true
    fillMode: Image.PreserveAspectFit
    smooth: true
    mipmap: true

    onStatusChanged: if (status === Image.Error && useOptimizedSource) useOptimizedSource = false
  }

  Text {
    anchors.centerIn: parent
    visible: !root.logoUrl || logo.status === Image.Error
    text: root.abbreviation.slice(0, 3)
    color: root.accentColor
    font.family: Style.font.family
    font.pixelSize: Style.font.caption
    font.bold: true
  }
}
