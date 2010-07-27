function GovnahConfig(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;

	this.choicesGovnahStartSelector = [{'label': "No profiles", 'value': "none"}];
	this.choicesGovnahCloseSelector = [{'label': "No profiles", 'value': "none"}];
}

GovnahConfig.prototype.version = function() {
	return "1.0";
}

GovnahConfig.prototype.appid = function() {
	return "org.webosinternals.govnah";
}

//

GovnahConfig.prototype.init = function() {
	this.service.request('palm://org.webosinternals.govnah/', {
		method: 'getProfiles', parameters: {returnid: 'com.palm.org.e-lnx.wee.apps.modeswitcher'} });
}

GovnahConfig.prototype.data = function(data) {
	this.choicesGovnahStartSelector.clear();
	this.choicesGovnahCloseSelector.clear();
	
	if(data.profiles.length > 0) {
		this.choicesGovnahStartSelector.clear();
		this.choicesGovnahCloseSelector.clear();
	}
		
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

GovnahConfig.prototype.config = function(launchPoint) {
	var config = {
		'name': launchPoint.title, 
		'appid': launchPoint.id, 
		'launchMode': 0, 
		'launchDelay': 0, 
		'startProfile': 0, 
		'closeProfile': 0 };
	
	return config;
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
	
	startParams = "{profileid: '" + config.startProfile + "'}";
	closeParams = "{profileid: '" + config.closeProfile + "'}";

	var preferences = {
		'url': "palm://org.webosinternals.govnah/",
		'method': "setProfile",
		'name': config.name,
		'appid': config.appid, 
		'launchMode': config.launchMode, 
		'launchDelay': config.launchDelay, 		
		'startParams': startParams,
		'closeParams': closeParams };
	
	return preferences;
}

