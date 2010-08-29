function SilentswTrigger(Config, Control) {
	this.config = Config;

	this.service = Control.service;

	this.initialized = false;

	this.startupCallback = null;
	this.executeCallback = null;

	this.switchState = "unknown";
}

//

SilentswTrigger.prototype.init = function(startupCallback) {
	this.initialized = true;

	startupCallback(true);
}

SilentswTrigger.prototype.shutdown = function() {
	this.initialized = false;

	this.switchState = "off";
}

//

SilentswTrigger.prototype.enable = function(executeCallback) {
	this.executeCallback = executeCallback;
	
	this.subscribeSwitchState();
}

SilentswTrigger.prototype.disable = function() {
	this.executeCallback = null;
	
	if(this.subscribtionSwitchState)
		this.subscribtionSwitchState.cancel();
}

//

SilentswTrigger.prototype.check = function(triggerConfig, modeName) {
	if(this.switchState == "unknown")
		return true;

	if(((triggerConfig.silentswState == 0) && (this.switchState == "on")) ||
		((triggerConfig.silentswState == 1) && (this.switchState == "off")))
	{
		return true;
	}

	return false;
}

//

SilentswTrigger.prototype.execute = function(triggerData, manualLaunch) {
	Mojo.Log.info("Silentsw trigger received: " + Object.toJSON(triggerData));

	var startModes = new Array();
	var closeModes = new Array();

	if((triggerData.state) && (triggerData.state != this.switchState)) {
		this.switchState = triggerData.state;
			
		for(var i = 0; i < this.config.modesConfig.length; i++) {
			for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
				if(this.config.modesConfig[i].triggersList[j].extension == "silentsw") {
					if((this.config.modesConfig[i].name != this.config.currentMode.name) &&
						(this.config.modifierModes.indexOf(this.config.modesConfig[i].name) == -1))
					{
						if(this.check(this.config.modesConfig[i].triggersList[j])) {
							startModes.push(this.config.modesConfig[i]);
							break;
						}
					}
					else {
						if(!this.check(this.config.modesConfig[i].triggersList[j])) {
							closeModes.push(this.config.modesConfig[i]);
							break;
						}
					}
				}
			}
		}

		if((this.executeCallback) && ((startModes.length > 0) || (closeModes.length > 0)))
			this.executeCallback(startModes, closeModes);
	}
}

//

SilentswTrigger.prototype.subscribeSwitchState = function() {
	this.subscribtionSwitchState = this.service.request("palm://com.palm.keys/switches/", {
		'method': "status", 'parameters': {'subscribe': true},
		'onSuccess': this.handleSwitchState.bind(this)});
}

SilentswTrigger.prototype.handleSwitchState = function(serviceResponse) {
	if(serviceResponse.key == "ringer") {
		if(serviceResponse.state == "down")
			var state = "on";
		else
			var state = "off";

		this.execute({'state': state}, false);
	}
}

