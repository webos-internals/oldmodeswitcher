function PhoneConfig(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
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

PhoneConfig.prototype.setup = function(controller) {
	this.choicesPhoneLaunchSelector = [
		{'label': "On Mode Start", value: "start"},
		{'label': "On Mode Close", value: "close"} ];  

	controller.setupWidget("PhoneLaunchSelector", {'label': "Launch", 
		'labelPlacement': "left", 'modelProperty': "launchMode",
		'choices': this.choicesPhoneLaunchSelector} );
			
	controller.setupWidget("PhoneNumberText", { 'hintText': "Enter phone number...", 
		'multiline': false, 'enterSubmits': false, 'focus': false, 
		'textCase': Mojo.Widget.steModeLowerCase, 'modelProperty': "launchNumber"} );
}

//

PhoneConfig.prototype.config = function(launchPoint) {
	var config = {
		'name': launchPoint.title,
		'launchMode': "start",
		'launchNumber': "" };
	
	return config;
}

//

PhoneConfig.prototype.load = function(preferences) {
	var launchNumber = "";
	
	try {eval("var params = " + preferences.params);} catch(error) {var params = "";}

	if(params.number != undefined)
		launchNumber = params.number;
		
	var config = {
		'name': preferences.name,		
		'launchMode': preferences.event,
		'launchNumber': launchNumber };
	
	return config;
}

PhoneConfig.prototype.save = function(config) {
	var params = "";

	if(config.launchNumber.length != 0)
		params = "{number: '" + config.launchNumber + "'}";

	var preferences = {
		'type': "app",
		'name': config.name,		
		'event': config.launchMode,
		'delay': config.launchDelay,
		'appid': this.appid(), 
		'params': params };
	
	return preferences;
}

