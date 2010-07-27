function PhoneConfig(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
}

PhoneConfig.prototype.version = function() {
	return "1.0";
}

PhoneConfig.prototype.appid = function() {
	return "com.palm.app.phone";
}

//

PhoneConfig.prototype.init = function() {
}

//

PhoneConfig.prototype.setup = function(controller) {
	this.choicesPhoneLaunchSelector = [
		{'label': "On Mode Start", value: 1},
		{'label': "On Mode Close", value: 2} ];  

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
		'appid': launchPoint.id, 
		'launchMode': 1, 
		'launchDelay': 0, 
		'launchNumber': "" };
	
	return config;
}

//

PhoneConfig.prototype.load = function(preferences) {
	var launchNumber = "";
	
	if(preferences.launchMode == 1) {
		try {eval("var params = " + preferences.startParams);} catch(error) {var params = "";}
	}
	else {
		try {eval("var params = " + preferences.closeParams);} catch(error) {var params = "";}
	}

	if(params.number != undefined)
		launchNumber = params.number;
		
	var config = {
		'name': preferences.name,
		'appid': preferences.appid,
		'launchMode': preferences.launchMode, 
		'launchDelay': preferences.launchDelay, 
		'launchNumber': launchNumber };
	
	return config;
}

PhoneConfig.prototype.save = function(config) {
	var startParams = "";
	var closeParams = "";
	
	if(config.launchNumber.length != 0) {
		if(config.launchMode == 1) {
			startParams = "{number: '" + config.launchNumber + "'}";
		}
		else {
			closeParams = "{number: '" + config.launchNumber + "'}";
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

