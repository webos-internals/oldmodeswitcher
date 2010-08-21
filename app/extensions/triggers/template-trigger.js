function TemplateTrigger(Config, Control) {
	// The service request wrapper needs to be used for making system requests.

	this.config = Config;

	this.service = Control.service;

	this.initialized = false;

	this.startupCallback = null;
	this.executeCallback = null;
	
	this.triggerState = 0;
}

//

TemplateTrigger.prototype.init = function(startupCallback) {
	// This function should subscribe to needed notifications and setup initial state.

	this.initialized = false;

	this.startupCallback = startupCallback;

	this.subscribeTemplateNotifications(false);
}

TemplateTrigger.prototype.shutdown = function() {
	// This function should unsubscribe the needed notifications and shutdown trigger.

	this.initialized = false;

	this.startupCallback = null;
}

//

TemplateTrigger.prototype.enable = function(executeCallback) {
	// This function should enable trigger (start notifying the app of trigger events).
	
	this.executeCallback = executeCallback;

	this.subscribeTemplateNotifications(true);
}

TemplateTrigger.prototype.disable = function() {
	// This function should disable trigger (stop notifying the app of trigger events).

	this.executeCallback = null;
	
	if(this.subscriptionTemplateNotifications)
		this.subscriptionTemplateNotifications.cancel();
}

//

TemplateTrigger.prototype.check = function(triggerConfig, modeName) {
	// This function should check if the trigger state in given configuration is valid.

	if(this.triggerState == triggerConfig.triggerState)
		return true;
	else
		return false;
}

//

TemplateTrigger.prototype.execute = function(triggerData, manualLaunch) {
	// This function should collect all modes that match the received trigger data.
	// Also setting up for reconfiguring the trigger should be made here if needed.
	
	// Normally this just collects all active modes with the correct trigger into one
	// array and all none active modes with the correct trigger into another array. 
	
	// However some triggers might know the exact modes that the trigger involves.

	Mojo.Log.info("Template trigger received: " + Object.toJSON(triggerData));

	var startModes = new Array();
	var closeModes = new Array();

	if(triggerData.state)
		this.triggerState = triggerData.state;

	for(var i = 0; i < this.config.modesConfig.length; i++) {
		for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
			if(this.config.modesConfig[i].triggersList[j].extension == "template") {
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

//

TemplateTrigger.prototype.subscribeTemplateNotifications = function(subscribeRequest) {
	// This function is a helper function that subscribes to wanted information.

	this.subscriptionTemplateNotifications = this.service.request("url", {
		'method': "method", 'parameters': {'subscribe': subscribeRequest},
		'onSuccess': this.handleTemplateNotification.bind(this),
		'onFailure': this.handleTriggerError.bind(this)});
}

TemplateTrigger.prototype.handleTemplateNotification = function(serviceResponse) {
	// This function is a helper function that parses the received information.
	
	if(!this.initialized) {
		this.triggerState = serviceResponse.state;
	
		this.initialized = true;
		this.startupCallback(true);
		this.startupCallback = null;
	}
	else {
		this.execute({'state': serviceResponse.state}, false);
	}
}

//

TemplateTrigger.prototype.handleTriggerError = function(serviceResponse) {
	// This function helper function notifies app about failed initialization.
	
	if(this.startupCallback) {
		this.startupCallback(false);
		this.startupCallback = null;
	}
}

