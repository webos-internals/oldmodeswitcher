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

RingerConfig.prototype.setup = function(sceneController) {
	this.controller = sceneController;

	this.choicesRingerOnSelector = [
		{'label': sceneController.defaultChoiseLabel, 'value': -1},		
		{'label': "Sound & Vibrate", 'value': 1},
		{'label': "Sound Only", 'value': 0} ];  

	sceneController.setupWidget("RingerOnSelector", {'label': "Ringer On", 
		'labelPlacement': "left", 'modelProperty': "ringerRingerOn",
		'choices': this.choicesRingerOnSelector});

	this.choicesRingerOffSelector = [
		{'label': sceneController.defaultChoiseLabel, 'value': -1},
		{'label': "Vibrate", 'value': 1},
		{'label': "Mute", 'value': 0}];  

	sceneController.setupWidget("RingerOffSelector", {'label': "Ringer Off", 
		'labelPlacement': "left", 'modelProperty': "ringerRingerOff",
		'choices': this.choicesRingerOffSelector});

	this.choicesRingerRingtone = [
		{'label': sceneController.defaultChoiseLabel, 'value': ""},
		{'label': "Select", 'value': "select"} ];  

	sceneController.setupWidget("RingerRingtoneSelector", {'label': "Ringtone", 
		'labelPlacement': "left", 'modelProperty': "ringerRingtoneName",
		'choices': this.choicesRingerRingtone});
		
	// Listen for change event for ringtone selector
	
	sceneController.listen(sceneController.get("SettingsList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

RingerConfig.prototype.config = function() {
	var settingConfig = {
		'ringerRingerOn': -1, 
		'ringerRingerOff': -1, 
		'ringerRingtoneName': "", 
		'ringerRingtonePath': "" };
	
	return settingConfig;
}

//

RingerConfig.prototype.load = function(settingPreferences) {
	var settingConfig = this.config();
	
	if(settingPreferences.ringerRingerOn != undefined)
		settingConfig.ringerRingerOn = settingPreferences.ringerRingerOn;

	if(settingPreferences.ringerRingerOff != undefined)
		settingConfig.ringerRingerOff = settingPreferences.ringerRingerOff;

	if(settingPreferences.ringerRingtone != undefined) {
		settingConfig.ringerRingtoneName = settingPreferences.ringerRingtone.name;
		settingConfig.ringerRingtonePath = settingPreferences.ringerRingtone.path;
	}
	
	return settingConfig;
}

RingerConfig.prototype.save = function(settingConfig) {
	var settingPreferences = {};
	
	if(settingConfig.ringerRingerOn != -1)
		settingPreferences.ringerRingerOn = settingConfig.ringerRingerOn;

	if(settingConfig.ringerRingerOff != -1)
		settingPreferences.ringerRingerOff = settingConfig.ringerRingerOff;

	if(settingConfig.ringerRingtoneName.length != 0) {
		settingPreferences.ringerRingtone = {
			'name': settingConfig.ringerRingtoneName,
			'path': settingConfig.ringerRingtonePath };
	}

	return settingPreferences;
}

//

RingerConfig.prototype.handleListChange = function(changeEvent) {
	if(changeEvent.property == "ringerRingtoneName") {
		changeEvent.model.ringerRingtoneName = "";		
		changeEvent.model.ringerRingtonePath = "";		

		this.controller.modelChanged(changeEvent.model, this);

		if(changeEvent.value == "select") {
			this.executeRingerSelect(changeEvent.model);
		}
	}	
}

//

RingerConfig.prototype.executeRingerSelect = function(eventModel) {
	Mojo.FilePicker.pickFile({'defaultKind': "ringtone", 'kinds': ["ringtone"], 
		'actionType': "attach", 'actionName': "Done", 'onSelect': 
			function(eventModel, serviceResponse) {
				eventModel.ringerRingtoneName = serviceResponse.name;
				eventModel.ringerRingtonePath = serviceResponse.fullPath;
				
				this.controller.modelChanged(eventModel, this);	
			}.bind(this, eventModel)},
		this.controller.stageController);
}

