function ModeswConfig(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;

	this.modesList = [];

	this.choicesModeswModeSelector = [];
}

ModeswConfig.prototype.version = function() {
	return "1.1";
}

ModeswConfig.prototype.appid = function() {
	return "com.palm.org.e-lnx.wee.apps.modeswitcher";
}

//

ModeswConfig.prototype.activate = function() {
	this.subscriptionMSPreferences = this.service.request('palm://com.palm.systemservice/', {
		'method': 'getPreferences', 'parameters': {
			'subscribe': true, 'keys': ["modesConfig"]},
		onSuccess: this.handleModeData.bind(this)} );
}

ModeswConfig.prototype.deactivate = function() {
	if(this.subscriptionMSPreferences)
		this.subscriptionMSPreferences.cancel();
}

//

ModeswConfig.prototype.setup = function(controller) {
	this.controller = controller;

	this.choicesModeswLaunchSelector = [
		{'label': "On Mode Start", value: "start"},
		{'label': "On Mode Close", value: "close"},
		{'label': "On Mode Switch", value: "switch"}];  

	controller.setupWidget("ModeswLaunchSelector", {'label': "Launch", 
		'labelPlacement': "left", 'modelProperty': "launchMode",
		'choices': this.choicesModeswLaunchSelector});
	
	this.choicesModeswActionSelector = [
		{'label': "Start Mode", value: "start"},
		{'label': "Close Mode", value: "close"},
		{'label': "Trigger Mode", value: "trigger"}];  

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
		'launchMode': "start", 
		'modeAction': "start", 
		'modeName': "Previous Mode" };
	
	return config;
}

//

ModeswConfig.prototype.load = function(preferences) {
	this.choicesModeswModeSelector.clear();

	for(var i = 0; i < this.modesList.length; i++) {
		if((preferences.action == "start") || (preferences.action == "manual")) {
			if((this.modesList[i].type != "current") && (this.modesList[i].type != "default"))
				this.choicesModeswModeSelector.push(this.modesList[i]);
		}
		else if(preferences.action == "close") {
			if((this.modesList[i].type == "current") || (this.modesList[i].type == "modifier"))
				this.choicesModeswModeSelector.push(this.modesList[i]);
		}
	}

	var config = {
		'name': preferences.name,	
		'launchMode': preferences.event, 
		'modeAction': preferences.action, 
		'modeName': preferences.mode };
	
	return config;
}

ModeswConfig.prototype.save = function(config) {
	var force = "no";
	var event = "close";
	
	if(config.launchMode == "start")
		event = "start";
	else if(config.launchMode == "switch")
		force = "yes";

	var preferences = {
		'type': "ms",
		'name': config.name,
		'event': event,
		'action': config.modeAction,
		'mode': config.modeName, 
		'force': force };
	
	return preferences;
}

//

ModeswConfig.prototype.handleModeData = function(data) {
	if(data.modesConfig != undefined) {
		this.modesList.clear();
	
		this.modesList.push({'label': "Current Mode", 'value': "Current Mode", 'type': "current"});  
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
			if((event.value == "start") || (event.value == "trigger")) {
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

