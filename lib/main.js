const { Cc, Ci }     = require("chrome");
var { ToggleButton } = require("sdk/ui/button/toggle"),
    panels           = require("sdk/panel"),
    self             = require("sdk/self"),
    system           = require("sdk/system"),
    tabs             = require("sdk/tabs"),
    prefs            = require("sdk/simple-prefs").prefs,
    contextMenu      = require("sdk/context-menu"),
    locale           = require("sdk/l10n").get,
    winUtils         = require("sdk/window/utils");

var iconPath         = "./img/icon.svg",
    loadingPath      = self.data.load("./img/loading.svg");

// Check if dark theme is present
if(isDarkTheme()) {
    var theme       = "dark";
        iconPath    = "./img/icon.white.svg";
}

// The universal button for Open With Livestreamer
var button = ToggleButton({
    id: "open-livestreamer",
    label: locale("label"),
    icon: iconPath,
    onChange: openPanel,
});

// A gernic panel where all content is showed for Open With Livestreamer
// Uses ./js/global.js to build the menus.
var panel = panels.Panel({
    contentURL: "./panel/global.html",
    width: 250,
    height: 97,
    onHide: closePanel,
    contentScriptFile: self.data.url("./js/global.js"),
    contentScript: 'document.body.id = "' + theme + '";',
    contentScriptOptions: {
        loadingPath: loadingPath,
    }
});

// Opens the panel and checks the button.
// It then grabs the current url and has getLivestreamerValidation()
// validate the url + get the quality posibilites.
// Inside of getLivestreamerValidation() ContentScript is pass to populate the
// quality buttons.
function openPanel(state) {
    // Check button
    if (state.checked) {
        // Display quality menu?
        if (prefs.qualityselector) {
            // Get current tab url
            getLivestreamerValidation(tabs.activeTab.url);
        } else {
            runLivestreamer(buildArgs(tabs.activeTab.url));
        }
        panel.show({
            position: button
        });
    }
}

// Closes the panel and takes the button
// off the true state
function closePanel() {
    // Close button
    button.state("window", {
        checked: false
    });
}

// Context Menu
// Right-click -> "Open with Livestreamer"
contextMenu.Item({
    label: locale("label"),
    context: contextMenu.SelectorContext("a[href], body"),
    contentScript: 'self.on("click", function(node, data) {' +
                   '    var stream = node.href;' +
                   '    if(!node.href) {' +
                   '        stream = window.location.href;' +
                   '    }' +
                   '    self.postMessage(stream);' +
                   '});',
    onMessage: function(streamURL) {
        // Display quality menu?
        if (prefs.qualityselector) {
            getLivestreamerValidation(streamURL);
        } else {
            runLivestreamer(buildArgs(streamURL));
        }
        panel.show({
            position: button
        });
    }
});

// Listen for livestreamer click events
panel.port.on("resolution-selected", function(payload) {
    var url = payload[0],
        resolution = payload[1];
    runLivestreamer(buildArgs(url, resolution));
});

// If the user set any optional args in the menu we have to handle that also if
// we launch livestreamer from the context menu we have to pass the url to
// livestreamer
function buildArgs(streamURL, streamResolution) {
    var args,
        currentURL,
        currentResolution,
        optArgs;
    // Get stream url
    if (streamURL === undefined) {
        currentURL = tabs.activeTab.url;
    } else {
        currentURL = streamURL;
    }
    // Get stream resolution
    if (streamResolution === undefined) {
        if (prefs.quality === undefined) {
            currentResolution = "best";
        } else {
            currentResolution = prefs.quality;
        }
    } else {
        currentResolution = streamResolution;
    }
    // Main
    args = [currentURL, currentResolution];
    // Optional arguments
    if (prefs.optargs) {
        optArgs = prefs.optargs.split(",")
        args = args.concat(optArgs);
    }
    return args;
}

// Run Livestreamer
function runLivestreamer(args) {
    var path,
        file,
        process;
    // Notify
    panel.width = 250;
    panel.height = 97;
    panel.port.emit("status", locale("status_lauching"));
    panel.port.emit("loading", true);
    // Get livestreamer path
    path = getLivestreamerPath();
    // Build file
    file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
    file.initWithPath(path);
    // New child process
    process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
    process.init(file);
    process.run(false, args, args.length);
    // Open chat if selected
    openChat(args[0]);
}

// Get Livestreams path
// First check if a user has defined a path
// Otherwise try our best guess for each system
function getLivestreamerPath() {
    var path,
        file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
    // User defined
    if (prefs.path && prefs.path !== "") {
        path = prefs.path;
    // Best guess
    } else if (system.platform == "linux") {
        path = "/usr/bin/livestreamer";
    } else if (system.platform == "winnt") {
        path = "C:\\Program Files (x86)\\Livestreamer\\livestreamer.exe";
    } else if (system.platform == "mac") {
        path = "/Applications/livestreamer.app";
    }
    // Test file
    file.initWithPath(path);
    if (file.exists()) {
        return path;
    } else {
        panel.width = 250;
        panel.height = 97;
        panel.port.emit("loading", false);
        panel.port.emit("status", locale("status_error_livestreamer"));
        return null;
    }
}

