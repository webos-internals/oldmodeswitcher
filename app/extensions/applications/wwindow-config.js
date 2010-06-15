function WWindowConfig(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
}

//

WWindowConfig.prototype.init = function() {
}

WWindowConfig.prototype.data = function(data) {
}

//

WWindowConfig.prototype.setup = function(controller) {
	// Mode selector

	this.choicesWWindowLaunchSelector = [
		{'label': "On Mode Start", value: 1},
		{'label': "On Mode Close", value: 2} ];  

	controller.setupWidget("WWindowLaunchSelector", {'label': "Launch", 
		'labelPlacement': "left", 'modelProperty': "launchMode",
		'choices': this.choicesWWindowLaunchSelector} );

	// Action selector
	
	this.choicesWWindowActionSelector = [
		{'label': "Do Nothing", value: 0},
		{'label': "Get Weather", value: 1} ];  

	controller.setupWidget("WWindowActionSelector", {'label': "Action", 
		'labelPlacement': "left", 'modelProperty': "launchAction",
		'choices': this.choicesWWindowActionSelector} );
}

//

WWindowConfig.prototype.load = function(preferences) {
	var launchAction = 0;
	
	if(preferences.launchMode == 1) {
		try {eval("var params = " + preferences.startParams);} catch(error) {var params = "";}
	}
	else {
		try {eval("var params = " + preferences.closeParams);} catch(error) {var params = "";}
	}

	if(params.action != undefined)
		launchAction = 1;
		
	var config = {
		'name': preferences.name,
		'appid': preferences.appid,
		'launchMode': preferences.launchMode,
		'launchDelay': preferences.launchDelay,  
		'launchAction': launchAction };
	
	return config;
}

WWindowConfig.prototype.save = function(config) {
	var startParams = "";
	var closeParams = "";
	
	if(config.launchAction == 1) {
		if(config.launchMode == 1) {
			startParams = "{action: 'getWeather'}";
		}
		else {
			closeParams = "{action: 'getWeather'}";
		}
	}

	var preferences = {
		'name': config.name,
		'appid': config.appid, 
		'launchMode': config.launchMode,
		'launchDelay': config.launchDelay,  
		'startParams': startParams,
		'closeParams': closeParams };
	
	return preferences;
}

//

WWindowConfig.prototype.config = function(launchPoint) {
	var config = {
		'name': launchPoint.title, 
		'appid': launchPoint.id, 
		'launchMode': 1, 
		'launchDelay': 0,
		'launchAction': 1 };
	
	return config;
}

