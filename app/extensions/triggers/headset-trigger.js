function HeadsetTrigger(ServiceRequestWrapper, SystemAlarmsWrapper) {
	this.service = ServiceRequestWrapper;

	this.callback = null;
	this.initialized = false;

	this.config = null;
	this.enabled = false;
	
	this.connected = "none";
}

//

HeadsetTrigger.prototype.init = function(callback) {
	this.callback = callback;

	this.initialized = false;

	this.subscribeHeadsetStatus();
}

HeadsetTrigger.prototype.shutdown = function() {
	this.initialized = false;

	this.connected = "none";

	if(this.subscribtionHeadsetStatus)
		this.subscribtionHeadsetStatus.cancel();
}


//

HeadsetTrigger.prototype.enable = function(config) {
	this.config = config;
	
	this.enabled = true;
}

HeadsetTrigger.prototype.disable = function() {
	this.enabled = false;
}

//

HeadsetTrigger.prototype.check = function(config) {
	if((config.headsetState == 0) && (((config.headsetScenario == 0) && (this.connected != "none")) ||
		((config.headsetScenario == 1) && (this.connected == "media_headset")) ||
		((config.headsetScenario == 2) && (this.connected == "media_headset_mic"))))
	{
		return true;
	}
	
	if((config.headsetState == 1) && (((config.headsetScenario == 0) && (this.connected == "none")) ||
		((config.headsetScenario == 1) && (this.connected != "media_headset")) ||
		((config.headsetScenario == 2) && (this.connected != "media_headset_mic"))))
	{
		return true;
	}

	return false;
}

//

HeadsetTrigger.prototype.execute = function(state, launchCallback) {
	Mojo.Log.info("Headset trigger received: " + state);

	var startModes = new Array();
	var closeModes = new Array();
	
	for(var i = 0; i < this.config.modesConfig.length; i++) {
		for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
			if(this.config.modesConfig[i].triggersList[j].extension == "headset") {
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

HeadsetTrigger.prototype.subscribeHeadsetStatus = function() {
	this.subscribtionHeadsetStatus = this.service.request("palm://com.palm.audio/media/", {
		'method': "status", 'parameters': {"subscribe": true},
		'onSuccess': this.handleHeadsetStatus.bind(this),
		'onFailure': this.handleTriggerError.bind(this)});
}

HeadsetTrigger.prototype.handleHeadsetStatus = function(response) {
	var old = this.connected;

	if((response.scenario) && (response.action) && 
		((response.scenario == "media_headset") ||
		(response.scenario == "media_headset_mic")))
	{
		if(response.action == "enabled")
			this.connected = response.scenario;
		else if(response.action == "disabled")
			this.connected = "none";		
	}
	
	if(!this.initialized) {
		this.initialized = true;
		this.callback(true);
		this.callback = null;
	}
	else if((this.enabled) && (old != this.connected)) {
		this.service.request("palm://com.palm.applicationManager", {'method': "launch", 
			'parameters': {'id': Mojo.Controller.appInfo.id, 'params': {'action': "trigger", 
				'event': "headset", 'data': this.connected}}});
	}
}

HeadsetTrigger.prototype.handleTriggerError = function(response) {
	if(this.callback) {
		this.callback(false);
		this.callback = null;
	}
}

