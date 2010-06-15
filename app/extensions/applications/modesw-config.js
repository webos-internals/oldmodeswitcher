function ModeSWConfig(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;

	this.choicesModeSWModeSelector = [];
}

//

ModeSWConfig.prototype.init = function() {
	this.service.request('palm://com.palm.systemservice/', {
		'method': 'getPreferences', 'parameters': {
			'subscribe': false, 'keys': ["modesConfig"]},
		onSuccess: this.data.bind(this)} );
}

ModeSWConfig.prototype.data = function(data) {
	if(data.modesConfig != undefined) {
		this.choicesModeSWModeSelector.clear();
	
		this.choicesModeSWModeSelector.push({'label': "Default Mode", 'value': "Default Mode"});
	
		for(var i = 0; i < data.modesConfig.length; i++) {
			this.choicesModeSWModeSelector.push({'label': data.modesConfig[i].name, 'value': data.modesConfig[i].name});  
		}
	}
}

//

ModeSWConfig.prototype.setup = function(controller) {
	// Launch mode selector

	this.choicesModeSWLaunchSelector = [
		{'label': "On Mode Start", value: 1},
		{'label': "On Mode Close", value: 2}];  

	controller.setupWidget("ModeSWLaunchSelector", {'label': "Launch", 
		'labelPlacement': "left", 'modelProperty': "launchMode",
		'choices': this.choicesModeSWLaunchSelector});
		
	// Mode selector

	controller.setupWidget("ModeSWModeSelector", {'label': "Start Mode", 
		'labelPlacement': "left", 'modelProperty': "startMode",
		'choices': this.choicesModeSWModeSelector});
}

//

ModeSWConfig.prototype.load = function(preferences) {
	var startMode = "Default Mode";
		
	try {eval("var startParams = " + preferences.startParams);} catch(error) {var startParams = "";}

	try {eval("var closeParams = " + preferences.closeParams);} catch(error) {var closeParams = "";}

	if(startParams.name != undefined)
		startMode = startParams.name;
	else if(closeParams.name != undefined)
		startMode = closeParams.name;

	var config = {
		'name': preferences.name,
		'appid': preferences.appid,
		'launchMode': preferences.launchMode, 
		'launchDelay': preferences.launchDelay, 
		'startMode': startMode };
	
	return config;
}

ModeSWConfig.prototype.save = function(config) {
	var startParams = "";
	var closeParams = "";
	
	if(config.launchMode == 1)
		startParams = "{action: 'execute', event: 'start', name: '" + config.startMode + "'}";
	else if(config.launchMode == 2)
		closeParams = "{action: 'execute', event: 'start', name: '" + config.startMode + "'}";

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

ModeSWConfig.prototype.config = function(launchPoint) {
	var config = {
		'name': launchPoint.title, 
		'appid': launchPoint.id, 
		'launchMode': 1, 
		'launchDelay': 0, 
		'startMode': "Default Mode" };
	
	return config;
}

