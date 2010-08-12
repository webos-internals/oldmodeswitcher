function DefaultConfig() {
}

DefaultConfig.prototype.version = function() {
	return "1.1";
}

DefaultConfig.prototype.appid = function() {
	return "default";
}

//

DefaultConfig.prototype.activate = function() {
}

DefaultConfig.prototype.deactivate = function() {
}

//

DefaultConfig.prototype.setup = function(controller) {
	this.choicesDefaultLaunchSelector = [
		{'label': "On Mode Start", value: "start"},
		{'label': "On Mode Close", value: "close"} ];  

	controller.setupWidget("DefaultLaunchSelector", {'label': "Launch", 
		'labelPlacement': "left", 'modelProperty': "launchMode",
		'choices': this.choicesDefaultLaunchSelector} );
		
	// Delay selector
	
	this.choicesDefaultDelaySelector = [
		{'label': "No Delay", value: 0},
		{'label': "15 Seconds", value: 15},
		{'label': "30 Seconds", value: 30} ];  

	controller.setupWidget("DefaultDelaySelector", {'label': "Delay", 
		'labelPlacement': "left", 'modelProperty': "launchDelay",
		'choices': this.choicesDefaultDelaySelector} );
}

//

DefaultConfig.prototype.config = function(launchPoint) {
	var config = {
		'name': launchPoint.title, 
		'appid': launchPoint.id,
		'launchMode': "start", 
		'launchDelay': 0 };
	
	return config;
}

//

DefaultConfig.prototype.load = function(preferences) {
	var config = {
		'name': preferences.name,
		'appid': preferences.appid,
		'launchMode': preferences.event, 
		'launchDelay': preferences.delay };
	
	return config;
}

DefaultConfig.prototype.save = function(config) {
	var preferences = {
		'type': "app",
		'name': config.name,
		'event': config.launchMode,
		'delay': config.launchDelay,		
		'appid': config.appid, 
		'params': "" };
	
	return preferences;
}

