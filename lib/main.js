//todo: check for livestreamer binary. show possible quality options
var tabs = require("sdk/tabs");
const {Cc,Ci} = require("chrome");
var prefs = require("sdk/simple-prefs").prefs;
var panels = require("sdk/panel");
var data = require("sdk/self").data;

var button = require("sdk/ui/button/action").ActionButton({
  id: "open-livestreamer",
  label: "Open in Livestreamer",
  icon: "./icon-16.png",
  onClick: run
});

var panel = panels.Panel({
        contentURL: data.url("panel.html"),
        width: 300,
        height: 60
});

function run(state) {
    console.log(prefs.path);
    console.log(prefs.quality);
    var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
    file.initWithPath(prefs.path);
    console.log(tabs.activeTab.url);
    var args = [tabs.activeTab.url, prefs.quality];
    if(file.exists()){
        var process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
        process.init(file);
        process.run(false, args, args.length);
    }else{
        console.log("Binary not found");
        panel.show({
            position: button
        });
    }
}
