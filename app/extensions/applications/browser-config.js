function BrowserConfig(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
}

BrowserConfig.prototype.version = function() {
	return "1.0";
}

BrowserConfig.prototype.appid = function() {
	return "com.palm.app.browser";
}

//

BrowserConfig.prototype.activate = function() {
}

BrowserConfig.prototype.deactivate = function() {
}

//

BrowserConfig.prototype.setup = function(controller) {
	// Mode selector

	this.choicesBrowserLaunchSelector = [
		{'label': "On Mode Start", value: 1},
		{'label': "On Mode Close", value: 2}];  

	controller.setupWidget("BrowserLaunchSelector", {'label': "Launch", 
		'labelPlacement': "left", 'modelProperty': "launchMode",
		'choices': this.choicesBrowserLaunchSelector});

	// URL text field
			
	controller.setupWidget("BrowserURLText", { 'hintText': "Enter URL to load...", 
		'multiline': false, 'enterSubmits': false, 'focus': false, 
		'textCase': Mojo.Widget.steModeLowerCase, 'modelProperty': "launchURL"});

	// Delay selector
	
	this.choicesBrowserDelaySelector = [
		{'label': "No Delay", value: 0},
		{'label': "15 Seconds", value: 15},
		{'label': "30 Seconds", value: 30} ];  

	controller.setupWidget("BrowserDelaySelector", {'label': "Delay", 
		'labelPlacement': "left", 'modelProperty': "launchDelay",
		'choices': this.choicesBrowserDelaySelector} );
}

//

BrowserConfig.prototype.config = function(launchPoint) {
	var config = {
		'name': launchPoint.title, 
		'appid': launchPoint.id, 
		'launchMode': 1, 
		'launchDelay': 0, 
		'launchURL': "" };
	
	return config;
}

//

BrowserConfig.prototype.load = function(preferences) {
	var launchURL = "";
	
	if(preferences.launchMode == 1) {
		try {eval("var params = " + preferences.startParams);} catch(error) {var params = "";}
	}
	else {
		try {eval("var params = " + preferences.closeParams);} catch(error) {var params = "";}
	}

	if(params.target != undefined)
		launchURL = params.target;
		
	var config = {
		'name': preferences.name,
		'appid': preferences.appid,
		'launchMode': preferences.launchMode, 
		'launchDelay': preferences.launchDelay, 
		'launchURL': launchURL };
	
	return config;
}

BrowserConfig.prototype.save = function(config) {
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

	var preferences = {
		'url': "",
		'method': "",
		'name': config.name,
		'appid': config.appid, 
		'launchMode': config.launchMode, 
		'launchDelay': config.launchDelay, 
		'startParams': startParams,
		'closeParams': closeParams };
	
	return preferences;
}

