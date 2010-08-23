function WwindowConfig() {
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

WwindowConfig.prototype.setup = function(sceneController) {
	this.choicesWwindowLaunchSelector = [
		{'label': $L("On Mode Start"), value: "start"},
		{'label': $L("On Mode Close"), value: "close"} ];  

	sceneController.setupWidget("WwindowLaunchSelector", {'label': $L("Launch"), 
		'labelPlacement': "left", 'modelProperty': "launchMode",
		'choices': this.choicesWwindowLaunchSelector} );
	
	this.choicesWwindowActionSelector = [
		{'label': $L("Do Nothing"), value: 0},
		{'label': $L("Get Weather"), value: 1} ];  

	sceneController.setupWidget("WwindowActionSelector", {'label': $L("Action"), 
		'labelPlacement': "left", 'modelProperty': "launchAction",
		'choices': this.choicesWwindowActionSelector} );

	this.choicesWwindowtDelaySelector = [
		{'label': $L("No Delay"), value: 0},
		{'label': "15 " + $L("Seconds"), value: 15},
		{'label': "30 " + $L("Seconds"), value: 30} ];  

	sceneController.setupWidget("WwindowDelaySelector", {'label': $L("Delay"), 
		'labelPlacement': "left", 'modelProperty': "launchDelay",
		'choices': this.choicesWwindowDelaySelector} );
}

//

WwindowConfig.prototype.config = function(launchPoint) {
	var appConfig = {
		'name': launchPoint.title,
		'launchMode': "start",
		'launchAction': 0,
		'launchDelay': 0 };
	
	return appConfig;
}

//

WwindowConfig.prototype.load = function(appPreferences) {
	var launchAction = 0;
	
	try {eval("var params = " + appPreferences.params);} catch(error) {var params = "";}

	if(params.action != undefined)
		launchAction = 1;
		
	var appConfig = {
		'name': appPreferences.name,
		'launchMode': appPreferences.event,
		'launchDelay': appPreferences.delay,
		'launchAction': launchAction };
	
	return appConfig;
}

WwindowConfig.prototype.save = function(appConfig) {
	var params = "";
	
	if(appConfig.launchAction == 1)
		params = "{action: 'getWeather'}";

	var appPreferences = {
		'type': "app",
		'name': appConfig.name,
		'event': appConfig.launchMode,
		'delay': appConfig.launchDelay,
		'appid': this.appid(),
		'params': params };
	
	return appPreferences;
}

