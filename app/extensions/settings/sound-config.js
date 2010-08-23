function SoundConfig() {
}

SoundConfig.prototype.version = function() {
	return "1.1";
}

//

SoundConfig.prototype.label = function() {
	return $L("Sound Settings");
}

//

SoundConfig.prototype.activate = function() {
}

SoundConfig.prototype.deactivate = function() {
}

//

SoundConfig.prototype.setup = function(sceneController) {
	// Ringer, System and Media volume selectors
	
	this.choicesRingerVolumeSelector = [
		{'label': sceneController.defaultChoiseLabel, 'value': -1},
		{'label': $L("Minimum"), 'value': 0},
		{'label': $L("Maximum"), 'value': 100} ];  

	sceneController.setupWidget("SoundRingerSelector", {'label': $L("Ringer"), 
		'labelPlacement': "left", 'modelProperty': "soundRingerVolume",
		'choices': this.choicesRingerVolumeSelector});
		
	sceneController.setupWidget("SoundRingerSlider", {'minValue': -1, 'maxValue': 100, 
		'round': true, 'modelProperty': "soundRingerVolume"});

	this.choicesSystemVolumeSelector = [
		{'label': sceneController.defaultChoiseLabel, 'value': -1},
		{'label': $L("Minimum"), 'value': 0},
		{'label': $L("Maximum"), 'value': 100} ];  

	sceneController.setupWidget("SoundSystemSelector", {'label': $L("System"), 
		'labelPlacement': "left", 'modelProperty': "soundSystemVolume",
		'choices': this.choicesSystemVolumeSelector});
		
	sceneController.setupWidget("SoundSystemSlider", {'minValue': -1, 'maxValue': 100, 
		'round': true, 'modelProperty': "soundSystemVolume"});

	this.choicesMediaVolumeSelector = [
		{'label': sceneController.defaultChoiseLabel, 'value': -1},
		{'label': $L("Minimum"), 'value': 0},
		{'label': $L("Maximum"), 'value': 100} ];  

	sceneController.setupWidget("SoundMediaSelector", {'label': $L("Media"), 
		'labelPlacement': "left", 'modelProperty': "soundMediaVolume",
		'choices': this.choicesMediaVolumeSelector});

	sceneController.setupWidget("SoundMediaSlider", {'minValue': -1, 'maxValue': 100, 
		'round': true, 'modelProperty': "soundMediaVolume"});
}

//

SoundConfig.prototype.config = function() {
	var settingConfig = {
		'soundTitle': $L("Sounds"),
		'soundRingerVolume': -1, 
		'soundSystemVolume': -1, 
		'soundMediaVolume': -1 };
	
	return settingConfig;
}

//

SoundConfig.prototype.load = function(settingPreferences) {
	var settingConfig = this.config();
	
	if(settingPreferences.soundRingerVolume != undefined)
		settingConfig.soundRingerVolume = settingPreferences.soundRingerVolume;

	if(settingPreferences.soundSystemVolume != undefined)
		settingConfig.soundSystemVolume = settingPreferences.soundSystemVolume; 

	if(settingPreferences.soundMediaVolume != undefined)
		settingConfig.soundMediaVolume = settingPreferences.soundMediaVolume;
	
	return settingConfig;
}

SoundConfig.prototype.save = function(settingConfig) {
	var settingPreferences = {};
	
	if(settingConfig.soundRingerVolume != -1)
		settingPreferences.soundRingerVolume = settingConfig.soundRingerVolume;

	if(settingConfig.soundSystemVolume != -1)
		settingPreferences.soundSystemVolume = settingConfig.soundSystemVolume;

	if(settingConfig.soundMediaVolume != -1)
		settingPreferences.soundMediaVolume = settingConfig.soundMediaVolume;
	
	return settingPreferences;
}

