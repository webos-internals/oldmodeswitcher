function WWindowConfig(ServiceRequestWrapper) {
}

//

WWindowConfig.prototype.init = function() {
}

WWindowConfig.prototype.data = function(data) {
}

//

WWindowConfig.prototype.setup = function(controller) {
	// Mode selector

	this.choicesModeSelector = [
		{'label': "On Mode Start", value: 1},
		{'label': "On Mode Close", value: 2}];  

	controller.setupWidget("ModeSelector",	{'label': "Launch", 
		'labelPlacement': "left", 'modelProperty': "launchMode",
		'choices': this.choicesModeSelector});

	// Action selector
	
	this.choicesActionSelector = [
		{'label': "Do Nothing", value: 0},
		{'label': "Get Weather", value: 1}];  

	controller.setupWidget("ActionSelector",	{'label': "Action", 
		'labelPlacement': "left", 'modelProperty': "launchAction",
		'choices': this.choicesActionSelector});
}

//

WWindowConfig.prototype.load = function(config, preferences) {
	var launchAction = 0;
	
	if(preferences.launchMode == 1) {
		try {eval("var params = " + preferences.startParams);} catch(error) {var params = "";}
	}
	else {
		try {eval("var params = " + preferences.closeParams);} catch(error) {var params = "";}
	}

	if(params.action != undefined)
		launchAction = 1;
		
	config.push({'extension': "wwindow", 
		'name': preferences.name,
		'appid': preferences.appid,
		'launchMode': preferences.launchMode, 
		'launchAction': launchAction});
}

WWindowConfig.prototype.save = function(config, preferences) {
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

	preferences.push({'extension': "wwindow",
		'name': config.name,
		'appid': config.appid, 
		'launchMode': config.launchMode, 
		'startParams': startParams,
		'closeParams': closeParams});
}

//

WWindowConfig.prototype.append = function(config, launchPoint, saveCallback) {
	config.push({'extension': "wwindow", 'name': launchPoint.title, 'appid': launchPoint.id, 
		'launchMode': 1, 'launchAction': 1});
	
	saveCallback();
}

WWindowConfig.prototype.remove = function(config, index, saveCallback) {
	config.splice(index,1);

	saveCallback();
}

