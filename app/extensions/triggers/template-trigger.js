function TemplateTrigger(ServiceRequestWrapper, SystemAlarmsWrapper, SystemNotifierWrapper) {
	// The service request wrapper needs to be used for making system requests.

	this.service = ServiceRequestWrapper;

	this.triggerState = 0;
	
	this.appid = "com.palm.org.e-lnx.wee.apps.modeswitcher";
}

//

TemplateTrigger.prototype.init = function(config) {
	// This function should subscribe to needed notifications and setup initial state.

	this.config = config;
}

TemplateTrigger.prototype.shutdown = function(config) {
	// This function should unsubscribe the needed notifications and shutdown trigger.

	this.config = config;
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

