// TODO: expand url list
// add icons to channel overview for quicklaunching
// bookmark support
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

var launch_panel = panels.Panel({
    contentURL: data.url("launching.html"),
    width: 120,
    height: 60
});



function check_url() {
    var valid_urls = ["http://www.twitch.tv", "http://www.hitbox.tv"];
    for (var i = 0; i < valid_urls.length; i++) {
        if (tabs.activeTab.url.startsWith(valid_urls[i])) {
            //console.log("we are on " + valid_urls[i]);
            return true;
        } else {
            //console.log("nope, no compatible site");
        }
    }
}

function run_livestreamer() {
    var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
    file.initWithPath(prefs.path);
    var main_args = [tabs.activeTab.url, prefs.quality];
    var optargs = prefs.optargs.split(",");
    var args = main_args.concat(optargs);
    console.log(args);
    if (file.exists()) {
        var process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
        launch_panel.show({
            position: button
        });
        process.init(file);
        process.run(false, args, args.length);
    } else {
        panel.show({
            position: button
        });
    }
}

function buttonClicked(state) {
    //var filename = prefs.path1;
    //console.log(filename);
    if (check_url()) {
        run_livestreamer();
    }

}
