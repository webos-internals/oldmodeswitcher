function SoundConfig() {
}

//

SoundConfig.prototype.label = function() {
	return "Sound Settings";
}

//

SoundConfig.prototype.setup = function(controller) {
	// Ringer, System and Media volume selectors
	
	controller.setupWidget("RingerSlider", {'minValue': 0, 'maxValue': 100, 
		'round': true, 'modelProperty': "soundRingerVolume"});

	controller.setupWidget("SystemSlider", {'minValue': 0, 'maxValue': 100, 
		'round': true, 'modelProperty': "soundSystemVolume"});

	controller.setupWidget("MediaSlider", {'minValue': 0, 'maxValue': 100, 
		'round': true, 'modelProperty': "soundMediaVolume"});
}

//

SoundConfig.prototype.load = function(config, preferences) {
	config.push({'soundRingerVolume': preferences.soundRingerVolume,
		'soundSystemVolume': preferences.soundSystemVolume, 
		'soundMediaVolume': preferences.soundMediaVolume});
}

SoundConfig.prototype.save = function(config, preferences) {
	preferences.push({'soundRingerVolume': config.soundRingerVolume,
		'soundSystemVolume': config.soundSystemVolume, 
		'soundMediaVolume': config.soundMediaVolume});
}

//

SoundConfig.prototype.append = function(config, saveCallback) {
	config.push({'soundRingerVolume': "(querying)", 
		'soundSystemVolume': "(querying)", 'soundMediaVolume': "(querying)"});
	
	saveCallback();
}

SoundConfig.prototype.remove = function(config, index, saveCallback) {
	config.splice(index,1);

	saveCallback();
}

//

SoundConfig.prototype.changed = function(config, event, saveCallback) {
	saveCallback();
}

SoundConfig.prototype.tapped = function(config, event, saveCallback) {
}

