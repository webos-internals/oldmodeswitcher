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

ModeswConfig.prototype.setup = function(sceneController) {
	this.controller = sceneController;

	this.choicesModeswProcessSelector = [
		{'label': "Before Mode Start", value: "start"},
		{'label': "Before Mode Close", value: "close"},
		{'label': "Before Mode Switch", value: "switch"},
		{'label': "After Mode Start", value: "started"},
		{'label': "After Mode Close", value: "closed"},
		{'label': "After Mode Switch", value: "switched"} ];  

	sceneController.setupWidget("ModeswProcessSelector", {'label': "Process", 
		'labelPlacement': "left", 'modelProperty': "modeProcess",
		'choices': this.choicesModeswProcessSelector});
	
	this.choicesModeswActionSelector = [
		{'label': "Start Mode", value: "start"},
		{'label': "Close Mode", value: "close"},
		{'label': "Trigger Mode", value: "trigger"},
		{'label': "Require Mode", value: "require"},
		{'label': "Disable Triggers", value: "lock"}];  

	sceneController.setupWidget("ModeswActionSelector", {'label': "Action", 
		'labelPlacement': "left", 'modelProperty': "modeAction",
		'choices': this.choicesModeswActionSelector});

	sceneController.setupWidget("ModeswModeSelector", {'label': "Mode", 
		'labelPlacement': "left", 'modelProperty': "modeName",
		'choices': this.choicesModeswModeSelector});

	// Listen for change event for action selector
	
	sceneController.listen(sceneController.get("AppsList"), Mojo.Event.propertyChange, 
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

	var appConfig = {
		'name': launchPoint.title,
		'modeProcess': "start", 
		'modeAction': "start", 
		'modeName': "Previous Mode",
		'modeActionRow': "",
		'modeModeDisplay': "block" };
	
	return appConfig;
}

//

ModeswConfig.prototype.load = function(appPreferences) {
	var row = "";
	var display = "block";

	this.choicesModeswModeSelector.clear();

	if(appPreferences.modeAction == "lock") {
		row = "last";
		display = "none";
	}
	else {
		for(var i = 0; i < this.modesList.length; i++) {
			if(appPreferences.action == "start") {
				if((this.modesList[i].type != "current") && (this.modesList[i].type != "default") &&
					(this.modesList[i].type != "alln") && (this.modesList[i].type != "allm")) 
				{
					this.choicesModeswModeSelector.push(this.modesList[i]);
				}
			}
			else if(appPreferences.action == "close") {
				if((this.modesList[i].type == "current") || (this.modesList[i].type == "modifier") ||
					(this.modesList[i].type == "allm"))
				{
					this.choicesModeswModeSelector.push(this.modesList[i]);
				}
			}
			else if(appPreferences.action == "trigger") {
				if((this.modesList[i].type != "current") && (this.modesList[i].type != "default")) {
					this.choicesModeswModeSelector.push(this.modesList[i]);
				}
			}
			else if(appPreferences.action == "require") {
				if((this.modesList[i].type == "default") || (this.modesList[i].type == "normal") || 
					(this.modesList[i].type == "modifier"))
				{
					this.choicesModeswModeSelector.push(this.modesList[i]);
				}
			}
		}
	}
	
	var appConfig = {
		'name': appPreferences.name,	
		'modeProcess': appPreferences.event, 
		'modeAction': appPreferences.action, 
		'modeName': appPreferences.mode,
		'modeActionRow': row,
		'modeModeDisplay': display };
	
	return appConfig;
}

ModeswConfig.prototype.save = function(appConfig) {
	var force = "no";

	if((appConfig.modeProcess == "switch") || (appConfig.modeProcess == "switched"))
		force = "yes";
	
	var appPreferences = {
		'type': "ms",
		'name': appConfig.name,
		'event': appConfig.modeProcess,
		'action': appConfig.modeAction,
		'mode': appConfig.modeName, 
		'force': force };
	
	return appPreferences;
}

//

ModeswConfig.prototype.handleModeData = function(modeData) {
	if(modeData.modesConfig != undefined) {
		this.modesList.clear();

		this.modesList.push({'label': "All Normal Modes", 'value': "All Normal Modes", 'type': "alln"});  	
		this.modesList.push({'label': "All Modifier Modes", 'value': "All Modifier Modes", 'type': "allm"});  	
		this.modesList.push({'label': "Current Mode", 'value': "Current Mode", 'type': "current"});  
		this.modesList.push({'label': "Previous Mode", 'value': "Previous Mode", 'type': "previous"});  
	
		for(var i = 0; i < modeData.modesConfig.length; i++) {
			this.modesList.push({
				'label': modeData.modesConfig[i].name, 
				'value': modeData.modesConfig[i].name, 
				'type': modeData.modesConfig[i].type});  
		}
	}
}

//

ModeswConfig.prototype.handleListChange = function(changeEvent) {
	if(changeEvent.property == "modeAction") {
		this.choicesModeswModeSelector.clear();

		if(changeEvent.value == "lock") {
			changeEvent.model.modeActionRow = "last";
			changeEvent.model.modeModeDisplay = "none";
		}
		else {
			changeEvent.model.modeActionRow = "";
			changeEvent.model.modeModeDisplay = "block";

			for(var i = 0; i < this.modesList.length; i++) {
				if(changeEvent.value == "start") {
					if((this.modesList[i].type != "current") && (this.modesList[i].type != "default") &&
						(this.modesList[i].type != "alln")) 
					{
						if(this.controller.get("NameText").mojo.getValue() != this.modesList[i].value)
							this.choicesModeswModeSelector.push(this.modesList[i]);
					}
				}
				else if(changeEvent.value == "close") {
					if((this.modesList[i].type == "current") || (this.modesList[i].type == "modifier") ||
						(this.modesList[i].type == "allm"))
					{
						this.choicesModeswModeSelector.push(this.modesList[i]);
					}
				}
				else if(changeEvent.value == "trigger") {
					if((this.modesList[i].type != "current") && (this.modesList[i].type != "default")) {
						if(this.controller.get("NameText").mojo.getValue() != this.modesList[i].value)
							this.choicesModeswModeSelector.push(this.modesList[i]);
					}
				}
				else if(changeEvent.value == "require") {
					if(((this.modesList[i].type == "default") || this.modesList[i].type == "normal") || 
						(this.modesList[i].type == "modifier"))
					{
						this.choicesModeswModeSelector.push(this.modesList[i]);
					}
				}
			}		

			if(changeEvent.value == "start")
				changeEvent.model.modeName = "Previous Mode";
			else if(changeEvent.value == "close")
				changeEvent.model.modeName = "Current Mode";
			else if(changeEvent.value == "trigger")
				changeEvent.model.modeName = "Previous Mode";
			else if(changeEvent.value == "require")
				changeEvent.model.modeName = "Default Mode";
		}
		
		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("AppsList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
}

