function GovnahConfig() {
}

GovnahConfig.prototype.version = function() {
	return "1.1";
}

GovnahConfig.prototype.appid = function() {
	return "org.webosinternals.govnah";
}

//

GovnahConfig.prototype.activate = function() {
	this.controller.serviceRequest("palm://org.webosinternals.govnah/", {
		'method': "getProfiles", 'parameters': {'returnid': Mojo.Controller.appInfo.id}});
}

GovnahConfig.prototype.data = function(profileData) {
	if(profileData.profiles.length > 0) {
		this.choicesGovnahStartSelector.clear();
		this.choicesGovnahCloseSelector.clear();
	}

	// HACK: not sure if govnah uses index 0
	
	this.normal = true;

	for(var i = 0; i < profileData.profiles.length; i++) {
		if(profileData.profiles[i].id == 0) {
			this.normal = false;
			break;
		}
	}
		
	if((this.normal) && (profileData.profiles.length > 0)) {
		this.choicesGovnahStartSelector.push({'label': $L("Do Nothing"), 'value': 0});  
		this.choicesGovnahCloseSelector.push({'label': $L("Do Nothing"), 'value': 0});  
	}

	for(var i = 0; i < profileData.profiles.length; i++) {
		this.choicesGovnahStartSelector.push({'label': profileData.profiles[i].name, 'value': profileData.profiles[i].id});  

		this.choicesGovnahCloseSelector.push({'label': profileData.profiles[i].name, 'value': profileData.profiles[i].id});  
	}
	
	var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

	this.controller.get("AppsList").mojo.invalidateItems(0);
	
	this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);		
}

GovnahConfig.prototype.deactivate = function() {
}

//

GovnahConfig.prototype.setup = function(sceneController) {
	this.controller = sceneController;

	this.choicesGovnahLaunchSelector = [
		{'label': $L("On Mode Start"), value: "start"},
		{'label': $L("On Mode Close"), value: "close"} ];  

	sceneController.setupWidget("GovnahLaunchSelector", {'label': $L("Launch"), 
		'labelPlacement': "left", 'modelProperty': "launchMode",
		'choices': this.choicesGovnahLaunchSelector} );

	this.choicesGovnahStartSelector = [{'label': $L("No Profiles"), 'value': 0}];

	sceneController.setupWidget("GovnahStartSelector", {'label': $L("On Start"), 
		'labelPlacement': "left", 'modelProperty': "startProfile",
		'choices': this.choicesGovnahStartSelector});

	this.choicesGovnahCloseSelector = [{'label': $L("No Profiles"), 'value': 0}];

	sceneController.setupWidget("GovnahCloseSelector", {'label': $L("On Close"), 
		'labelPlacement': "left", 'modelProperty': "closeProfile",
		'choices': this.choicesGovnahCloseSelector});

	// Listen for change event for action selector
	
	sceneController.listen(sceneController.get("AppsList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

GovnahConfig.prototype.config = function(launchPoint) {
	if(launchPoint.type == "app") {
		var appDisplay = "block";
		var srvDisplay = "none";
	}
	else {
		var appDisplay = "none";
		var srvDisplay = "block";
	}

	var appConfig = {
		'name': launchPoint.title,
		'appType': launchPoint.type,
		'launchMode': "start",
		'startProfile': 0, 
		'closeProfile': 0,
		'govnahAppCfgDisplay': appDisplay,
		'govnahSrvCfgDisplay': srvDisplay };
	
	return appConfig;
}

//

GovnahConfig.prototype.load = function(appPreferences) {
	var startProfile = 0;
	var closeProfile = 0;

	if(appPreferences.type == "app") {
		var launchMode = appPreferences.event;
		
		var displayAppCfg = "block";
		var displaySrvCfg = "none";
	}
	else {	
		var launchMode = "start";

		var displayAppCfg = "none";
		var displaySrvCfg = "block";
		
		try {eval("var startParams = " + appPreferences.params.start);} catch(error) {var startParams = "";}

		try {eval("var closeParams = " + appPreferences.params.close);} catch(error) {var closeParams = "";}

		if(startParams.profileid != undefined)
			startProfile = startParams.profileid;

		if(closeParams.profileid != undefined)
			closeProfile = closeParams.profileid;
	}
	
	var appConfig = {
		'name': appPreferences.name,
		'appType': appPreferences.type,
		'launchMode': launchMode,
		'startProfile': startProfile,
		'closeProfile': closeProfile,
		'govnahAppCfgDisplay': displayAppCfg,
		'govnahSrvCfgDisplay': displaySrvCfg };
	
	return appConfig;
}

GovnahConfig.prototype.save = function(appConfig) {
	if(appConfig.appType == "app") {
		var appPreferences = {
			'type': "app",
			'name': appConfig.name,
			'event': appConfig.launchMode,
			'delay': 0,
			'appid': this.appid(),
			'params': "" };
	}
	else {
		// HACK
	
		var event = "both";
	
		if(this.normal) {
			if((appConfig.startProfile == 0) && (appConfig.closeProfile == 0))
				event = "none";
			else if(appConfig.startProfile == 0)
				event = "close";
			else if(appConfig.closeProfile == 0)
				event = "start";
		}

		var params = {};
	
		params.start = "{profileid: " + appConfig.startProfile + "}";
		params.close = "{profileid: " + appConfig.closeProfile + "}";

		var appPreferences = {
			'type': "srv",
			'name': appConfig.name,
			'event': event,
			'url': "palm://org.webosinternals.govnah/",
			'method': "setProfile",
			'params': params };
	}
		
	return appPreferences;
}

//

GovnahConfig.prototype.handleListChange = function(changeEvent) {
	if(changeEvent.property == "appType") {
		if(changeEvent.value == "app") {
			changeEvent.model.launchMode = "start";
		
			changeEvent.model.govnahAppCfgDisplay = "block";
			changeEvent.model.govnahSrvCfgDisplay = "none";
		}
		else if(changeEvent.value == "srv") {
			changeEvent.model.govnahAppCfgDisplay = "none";
			changeEvent.model.govnahSrvCfgDisplay = "block";
		}		

		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("AppsList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
}

