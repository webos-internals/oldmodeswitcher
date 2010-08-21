function RingerConfig() {
}

RingerConfig.prototype.version = function() {
	return "1.1";
}

//

RingerConfig.prototype.label = function() {
	return "Ringer Settings";
}

//

RingerConfig.prototype.activate = function() {
}

RingerConfig.prototype.deactivate = function() {
}

//

RingerConfig.prototype.setup = function(controller) {
	this.controller = controller;

	this.choicesRingerOnSelector = [
		{'label': controller.defaultChoiseLabel, 'value': -1},		
		{'label': "Sound & Vibrate", 'value': 1},
		{'label': "Sound Only", 'value': 0} ];  

	controller.setupWidget("RingerOnSelector", {'label': "Ringer On", 
		'labelPlacement': "left", 'modelProperty': "ringerRingerOn",
		'choices': this.choicesRingerOnSelector});

	this.choicesRingerOffSelector = [
		{'label': controller.defaultChoiseLabel, 'value': -1},
		{'label': "Vibrate", 'value': 1},
		{'label': "Mute", 'value': 0}];  

	controller.setupWidget("RingerOffSelector", {'label': "Ringer Off", 
		'labelPlacement': "left", 'modelProperty': "ringerRingerOff",
		'choices': this.choicesRingerOffSelector});

	this.choicesRingerRingtone = [
		{'label': controller.defaultChoiseLabel, 'value': ""},
		{'label': "Select", 'value': "select"} ];  

	controller.setupWidget("RingerRingtoneSelector", {'label': "Ringtone", 
		'labelPlacement': "left", 'modelProperty': "ringerRingtoneName",
		'choices': this.choicesRingerRingtone});
		
	// Listen for change event for ringtone selector
	
	controller.listen(controller.get("SettingsList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

RingerConfig.prototype.config = function() {
	var config = {
		'ringerRingerOn': -1, 
		'ringerRingerOff': -1, 
		'ringerRingtoneName': "", 
		'ringerRingtonePath': "" };
	
	return config;
}

//

RingerConfig.prototype.load = function(preferences) {
	var config = this.config();
	
	if(preferences.ringerRingerOn != undefined)
		config.ringerRingerOn = preferences.ringerRingerOn;

	if(preferences.ringerRingerOff != undefined)
		config.ringerRingerOff = preferences.ringerRingerOff;

	if(preferences.ringerRingtone != undefined) {
		config.ringerRingtoneName = preferences.ringerRingtone.name;
		config.ringerRingtonePath = preferences.ringerRingtone.path;
	}
	
	return config;
}

RingerConfig.prototype.save = function(config) {
	var preferences = {};
	
	if(config.ringerRingerOn != -1)
		preferences.ringerRingerOn = config.ringerRingerOn;

	if(config.ringerRingerOff != -1)
		preferences.ringerRingerOff = config.ringerRingerOff;

	if(config.ringerRingtoneName.length != 0) {
		preferences.ringerRingtone = {
			'name': config.ringerRingtoneName,
			'path': config.ringerRingtonePath };
	}

	return preferences;
}

//

RingerConfig.prototype.handleListChange = function(event) {
	if(event.property == "ringerRingtoneName") {
		event.model.ringerRingtoneName = "";		
		event.model.ringerRingtonePath = "";		

		this.controller.modelChanged(event.model, this);

		if(event.value == "select") {
			this.executeRingerSelect(event.model);
		}
	}	
}

//

RingerConfig.prototype.executeRingerSelect = function(config) {
	Mojo.FilePicker.pickFile({'defaultKind': "ringtone", 'kinds': ["ringtone"], 
		'actionType': "attach", 'actionName': "Done", 'onSelect': 
			function(config, payload) {
				config.ringerRingtoneName = payload.name;
				config.ringerRingtonePath = payload.fullPath;
				
				this.controller.modelChanged(config, this);	
			}.bind(this, config)},
		this.controller.stageController);
}

