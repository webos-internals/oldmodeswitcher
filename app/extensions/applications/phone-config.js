function PhoneConfig() {
}

PhoneConfig.prototype.version = function() {
	return "1.1";
}

PhoneConfig.prototype.appid = function() {
	return "com.palm.app.phone";
}

//

PhoneConfig.prototype.activate = function() {
}

PhoneConfig.prototype.deactivate = function() {
}

//

PhoneConfig.prototype.setup = function(sceneController) {
	this.choicesPhoneLaunchSelector = [
		{'label': "On Mode Start", value: "start"},
		{'label': "On Mode Close", value: "close"} ];  

	sceneController.setupWidget("PhoneLaunchSelector", {'label': "Launch", 
		'labelPlacement': "left", 'modelProperty': "launchMode",
		'choices': this.choicesPhoneLaunchSelector} );
			
	sceneController.setupWidget("PhoneNumberText", { 'hintText': "Enter phone number...", 
		'multiline': false, 'enterSubmits': false, 'focus': false, 
		'textCase': Mojo.Widget.steModeLowerCase, 'modelProperty': "launchNumber"} );
}

//

PhoneConfig.prototype.config = function(launchPoint) {
	var appConfig = {
		'name': launchPoint.title,
		'launchMode': "start",
		'launchNumber': "" };
	
	return appConfig;
}

//

PhoneConfig.prototype.load = function(appPreferences) {
	var launchNumber = "";
	
	try {eval("var params = " + appPreferences.params);} catch(error) {var params = "";}

	if(params.number != undefined)
		launchNumber = params.number;
		
	var appConfig = {
		'name': appPreferences.name,		
		'launchMode': appPreferences.event,
		'launchNumber': launchNumber };
	
	return appConfig;
}

PhoneConfig.prototype.save = function(appConfig) {
	var params = "";

	if(appConfig.launchNumber.length != 0)
		params = "{number: '" + appConfig.launchNumber + "'}";

	var appPreferences = {
		'type': "app",
		'name': appConfig.name,		
		'event': appConfig.launchMode,
		'delay': appConfig.launchDelay,
		'appid': this.appid(), 
		'params': params };
	
	return appPreferences;
}

