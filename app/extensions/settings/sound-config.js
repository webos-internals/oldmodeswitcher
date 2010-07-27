function SoundConfig() {
}

SoundConfig.prototype.version = function() {
	return "1.0";
}

//

SoundConfig.prototype.label = function() {
	return "Sound Settings";
}

//

SoundConfig.prototype.activate = function() {
}

SoundConfig.prototype.deactivate = function() {
}

//

SoundConfig.prototype.setup = function(controller) {
	// Ringer, System and Media volume selectors
	
	this.choicesRingerVolumeSelector = [
		{'label': controller.defaultChoiseLabel, 'value': -1},
		{'label': "Minimum", 'value': 0},
		{'label': "Maximum", 'value': 100} ];  

	controller.setupWidget("SoundRingerSelector", {'label': "Ringer", 
		'labelPlacement': "left", 'modelProperty': "soundRingerVolume",
		'choices': this.choicesRingerVolumeSelector});
		
	controller.setupWidget("SoundRingerSlider", {'minValue': -1, 'maxValue': 100, 
		'round': true, 'modelProperty': "soundRingerVolume"});

	this.choicesSystemVolumeSelector = [
		{'label': controller.defaultChoiseLabel, 'value': -1},
		{'label': "Minimum", 'value': 0},
		{'label': "Maximum", 'value': 100} ];  

	controller.setupWidget("SoundSystemSelector", {'label': "System", 
		'labelPlacement': "left", 'modelProperty': "soundSystemVolume",
		'choices': this.choicesSystemVolumeSelector});
		
	controller.setupWidget("SoundSystemSlider", {'minValue': -1, 'maxValue': 100, 
		'round': true, 'modelProperty': "soundSystemVolume"});

	this.choicesMediaVolumeSelector = [
		{'label': controller.defaultChoiseLabel, 'value': -1},
		{'label': "Minimum", 'value': 0},
		{'label': "Maximum", 'value': 100} ];  

	controller.setupWidget("SoundMediaSelector", {'label': "Media", 
		'labelPlacement': "left", 'modelProperty': "soundMediaVolume",
		'choices': this.choicesMediaVolumeSelector});

	controller.setupWidget("SoundMediaSlider", {'minValue': -1, 'maxValue': 100, 
		'round': true, 'modelProperty': "soundMediaVolume"});
}

//

SoundConfig.prototype.config = function() {
	var config = {
		'soundRingerVolume': -1, 
		'soundSystemVolume': -1, 
		'soundMediaVolume': -1 };
	
	return config;
}

//

SoundConfig.prototype.load = function(preferences) {
	var config = this.config();
	
	if(preferences.soundRingerVolume != undefined)
		config.soundRingerVolume = preferences.soundRingerVolume;

	if(preferences.soundSystemVolume != undefined)
		config.soundSystemVolume = preferences.soundSystemVolume; 

	if(preferences.soundMediaVolume != undefined)
		config.soundMediaVolume = preferences.soundMediaVolume;
	
	return config;
}

SoundConfig.prototype.save = function(config) {
	var preferences = {};
	
	if(config.soundRingerVolume != -1)
		preferences.soundRingerVolume = config.soundRingerVolume;

	if(config.soundSystemVolume != -1)
		preferences.soundSystemVolume = config.soundSystemVolume;

	if(config.soundMediaVolume != -1)
		preferences.soundMediaVolume = config.soundMediaVolume;
	
	return preferences;
}

