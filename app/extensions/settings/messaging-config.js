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

MessagingConfig.prototype.setup = function(controller) {
	this.controller = controller;
	
	this.choicesMsgAlertSelector = [
		{'label': controller.defaultChoiseLabel, 'value': -1},
		{'label': "Vibrate", 'value': 3},
		{'label': "System Sound", 'value': 1},
		{'label': "Ringtone", 'value': 2},
		{'label': "Mute", 'value': 0} ];  

	controller.setupWidget("MessagingAlertSelector", {'label': "Msg Alert", 
		'labelPlacement': "left", 'modelProperty': "messagingAlert",
		'choices': this.choicesMsgAlertSelector});

	this.choicesMsgRingtoneSelector = [
		{'label': controller.defaultChoiseLabel, 'value': ""},
		{'label': "Select", 'value': "select"} ];  

	controller.setupWidget("MessagingRingtoneSelector", {'label': "Ringtone", 
		'labelPlacement': "left", 'modelProperty': "messagingRingtoneName",
		'choices': this.choicesMsgRingtoneSelector});

/*		{'label': "Set Per Account", 'value': -2},*/

	this.choicesIMStatusSelector = [
		{'label': controller.defaultChoiseLabel, 'value': -1},
		{'label': "Available", 'value': 0},
		{'label': "Busy", 'value': 2},
		{'label': "Sign Off", 'value': 4} ];

	controller.setupWidget("MessagingIMStatusSelector", {'label': "IM Status", 
		'labelPlacement': "left", 'modelProperty': "messagingIMStatus",
		'choices': this.choicesIMStatusSelector});

	// Listen for change event for ringtone selector
	
	Mojo.Event.listen(controller.get("SettingsList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

MessagingConfig.prototype.config = function() {
	var config = {
		'messagingAlert': -1, 
		'messagingRingtoneName': "", 
		'messagingRingtonePath': "",
		'messagingIMStatus': -1,
		'messagingIMStatusCfg': [],
		'messagingRingtoneDisplay': "none" };
	
	return config;
}

//

MessagingConfig.prototype.load = function(preferences) {
	var config = this.config();
	
	if(preferences.messagingAlert != undefined)
		config.messagingAlert = preferences.messagingAlert;

	if(preferences.messagingAlert == 2)
		config.messagingRingtoneDisplay = "block";

	if(preferences.messagingRingtone != undefined) {
		config.messagingRingtoneName = preferences.messagingRingtone.name;
		config.messagingRingtonePath = preferences.messagingRingtone.path;
	}
	
	if(preferences.messagingIMStatusCfg != undefined) {
		config.messagingIMStatus = "Per Account";

		config.messagingIMStatusCfg = preferences.messagingIMStatusCfg;	
	}
	else if(preferences.messagingIMStatus != undefined)
		config.messagingIMStatus = preferences.messagingIMStatus;
		
	return config;
}

MessagingConfig.prototype.save = function(config) {
	var preferences = {};

	if(config.messagingAlert != -1)
		preferences.messagingAlert = config.messagingAlert;

	if(config.messagingAlert == 2) {
		if(config.messagingRingtoneName.length != 0) {
			preferences.messagingRingtone = {
				'name': config.messagingRingtoneName, 
				'path': config.messagingRingtonePath };
		}
	}

	if(config.messagingIMStatus == "Per Account")
		preferences.messagingIMStatusCfg = config.messagingIMStatusCfg;
	else if(config.messagingIMStatus != -1)
		preferences.messagingIMStatus = config.messagingIMStatus;
	
	return preferences;
}

//

MessagingConfig.prototype.handleListChange = function(event) {
	if(event.property == "messagingAlert") {
		event.model.messagingRingtoneDisplay = "none";
		
		if(event.value == 2)
			event.model.messagingRingtoneDisplay = "block";

		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("SettingsList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
	else if(event.property == "messagingRingtoneName") {
		event.model.messagingRingtoneName = "";		
		event.model.messagingRingtonePath = "";		
		
		this.controller.modelChanged(event.model, this);

		if(event.value == "select") {
			this.executeRingtoneSelect(event.model);
		}
	}
	else if(event.property == "messagingIMStatus") {
		if(event.value == -2) {
			var callback = this.handlePerAccount.bind(this, event.model);

			if(event.model.messagingIMStatusCfg.length > 0)
				event.model.messagingIMStatus = "Per Account";		
			else
				event.model.messagingIMStatus = -1;

			this.controller.modelChanged(event.model, this);

			this.controller.stageController.pushScene("scene", "imStatus", 
				this.controller.defaultChoiseLabel, event.model.messagingIMStatusCfg, callback);
		}
		else if(event.model.messagingIMStatusCfg)
			event.model.messagingIMStatusCfg.clear();
	}
}

//

MessagingConfig.prototype.executeRingtoneSelect = function(config) {
	Mojo.FilePicker.pickFile({'defaultKind': "ringtone", 'kinds': ["ringtone"], 
		'actionType': "attach", 'actionName': "Done", 'onSelect': 
			function(config, payload) {
				config.messagingRingtoneName = payload.name;
				config.messagingRingtonePath = payload.fullPath;
				
				this.controller.modelChanged(config, this);
			}.bind(this, config)},
		this.controller.stageController);
}

//

MessagingConfig.prototype.handlePerAccount = function(model, config, returnValue) {
	if((returnValue) && (config.length > 0)) {
		model.messagingIMStatus = "Per Account";
		
		model.messagingIMStatusCfg.clear();
		
		for(var i = 0; i < config.length; i++) {
			if(config[i].messagingIMStatus != -1)
				model.messagingIMStatusCfg.push(config[i]);
		}
		
		if(model.messagingIMStatusCfg.length == 0)
			model.messagingIMStatus = -1;
	}
	
	this.controller.modelChanged(model, this);
}

