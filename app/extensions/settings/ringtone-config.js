function RingtoneConfig() {
}

//

RingtoneConfig.prototype.label = function() {
	return "Ringer Settings";
}

//

RingtoneConfig.prototype.setup = function(controller) {
	// Ringer on, ringer off and ringtone selectors

	this.controller = controller;

	this.choicesRingerOnSelector = [
		{'label': "Do Not Set", 'value': 0},		
		{'label': "Sound & Vibrate", 'value': 1},
		{'label': "Sound Only", 'value': 2}];  

	controller.setupWidget("RingerOnSelector", {'label': "Ringer On", 
		'labelPlacement': "left", 'modelProperty': "ringerRingerOn",
		'choices': this.choicesRingerOnSelector});

	this.choicesRingerOffSelector = [
		{'label': "Do Not Set", 'value': 0},
		{'label': "Vibrate", 'value': 1},
		{'label': "Mute", 'value': 2}];  

	controller.setupWidget("RingerOffSelector", {'label': "Ringer Off", 
		'labelPlacement': "left", 'modelProperty': "ringerRingerOff",
		'choices': this.choicesRingerOffSelector});

	// Listen for tap event for ringtone selector
	
	Mojo.Event.listen(controller.get("SettingsList"), Mojo.Event.listTap, 
		this.handleListTap.bind(this));
}

//

RingtoneConfig.prototype.load = function(preferences) {
	var config = {
		'ringerRingerOn': preferences.ringerRingerOn,
		'ringerRingerOff': preferences.ringerRingerOff, 
		'ringerRingtoneName': preferences.ringerRingtoneName, 
		'ringerRingtonePath': preferences.ringerRingtonePath };
	
	return config;
}

RingtoneConfig.prototype.save = function(config) {
	var preferences = {
		'ringerRingerOn': config.ringerRingerOn,
		'ringerRingerOff': config.ringerRingerOff, 
		'ringerRingtoneName': config.ringerRingtoneName, 
		'ringerRingtonePath': config.ringerRingtonePath };
	
	return preferences;
}

//

RingtoneConfig.prototype.config = function() {
	var config = {
		'ringerRingerOn': 0, 
		'ringerRingerOff': 0, 
		'ringerRingtoneName': "Do Not Set*", 
		'ringerRingtonePath': "" };
	
	return config;
}

//

RingtoneConfig.prototype.handleListTap = function(event) {
	if(event.model.ringtone != undefined) {
		if(event.originalEvent.target.id == "RingtoneSelect") {
			this.executeRingtoneSelect(event.model.ringtone[0]);
		}
	}	
}

//

RingtoneConfig.prototype.executeRingtoneSelect = function(config) {
	Mojo.FilePicker.pickFile({'defaultKind': "ringtone", 'kinds': ["ringtone"], 
		'actionType': "attach", 'actionName': "Done", 'onSelect': 
			function(config, payload) {
				config.ringerRingtoneName = payload.name;
				config.ringerRingtonePath = payload.fullPath;
				
				this.controller.get("SettingsList").mojo.invalidateItems(0);
			}.bind(this, config)},
		this.controller.stageController);
}

