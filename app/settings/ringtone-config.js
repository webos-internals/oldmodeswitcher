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
		{'label': "Sound & Vibrate", 'value': 1},
		{'label': "Sound Only", 'value': 2}];  

	controller.setupWidget("RingerOnSelector", {'label': "Ringer On", 
		'labelPlacement': "left", 'modelProperty': "ringerRingerOn",
		'choices': this.choicesRingerOnSelector});

	this.choicesRingerOffSelector = [
		{'label': "Vibrate", 'value': 1},
		{'label': "Mute", 'value': 2}];  

	controller.setupWidget("RingerOffSelector", {'label': "Ringer Off", 
		'labelPlacement': "left", 'modelProperty': "ringerRingerOff",
		'choices': this.choicesRingerOffSelector});
}

//

RingtoneConfig.prototype.load = function(config, preferences) {
	config.push({'ringerRingerOn': preferences.ringerRingerOn,
		'ringerRingerOff': preferences.ringerRingerOff, 
		'ringerRingtoneName': preferences.ringerRingtoneName, 
		'ringerRingtonePath': preferences.ringerRingtonePath});
}

RingtoneConfig.prototype.save = function(config, preferences) {
	preferences.push({'ringerRingerOn': config.ringerRingerOn,
		'ringerRingerOff': config.ringerRingerOff, 
		'ringerRingtoneName': config.ringerRingtoneName, 
		'ringerRingtonePath': config.ringerRingtonePath});
}

//

RingtoneConfig.prototype.append = function(config, saveCallback) {
	config.push({'ringerRingerOn': "(querying)", 'ringerRingerOff': "(querying)", 
		'ringerRingtoneName': "(querying)", 'ringerRingtonePath': ""});
	
	saveCallback();
}

RingtoneConfig.prototype.remove = function(config, index, saveCallback) {
	config.splice(index,1);

	saveCallback();
}

//

RingtoneConfig.prototype.changed = function(config, event, saveCallback) {
	saveCallback();
}

RingtoneConfig.prototype.tapped = function(config, event, saveCallback) {
	if(event.target.id == "Ringtone") {
		this.executeRingtoneSelect(config, saveCallback);
	}
}

//

RingtoneConfig.prototype.executeRingtoneSelect = function(config, saveCallback) {
	Mojo.FilePicker.pickFile({'defaultKind': "ringtone", 'kinds': ["ringtone"], 
		'actionType': "attach", 'actionName': "Done", 'onSelect': 
			function(config, saveCallback, payload) {
				config.ringerRingtoneName = payload.name;
				config.ringerRingtonePath = payload.fullPath;
				
				saveCallback();
			}.bind(this, config, saveCallback)},
		this.controller.stageController);
}

