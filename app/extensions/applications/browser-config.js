function BrowserConfig(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
}

BrowserConfig.prototype.version = function() {
	return "1.1";
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
		{'label': "On Mode Start", value: "start"},
		{'label': "On Mode Close", value: "close"}];  

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
	var url = "";

	if((launchPoint.params) && (launchPoint.params.url))
		url = launchPoint.params.url;

	var config = {
		'name': launchPoint.title,
		'launchMode': "start", 
		'launchDelay': 0, 
		'launchURL': url };
	
	return config;
}

//

BrowserConfig.prototype.load = function(preferences) {
	var launchURL = "";
	
	try {eval("var params = " + preferences.params);} catch(error) {var params = "";}

	if(params.target != undefined)
		launchURL = params.target;
		
	var config = {
		'name': preferences.name,
		'launchMode': preferences.launchMode, 
		'launchDelay': preferences.launchDelay, 
		'launchURL': launchURL };
	
	return config;
}

BrowserConfig.prototype.save = function(config) {
	var params = "";
	
	if(config.launchURL.length != 0)
		params = "{target: '" + config.launchURL + "'}";

	var preferences = {
		'type': "app",
		'name': config.name,
		'event': config.launchMode,
		'delay': config.launchDelay, 
		'appid': this.appid(), 
		'params': params };
	
	return preferences;
}

