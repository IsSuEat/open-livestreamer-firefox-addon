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
        icon: {
            "16": "./icon-16.png",
            "32": "./icon-32.png",
            "64": "./icon-64.png"
        },
    onClick: buttonClicked
});
//binary not found msg
var not_found_panel = panels.Panel({
    contentURL: data.url("panel.html"),
    width: 280,
    height: 70
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
function checkUrl(currentUrl) {

    // Check if currentUrl matches Twitch.tv, hitbox.tv or youtube.com schemata.
	if (typeof currentUrl !== 'undefined') {
		// Twitch.tv matches.
		if(!currentUrl.match("http://www.twitch.tv/directory") && 
		   !currentUrl.match("http://www.twitch.tv/signup") && 
		   !currentUrl.match("http://www.twitch.tv/login") && 
		    currentUrl.match(/^http(s)?:\/\/(\w+\.)*twitch.tv\/[A-Za-z0-9 _-]+(\/[a-z]+\/[0-9]+(\?t=([0-9]+h)?([0-9]+m)?([0-9]+s)?)?)?$/i)) {
			return true; 
		} 
		// hitbox.tv matches.
		else if (currentUrl.match(/^http(s)?:\/\/(\w+\.)*hitbox.tv\/[A-Za-z0-9 _-]+(\/video\/[0-9]+)?$/i)) {
			return true; 
		}
		// youtube.com matches.
		else if (currentUrl.match(/^http(s)?:\/\/www.youtube.com\/watch\?v=[A-Za-z0-9 _-]+$/i)) {
			return true; 
		} 
		// games.dailymotion.com matches.
		else if (currentUrl.match(/^http(s)?:\/\/games.dailymotion.com\/live\/[A-Za-z0-9 _-]+$/i)) {
			return true; 
		}
		// picarto.tv matches.
		else if (currentUrl.match(/^http(s)?:\/\/(\w+\.)*picarto.tv\/live\/(channel|channelhd|multistream).php\?watch=[A-Za-z0-9 _-]+$/i)) {
			return true; 
		}
		// TODO: Add other websites
	}

}
// display a context menu for twitch to launch a stream on rightclick
contextMenu.Item({
    label: "Open with Livestreamer",
    context: [
        contextMenu.PredicateContext(function(ctxnode){
                return checkUrl(ctxnode.linkURL)
        }),
        contextMenu.SelectorContext("a[href]")
    ],
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
    if (streamURL === undefined) {
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
    return args;
}

function runLivestreamer(args) {
    if (prefs.path){
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
    } else {
        not_found_panel.show({
            position: button
        });
    }
}
function buttonClicked() {
    if (checkUrl(tabs.activeTab.url)) {
        if (prefs.qualityselector) {
            resolution.show({
                position: button
            });
        } else {
            runLivestreamer(buildArgs());
        }
    }
}
resolution.on("show", function () {
    resolution.port.emit("show");
});

resolution.port.on("resolution-selected", function (reso) {
    resolution.hide();
    runLivestreamer(buildArgs(undefined, reso));
});
