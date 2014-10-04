//todo: check for livestreamer binary. show possible quality options
var tabs = require("sdk/tabs");
const { Cc, Ci } = require("chrome");
var prefs = require("sdk/simple-prefs").prefs;
var panels = require("sdk/panel");
var data = require("sdk/self").data;

var button = require("sdk/ui/button/action").ActionButton({
    id: "open-livestreamer",
    label: "Open in Livestreamer",
    icon: "./icon-16.png",
    onClick: buttonClicked
});

var panel = panels.Panel({
    contentURL: data.url("panel.html"),
    width: 300,
    height: 60
});

function check_url() {
    // looks at the tabs url and returns true if we are on a site that works with livestreamer
    console.log(tabs.activeTab.url);
    if (tabs.activeTab.url.startsWith("http://www.twitch.tv")) {
        return true;
    }


}
function run_livestreamer() {
    var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
    file.initWithPath(prefs.path);
    var args = [tabs.activeTab.url, prefs.quality];
    if (file.exists()) {
        var process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
        process.init(file);
        process.run(false, args, args.length);
    } else {
        panel.show({
            position: button
        });
    }
}
function buttonClicked(state) {
    if  (check_url()) {
        run_livestreamer();
    }

}