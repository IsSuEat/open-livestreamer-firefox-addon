var btns = document.getElementsByTagName("button");
//add eventlisteners to all the found buttons, on click the buttons name is emitted to main.js
for (var i = 0; i < btns.length; ++i) {
    btns[i].addEventListener("click", emit, false);
}
function emit(e) {
    self.port.emit("resolution-selected", e.target.name);
}
