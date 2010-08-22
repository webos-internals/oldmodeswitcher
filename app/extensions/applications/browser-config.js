function BrowserConfig() {
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

BrowserConfig.prototype.setup = function(sceneController) {
	// Mode selector

	this.choicesBrowserLaunchSelector = [
		{'label': "On Mode Start", value: "start"},
		{'label': "On Mode Close", value: "close"}];  

	sceneController.setupWidget("BrowserLaunchSelector", {'label': "Launch", 
		'labelPlacement': "left", 'modelProperty': "launchMode",
		'choices': this.choicesBrowserLaunchSelector});

	// URL text field
			
	sceneController.setupWidget("BrowserURLText", { 'hintText': "Enter URL to load...", 
		'multiline': false, 'enterSubmits': false, 'focus': false, 
		'textCase': Mojo.Widget.steModeLowerCase, 'modelProperty': "launchURL"});

	// Delay selector
	
	this.choicesBrowserDelaySelector = [
		{'label': "No Delay", value: 0},
		{'label': "15 Seconds", value: 15},
		{'label': "30 Seconds", value: 30} ];  

	sceneController.setupWidget("BrowserDelaySelector", {'label': "Delay", 
		'labelPlacement': "left", 'modelProperty': "launchDelay",
		'choices': this.choicesBrowserDelaySelector} );
}

//

BrowserConfig.prototype.config = function(launchPoint) {
	var url = "";

	if((launchPoint.params) && (launchPoint.params.url))
		url = launchPoint.params.url;

	var appConfig = {
		'name': launchPoint.title,
		'launchMode': "start", 
		'launchDelay': 0, 
		'launchURL': url };
	
	return appConfig;
}

//

BrowserConfig.prototype.load = function(appPreferences) {
	var launchURL = "";
	
	try {eval("var params = " + appPreferences.params);} catch(error) {var params = "";}

	if(params.target != undefined)
		launchURL = params.target;

	var appConfig = {
		'name': appPreferences.name,
		'launchMode': appPreferences.event, 
		'launchDelay': appPreferences.delay, 
		'launchURL': launchURL };
	
	return appConfig;
}

BrowserConfig.prototype.save = function(appConfig) {
	var params = "";

	if(appConfig.launchURL.length != 0)
		params = "{target: '" + appConfig.launchURL + "'}";

	var appPreferences = {
		'type': "app",
		'name': appConfig.name,
		'event': appConfig.launchMode,
		'delay': appConfig.launchDelay, 
		'appid': this.appid(), 
		'params': params };
	
	return appPreferences;
}

