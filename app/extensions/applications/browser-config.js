function BrowserConfig(ServiceRequestWrapper) {
}

//

BrowserConfig.prototype.init = function() {
}

BrowserConfig.prototype.data = function(data) {
}

//

BrowserConfig.prototype.setup = function(controller) {
	// Mode selector

	this.choicesModeSelector = [
		{'label': "On Mode Start", value: 1},
		{'label': "On Mode Close", value: 2}];  

	controller.setupWidget("ModeSelector",	{'label': "Launch", 
		'labelPlacement': "left", 'modelProperty': "launchMode",
		'choices': this.choicesModeSelector});

	// URL text field
			
	controller.setupWidget("URLText", { 'hintText': "Enter URL to load...", 
		'multiline': false, 'enterSubmits': false, 'focus': false, 
		'textCase': Mojo.Widget.steModeLowerCase, 'modelProperty': "launchURL"});
}

//

BrowserConfig.prototype.load = function(config, preferences) {
	var launchURL = "";
	
	if(preferences.launchMode == 1) {
		try {eval("var params = " + preferences.startParams);} catch(error) {var params = "";}
	}
	else {
		try {eval("var params = " + preferences.closeParams);} catch(error) {var params = "";}
	}

	if(params.target != undefined)
		launchURL = params.target;
		
	config.push({'extension': "browser", 
		'name': preferences.name,
		'appid': preferences.appid,
		'launchMode': preferences.launchMode, 
		'launchURL': launchURL});
}

BrowserConfig.prototype.save = function(config, preferences) {
	var startParams = "";
	var closeParams = "";
	
	if(config.launchURL.length != 0) {
		if(config.launchMode == 1) {
			startParams = "{target: '" + config.launchURL + "'}";
		}
		else {
			closeParams = "{target: '" + config.launchURL + "'}";
		}
	}

	preferences.push({'extension': "browser",
		'name': config.name,
		'appid': config.appid, 
		'launchMode': config.launchMode, 
		'startParams': startParams,
		'closeParams': closeParams});
}

//

BrowserConfig.prototype.append = function(config, launchPoint, saveCallback) {
	config.push({'extension': "browser", 'name': launchPoint.title, 'appid': launchPoint.id, 
		'launchMode': 1, 'launchURL': ""});
	
	saveCallback();
}

BrowserConfig.prototype.remove = function(config, index, saveCallback) {
	config.splice(index,1);

	saveCallback();
}

