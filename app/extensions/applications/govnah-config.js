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
	this.service.request("palm://org.webosinternals.govnah/", {
		'method': "getProfiles", 'parameters': {'returnid': Mojo.Controller.appInfo.id}});
}

GovnahConfig.prototype.data = function(data) {
	if(data.profiles.length > 0) {
		this.choicesGovnahStartSelector.clear();
		this.choicesGovnahCloseSelector.clear();
	}

	// HACK: not sure if govnah uses index 0
	
	this.normal = true;

	for(var i = 0; i < data.profiles.length; i++) {
		if(data.profiles[i].id == 0) {
			this.normal = false;
			break;
		}
	}
		
	if(this.normal) {
		this.choicesGovnahStartSelector.push({'label': "Do Nothing", 'value': 0});  
		this.choicesGovnahCloseSelector.push({'label': "Do Nothing", 'value': 0});  
	}

	for(var i = 0; i < data.profiles.length; i++) {
		this.choicesGovnahStartSelector.push({'label': data.profiles[i].name, 'value': data.profiles[i].id});  

		this.choicesGovnahCloseSelector.push({'label': data.profiles[i].name, 'value': data.profiles[i].id});  
	}
	
	var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

	this.controller.get("AppsList").mojo.invalidateItems(0);
	
	this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);		
}

GovnahConfig.prototype.deactivate = function() {
}

//

GovnahConfig.prototype.setup = function(controller) {
	this.controller = controller;

	this.choicesGovnahStartSelector = [{'label': "No profiles", 'value': 0}];

	controller.setupWidget("GovnahStartSelector", {'label': "On Start", 
		'labelPlacement': "left", 'modelProperty': "startProfile",
		'choices': this.choicesGovnahStartSelector});

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
	// HACK
	
	var event = "both";
	
	if(this.normal) {
		if((config.startProfile == 0) && (config.closeProfile == 0))
			event = "none";
		else if(config.startProfile == 0)
			event = "close";
		else if(config.closeProfile == 0)
			event = "start";
	}

	var params = {};
	
	params.start = "{profileid: " + config.startProfile + "}";
	params.close = "{profileid: " + config.closeProfile + "}";

	var preferences = {
		'type': "srv",
		'name': config.name,
		'event': event,
		'url': "palm://org.webosinternals.govnah/",
		'method': "setProfile",
		'params': params };
	
	return preferences;
}

