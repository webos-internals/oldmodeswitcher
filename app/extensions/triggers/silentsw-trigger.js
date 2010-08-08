function SilentswTrigger(ServiceRequestWrapper, SystemAlarmsWrapper) {
	this.service = ServiceRequestWrapper;

	this.callback = null;
	this.initialized = false;

	this.config = null;
	this.enabled = false;
	
	this.state = false;
}

//

SilentswTrigger.prototype.init = function(callback) {
	this.callback = callback;

	this.initialized = false;

	this.subscribeSwitchState();
}

SilentswTrigger.prototype.shutdown = function() {
	this.initialized = false;

	this.state = false;

	if(this.subscribtionSwitchState)
		this.subscribtionSwitchState.cancel();
}


//

SilentswTrigger.prototype.enable = function(config) {
	this.config = config;
	
	this.enabled = true;
}

SilentswTrigger.prototype.disable = function() {
	this.enabled = false;
}

//

SilentswTrigger.prototype.check = function(config) {
	if(((config.silentswState == 0) && (this.state)) ||
		((config.silentswState == 1) && (!this.state)))
	{
		return true;
	}

	return false;
}

//

SilentswTrigger.prototype.execute = function(state, launchCallback) {
	Mojo.Log.info("Silentsw trigger received: " + state);

	var startModes = new Array();
	var closeModes = new Array();
	
	for(var i = 0; i < this.config.modesConfig.length; i++) {
		for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
			if(this.config.modesConfig[i].triggersList[j].extension == "silentsw") {
				if((this.config.modesConfig[i].name != this.config.currentMode.name) &&
					(this.config.modifierModes.indexOf(this.config.modesConfig[i].name) == -1))
				{
					startModes.push(this.config.modesConfig[i]);
				}
				else {
					closeModes.push(this.config.modesConfig[i]);
				}
				
				break;
			}
		}
	}

	launchCallback(startModes, closeModes);
}

//

SilentswTrigger.prototype.subscribeSwitchState = function() {
	this.subscribtionSwitchState = this.service.request("palm://com.palm.keys/switches/", {
		'method': "status", 'parameters': {'subscribe': true},
		'onSuccess': this.handleSwitchState.bind(this),
		'onFailure': this.handleTriggerError.bind(this)});
}

SilentswTrigger.prototype.handleSwitchState = function(response) {
	if(response.key == "ringer") {
		if(response.state == "down")
			this.state = true;
		else
			this.state = false;
	}

	if(!this.initialized) {
		this.initialized = true;
		this.callback(true);
		this.callback = null;
	}
	else if((this.enabled) && (response.key == "ringer")) {
		this.service.request("palm://com.palm.applicationManager", {'method': "launch", 
			'parameters': {'id': Mojo.Controller.appInfo.id, 'params': {'action': "trigger", 
				'event': "silentsw", 'data': this.state}}});
	}
}

SilentswTrigger.prototype.handleTriggerError = function(response) {
	if(this.callback) {
		this.callback(false);
		this.callback = null;
	}
}

