function PhoneConfig(ServiceRequestWrapper) {
}

//

PhoneConfig.prototype.init = function() {
}

PhoneConfig.prototype.data = function(data) {
}

//

PhoneConfig.prototype.setup = function(controller) {
	// Mode selector

	this.choicesModeSelector = [
		{'label': "On Mode Start", value: 1},
		{'label': "On Mode Close", value: 2}];  

	controller.setupWidget("ModeSelector",	{'label': "Launch", 
		'labelPlacement': "left", 'modelProperty': "launchMode",
		'choices': this.choicesModeSelector});

	// URL text field
			
	controller.setupWidget("NumberText", { 'hintText': "Enter phone number...", 
		'multiline': false, 'enterSubmits': false, 'focus': false, 
		'textCase': Mojo.Widget.steModeLowerCase, 'modelProperty': "launchNumber"});
}

//

PhoneConfig.prototype.load = function(config, preferences) {
	var launchNumber = "";
	
	if(preferences.launchMode == 1) {
		try {eval("var params = " + preferences.startParams);} catch(error) {var params = "";}
	}
	else {
		try {eval("var params = " + preferences.closeParams);} catch(error) {var params = "";}
	}

	if(params.number != undefined)
		launchNumber = params.number;
		
	config.push({'extension': "phone", 
		'name': preferences.name,
		'appid': preferences.appid,
		'launchMode': preferences.launchMode, 
		'launchNumber': launchNumber});
}

PhoneConfig.prototype.save = function(config, preferences) {
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

	preferences.push({'extension': "phone",
		'name': config.name,
		'appid': config.appid, 
		'launchMode': config.launchMode, 
		'startParams': startParams,
		'closeParams': closeParams});
}

//

PhoneConfig.prototype.append = function(config, launchPoint, saveCallback) {
	config.push({'extension': "phone", 'name': launchPoint.title, 'appid': launchPoint.id, 
		'launchMode': 1, 'launchNumber': ""});
	
	saveCallback();
}

PhoneConfig.prototype.remove = function(config, index, saveCallback) {
	config.splice(index,1);

	saveCallback();
}

