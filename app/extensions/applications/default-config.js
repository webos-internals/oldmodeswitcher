function DefaultConfig(ServiceRequestWrapper) {
}

//

DefaultConfig.prototype.init = function() {
}

DefaultConfig.prototype.data = function(data) {
}

//

DefaultConfig.prototype.setup = function(controller) {
	// Mode selector

	this.choicesModeSelector = [
		{'label': "On Mode Start", value: 1},
		{'label': "On Mode Close", value: 2}];  

	controller.setupWidget("ModeSelector",	{'label': "Launch", 
		'labelPlacement': "left", 'modelProperty': "launchMode",
		'choices': this.choicesModeSelector});
}

//

DefaultConfig.prototype.load = function(config, preferences) {
	config.push({'extension': "default",
		'name': preferences.name,
		'appid': preferences.appid,
		'launchMode': preferences.launchMode, 
		'startParams': preferences.startParams,
		'closeParams': preferences.closeParams});
}

DefaultConfig.prototype.save = function(config, preferences) {
	preferences.push({'extension': "default",
		'name': config.name,
		'appid': config.appid, 
		'launchMode': config.launchMode, 
		'startParams': config.startParams,
		'closeParams': config.closeParams});
}

//

DefaultConfig.prototype.append = function(config, launchPoint, saveCallback) {
	config.push({'extension': "default", 'name': launchPoint.title, 'appid': launchPoint.id, 
		'launchMode': 1, 'startParams': "", 'closeParams': ""});
	
	saveCallback();
}

DefaultConfig.prototype.remove = function(config, index, saveCallback) {
	config.splice(index,1);

	saveCallback();
}

