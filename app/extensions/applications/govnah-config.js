function GovnahConfig(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;

	this.choicesGovnahStartSelector = [];
	this.choicesGovnahCloseSelector = [];
}

//

GovnahConfig.prototype.init = function() {
	this.service.request('palm://com.palm.applicationManager', {
		method: 'launch', parameters: { id: 'org.webosinternals.govnah', params: {
				type: 'get-profiles', returnid: 'com.palm.org.e-lnx.wee.apps.modeswitcher'}}} );
}

GovnahConfig.prototype.data = function(data) {
	this.choicesGovnahStartSelector.clear();
	this.choicesGovnahCloseSelector.clear();
	
	for(var i = 0; i < data.profiles.length; i++) {
		this.choicesGovnahStartSelector.push({'label': data.profiles[i].name, value: data.profiles[i].id});  

		this.choicesGovnahCloseSelector.push({'label': data.profiles[i].name, value: data.profiles[i].id});  
	}
}

//

GovnahConfig.prototype.setup = function(controller) {
	// Start profile selector

	controller.setupWidget("GovnahStartSelector", {'label': "On Start", 
		'labelPlacement': "left", 'modelProperty': "startProfile",
		'choices': this.choicesGovnahStartSelector});
		
	// Close profile selector

	controller.setupWidget("GovnahCloseSelector", {'label': "On Close", 
		'labelPlacement': "left", 'modelProperty': "closeProfile",
		'choices': this.choicesGovnahCloseSelector});
}

//

GovnahConfig.prototype.load = function(preferences) {
	var startProfile = 0;
	var closeProfile = 0;
		
	try {eval("var startParams = " + preferences.startParams);} catch(error) {var startParams = "";}

	try {eval("var closeParams = " + preferences.closeParams);} catch(error) {var closeParams = "";}

	if(startParams.profileid != undefined)
		startProfile = startParams.profileid;

	if(closeParams.profileid != undefined)
		closeProfile = closeParams.profileid;

	var config = {
		'name': preferences.name,
		'appid': preferences.appid,
		'launchMode': preferences.launchMode, 
		'launchDelay': preferences.launchDelay, 
		'startProfile': startProfile,
		'closeProfile': closeProfile };
	
	return config;
}

GovnahConfig.prototype.save = function(config) {
	var startParams = "";
	var closeParams = "";
	
	startParams = "{type: 'set-profile', profileid: '" + config.startProfile + "'}";
	closeParams = "{type: 'set-profile', profileid: '" + config.closeProfile + "'}";

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

GovnahConfig.prototype.config = function(launchPoint) {
	var config = {
		'name': launchPoint.title, 
		'appid': launchPoint.id, 
		'launchMode': 0, 
		'launchDelay': 0, 
		'startProfile': 1, 
		'closeProfile': 1 };
	
	return config;
}

