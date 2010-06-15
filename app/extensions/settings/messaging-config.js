function MessagingConfig() {
}

//

MessagingConfig.prototype.label = function() {
	return "Messaging Settings";
}

//

MessagingConfig.prototype.setup = function(controller) {
	// IM status, sound and ringtone selectors

	this.choicesIMStatusSelector = [
		{'label': "Do Not Set", 'value': 0},
		{'label': "Available", 'value': 1},
		{'label': "Busy", 'value': 2},
		{'label': "Sign Off", 'value': 3} ];  

	controller.setupWidget("IMStatusSelector", {'label': "IM Status", 
		'labelPlacement': "left", 'modelProperty': "messagingIMStatus",
		'choices': this.choicesIMStatusSelector});

	this.choicesSoundSelector = [
		{'label': "Do Not Set", 'value': 0},
		{'label': "Vibrate", 'value': 1},
		{'label': "System Sound", 'value': 2},
		{'label': "Ringtone", 'value': 3},
		{'label': "Mute", 'value': 4}];  

	controller.setupWidget("MsgSoundSelector", {'label': "Alert", 
		'labelPlacement': "left", 'modelProperty': "messagingSoundMode",
		'choices': this.choicesSoundSelector});
}

//

MessagingConfig.prototype.load = function(preferences) {
	var config = {
		'messagingIMStatus': preferences.messagingIMStatus,
		'messagingSoundMode': preferences.messagingSoundMode, 
		'messagingRingtoneName': preferences.messagingRingtoneName, 
		'messagingRingtonePath': preferences.messagingRingtonePath };
	
	return config;
}

MessagingConfig.prototype.save = function(config) {
	var preferences = {
		'messagingIMStatus': config.messagingIMStatus,
		'messagingSoundMode': config.messagingSoundMode, 
		'messagingRingtoneName': config.messagingRingtoneName, 
		'messagingRingtonePath': config.messagingRingtonePath };
	
	return preferences;
}

//

MessagingConfig.prototype.config = function() {
	var config = {
		'messagingIMStatus': 0, 
		'messagingSoundMode': 0, 
		'messagingRingtoneName': 0, 
		'messagingRingtonePath': 0 };
	
	return config;
}

