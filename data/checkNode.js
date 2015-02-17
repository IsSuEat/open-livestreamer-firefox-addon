var gurl;

self.on("click",function(node,data){
	self.postMessage(gurl);
	delete gurl;
});

self.on("context", function(node){
	var url;
	
	// Check if node is an image and take its parent node. 
	if (node.href == undefined && node.nodeName == 'IMG' && 
		node.parentNode.href != undefined) {
		url = node.parentNode.href;
	} 
	// Check if node is A element (url).
	else if (node.href != undefined && node.nodeName == 'A') {
		url = node.href;
	}
	
	// Check if url matches Twitch.tv, hitbox.tv or youtube.com schemata.
	if (undefined != url) {
		// Twitch.tv matches.
		if(!url.match("http://www.twitch.tv/directory") && !url.match("http://www.twitch.tv/signup") && !url.match("http://www.twitch.tv/login") && 
			(url.match(/^http(s)?:\/\/(\w+\.)*twitch.tv\/[A-Za-z0-9 _]+$/i) ||
			url.match(/^http(s)?:\/\/(\w+\.)*twitch.tv\/[A-Za-z0-9 _]+\/[a-z]+\/[0-9]+(\?t=([0-9]*h)?([0-9]*m)?([0-9]*s)?)*$/i))) {
			gurl = url;
			return true; 
		} 
		// hitbox.tv matches.
		else if (url.match(/^http(s)?:\/\/(\w+\.)*hitbox.tv\/[A-Za-z0-9 _]+$/i) || 
				 url.match(/^http(s)?:\/\/(\w+\.)*hitbox.tv\/video\/[0-9]+$/i)) {
			gurl = url;
			return true; 
		}
		// youtube.com matches.
		else if (url.match(/http(s)?:\/\/www.youtube.com\/watch\?v=[A-Za-z0-9 _]+/i)) {
			gurl = url;
			return true; 
		} 
		// TODO: Add other websites
	}
	
	return false;
	
});
