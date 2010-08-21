function ModeswConfig() {
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
	this.subscriptionMSPreferences = this.controller.serviceRequest(
		'palm://com.palm.systemservice/', {
			'method': 'getPreferences', 'parameters': {
				'subscribe': true, 'keys': ["modesConfig"]},
			'onSuccess': this.handleModeData.bind(this)} );
}

ModeswConfig.prototype.deactivate = function() {
	if(this.subscriptionMSPreferences)
		this.subscriptionMSPreferences.cancel();
}

//

ModeswConfig.prototype.setup = function(controller) {
	this.controller = controller;

	this.choicesModeswProcessSelector = [
		{'label': "Before Mode Start", value: "start"},
		{'label': "Before Mode Close", value: "close"},
		{'label': "Before Mode Switch", value: "switch"},
		{'label': "After Mode Start", value: "started"},
		{'label': "After Mode Close", value: "closed"},
		{'label': "After Mode Switch", value: "switched"} ];  

	controller.setupWidget("ModeswProcessSelector", {'label': "Process", 
		'labelPlacement': "left", 'modelProperty': "modeProcess",
		'choices': this.choicesModeswProcessSelector});
	
	this.choicesModeswActionSelector = [
		{'label': "Start Mode", value: "start"},
		{'label': "Close Mode", value: "close"},
		{'label': "Trigger Mode", value: "trigger"},
		{'label': "Require Mode", value: "require"},
		{'label': "Disable Triggers", value: "lock"}];  

	controller.setupWidget("ModeswActionSelector", {'label': "Action", 
		'labelPlacement': "left", 'modelProperty': "modeAction",
		'choices': this.choicesModeswActionSelector});

	controller.setupWidget("ModeswModeSelector", {'label': "Mode", 
		'labelPlacement': "left", 'modelProperty': "modeName",
		'choices': this.choicesModeswModeSelector});

	// Listen for change event for action selector
	
	controller.listen(controller.get("AppsList"), Mojo.Event.propertyChange, 
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
		'modeProcess': "start", 
		'modeAction': "start", 
		'modeName': "Previous Mode",
		'modeActionRow': "",
		'modeModeDisplay': "block" };
	
	return config;
}

//

ModeswConfig.prototype.load = function(preferences) {
	var row = "";
	var display = "block";

	this.choicesModeswModeSelector.clear();

	if(preferences.modeAction == "lock") {
		row = "last";
		display = "none";
	}
	else {
		for(var i = 0; i < this.modesList.length; i++) {
			if(preferences.action == "start") {
				if((this.modesList[i].type != "current") && (this.modesList[i].type != "default") &&
					(this.modesList[i].type != "alln") && (this.modesList[i].type != "allm")) 
				{
					this.choicesModeswModeSelector.push(this.modesList[i]);
				}
			}
			else if(preferences.action == "close") {
				if((this.modesList[i].type == "current") || (this.modesList[i].type == "modifier") ||
					(this.modesList[i].type == "allm"))
				{
					this.choicesModeswModeSelector.push(this.modesList[i]);
				}
			}
			else if(preferences.action == "trigger") {
				if((this.modesList[i].type != "current") && (this.modesList[i].type != "default")) {
					this.choicesModeswModeSelector.push(this.modesList[i]);
				}
			}
			else if(preferences.action == "require") {
				if((this.modesList[i].type == "default") || (this.modesList[i].type == "normal") || 
					(this.modesList[i].type == "modifier"))
				{
					this.choicesModeswModeSelector.push(this.modesList[i]);
				}
			}
		}
	}
	
	var config = {
		'name': preferences.name,	
		'modeProcess': preferences.event, 
		'modeAction': preferences.action, 
		'modeName': preferences.mode,
		'modeActionRow': row,
		'modeModeDisplay': display };
	
	return config;
}

ModeswConfig.prototype.save = function(config) {
	var force = "no";

	if((config.modeProcess == "switch") || (config.modeProcess == "switched"))
		force = "yes";
	
	var preferences = {
		'type': "ms",
		'name': config.name,
		'event': config.modeProcess,
		'action': config.modeAction,
		'mode': config.modeName, 
		'force': force };
	
	return preferences;
}

//

ModeswConfig.prototype.handleModeData = function(data) {
	if(data.modesConfig != undefined) {
		this.modesList.clear();

		this.modesList.push({'label': "All Normal Modes", 'value': "All Normal Modes", 'type': "alln"});  	
		this.modesList.push({'label': "All Modifier Modes", 'value': "All Modifier Modes", 'type': "allm"});  	
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

		if(event.value == "lock") {
			event.model.modeActionRow = "last";
			event.model.modeModeDisplay = "none";
		}
		else {
			event.model.modeActionRow = "";
			event.model.modeModeDisplay = "block";

			for(var i = 0; i < this.modesList.length; i++) {
				if(event.value == "start") {
					if((this.modesList[i].type != "current") && (this.modesList[i].type != "default") &&
						(this.modesList[i].type != "alln")) 
					{
						if(this.controller.get("NameText").mojo.getValue() != this.modesList[i].value)
							this.choicesModeswModeSelector.push(this.modesList[i]);
					}
				}
				else if(event.value == "close") {
					if((this.modesList[i].type == "current") || (this.modesList[i].type == "modifier") ||
						(this.modesList[i].type == "allm"))
					{
						this.choicesModeswModeSelector.push(this.modesList[i]);
					}
				}
				else if(event.value == "trigger") {
					if((this.modesList[i].type != "current") && (this.modesList[i].type != "default")) {
						if(this.controller.get("NameText").mojo.getValue() != this.modesList[i].value)
							this.choicesModeswModeSelector.push(this.modesList[i]);
					}
				}
				else if(event.value == "require") {
					if(((this.modesList[i].type == "default") || this.modesList[i].type == "normal") || 
						(this.modesList[i].type == "modifier"))
					{
						this.choicesModeswModeSelector.push(this.modesList[i]);
					}
				}
			}		

			if(event.value == "start")
				event.model.modeName = "Previous Mode";
			else if(event.value == "close")
				event.model.modeName = "Current Mode";
			else if(event.value == "trigger")
				event.model.modeName = "Previous Mode";
			else if(event.value == "require")
				event.model.modeName = "Default Mode";
		}
		
		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("AppsList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
}

