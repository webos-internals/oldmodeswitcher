function EmailConfig() {
}

EmailConfig.prototype.version = function() {
	return "1.1";
}

//

EmailConfig.prototype.label = function() {
	return $L("Email Settings");
}

//

EmailConfig.prototype.activate = function() {
}

EmailConfig.prototype.deactivate = function() {
}

//

EmailConfig.prototype.setup = function(sceneController) {
	this.controller = sceneController;

	this.choicesEmailAlertSelector = [
		{'label': $L("Set Per Account"), 'value': -2},
		{'label': sceneController.defaultChoiseLabel, 'value': -1},
		{'label': $L("Vibrate"), 'value': 2},
		{'label': $L("System Sound"), 'value': 1},
		{'label': $L("Ringtone"), 'value': 3},
		{'label': $L("Mute"), 'value': 0} ];  

	sceneController.setupWidget("EmailAlertSelector", {'label': $L("Alert"), 
		'labelPlacement': "left", 'modelProperty': "emailAlert",
		'choices': this.choicesEmailAlertSelector});

	this.choicesEmailRingtoneSelector = [
		{'label': $L("Set Per Account"), 'value': -2},
		{'label': sceneController.defaultChoiseLabel, 'value': ""},
		{'label': $L("Select"), 'value': "select"} ];  

	sceneController.setupWidget("EmailRingtoneSelector", {'label': $L("Ringtone"), 
		'labelPlacement': "left", 'modelProperty': "emailRingtoneName",
		'choices': this.choicesEmailRingtoneSelector});

	this.choicesEmailSyncSelector = [
		{'label': $L("Set Per Account"), 'value': -2},
		{'label': sceneController.defaultChoiseLabel, 'value': -1},
		{'label': $L("As Items Arrive"), 'value': 0}, 
		{'label': "5 " + $L("Minutes"), 'value': 5},
		{'label': "10 " + $L("Minutes"), 'value': 10},
		{'label': "15 " + $L("Minutes"), 'value': 15},
		{'label': "30 " + $L("Minutes"), 'value': 30},
		{'label': "1 " + $L("Hour"), 'value': 60},
		{'label': "6 " + $L("Hours"), 'value': 360},		
		{'label': "12 " + $L("Hours"), 'value': 720},
		{'label': "24 " + $L("Hours"), 'value': 1440},		
		{'label': $L("Manual"), 'value': 1000000} ];

	sceneController.setupWidget("EmailSyncSelector", {'label': $L("Get Email"), 
		'labelPlacement': "left", 'modelProperty': "emailSync",
		'choices': this.choicesEmailSyncSelector});

	// Listen for change event for ringtone selector
	
	sceneController.listen(sceneController.get("SettingsList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

EmailConfig.prototype.config = function() {
	var settingConfig = {
		'emailTitle': $L("Email"),
		'emailAlert': -1, 
		'emailAlertCfg': [],
		'emailRingtoneName': "", 
		'emailRingtonePath': "",
		'emailRingtoneCfg': [],
		'emailSync': -1,
		'emailSyncCfg': [],
		'emailRingtoneDisplay': "none" };
	
	return settingConfig;
}

//

EmailConfig.prototype.load = function(settingPreferences) {
	var settingConfig = this.config();
	
	if(settingPreferences.emailAlertCfg != undefined) {
		settingConfig.emailAlert = $L("Per Account");

		settingConfig.emailAlertCfg = settingPreferences.emailAlertCfg;	

		settingConfig.emailRingtoneDisplay = "block";
	}
	else if(settingPreferences.emailAlert != undefined)
		settingConfig.emailAlert = settingPreferences.emailAlert;

	if(settingPreferences.emailAlert == 3)
		settingConfig.emailRingtoneDisplay = "block";

	if(settingPreferences.emailRingtoneCfg != undefined) {
		settingConfig.emailRingtoneName = $L("Per Account");

		settingConfig.emailRingtoneCfg = settingPreferences.emailRingtoneCfg;	
	}
	else if(settingPreferences.emailRingtone != undefined) {
		settingConfig.emailRingtoneName = settingPreferences.emailRingtone.name; 
		settingConfig.emailRingtonePath = settingPreferences.emailRingtone.path;
	}

	if(settingPreferences.emailSyncCfg != undefined) {
		settingConfig.emailSync = $L("Per Account");

		settingConfig.emailSyncCfg = settingPreferences.emailSyncCfg;	
	}
	else if(settingPreferences.emailSync != undefined)
		settingConfig.emailSync = settingPreferences.emailSync;
	
	return settingConfig;
}

EmailConfig.prototype.save = function(settingConfig) {
	var settingPreferences = {};

	if(settingConfig.emailAlert == $L("Per Account"))
		settingPreferences.emailAlertCfg = settingConfig.emailAlertCfg;
	else if(settingConfig.emailAlert != -1)
		settingPreferences.emailAlert = settingConfig.emailAlert;

	if(settingConfig.emailRingtoneName == $L("Per Account"))
		settingPreferences.emailRingtoneCfg = settingConfig.emailRingtoneCfg;
	else {
		if(settingConfig.emailAlert == 3) {
			if(settingConfig.emailRingtoneName.length != 0) {
				settingPreferences.emailRingtone = {
					'name': settingConfig.emailRingtoneName, 
					'path': settingConfig.emailRingtonePath };
			}
		}
	}
		
	if(settingConfig.emailSync == $L("Per Account"))
		settingPreferences.emailSyncCfg = settingConfig.emailSyncCfg;
	else if(settingConfig.emailSync != -1)
		settingPreferences.emailSync = settingConfig.emailSync;
	
	return settingPreferences;
}

//

EmailConfig.prototype.handleListChange = function(changeEvent) {
	if(changeEvent.property == "emailAlert") {
		if(changeEvent.value == -2) {
			if(changeEvent.model.emailAlertCfg.length > 0)
				changeEvent.model.emailAlert = $L("Per Account");
			else {
				changeEvent.model.emailAlert = -1;
	
				changeEvent.model.emailRingtoneDisplay = "none";
			}
			
			var callback = this.handlePerAccountAlert.bind(this, changeEvent.model);
	
			this.controller.stageController.pushScene("scene", "emailAlert", null, callback,
				this.controller.defaultChoiseLabel, changeEvent.model.emailAlertCfg);
		}
		else {
			if(changeEvent.model.emailAlertCfg)
				changeEvent.model.emailAlertCfg.clear();

			changeEvent.model.emailRingtoneDisplay = "none";
		
			if(changeEvent.value == 3)
				changeEvent.model.emailRingtoneDisplay = "block";
		}
		
		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("SettingsList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
	else if(changeEvent.property == "emailRingtoneName") {
		if(changeEvent.value == -2) {
			if(changeEvent.model.emailRingtoneCfg.length > 0)
				changeEvent.model.emailRingtoneName = $L("Per Account");		
			else {
				changeEvent.model.emailRingtoneName = "";		
				changeEvent.model.emailRingtonePath = "";		
			}
		
			var callback = this.handlePerAccountRingtone.bind(this, changeEvent.model);
	
			this.controller.stageController.pushScene("scene", "emailRingtone", null, callback,
				this.controller.defaultChoiseLabel, changeEvent.model.emailRingtoneCfg);
		}
		else {
			if(changeEvent.model.emailRingtoneCfg)
				changeEvent.model.emailRingtoneCfg.clear();
			
			changeEvent.model.emailRingtoneName = "";		
			changeEvent.model.emailRingtonePath = "";		
		
			if(changeEvent.value == "select") {
				this.executeRingtoneSelect(changeEvent.model);
			}
		}
		
		this.controller.modelChanged(changeEvent.model, this);
	}
	else if(changeEvent.property == "emailSync") {
		if(changeEvent.value == -2) {
			if(changeEvent.model.emailSyncCfg.length > 0)
				changeEvent.model.emailSync = $L("Per Account");		
			else
				changeEvent.model.emailSync = -1;
			
			var callback = this.handlePerAccountSync.bind(this, changeEvent.model);
	
			this.controller.stageController.pushScene("scene", "emailSync", null, callback,
				this.controller.defaultChoiseLabel, changeEvent.model.emailSyncCfg);
		}
		else if(changeEvent.model.emailSyncCfg)
			changeEvent.model.emailSyncCfg.clear();

		this.controller.modelChanged(changeEvent.model, this);
	}	
}

//

EmailConfig.prototype.executeRingtoneSelect = function(eventModel) {
	Mojo.FilePicker.pickFile({'defaultKind': "ringtone", 'kinds': ["ringtone"], 
		'actionType': "attach", 'actionName': $L("Done"), 'onSelect': 
			function(eventModel, serviceResponse) {
				eventModel.emailRingtoneName = serviceResponse.name;
				eventModel.emailRingtonePath = serviceResponse.fullPath;
				
				this.controller.modelChanged(eventModel, this);
			}.bind(this, eventModel)},
		this.controller.stageController);
}

//

EmailConfig.prototype.handlePerAccountAlert = function(eventModel, configList, returnValue) {
	if(returnValue) {
		eventModel.emailAlert = $L("Per Account");		

		eventModel.emailAlertCfg.clear();
		
		for(var i = 0; i < configList.length; i++) {
			if(configList[i].emailAlert != -1)
				eventModel.emailAlertCfg.push(configList[i]);
		}
		
		if(eventModel.emailAlertCfg.length == 0)
			eventModel.emailAlert = -1;
		
		eventModel.emailRingtoneDisplay = "block";

		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("SettingsList").mojo.invalidateItems(0);

		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
}

EmailConfig.prototype.handlePerAccountRingtone = function(eventModel, configList, returnValue) {
	if(returnValue) {
		eventModel.emailRingtoneName = $L("Per Account");		

		eventModel.emailRingtoneCfg.clear();
		
		for(var i = 0; i < configList.length; i++) {
			if(configList[i].emailRingtone.name != "")
				eventModel.emailRingtoneCfg.push(configList[i]);
		}
		
		if(eventModel.emailRingtoneCfg.length == 0)
			eventModel.emailRingtoneName = "";

		this.controller.modelChanged(eventModel, this);
	}
}

EmailConfig.prototype.handlePerAccountSync = function(eventModel, configList, returnValue) {
	if(returnValue) {
		eventModel.emailSync = $L("Per Account");		

		eventModel.emailSyncCfg.clear();
		
		for(var i = 0; i < configList.length; i++) {
			if(configList[i].emailSync != -1)
				eventModel.emailSyncCfg.push(configList[i]);
		}

		if(eventModel.emailSyncCfg.length == 0)
			eventModel.emailSync = -1;

		this.controller.modelChanged(eventModel, this);
	}
}

