function BtprofileConfig() {
}

BtprofileConfig.prototype.version = function() {
	return "1.0";
}

BtprofileConfig.prototype.label = function() {
	return "Bluetooth Profile Trigger";
}

//

BtprofileConfig.prototype.activate = function() {
}

BtprofileConfig.prototype.deactivate = function() {
}

//

BtprofileConfig.prototype.setup = function(controller) {
	this.choicesProfileSelector = [
		{'label': "Stereo Music", 'value': "a2dp"},
		{'label': "AV Remote Control", 'value': "avrcp"},
		{'label': "Hands-Free", 'value': "hfg"},
		{'label': "Headset", 'value': "hsp"},
		{'label': "Personal Area Network", 'value': "pan"},
		{'label': "Phone Book Access", 'value': "pba"} ];

	controller.setupWidget("BtprofileProfileSelector", {'label': "Profile",
		'labelPlacement': "left", 'modelProperty': "btprofileProfile",
		'choices': this.choicesProfileSelector});
        
	this.choicesProfileStateSelector = [
		{'label': "Connected", 'value': 1},
		{'label': "Disconnected", 'value': 0},
		{'label': "Any", 'value': 2} ];  

	controller.setupWidget("BtprofileStateSelector", {'label': "State",
		'labelPlacement': "left", 'modelProperty': "btprofileState",
		'choices': this.choicesProfileStateSelector});        
}

//

BtprofileConfig.prototype.load = function(preferences) {
	var config = {
		'btprofileProfile': preferences.btprofileProfile,
		'btprofileState': preferences.btprofileState };
	
	return config;
}

BtprofileConfig.prototype.save = function(config) {
	var preferences = {
		'btprofileProfile': config.btprofileProfile,
		'btprofileState': config.btprofileState };
	
	return preferences;
}

//

BtprofileConfig.prototype.config = function() {
	var config = {
		'btprofileProfile': "a2dp",
		'btprofileState': 1 };
	
	return config;
}

