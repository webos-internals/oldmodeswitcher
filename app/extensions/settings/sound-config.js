function SoundConfig() {
}

//

SoundConfig.prototype.label = function() {
	return "Sound Settings";
}

//

SoundConfig.prototype.setup = function(controller) {
	// Ringer, System and Media volume selectors
	
	controller.setupWidget("RingerVolumeSlider", {'minValue': 0, 'maxValue': 100, 
		'round': true, 'modelProperty': "soundRingerVolume"});

	controller.setupWidget("SystemVolumeSlider", {'minValue': 0, 'maxValue': 100, 
		'round': true, 'modelProperty': "soundSystemVolume"});

	controller.setupWidget("MediaVolumeSlider", {'minValue': 0, 'maxValue': 100, 
		'round': true, 'modelProperty': "soundMediaVolume"});
}

//

SoundConfig.prototype.load = function(preferences) {
	var config = {
		'soundRingerVolume': preferences.soundRingerVolume,
		'soundSystemVolume': preferences.soundSystemVolume, 
		'soundMediaVolume': preferences.soundMediaVolume };
	
	return config;
}

SoundConfig.prototype.save = function(config) {
	var preferences = {
		'soundRingerVolume': config.soundRingerVolume,
		'soundSystemVolume': config.soundSystemVolume, 
		'soundMediaVolume': config.soundMediaVolume };
	
	return preferences;
}

//

SoundConfig.prototype.config = function() {
	var config = {
		'soundRingerVolume': 50, 
		'soundSystemVolume': 50, 
		'soundMediaVolume': 50 };
	
	return config;
}

