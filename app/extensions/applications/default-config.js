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

DefaultConfig.prototype.setup = function(sceneController) {
	this.choicesDefaultLaunchSelector = [
		{'label': $L("On Mode Start"), value: "start"},
		{'label': $L("On Mode Close"), value: "close"} ];  

	sceneController.setupWidget("DefaultLaunchSelector", {'label': $L("Launch"), 
		'labelPlacement': "left", 'modelProperty': "launchMode",
		'choices': this.choicesDefaultLaunchSelector} );
		
	// Delay selector
	
	this.choicesDefaultDelaySelector = [
		{'label': $L("No Delay"), value: 0},
		{'label': "15" + $L(" Seconds"), value: 15},
		{'label': "30 " + $L("Seconds"), value: 30} ];  

	sceneController.setupWidget("DefaultDelaySelector", {'label': $L("Delay"), 
		'labelPlacement': "left", 'modelProperty': "launchDelay",
		'choices': this.choicesDefaultDelaySelector} );
}

//

DefaultConfig.prototype.config = function(launchPoint) {
	var appConfig = {
		'name': launchPoint.title, 
		'appid': launchPoint.id,
		'launchMode': "start", 
		'launchDelay': 0 };
	
	return appConfig;
}

//

DefaultConfig.prototype.load = function(appPreferences) {
	var appConfig = {
		'name': appPreferences.name,
		'appid': appPreferences.appid,
		'launchMode': appPreferences.event, 
		'launchDelay': appPreferences.delay };
	
	return appConfig;
}

DefaultConfig.prototype.save = function(appConfig) {
	var appPreferences = {
		'type': "app",
		'name': appConfig.name,
		'event': appConfig.launchMode,
		'delay': appConfig.launchDelay,		
		'appid': appConfig.appid, 
		'params': "" };
	
	return appPreferences;
}

