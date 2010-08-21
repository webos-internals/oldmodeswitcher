function SecurityConfig() {
}

SecurityConfig.prototype.version = function() {
	return "1.1";
}

//

SecurityConfig.prototype.label = function() {
	return "Security Settings";
}

//

SecurityConfig.prototype.activate = function() {
}

SecurityConfig.prototype.deactivate = function() {
}

//

SecurityConfig.prototype.setup = function(controller) {
	this.controller = controller;

	this.choicesSecurityLockSelector = [
		{'label': controller.defaultChoiseLabel, 'value': -1},
		{'label': "Unsecure", 'value': 0},
		{'label': "Simple PIN", 'value': 1},
		{'label': "Password", 'value': 2} ];  

	controller.setupWidget("SecurityLockSelector", {'label': "Unlock Mode", 
		'labelPlacement': "left", 'modelProperty': "securityLock",
		'choices': this.choicesSecurityLockSelector});

	this.controller.setupWidget("SecurityPINText", {'hintText': "Enter PIN...", 
		'multiline': false, 'enterSubmits': false, 'focus': false, 
		'modifierState': Mojo.Widget.numLock, 'modelProperty': "securitySecretPIN", 
		'charsAllow': this.checkPINCharacter.bind(this)});

	this.controller.setupWidget("SecurityPINText2", {'hintText': "Enter PIN Again...", 
		'multiline': false, 'enterSubmits': false, 'focus': false, 
		'modifierState': Mojo.Widget.numLock, 'modelProperty': "securitySecretPIN2", 
		'charsAllow': this.checkPINCharacter.bind(this)});

	this.controller.setupWidget("SecurityPWText", {'hintText': "Enter Password...", 
		'multiline': false, 'enterSubmits': false, 'focus': false, 
		'textCase': Mojo.Widget.steModeLowerCase, 'modelProperty': "securitySecretPW"});

	this.controller.setupWidget("SecurityPWText2", {'hintText': "Enter Password Again...", 
		'multiline': false, 'enterSubmits': false, 'focus': false, 
		'textCase': Mojo.Widget.steModeLowerCase, 'modelProperty': "securitySecretPW2"});

	// Listen for keyboard event for secret text field

	controller.listen(controller.get("SettingsList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

SecurityConfig.prototype.config = function() {
	var config = {
		'securityLock': -1, 
		'securitySecretPIN': "",
		'securitySecretPW': "",
		'securitySecretPIN2': "",
		'securitySecretPW2': "",
		'securityPINDisplay': "none",
		'securityPWDisplay': "none",
		'securityLockRow': "single" };
	
	return config;
}

//

SecurityConfig.prototype.load = function(preferences) {
	var config = this.config();

	if(preferences.securityLock != undefined)
		config.securityLock = preferences.securityLock;
	
	if(preferences.securitySecret != undefined)
		config.securitySecret = preferences.securitySecret;
	
	config.securityLockRow = "single";
	config.securityPINDisplay = "none";
	config.securityPWDisplay = "none";

	config.securitySecretPIN = "";
	config.securitySecretPW = "";
	config.securitySecretPIN2 = "";
	config.securitySecretPW2 = "";
		
	if(config.securityLock == 1) {
		config.securityLockRow = "first";
		config.securityPINDisplay = "block";
		config.securitySecretPIN = config.securitySecret;
		config.securitySecretPIN2 = config.securitySecret;
	}
	else if(config.securityLock == 2) {
		config.securityLockRow = "first";
		config.securityPWDisplay = "block";
		config.securitySecretPW = config.securitySecret;
		config.securitySecretPW2 = config.securitySecret;
	}
	
	return config;
}

SecurityConfig.prototype.save = function(config) {
	var preferences = {};

	if(config.securityLock == 0) {
		preferences.securityLock = 0;
		preferences.securitySecret = "";
	}
	else if(config.securityLock == 1) {
		preferences.securityLock = 1;
		
		if(config.securitySecretPIN == config.securitySecretPIN2)
			preferences.securitySecret = config.securitySecretPIN;
	}
	else if(config.securityLock == 2) {
		preferences.securityLock = 2;

		if(config.securitySecretPW == config.securitySecretPW2)
			preferences.securitySecret = config.securitySecretPW;
	}

	return preferences;
}

//

SecurityConfig.prototype.checkPINCharacter = function(event) {
	if((event >= 48) && (event <= 57))
		return true;
	else
		return false;
}

//

SecurityConfig.prototype.handleListChange = function(event) {
	if(event.property == "securityLock") {
		event.model.securityLockRow = "single";

		event.model.securityPINDisplay = "none";
		event.model.securityPWDisplay = "none";
		
		if(event.value == 1) {
			event.model.securityLockRow = "first";
			event.model.securityPINDisplay = "block";
		}
		else if(event.value == 2) {
			event.model.securityLockRow = "first";
			event.model.securityPWDisplay = "block";
		}
		
		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("SettingsList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
}

