const {
    Cc, Ci
} = require("chrome");
var prefs = require("sdk/simple-prefs").prefs;
var panels = require("sdk/panel");
var data = require("sdk/self").data;
var tabs = require("sdk/tabs");
var contextMenu = require("sdk/context-menu");
//main button
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
    width: 110,
    height: 125
});
//checks if the tab url is known by livestreamer, else we wont run
function checkUrl() {
    var valid_urls = ["twitch.tv", "hitbox.tv", "youtube.com"];
    for (var i = 0; i < valid_urls.length; i++) {
        if (tabs.activeTab.url.indexOf(valid_urls[i]) > -1) {
			
            return true
        }

    }
}
// display a context menu for twitch to launch a stream on rightclick
contextMenu.Item({
    label: "Open with Livestreamer",
    context: [
        //contextMenu.URLContext("*.twitch.tv"),
		contextMenu.URLContext(["*.twitch.tv", "*.hitbox.tv", "*.youtube.com"]),
        //contextMenu.SelectorContext(".thumb")
		//contextMenu.SelectorContext(".thumb, a[href]")
		contextMenu.SelectorContext("a[href]")
    ],
	
	//contentScriptFile: data.url("twitchCM.js"),
	contentScript: 'self.on("click", function(node, data){' +
						'self.postMessage(node.href);' +
					'});',
	
    onMessage: function (streamURL) {

       runLivestreamer(buildArgs(streamURL, undefined));
    }
});
//if the user set any optional args in the menu we have to handle that
// also if we launch livestreamer from the context menu we have to pass the url to livestreamer
function buildArgs(streamURL, streamResolution) {
    var args;
    var stream_res;
    var optargs;
    var currentURL;

    if (streamResolution === undefined) {
        stream_res = prefs.quality;
    } else {
        stream_res = streamResolution;
    }
    if (streamURL === undefined){
        currentURL = tabs.activeTab.url;
    } else {
      currentURL = streamURL;
    }
    var main_args = [currentURL, stream_res];
    if (prefs.optargs === undefined) {
        args = main_args;
    } else {
        optargs = prefs.optargs.split(",");
        args = main_args.concat(optargs);

    }
    //console.log(args);
    return args;
}

function runLivestreamer(args) {
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
    if (checkUrl()) {
        if (prefs.qualityselector) {
            resolution.show({
                position: button
            });
        } else {
            runLivestreamer(buildArgs());
        }
    }
}
resolution.on("show", function() {
    resolution.port.emit("show");
});

resolution.port.on("resolution-selected", function(reso) {
    resolution.hide();
    runLivestreamer(buildArgs(undefined, reso));
});
