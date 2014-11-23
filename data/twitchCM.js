/**
 * Created by issue on 23.11.14.
 */
//post the url of our context node so we can later feed it to livestreamer
//because we only act on divs with .thumb, we need the 2nd child for the url
self.on("click", function(node, data){
    self.postMessage(node.childNodes[1].href);
});