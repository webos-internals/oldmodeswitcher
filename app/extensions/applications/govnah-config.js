function GovnahConfig(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;

	this.choicesPStartSelector = [];
	this.choicesPCloseSelector = [];
}

//

GovnahConfig.prototype.init = function() {
	this.service.request('palm://com.palm.applicationManager', {
		method: 'launch', parameters: {
			id: 'org.webosinternals.govnah', params: {
				type: 'get-profiles',
				returnid: 'com.palm.org.e-lnx.wee.apps.modeswitcher'}}});
}

GovnahConfig.prototype.data = function(data) {
	for(var i = 0; i < data.profiles.length; i++) {
		this.choicesPStartSelector.push({'label': data.profiles[i].name, value: data.profiles[i].id});  

		this.choicesPCloseSelector.push({'label': data.profiles[i].name, value: data.profiles[i].id});  
	}
}

//

GovnahConfig.prototype.setup = function(controller) {
	// Start profile selector

	controller.setupWidget("PStartSelector",	{'label': "On Start", 
		'labelPlacement': "left", 'modelProperty': "startProfile",
		'choices': this.choicesPStartSelector});
		
	// Close profile selector

	controller.setupWidget("PCloseSelector",	{'label': "On Close", 
		'labelPlacement': "left", 'modelProperty': "closeProfile",
		'choices': this.choicesPCloseSelector});
}

//

GovnahConfig.prototype.load = function(config, preferences) {
	var startProfile = 0;
	var closeProfile = 0;
		
	try {eval("var startParams = " + preferences.startParams);} catch(error) {var startParams = "";}

	try {eval("var closeParams = " + preferences.closeParams);} catch(error) {var closeParams = "";}

	if(startParams.profileid != undefined)
		startProfile = startParams.profileid;

	if(closeParams.profileid != undefined)
		closeProfile = closeParams.profileid;

	config.push({'extension': "govnah",
		'name': preferences.name,
		'appid': preferences.appid,
		'launchMode': preferences.launchMode, 
		'startProfile': startProfile,
		'closeProfile': closeProfile});
}

GovnahConfig.prototype.save = function(config, preferences) {
	var startParams = "";
	var closeParams = "";
	
	startParams = "{type: 'set-profile', profileid: '" + config.startProfile + "'}";
	closeParams = "{type: 'set-profile', profileid: '" + config.closeProfile + "'}";

	preferences.push({'extension': "govnah",
		'name': config.name,
		'appid': config.appid, 
		'launchMode': config.launchMode, 
		'startParams': startParams,
		'closeParams': closeParams});
}

//

GovnahConfig.prototype.append = function(config, launchPoint, saveCallback) {
	config.push({'extension': "govnah", 'name': launchPoint.title, 'appid': launchPoint.id, 
		'launchMode': 0, 'startProfile': 1, 'closeProfile': 1});
	
	saveCallback();
}

GovnahConfig.prototype.remove = function(config, index, saveCallback) {
	config.splice(index,1);

	saveCallback();
}

