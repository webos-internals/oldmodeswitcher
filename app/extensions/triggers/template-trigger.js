function TemplateTrigger(ServiceRequestWrapper, SystemAlarmsWrapper) {
	// The service request wrapper needs to be used for making system requests.

	this.service = ServiceRequestWrapper;

	this.callback = null;
	this.initialized = false;
	
	this.config = null;
	this.enabled = false;

	this.triggerState = 0;
}

//

TemplateTrigger.prototype.init = function(callback) {
	// This function should subscribe to needed notifications and setup initial state.

	this.callback = callback;

	this.initialized = false;

	this.subscribeTemplateNotifications();
}

TemplateTrigger.prototype.shutdown = function() {
	// This function should unsubscribe the needed notifications and shutdown trigger.

	this.initialized = false;
	
	if(this.subscriptionTemplateNotifications)
		this.subscriptionTemplateNotifications.cancel();
}

//

TemplateTrigger.prototype.enable = function(config) {
	// This function should enable trigger (start notifying the app of trigger events).
	
	this.enabled = true;
	
	this.config = config;
}

TemplateTrigger.prototype.disable = function() {
	// This function should disable trigger (stop notifying the app of trigger events).

	this.enabled = false;
}

//

TemplateTrigger.prototype.check = function(config) {
	// This function should check if the trigger state in given configuration is valid.

	if(this.triggerState == config.triggerState)
		return true;
	else
		return false;
}

//

TemplateTrigger.prototype.execute = function(state, launchCallback) {
	// This function should collect all modes that match the received trigger data.
	// Also setting up for reconfiguring the trigger should be made here if needed.
	
	// Normally this just collects all active modes with the correct trigger into one
	// array and all none active modes with the correct trigger into another array. 
	
	// However some triggers might know the exact modes that the trigger involves.

	Mojo.Log.info("Template trigger received: " + state);

	var startModes = new Array();
	var closeModes = new Array();

	for(var i = 0; i < this.config.modesConfig.length; i++) {
		for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
			if(this.config.modesConfig[i].triggersList[j].extension == "template") {
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

TemplateTrigger.prototype.subscribeTemplateNotifications = function() {
	// This function is a helper function that subscribes to wanted information.

	this.subscriptionTemplateNotifications = this.service.request("url", {
		'method': "method", 'parameters': {'subscribe': true},
		'onSuccess': this.handleTemplateNotification.bind(this),
		'onFailure': this.handleTriggerError.bind(this)});
}

TemplateTrigger.prototype.handleTemplateNotification = function(response) {
	// This function is a helper function that parses the received information.
	
	if(!this.initialized) {
		this.initialized = true;
		this.callback(true);
		this.callback = null;
	}
	else if((this.enabled) && (this.response)) {
		this.triggerState = response.state;
	
		this.service.request("palm://com.palm.applicationManager", {'method': "launch", 
			'parameters': {'id': Mojo.Controller.appInfo.id, 'params': {'action': "trigger", 
				'event': "template", 'data': this.triggerState}}});
	}
}

TemplateTrigger.prototype.handleTemplateNotification = function(response) {
	// This function helper function notifies app about failed initialization.
	
	if(this.callback) {
		this.callback(false);
		this.callback = null;
	}
}

