function WwindowConfig(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
}

WwindowConfig.prototype.version = function() {
	return "1.0";
}

WwindowConfig.prototype.appid = function() {
	return "com.hiddenworldhut.weatherwindow";
}

//

WwindowConfig.prototype.init = function() {
}

//

WwindowConfig.prototype.setup = function(controller) {
	this.choicesWwindowLaunchSelector = [
		{'label': "On Mode Start", value: 1},
		{'label': "On Mode Close", value: 2} ];  

	controller.setupWidget("WwindowLaunchSelector", {'label': "Launch", 
		'labelPlacement': "left", 'modelProperty': "launchMode",
		'choices': this.choicesWwindowLaunchSelector} );
	
	this.choicesWwindowActionSelector = [
		{'label': "Do Nothing", value: 0},
		{'label': "Get Weather", value: 1} ];  

	controller.setupWidget("WwindowActionSelector", {'label': "Action", 
		'labelPlacement': "left", 'modelProperty': "launchAction",
		'choices': this.choicesWwindowActionSelector} );

	this.choicesWwindowtDelaySelector = [
		{'label': "No Delay", value: 0},
		{'label': "15 Seconds", value: 15},
		{'label': "30 Seconds", value: 30} ];  

	controller.setupWidget("WwindowDelaySelector", {'label': "Delay", 
		'labelPlacement': "left", 'modelProperty': "launchDelay",
		'choices': this.choicesWwindowDelaySelector} );
}

//

WwindowConfig.prototype.config = function(launchPoint) {
	var config = {
		'name': launchPoint.title, 
		'appid': launchPoint.id, 
		'launchMode': 1, 
		'launchDelay': 0,
		'launchAction': 1 };
	
	return config;
}

//

WwindowConfig.prototype.load = function(preferences) {
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

WwindowConfig.prototype.save = function(config) {
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