// Open twitch chat
function openChat(url) {

    if (prefs.chatselector == "none") {
        return null;
    }

    // Check if it's a twitch link
    // Chat only works for twitch so far
    var reg = /(twitch)\.tv\/[A-z]+/g;
    var twitch = reg.exec(url);
    if (twitch[1] !== "twitch") {
        return null;
    }

    if (prefs.chatselector == "popup") {

        var chat = "/chat?popout=";
        var url = url + chat;

        var win = require('sdk/window/utils').openDialog({
            features: Object.keys({
                chrome: true,
                centerscreen: true,
                resizable: true,
                scrollbars: false
            }).join() + ',width=400,height=550',
            name: "Chat"
        });
        win.addEventListener('load', function () {
            tabs.activeTab.url = self.data.url(url);
        });

    } else if (prefs.chatselector == "irc") {

        var reg = /twitch\.tv\/([A-z]+)/g;
        var name = reg.exec(url);
        var url = "irc://irc.twitch.tv/#" + name[1];

        var req = require("sdk/request").Request;
        var fakeReq = req({
          url: url
        }).get();

    } 
}

// Runs livestreamer and validates the url
// Will then return the avaliable resolutions
// We attempt to order them to some defgree and place the unknown formats at the end
// Example:
// This:    Array ["medium","mobile","high","source","worst","low","audio","best"]
// Becomes: Array ["best","source","high","medium","low","mobile","worst","audio"]
function getLivestreamerValidation(url) {
    var path,
        process,
        livestreamer,
        jsonData = '',
        ls,
        quality,
        qualityPattern = ['best', 'source', 'live', '2160p', '1440p', '1080p+', '1080p', 'ultra', 'high', '720p+', '720p', 'medium', 'mid', '480p+', '480p', 'low', '360p+', '360p', '240p', '144p', 'mobile', 'worst', 'audio'],
        results = [],
        i;
    // Notify
    panel.width = 250;
    panel.height = 97;
    panel.port.emit("status", locale("status_validating"));
    panel.port.emit("loading", true);
    // Get livestreamer path
    path = getLivestreamerPath();
    // Kill if null
    if (path === null) {
        return;
    }
    // Create child instance
    process = require("sdk/system/child_process");
    // Spawn a seperate child to validate in Livestreamer
    livestreamer = process.spawn(path, ["--json", url]);
    // As the stream comes in, grab the data
    livestreamer.stdout.on('data', function(data) {
        // Notify
        panel.width = 250;
        panel.height = 97;
        panel.port.emit("status", locale("status_parsing"));
        // Save the data to one global variable
        jsonData += data;
    });
    // When stream capture is finished, sent emit
    livestreamer.on("exit", function() {
        // Convert string to JSON
        ls = JSON.parse(jsonData);
        // Is the url live?
        if (ls.hasOwnProperty('error')) {
            panel.width = 250;
            panel.height = 70;
            panel.port.emit("loading", false);
            panel.port.emit("status", locale("status_error_url"));
        } else {
            // Capture quality
            quality = Object.keys(ls.streams);
            // Sort
            for (i = 0; i < qualityPattern.length; i++) {
                if (inArray(quality, qualityPattern[i])){
                    results.push(qualityPattern[i]);
                }
            }
            // Add left over qualiies
            for (i = 0; i < quality.length; i++) {
                if (!inArray(results, quality[i])){
                    results.push(quality[i]);
                }
            }
            // Results
            panel.width = 250;
            panel.height = 250;
            panel.port.emit("loading", false);
            panel.port.emit("status", locale("status_quality"));
            panel.port.emit("quality", [url, results]);
        }
    });
}

// isDarkTheme
// Checks to see if the current theme is labeled dark
// @param  void
// @return bool
function isDarkTheme() {
    let topWindow                  = winUtils.getMostRecentBrowserWindow();
    let { getComputedStyle }       = topWindow;
    let { color, backgroundColor } = getComputedStyle(topWindow.document.documentElement);
    let rgbRegex                   = /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i;
    let colorText                  = color.match(rgbRegex);
    let colorBG                    = backgroundColor.match(rgbRegex) || "rgb(255, 255, 255)";  // on windows 10 default theme, backgroundColor returns "transparent"
    let maxColor                   = Math.max.apply(null, [colorText[1], colorText[2], colorText[3]]);
    let maxBG                      = Math.max.apply(null, [colorBG[1], colorBG[2], colorBG[3]]);
    return maxColor > maxBG;
}

// Usefull function to see if an item exist in an array
// Usage:
// var myArray = ["example", "example2", "example3"];
// inArray(myarray, "example")
// addons should not extend JS prototypes, according to AMO guidelines
function inArray(array, target){
    var length = array.length;
    for(var i = 0; i < length; i++){
        if(array[i] == target) return true;

    }
    return false;
}

