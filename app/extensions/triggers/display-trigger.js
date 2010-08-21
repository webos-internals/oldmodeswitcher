function DisplayTrigger(Config, Control) {
	this.config = Config;

	this.service = Control.service;

	this.initialized = false;

	this.startupCallback = null;
	this.executeCallback = null;

	this.activeState = "on";
	this.activeLocked = "no";

	this.currentState = "on";
	this.currentLocked = "no";

	this.triggerTimeout = null;
}

//

DisplayTrigger.prototype.init = function(startupCallback) {
	this.initialized = true;

	startupCallback(true);
}

DisplayTrigger.prototype.shutdown = function() {
	this.initialized = false;

	this.startupCallback = null;

	this.activeState = "on";
	this.activeLocked = "no";
	
	this.currentState = "on";
	this.currentLocked = "no";

	this.triggerTimeout = null;
}

//

DisplayTrigger.prototype.enable = function(executeCallback) {
	this.executeCallback = executeCallback;

	this.subscribeDisplayStatus();
}

DisplayTrigger.prototype.disable = function() {
	this.executeCallback = null;

	if(this.subscribtionDisplayStatus)
		this.subscribtionDisplayStatus.cancel();

	if(this.subscribtionLockStatus)
		this.subscribtionLockStatus.cancel();
}

//

DisplayTrigger.prototype.check = function(triggerConfig, modeName) {
	if((triggerConfig.displayState == 0) && (this.currentState == "on"))
		return true;
	
	if((triggerConfig.displayState == 1) && (this.currentState == "off"))
		return true;
	
	if((triggerConfig.displayState == 2) && (this.currentLocked == "yes"))
		return true;
	
	return false;
}

//

DisplayTrigger.prototype.execute = function(triggerData, manualLaunch) {
	Mojo.Log.error("Display trigger received: " + Object.toJSON(triggerData));

	var startModes = new Array();
	var closeModes = new Array();

	if((triggerData.state) || (triggerData.locked)) {
		if(((triggerData.state) != this.activeState) ||
			((triggerData.locked) != this.activeLocked))
		{
			this.activeState = triggerData.state;
			this.activeLocked = triggerData.locked;

			for(var i = 0; i < this.config.modesConfig.length; i++) {
				for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
					if(this.config.modesConfig[i].triggersList[j].extension == "display") {
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
}

//

DisplayTrigger.prototype.subscribeDisplayStatus = function() {
	this.subscribtionDisplayStatus = this.service.request('palm://com.palm.display/control/', {
		'method': "status", 'parameters': {'subscribe': true}, 
		'onSuccess': this.handleDisplayStatus.bind(this)});

	this.subscribtionLockStatus = this.service.request('palm://com.palm.systemmanager/', {
		'method': "getLockStatus", 'parameters': {'subscribe': true},
		'onSuccess': this.handleDisplayStatus.bind(this)});
}

DisplayTrigger.prototype.handleDisplayStatus = function(response) {
	var timeout = 15000;

	if(response.event == "displayOn")
		this.currentState = "on";
	else if(response.event == "displayOff")
		this.currentState = "off";
	
	if(response.locked == true)
		this.currentLocked = "yes";
	else if(response.locked == false)
		this.currentLocked = "no";

	for(var i = 0; i < this.config.modesConfig.length; i++) {
		for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
			if(this.config.modesConfig[i].triggersList[j].extension == "display") {
				if(timeout < this.config.modesConfig[i].triggersList[j].displayDelay * 1000)
					timeout = this.config.modesConfig[i].triggersList[j].displayDelay * 1000;
			}		
		}
	}
	
	if(this.triggerTimeout)
		clearTimeout(this.triggerTimeout);
		
	var func = this.execute.bind(this, {'state': this.currentState, 'locked': this.currentLocked}, false);
		
	this.triggerTimeout = setTimeout(func, timeout);
}

