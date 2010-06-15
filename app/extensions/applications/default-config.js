function DefaultConfig(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
}

//

DefaultConfig.prototype.init = function() {
}

DefaultConfig.prototype.data = function(data) {
}

//

DefaultConfig.prototype.setup = function(controller) {
	// Mode selector

	this.choicesDefaultLaunchSelector = [
		{'label': "On Mode Start", value: 1},
		{'label': "On Mode Close", value: 2} ];  

	controller.setupWidget("DefaultLaunchSelector", {'label': "Launch", 
		'labelPlacement': "left", 'modelProperty': "launchMode",
		'choices': this.choicesDefaultLaunchSelector} );
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
		'name': config.name,
		'appid': config.appid, 
		'launchMode': config.launchMode, 
		'launchDelay': config.launchDelay,
		'startParams': config.startParams,
		'closeParams': config.closeParams };
	
	return preferences;
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

