function SecurityConfig() {
}

SecurityConfig.prototype.version = function() {
	return "1.1";
}

//

SecurityConfig.prototype.label = function() {
	return $L("Security Settings");
}

//

SecurityConfig.prototype.activate = function() {
}

SecurityConfig.prototype.deactivate = function() {
}

//

SecurityConfig.prototype.setup = function(sceneController) {
	this.controller = sceneController;

	this.choicesSecurityLockSelector = [
		{'label': sceneController.defaultChoiseLabel, 'value': -1},
		{'label': $L("Unsecure"), 'value': 0},
		{'label': $L("Simple PIN"), 'value': 1},
		{'label': $L("Password"), 'value': 2} ];  

	sceneController.setupWidget("SecurityLockSelector", {'label': $L("Unlock Mode"), 
		'labelPlacement': "left", 'modelProperty': "securityLock",
		'choices': this.choicesSecurityLockSelector});

	sceneController.setupWidget("SecurityPINText", {'hintText': $L("Enter PIN..."), 
		'multiline': false, 'enterSubmits': false, 'focus': false, 
		'modifierState': Mojo.Widget.numLock, 'modelProperty': "securitySecretPIN", 
		'charsAllow': this.checkPINCharacter.bind(this)});

	sceneController.setupWidget("SecurityPINText2", {'hintText': $L("Enter PIN Again..."), 
		'multiline': false, 'enterSubmits': false, 'focus': false, 
		'modifierState': Mojo.Widget.numLock, 'modelProperty': "securitySecretPIN2", 
		'charsAllow': this.checkPINCharacter.bind(this)});

	sceneController.setupWidget("SecurityPWText", {'hintText': $L("Enter Password..."), 
		'multiline': false, 'enterSubmits': false, 'focus': false, 
		'textCase': Mojo.Widget.steModeLowerCase, 'modelProperty': "securitySecretPW"});

	sceneController.setupWidget("SecurityPWText2", {'hintText': $L("Enter Password Again..."), 
		'multiline': false, 'enterSubmits': false, 'focus': false, 
		'textCase': Mojo.Widget.steModeLowerCase, 'modelProperty': "securitySecretPW2"});

	// Listen for keyboard event for secret text field

	sceneController.listen(sceneController.get("SettingsList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

SecurityConfig.prototype.config = function() {
	var settingConfig = {
		'securityTitle': $L("Security"),
		'securityLock': -1, 
		'securitySecretPIN': "",
		'securitySecretPW': "",
		'securitySecretPIN2': "",
		'securitySecretPW2': "",
		'securityPINDisplay': "none",
		'securityPWDisplay': "none",
		'securityLockRow': "single" };
	
	return settingConfig;
}

//

SecurityConfig.prototype.load = function(settingPreferences) {
	var settingConfig = this.config();

	if(settingPreferences.securityLock != undefined)
		settingConfig.securityLock = settingPreferences.securityLock;
	
	if(settingPreferences.securitySecret != undefined)
		settingConfig.securitySecret = settingPreferences.securitySecret;
	
	settingConfig.securityLockRow = "single";
	settingConfig.securityPINDisplay = "none";
	settingConfig.securityPWDisplay = "none";

	settingConfig.securitySecretPIN = "";
	settingConfig.securitySecretPW = "";
	settingConfig.securitySecretPIN2 = "";
	settingConfig.securitySecretPW2 = "";
		
	if(settingConfig.securityLock == 1) {
		settingConfig.securityLockRow = "first";
		settingConfig.securityPINDisplay = "block";
		settingConfig.securitySecretPIN = settingConfig.securitySecret;
		settingConfig.securitySecretPIN2 = settingConfig.securitySecret;
	}
	else if(settingConfig.securityLock == 2) {
		settingConfig.securityLockRow = "first";
		settingConfig.securityPWDisplay = "block";
		settingConfig.securitySecretPW = settingConfig.securitySecret;
		settingConfig.securitySecretPW2 = settingConfig.securitySecret;
	}
	
	return settingConfig;
}

SecurityConfig.prototype.save = function(settingConfig) {
	var settingPreferences = {};

	if(settingConfig.securityLock == 0) {
		settingPreferences.securityLock = 0;
		settingPreferences.securitySecret = "";
	}
	else if(settingConfig.securityLock == 1) {
		settingPreferences.securityLock = 1;
		
		if(settingConfig.securitySecretPIN == settingConfig.securitySecretPIN2)
			settingPreferences.securitySecret = settingConfig.securitySecretPIN;
	}
	else if(settingConfig.securityLock == 2) {
		settingPreferences.securityLock = 2;

		if(settingConfig.securitySecretPW == settingConfig.securitySecretPW2)
			settingPreferences.securitySecret = settingConfig.securitySecretPW;
	}

	return settingPreferences;
}

//

SecurityConfig.prototype.checkPINCharacter = function(keyEvent) {
	if((keyEvent >= 48) && (keyEvent <= 57))
		return true;
	else
		return false;
}

//

SecurityConfig.prototype.handleListChange = function(changeEvent) {
	if(changeEvent.property == "securityLock") {
		changeEvent.model.securityLockRow = "single";

		changeEvent.model.securityPINDisplay = "none";
		changeEvent.model.securityPWDisplay = "none";
		
		if(changeEvent.value == 1) {
			changeEvent.model.securityLockRow = "first";
			changeEvent.model.securityPINDisplay = "block";
		}
		else if(changeEvent.value == 2) {
			changeEvent.model.securityLockRow = "first";
			changeEvent.model.securityPWDisplay = "block";
		}
		
		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("SettingsList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
}

