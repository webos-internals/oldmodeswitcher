function GovnahConfig(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
}

GovnahConfig.prototype.version = function() {
	return "1.1";
}

GovnahConfig.prototype.appid = function() {
	return "org.webosinternals.govnah";
}

//

GovnahConfig.prototype.activate = function() {
	this.service.request('palm://org.webosinternals.govnah/', {
		method: 'getProfiles', parameters: {returnid: Mojo.Controller.appInfo.id} });
}

GovnahConfig.prototype.data = function(data) {
	if(data.profiles.length > 0) {
		this.choicesGovnahStartSelector.clear();
		this.choicesGovnahCloseSelector.clear();
	}

	for(var i = 0; i < data.profiles.length; i++) {
		this.choicesGovnahStartSelector.push({'label': data.profiles[i].name, value: data.profiles[i].id});  

		this.choicesGovnahCloseSelector.push({'label': data.profiles[i].name, value: data.profiles[i].id});  
	}
}

GovnahConfig.prototype.deactivate = function() {
}

//

GovnahConfig.prototype.setup = function(controller) {
	// Start profile selector

	this.choicesGovnahStartSelector = [{'label': "No profiles", 'value': 0}];

	controller.setupWidget("GovnahStartSelector", {'label': "On Start", 
		'labelPlacement': "left", 'modelProperty': "startProfile",
		'choices': this.choicesGovnahStartSelector});
		
	// Close profile selector

	this.choicesGovnahCloseSelector = [{'label': "No profiles", 'value': 0}];

	controller.setupWidget("GovnahCloseSelector", {'label': "On Close", 
		'labelPlacement': "left", 'modelProperty': "closeProfile",
		'choices': this.choicesGovnahCloseSelector});
}

//

GovnahConfig.prototype.config = function(launchPoint) {
	var config = {
		'name': launchPoint.title,
		'startProfile': 0, 
		'closeProfile': 0 };
	
	return config;
}

//

GovnahConfig.prototype.load = function(preferences) {
	var startProfile = 0;
	var closeProfile = 0;
		
	try {eval("var startParams = " + preferences.params.start);} catch(error) {var startParams = "";}

	try {eval("var closeParams = " + preferences.params.close);} catch(error) {var closeParams = "";}

	if(startParams.profileid != undefined)
		startProfile = startParams.profileid;

	if(closeParams.profileid != undefined)
		closeProfile = closeParams.profileid;

	var config = {
		'name': preferences.name,
		'startProfile': startProfile,
		'closeProfile': closeProfile };
	
	return config;
}

GovnahConfig.prototype.save = function(config) {
	var params = {};
	
	params.start = "{profileid: '" + config.startProfile + "'}";
	params.close = "{profileid: '" + config.closeProfile + "'}";

	var preferences = {
		'type': "srv",
		'name': config.name,
		'event': "both",
		'url': "palm://org.webosinternals.govnah/",
		'method': "setProfile",
		'params': params };
	
	return preferences;
}

