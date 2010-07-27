function EmailConfig() {
}

EmailConfig.prototype.version = function() {
	return "1.0";
}

//

EmailConfig.prototype.label = function() {
	return "Email Settings";
}

//

EmailConfig.prototype.setup = function(controller) {
	this.controller = controller;

	this.choicesEmailAlertSelector = [
		{'label': controller.defaultChoiseLabel, 'value': -1},
		{'label': "Vibrate", 'value': 2},
		{'label': "System Sound", 'value': 1},
		{'label': "Ringtone", 'value': 3},
		{'label': "Mute", 'value': 0} ];  

	controller.setupWidget("EmailAlertSelector", {'label': "Alert", 
		'labelPlacement': "left", 'modelProperty': "emailAlert",
		'choices': this.choicesEmailAlertSelector});

	this.choicesEmailRingtoneSelector = [
		{'label': controller.defaultChoiseLabel, 'value': ""},
		{'label': "Select", 'value': "select"} ];  

	controller.setupWidget("EmailRingtoneSelector", {'label': "Ringtone", 
		'labelPlacement': "left", 'modelProperty': "emailRingtoneName",
		'choices': this.choicesEmailRingtoneSelector});

	this.choicesEmailSyncSelector = [
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
	
	Mojo.Event.listen(controller.get("SettingsList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

EmailConfig.prototype.config = function() {
	var config = {
		'emailAlert': -1, 
		'emailRingtoneName': "", 
		'emailRingtonePath': "",
		'emailSync': -1 };
	
	return config;
}

//

EmailConfig.prototype.load = function(preferences) {
	var config = this.config();
	
	if(preferences.emailAlert != undefined)
		config.emailAlert = preferences.emailAlert;

	if(preferences.emailRingtone != undefined) {
		config.emailRingtoneName = preferences.emailRingtone.name; 
		config.emailRingtonePath = preferences.emailRingtone.path;
	}

	if(preferences.emailSync != undefined)
		config.emailSync = preferences.emailSync;
	
	return config;
}

EmailConfig.prototype.save = function(config) {
	var preferences = {};
	
	if(config.emailAlert != -1)
		preferences.emailAlert = config.emailAlert;
	
	if(config.emailRingtoneName.length != 0) {
		preferences.emailRingtone = {
			'name': config.emailRingtoneName, 
			'path': config.emailRingtonePath };
	}

	if(config.emailSync != -1)
		preferences.emailSync = config.emailSync;
	
	return preferences;
}

//

EmailConfig.prototype.handleListChange = function(event) {
	if(event.property == "emailRingtoneName") {
		event.model.emailRingtoneName = "";		
		event.model.emailRingtonePath = "";		
		
		this.controller.modelChanged(event.model, this);

		if(event.value == "select") {
			this.executeRingtoneSelect(event.model);
		}
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

