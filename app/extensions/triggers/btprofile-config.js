function BTProfileConfig() {
}

//

BTProfileConfig.prototype.label = function() {
	return "Bluetooth Profile Trigger";
}

//

BTProfileConfig.prototype.setup = function(controller) {
    
	this.choicesProfileSelector = [
		{'label': "Stereo Music", 'value': "a2dp"},
		{'label': "AV Remote Control", 'value': "avrcp"},
		{'label': "Hands-Free", 'value': "hfg"},
                {'label': "Headset", 'value': "hsp"},
		{'label': "Personal Area Network", 'value': "pan"},
		{'label': "Phone Book Access", 'value': "pba"}
		//{'label': "", 'value': ""}
	];

	controller.setupWidget(
		"ProfileSelector",
		{
			'label': "Profile",
			'labelPlacement': "left",
			'modelProperty': "profile",
			'choices': this.choicesProfileSelector
		}
	);
        
	this.choicesProfileStateSelector = [
		{'label': "Connected", 'value': 1},
		{'label': "Disconnected", 'value': 0},
                {'label': "Any", 'value': 2}
	];  

	controller.setupWidget(
		"ProfileStateSelector",
		{
			'label': "State",
			'labelPlacement': "left",
			'modelProperty': "profilestate",
			'choices': this.choicesProfileStateSelector
		}
	);        
}

//

BTProfileConfig.prototype.load = function(config, data) {
	config.push({'profile': data.profile, 'profilestate': data.profilestate});
}

BTProfileConfig.prototype.save = function(config, data) {
	data.push({'profile': config.profile, 'profilestate': config.profilestate});
}

//

BTProfileConfig.prototype.append = function(config, saveCallback) {
	config.push({'profile': "a2dp", 'profilestate': 1});
	
	saveCallback(true);
}

BTProfileConfig.prototype.remove = function(config, index, saveCallback) {
	config.splice(index,1);

	saveCallback(true);
}

//

BTProfileConfig.prototype.changed = function(config, event, saveCallback) {
	saveCallback();
}

BTProfileConfig.prototype.tapped = function(config, event, saveCallback) {
}

