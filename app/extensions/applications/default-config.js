function DefaultConfig(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
}

DefaultConfig.prototype.version = function() {
	return "1.0";
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
		{'label': "On Mode Start", value: 1},
		{'label': "On Mode Close", value: 2} ];  

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
		'launchMode': 1, 
		'launchDelay': 0,
		'startParams': "", 
		'closeParams': "" };
	
	return config;
}

//

DefaultConfig.prototype.load = function(preferences) {
	var config = {
		'name': preferences.name,
		'appid': preferences.appid,
		'launchMode': preferences.launchMode, 
		'launchDelay': preferences.launchDelay, 
		'startParams': preferences.startParams,
		'closeParams': preferences.closeParams };
	
	return config;
}

DefaultConfig.prototype.save = function(config) {
	var preferences = {
		'url': "",
		'method': "",
		'name': config.name,
		'appid': config.appid, 
		'launchMode': config.launchMode, 
		'launchDelay': config.launchDelay,
		'startParams': config.startParams,
		'closeParams': config.closeParams };
	
	return preferences;
}

