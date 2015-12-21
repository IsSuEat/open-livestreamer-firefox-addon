function updateStatus(msg) {
    var status  = document.getElementById("status"),
        quality = document.getElementById("quality");
    // Clean quality
    quality.innerHTML = '';
    // Remove loading message to default to "box" class staus
    status.classList.remove("loading");
    // Insert message
    status.textContent = msg;
}
function buildLoading(status) {
    var quality = document.getElementById("quality");
    // Remove contents from quality to give the ollusion of loading
    quality.innerHTML = '';
    // Add or remove
    if(status) {
        quality.innerHTML = self.options.loadingPath;
        quality.className = 'loading center';
        quality.style.borderTopWidth = "1px";
    } else {
        quality.innerHTML = '';
        quality.className = '';
        quality.style.borderTopWidth = "0px"
    }
}
function buildQuality(payload) {
    var quality = document.getElementById("quality"),
        url = payload[0],
        qualities = payload[1];
    // For each quality build a button
    Object.keys(qualities).forEach(function (key) {
        var val = qualities[key];
        button = document.createElement("input");
        button.type  = "button"
        button.name  = val;
        button.id    = val;
        button.value = val.charAt(0).toUpperCase() + val.slice(1);
        // Append button
        quality.appendChild(button);
    });
    // Build clicable events
    var btns = document.querySelectorAll("#quality input[type=button]");
    // For each add click event
    for (var i = 0; i < btns.length; ++i) {
        btns[i].addEventListener("click", emit, false);
    }
    // Emit to main.js
    function emit(e) {
        self.port.emit("resolution-selected", [url, e.target.name]);
    }
}
function changeTheme(theme) {
    document.body.id = theme;
}
// Listen for
self.port.on("status", updateStatus);
self.port.on("loading", buildLoading);
self.port.on("quality", buildQuality);
self.port.on("theme", changeTheme)
