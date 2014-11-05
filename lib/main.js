const {
    Cc, Ci
    } = require("chrome");
var prefs = require("sdk/simple-prefs").prefs;
var panels = require("sdk/panel");
var data = require("sdk/self").data;
var tabs = require("sdk/tabs");

var button = require("sdk/ui/button/action").ActionButton({
    id: "open-livestreamer",
    label: "Open in Livestreamer",
    icon: "./icon-16.png",
    onClick: buttonClicked
});
//binary not found msg
var not_found_panel = panels.Panel({
    contentURL: data.url("panel.html"),
    width: 300,
    height: 60
});
//starting livestreamer msg
var launch_panel = panels.Panel({
    contentURL: data.url("launching.html"),
    width: 110,
    height: 50
});
//reso selection box
var resolution = panels.Panel({
    contentURL: data.url("resolution.html"),
    contentScriptFile: data.url("get_resolution.js"),
    width: 100,
    height: 120
});

function check_url() {
    var valid_urls = ["http://www.twitch.tv", "http://www.hitbox.tv"];
    for (var i = 0; i < valid_urls.length; i++) {
        if (tabs.activeTab.url.startsWith(valid_urls[i])) {
            return true;
        }
    }
}
function build_args(reso) {
    var args;
    var stream_res;
    var optargs;
    if (reso === undefined) {
        stream_res = prefs.quality;
    } else {
        stream_res = reso;
    }
    var main_args = [tabs.activeTab.url, stream_res];
    if (prefs.optargs === undefined) {
        args = main_args;
    } else {
        optargs = prefs.optargs.split(",");
        args = main_args.concat(optargs);

    }
    return args;
}
function run_livestreamer(args) {
    var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);

    file.initWithPath(prefs.path);

    if (file.exists() && prefs.path.indexOf("livestreamer") > -1) {
        var process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
        launch_panel.show({
            position: button
        });
        process.init(file);
        process.run(false, args, args.length);
    } else {
        not_found_panel.show({
            position: button
        });
    }
}

function buttonClicked() {
    if (check_url()) {
        if (prefs.qualityselector) {
            resolution.show({
                position: button
            });
        } else {
            run_livestreamer(build_args());
        }
    }
}
resolution.on("show", function () {
    resolution.port.emit("show");
});

resolution.port.on("resolution-selected", function (reso) {
    resolution.hide();
    var args = build_args(reso);
    run_livestreamer(args);
});
