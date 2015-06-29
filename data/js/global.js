function updateStatus(msg) {
    var status = document.getElementById("status");
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
        quality.style.backgroundImage = "url(../img/loading.svg)";
        quality.style.height = "39px";
        quality.style.borderTop = "1px solid #cccccc"
    } else {
        quality.style.backgroundImage = "";
        quality.style.height = "auto";
        quality.style.borderTop = "none"
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
// Listen for
self.port.on("status", updateStatus);
self.port.on("loading", buildLoading);
self.port.on("quality", buildQuality);
