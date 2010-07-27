function ModeswConfig(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;

	this.modesList = [];

	this.choicesModeswModeSelector = [];
}

ModeswConfig.prototype.version = function() {
	return "1.0";
}

ModeswConfig.prototype.appid = function() {
	return "com.palm.org.e-lnx.wee.apps.modeswitcher";
}

//

ModeswConfig.prototype.init = function() {
	new Mojo.Service.Request('palm://com.palm.systemservice/', {
		'method': 'getPreferences', 'parameters': {
			'subscribe': true, 'keys': ["modesConfig"]},
		onSuccess: this.handleModeData.bind(this)} );
}

//

ModeswConfig.prototype.setup = function(controller) {
	this.controller = controller;

	this.choicesModeswLaunchSelector = [
		{'label': "On Mode Start", value: 1},
		{'label': "On Mode Close", value: 2}];  

	controller.setupWidget("ModeswLaunchSelector", {'label': "Launch", 
		'labelPlacement': "left", 'modelProperty': "launchMode",
		'choices': this.choicesModeswLaunchSelector});
	
	this.choicesModeswActionSelector = [
		{'label': "Start Mode", value: "start"},
		{'label': "Close Mode", value: "close"},
		{'label': "Trigger Mode", value: "manual"}];  

	controller.setupWidget("ModeswActionSelector", {'label': "Action", 
		'labelPlacement': "left", 'modelProperty': "modeAction",
		'choices': this.choicesModeswActionSelector});

	controller.setupWidget("ModeswModeSelector", {'label': "Mode", 
		'labelPlacement': "left", 'modelProperty': "modeName",
		'choices': this.choicesModeswModeSelector});

	// Listen for change event for action selector
	
	Mojo.Event.listen(controller.get("AppsList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

ModeswConfig.prototype.config = function(launchPoint) {
	this.choicesModeswModeSelector.clear();

	for(var i = 0; i < this.modesList.length; i++) {
		if((this.modesList[i].type != "current") && (this.modesList[i].type != "default")) {
			if(this.controller.get("NameText").mojo.getValue() != this.modesList[i].value)
				this.choicesModeswModeSelector.push(this.modesList[i]);
		}
	}

	var config = {
		'name': launchPoint.title, 
		'appid': launchPoint.id, 
		'launchMode': 1, 
		'launchDelay': 0,
		'modeAction': "start", 
		'modeName': "Previous Mode" };
	
	return config;
}

//

ModeswConfig.prototype.load = function(preferences) {
	var modeAction = "start";	
	var modeName = "Previous Mode";
		
	try {eval("var startParams = " + preferences.startParams);} catch(error) {var startParams = "";}

	try {eval("var closeParams = " + preferences.closeParams);} catch(error) {var closeParams = "";}

	if(startParams.event != undefined)
		modeAction = startParams.event;
	else if(closeParams.event != undefined)
		modeAction = closeParams.event;

	if(startParams.name != undefined)
		modeName = startParams.name;
	else if(closeParams.name != undefined)
		modeName = closeParams.name;

	this.choicesModeswModeSelector.clear();

	for(var i = 0; i < this.modesList.length; i++) {
		if((modeAction == "start") || (modeAction == "manual")) {
			if((this.modesList[i].type != "current") && (this.modesList[i].type != "default"))
				this.choicesModeswModeSelector.push(this.modesList[i]);
		}
		else if(modeAction == "close") {
			if((this.modesList[i].type == "current") || (this.modesList[i].type == "modifier"))
				this.choicesModeswModeSelector.push(this.modesList[i]);
		}
	}

	var config = {
		'name': preferences.name,
		'appid': preferences.appid,
		'launchMode': preferences.launchMode, 
		'launchDelay': preferences.launchDelay, 
		'modeAction': modeAction, 
		'modeName': modeName };
	
	return config;
}

ModeswConfig.prototype.save = function(config) {
	var startParams = "";
	var closeParams = "";
	
	if(config.launchMode == 1) {
		if(config.modeAction != "manual")
			startParams = "{action: 'execute', event: '" + config.modeAction + "', name: '" + config.modeName + "'}";
		else
			startParams = "{action: 'trigger', event: '" + config.modeAction + "', name: '" + config.modeName + "'}";
	}
	else if(config.launchMode == 2) {
		if(config.modeAction != "manual")
			closeParams = "{action: 'execute', event: '" + config.modeAction + "', name: '" + config.modeName + "'}";
		else
			closeParams = "{action: 'trigger', event: '" + config.modeAction + "', name: '" + config.modeName + "'}";
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

//

ModeswConfig.prototype.handleModeData = function(data) {
	if(data.modesConfig != undefined) {
		this.modesList.clear();
	
		this.modesList.push({'label': "Current Mode", 'value': "Current Mode", 'type': "current"});  
		this.modesList.push({'label': "Default Mode", 'value': "Default Mode", 'type': "default"});  
		this.modesList.push({'label': "Previous Mode", 'value': "Previous Mode", 'type': "previous"});  
	
		for(var i = 0; i < data.modesConfig.length; i++) {
			this.modesList.push({
				'label': data.modesConfig[i].name, 
				'value': data.modesConfig[i].name, 
				'type': data.modesConfig[i].type});  
		}
	}
}

//

ModeswConfig.prototype.handleListChange = function(event) {
	if(event.property == "modeAction") {
		this.choicesModeswModeSelector.clear();

		for(var i = 0; i < this.modesList.length; i++) {
			if((event.value == "start") || (event.value == "manual")) {
				if((this.modesList[i].type != "current") && (this.modesList[i].type != "default")) {
					if(this.controller.get("NameText").mojo.getValue() != this.modesList[i].value)
						this.choicesModeswModeSelector.push(this.modesList[i]);
				}
			}
			else if(event.value == "close") {
				if((this.modesList[i].type == "current") || (this.modesList[i].type == "modifier"))
					this.choicesModeswModeSelector.push(this.modesList[i]);
			}
		}		

		if(event.value == "start")
			event.model.modeName = "Previous Mode";
		else if(event.value == "close")
			event.model.modeName = "Current Mode";
		else if(event.value == "manual")
			event.model.modeName = "Previous Mode";

		this.controller.modelChanged(event.model);
	}
}

