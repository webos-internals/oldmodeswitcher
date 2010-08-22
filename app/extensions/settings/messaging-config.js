function MessagingConfig() {
}

MessagingConfig.prototype.version = function() {
	return "1.1";
}

//

MessagingConfig.prototype.label = function() {
	return "Messaging Settings";
}

//

MessagingConfig.prototype.activate = function() {
}

MessagingConfig.prototype.deactivate = function() {
}

//

MessagingConfig.prototype.setup = function(sceneController) {
	this.controller = sceneController;
	
	this.choicesMsgAlertSelector = [
		{'label': sceneController.defaultChoiseLabel, 'value': -1},
		{'label': "Vibrate", 'value': 3},
		{'label': "System Sound", 'value': 1},
		{'label': "Ringtone", 'value': 2},
		{'label': "Mute", 'value': 0} ];  

	sceneController.setupWidget("MessagingAlertSelector", {'label': "Msg Alert", 
		'labelPlacement': "left", 'modelProperty': "messagingAlert",
		'choices': this.choicesMsgAlertSelector});

	this.choicesMsgRingtoneSelector = [
		{'label': sceneController.defaultChoiseLabel, 'value': ""},
		{'label': "Select", 'value': "select"} ];  

	sceneController.setupWidget("MessagingRingtoneSelector", {'label': "Ringtone", 
		'labelPlacement': "left", 'modelProperty': "messagingRingtoneName",
		'choices': this.choicesMsgRingtoneSelector});

/*		{'label': "Set Per Account", 'value': -2},*/

	this.choicesIMStatusSelector = [
		{'label': sceneController.defaultChoiseLabel, 'value': -1},
		{'label': "Available", 'value': 0},
		{'label': "Busy", 'value': 2},
		{'label': "Sign Off", 'value': 4} ];

	sceneController.setupWidget("MessagingIMStatusSelector", {'label': "IM Status", 
		'labelPlacement': "left", 'modelProperty': "messagingIMStatus",
		'choices': this.choicesIMStatusSelector});

	// Listen for change event for ringtone selector
	
	sceneController.listen(sceneController.get("SettingsList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

MessagingConfig.prototype.config = function() {
	var settingConfig = {
		'messagingAlert': -1, 
		'messagingRingtoneName': "", 
		'messagingRingtonePath': "",
		'messagingIMStatus': -1,
		'messagingIMStatusCfg': [],
		'messagingRingtoneDisplay': "none" };
	
	return settingConfig;
}

//

MessagingConfig.prototype.load = function(settingPreferences) {
	var settingConfig = this.config();
	
	if(settingPreferences.messagingAlert != undefined)
		settingConfig.messagingAlert = settingPreferences.messagingAlert;

	if(settingPreferences.messagingAlert == 2)
		settingConfig.messagingRingtoneDisplay = "block";

	if(settingPreferences.messagingRingtone != undefined) {
		settingConfig.messagingRingtoneName = settingPreferences.messagingRingtone.name;
		settingConfig.messagingRingtonePath = settingPreferences.messagingRingtone.path;
	}
	
	if(settingPreferences.messagingIMStatusCfg != undefined) {
		settingConfig.messagingIMStatus = "Per Account";

		settingConfig.messagingIMStatusCfg = settingPreferences.messagingIMStatusCfg;	
	}
	else if(settingPreferences.messagingIMStatus != undefined)
		settingConfig.messagingIMStatus = settingPreferences.messagingIMStatus;
		
	return settingConfig;
}

MessagingConfig.prototype.save = function(settingConfig) {
	var settingPreferences = {};

	if(settingConfig.messagingAlert != -1)
		settingPreferences.messagingAlert = settingConfig.messagingAlert;

	if(settingConfig.messagingAlert == 2) {
		if(settingConfig.messagingRingtoneName.length != 0) {
			settingPreferences.messagingRingtone = {
				'name': settingConfig.messagingRingtoneName, 
				'path': settingConfig.messagingRingtonePath };
		}
	}

	if(settingConfig.messagingIMStatus == "Per Account")
		settingPreferences.messagingIMStatusCfg = settingConfig.messagingIMStatusCfg;
	else if(settingConfig.messagingIMStatus != -1)
		settingPreferences.messagingIMStatus = settingConfig.messagingIMStatus;
	
	return settingPreferences;
}

//

MessagingConfig.prototype.handleListChange = function(changeEvent) {
	if(changeEvent.property == "messagingAlert") {
		changeEvent.model.messagingRingtoneDisplay = "none";
		
		if(changeEvent.value == 2)
			changeEvent.model.messagingRingtoneDisplay = "block";

		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("SettingsList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
	else if(changeEvent.property == "messagingRingtoneName") {
		changeEvent.model.messagingRingtoneName = "";		
		changeEvent.model.messagingRingtonePath = "";		
		
		this.controller.modelChanged(changeEvent.model, this);

		if(changeEvent.value == "select") {
			this.executeRingtoneSelect(changeEvent.model);
		}
	}
	else if(changeEvent.property == "messagingIMStatus") {
		if(changeEvent.value == -2) {
			var callback = this.handlePerAccount.bind(this, changeEvent.model);

			if(changeEvent.model.messagingIMStatusCfg.length > 0)
				changeEvent.model.messagingIMStatus = "Per Account";		
			else
				changeEvent.model.messagingIMStatus = -1;

			this.controller.modelChanged(changeEvent.model, this);

			this.controller.stageController.pushScene("scene", "imStatus", null, callback,
				this.controller.defaultChoiseLabel, changeEvent.model.messagingIMStatusCfg);
		}
		else if(changeEvent.model.messagingIMStatusCfg)
			changeEvent.model.messagingIMStatusCfg.clear();
	}
}

//

MessagingConfig.prototype.executeRingtoneSelect = function(eventModel) {
	Mojo.FilePicker.pickFile({'defaultKind': "ringtone", 'kinds': ["ringtone"], 
		'actionType': "attach", 'actionName': "Done", 'onSelect': 
			function(eventModel, serviceResponse) {
				eventModel.messagingRingtoneName = serviceResponse.name;
				eventModel.messagingRingtonePath = serviceResponse.fullPath;
				
				this.controller.modelChanged(eventModel, this);
			}.bind(this, eventModel)},
		this.controller.stageController);
}

//

MessagingConfig.prototype.handlePerAccount = function(eventModel, configList, returnValue) {
	if((returnValue) && (configList.length > 0)) {
		eventModel.messagingIMStatus = "Per Account";
		
		eventModel.messagingIMStatusCfg.clear();
		
		for(var i = 0; i < configList.length; i++) {
			if(configList[i].messagingIMStatus != -1)
				eventModel.messagingIMStatusCfg.push(configList[i]);
		}
		
		if(eventModel.messagingIMStatusCfg.length == 0)
			eventModel.messagingIMStatus = -1;
	}
	
	this.controller.modelChanged(eventModel, this);
}

