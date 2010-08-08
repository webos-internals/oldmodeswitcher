function WwindowConfig(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
}

WwindowConfig.prototype.version = function() {
	return "1.1";
}

WwindowConfig.prototype.appid = function() {
	return "com.hiddenworldhut.weatherwindow";
}

//

WwindowConfig.prototype.activate = function() {
}

WwindowConfig.prototype.deactivate = function() {
}

//

WwindowConfig.prototype.setup = function(controller) {
	this.choicesWwindowLaunchSelector = [
		{'label': "On Mode Start", value: "start"},
		{'label': "On Mode Close", value: "close"} ];  

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
		'launchMode': "start",
		'launchAction': 0,
		'launchDelay': 0 };
	
	return config;
}

//

WwindowConfig.prototype.load = function(preferences) {
	var launchAction = 0;
	
	try {eval("var params = " + preferences.params);} catch(error) {var params = "";}

	if(params.action != undefined)
		launchAction = 1;
		
	var config = {
		'name': preferences.name,
		'launchMode': preferences.event,
		'launchDelay': preferences.delay,
		'launchAction': launchAction };
	
	return config;
}

WwindowConfig.prototype.save = function(config) {
	var params = "";
	
	if(config.launchAction == 1)
		params = "{action: 'getWeather'}";

	var preferences = {
		'type': "app",
		'name': config.name,
		'event': config.launchMode,
		'delay': config.launchDelay,
		'appid': this.appid(),
		'params': params };
	
	return preferences;
}

