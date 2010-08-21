function EmailConfig() {
}

EmailConfig.prototype.version = function() {
	return "1.1";
}

//

EmailConfig.prototype.label = function() {
	return "Email Settings";
}

//

EmailConfig.prototype.activate = function() {
}

EmailConfig.prototype.deactivate = function() {
}

//

EmailConfig.prototype.setup = function(controller) {
	this.controller = controller;

	this.choicesEmailAlertSelector = [
		{'label': "Set Per Account", 'value': -2},
		{'label': controller.defaultChoiseLabel, 'value': -1},
		{'label': "Vibrate", 'value': 2},
		{'label': "System Sound", 'value': 1},
		{'label': "Ringtone", 'value': 3},
		{'label': "Mute", 'value': 0} ];  

	controller.setupWidget("EmailAlertSelector", {'label': "Alert", 
		'labelPlacement': "left", 'modelProperty': "emailAlert",
		'choices': this.choicesEmailAlertSelector});

	this.choicesEmailRingtoneSelector = [
		{'label': "Set Per Account", 'value': -2},
		{'label': controller.defaultChoiseLabel, 'value': ""},
		{'label': "Select", 'value': "select"} ];  

	controller.setupWidget("EmailRingtoneSelector", {'label': "Ringtone", 
		'labelPlacement': "left", 'modelProperty': "emailRingtoneName",
		'choices': this.choicesEmailRingtoneSelector});

	this.choicesEmailSyncSelector = [
		{'label': "Set Per Account", 'value': -2},
		{'label': controller.defaultChoiseLabel, 'value': -1},
		{'label': "As Items Arrive", 'value': 0}, 
		{'label': "5 Minutes", 'value': 5},
		{'label': "10 Minutes", 'value': 10},
		{'label': "15 Minutes", 'value': 15},
		{'label': "30 Minutes", 'value': 30},
		{'label': "1 Hour", 'value': 60},
		{'label': "6 Hours", 'value': 360},		
		{'label': "12 Hours", 'value': 720},
		{'label': "24 Hours", 'value': 1440},		
		{'label': "Manual", 'value': 1000000} ];

	controller.setupWidget("EmailSyncSelector", {'label': "Get Email", 
		'labelPlacement': "left", 'modelProperty': "emailSync",
		'choices': this.choicesEmailSyncSelector});

	// Listen for change event for ringtone selector
	
	controller.listen(controller.get("SettingsList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

EmailConfig.prototype.config = function() {
	var config = {
		'emailAlert': -1, 
		'emailAlertCfg': [],
		'emailRingtoneName': "", 
		'emailRingtonePath': "",
		'emailRingtoneCfg': [],
		'emailSync': -1,
		'emailSyncCfg': [],
		'emailRingtoneDisplay': "none" };
	
	return config;
}

//

EmailConfig.prototype.load = function(preferences) {
	var config = this.config();
	
	if(preferences.emailAlertCfg != undefined) {
		config.emailAlert = "Per Account";

		config.emailAlertCfg = preferences.emailAlertCfg;	

		config.emailRingtoneDisplay = "block";
	}
	else if(preferences.emailAlert != undefined)
		config.emailAlert = preferences.emailAlert;

	if(preferences.emailAlert == 3)
		config.emailRingtoneDisplay = "block";

	if(preferences.emailRingtoneCfg != undefined) {
		config.emailRingtoneName = "Per Account";

		config.emailRingtoneCfg = preferences.emailRingtoneCfg;	
	}
	else if(preferences.emailRingtone != undefined) {
		config.emailRingtoneName = preferences.emailRingtone.name; 
		config.emailRingtonePath = preferences.emailRingtone.path;
	}

	if(preferences.emailSyncCfg != undefined) {
		config.emailSync = "Per Account";

		config.emailSyncCfg = preferences.emailSyncCfg;	
	}
	else if(preferences.emailSync != undefined)
		config.emailSync = preferences.emailSync;
	
	return config;
}

EmailConfig.prototype.save = function(config) {
	var preferences = {};

	if(config.emailAlert == "Per Account")
		preferences.emailAlertCfg = config.emailAlertCfg;
	else if(config.emailAlert != -1)
		preferences.emailAlert = config.emailAlert;

	if(config.emailRingtoneName == "Per Account")
		preferences.emailRingtoneCfg = config.emailRingtoneCfg;
	else {
		if(config.emailAlert == 3) {
			if(config.emailRingtoneName.length != 0) {
				preferences.emailRingtone = {
					'name': config.emailRingtoneName, 
					'path': config.emailRingtonePath };
			}
		}
	}
		
	if(config.emailSync == "Per Account")
		preferences.emailSyncCfg = config.emailSyncCfg;
	else if(config.emailSync != -1)
		preferences.emailSync = config.emailSync;
	
	return preferences;
}

//

EmailConfig.prototype.handleListChange = function(event) {
	if(event.property == "emailAlert") {
		if(event.value == -2) {
			if(event.model.emailAlertCfg.length > 0)
				event.model.emailAlert = "Per Account";
			else {
				event.model.emailAlert = -1;
	
				event.model.emailRingtoneDisplay = "none";
			}
			
			var callback = this.handlePerAccountAlert.bind(this, event.model);
	
			this.controller.stageController.pushScene("scene", "emailAlert", null, callback,
				this.controller.defaultChoiseLabel, event.model.emailAlertCfg);
		}
		else {
			if(event.model.emailAlertCfg)
				event.model.emailAlertCfg.clear();

			event.model.emailRingtoneDisplay = "none";
		
			if(event.value == 3)
				event.model.emailRingtoneDisplay = "block";
		}
		
		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("SettingsList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
	else if(event.property == "emailRingtoneName") {
		if(event.value == -2) {
			if(event.model.emailRingtoneCfg.length > 0)
				event.model.emailRingtoneName = "Per Account";		
			else {
				event.model.emailRingtoneName = "";		
				event.model.emailRingtonePath = "";		
			}
		
			var callback = this.handlePerAccountRingtone.bind(this, event.model);
	
			this.controller.stageController.pushScene("scene", "emailRingtone", null, callback,
				this.controller.defaultChoiseLabel, event.model.emailRingtoneCfg);
		}
		else {
			if(event.model.emailRingtoneCfg)
				event.model.emailRingtoneCfg.clear();
			
			event.model.emailRingtoneName = "";		
			event.model.emailRingtonePath = "";		
		
			if(event.value == "select") {
				this.executeRingtoneSelect(event.model);
			}
		}
		
		this.controller.modelChanged(event.model, this);
	}
	else if(event.property == "emailSync") {
		if(event.value == -2) {
			if(event.model.emailSyncCfg.length > 0)
				event.model.emailSync = "Per Account";		
			else
				event.model.emailSync = -1;
			
			var callback = this.handlePerAccountSync.bind(this, event.model);
	
			this.controller.stageController.pushScene("scene", "emailSync", null, callback,
				this.controller.defaultChoiseLabel, event.model.emailSyncCfg);
		}
		else if(event.model.emailSyncCfg)
			event.model.emailSyncCfg.clear();

		this.controller.modelChanged(event.model, this);
	}	
}

//

EmailConfig.prototype.executeRingtoneSelect = function(config) {
	Mojo.FilePicker.pickFile({'defaultKind': "ringtone", 'kinds': ["ringtone"], 
		'actionType': "attach", 'actionName': "Done", 'onSelect': 
			function(config, payload) {
				config.emailRingtoneName = payload.name;
				config.emailRingtonePath = payload.fullPath;
				
				this.controller.modelChanged(config, this);
			}.bind(this, config)},
		this.controller.stageController);
}

//

EmailConfig.prototype.handlePerAccountAlert = function(model, config, returnValue) {
	if(returnValue) {
		model.emailAlert = "Per Account";		

		model.emailAlertCfg.clear();
		
		for(var i = 0; i < config.length; i++) {
			if(config[i].emailAlert != -1)
				model.emailAlertCfg.push(config[i]);
		}
		
		if(model.emailAlertCfg.length == 0)
			model.emailAlert = -1;
		
		model.emailRingtoneDisplay = "block";

		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("SettingsList").mojo.invalidateItems(0);

		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
}

EmailConfig.prototype.handlePerAccountRingtone = function(model, config, returnValue) {
	if(returnValue) {
		model.emailRingtoneName = "Per Account";		

		model.emailRingtoneCfg.clear();
		
		for(var i = 0; i < config.length; i++) {
			if(config[i].emailRingtone.name != "")
				model.emailRingtoneCfg.push(config[i]);
		}
		
		if(model.emailRingtoneCfg.length == 0)
			model.emailRingtoneName = "";

		this.controller.modelChanged(model, this);
	}
}

EmailConfig.prototype.handlePerAccountSync = function(model, config, returnValue) {
	if(returnValue) {
		model.emailSync = "Per Account";		

		model.emailSyncCfg.clear();
		
		for(var i = 0; i < config.length; i++) {
			if(config[i].emailSync != -1)
				model.emailSyncCfg.push(config[i]);
		}

		if(model.emailSyncCfg.length == 0)
			model.emailSync = -1;

		this.controller.modelChanged(model, this);
	}
}

