function ApplicationTrigger(ServiceRequestWrapper, SystemAlarmsWrapper) {
	this.service = ServiceRequestWrapper;

	this.callback = null;
	this.initialized = false;

	this.config = null;
	this.enabled = false;
	
	this.current = "unknown";
	
	this.previous = "unknown";
	
	this.closeTimer = null;
}

//

ApplicationTrigger.prototype.init = function(callback) {
	this.callback = callback;

	this.initialized = false;

	this.subscribeForegroundApp();
}

ApplicationTrigger.prototype.shutdown = function() {
	this.initialized = false;

	this.current = "unknown";
	this.previous = "unknown";
	
	if(this.subscribtionForegroundApp)
		this.subscribtionForegroundApp.cancel();
}


//

ApplicationTrigger.prototype.enable = function(config) {
	this.config = config;
	
	this.enabled = true;
}

ApplicationTrigger.prototype.disable = function() {
	this.enabled = false;
}

//

ApplicationTrigger.prototype.check = function(config) {
	if((config.applicationState == 0) && (config.applicationId == this.current))
		return true;
		
	if((config.applicationState == 1) && (config.applicationId != this.current))
		return true;

	return false;
}

//

ApplicationTrigger.prototype.execute = function(appid, launchCallback) {
	Mojo.Log.info("Application trigger received: " + appid);

	var startModes = new Array();
	var closeModes = new Array();
	
	for(var i = 0; i < this.config.modesConfig.length; i++) {
		for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
			if(this.config.modesConfig[i].triggersList[j].extension == "application") {
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

ApplicationTrigger.prototype.subscribeForegroundApp = function() {
	this.subscriptionForegroundApp = this.service.request("palm://com.palm.systemmanager/", {
		'method': "getForegroundApplication", 'parameters': {'subscribe': true},
		'onSuccess': this.handleForegroundApp.bind(this),
		'onFailure': this.handleTriggerError.bind(this)});
}

ApplicationTrigger.prototype.handleForegroundApp = function(response) {
	if(this.current != "unknown")
		this.previous = this.current;

	if(response.id != undefined)
		this.current = response.id;
	else
		this.current = "unknown";

	if(!this.initialized) {
		this.initialized = true;
		this.callback(true);
		this.callback = null;
	}
	else if(this.enabled) {
		var found = false;
		var delay = null;
	
		for(var i = 0; i < this.config.modesConfig.length; i++) {
			for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
				if(this.config.modesConfig[i].triggersList[j].extension == "application") {
					if(this.config.modesConfig[i].triggersList[j].applicationId == this.previous) {
						if((this.config.currentMode.name == this.config.modesConfig[i].name) ||
							(this.config.modifierModes.indexOf(this.config.modesConfig[i].name) != -1))
						{
							delay = this.config.modesConfig[i].triggersList[j].applicationDelay;
						}
					}

					if(this.config.modesConfig[i].triggersList[j].applicationId == this.current) {
						found = true;
					}						
				}
			}
		}

		if(this.closeTimeout)
			clearTimeout(this.closeTimeout);
	
		if((found) && (this.current != "unknown"))
			this.notifyTriggerUpdate();
		else if((delay) && (this.current == "unknown"))
			this.closeTimeout = setTimeout(this.notifyTriggerUpdate.bind(this), delay * 1000);
	}
}

ApplicationTrigger.prototype.notifyTriggerUpdate = function() {	
		this.service.request("palm://com.palm.applicationManager", {'method': "launch", 
			'parameters': {'id': Mojo.Controller.appInfo.id, 'params': {'action': "trigger", 
				'event': "application", 'data': this.current}}});
}

ApplicationTrigger.prototype.handleTriggerError = function(response) {
	if(this.callback) {
		this.callback(false);
		this.callback = null;
	}
}

