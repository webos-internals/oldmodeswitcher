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
		{'label': "Available", 'value': 0},
		{'label': "Busy", 'value': 2},
		{'label': "Sign Off", 'value': 4}];  

	controller.setupWidget("IMStatusSelector", {'label': "IM Status", 
		'labelPlacement': "left", 'modelProperty': "messagingIMStatus",
		'choices': this.choicesIMStatusSelector});

	this.choicesSoundSelector = [
		{'label': "Vibrate", 'value': 3},
		{'label': "System Sound", 'value': 1},
		{'label': "Ringtone", 'value': 2},
		{'label': "Mute", 'value': 0}];  

	controller.setupWidget("MsgSoundSelector", {'label': "Alert", 
		'labelPlacement': "left", 'modelProperty': "messagingSoundMode",
		'choices': this.choicesSoundSelector});
}

//

MessagingConfig.prototype.load = function(config, preferences) {
	config.push({'messagingIMStatus': preferences.messagingIMStatus,
		'messagingSoundMode': preferences.messagingSoundMode, 
		'messagingRingtoneName': preferences.messagingRingtoneName, 
		'messagingRingtonePath': preferences.messagingRingtonePath});
}

MessagingConfig.prototype.save = function(config, preferences) {
	preferences.push({'messagingIMStatus': config.messagingIMStatus,
		'messagingSoundMode': config.messagingSoundMode, 
		'messagingRingtoneName': config.messagingRingtoneName, 
		'messagingRingtonePath': config.messagingRingtonePath});
}

//

MessagingConfig.prototype.append = function(config, saveCallback) {
	config.push({'messagingIMStatus': "(querying)", 'messagingSoundMode': "(querying)", 
		'messagingRingtoneName': "(querying)", 'messagingRingtonePath': ""});
	
	saveCallback();
}

MessagingConfig.prototype.remove = function(config, index, saveCallback) {
	config.splice(index,1);

	saveCallback();
}

//

MessagingConfig.prototype.changed = function(config, event, saveCallback) {
	saveCallback();
}

MessagingConfig.prototype.tapped = function(config, event, saveCallback) {
}

