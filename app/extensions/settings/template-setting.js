function TemplateSetting(Control) {
	// The service request wrapper needs to be used for making system requests.
		
	this.service = Control.service;
}

//

TemplateSetting.prototype.init = function(doneCallback) {
	// This function should subscribe to needed notifications and setup initial state.

	doneCallback(true);
}

TemplateSetting.prototype.shutdown = function() {
	// This function should unsubscribe the needed notifications and shutdown trigger.
}

//

TemplateSetting.prototype.get = function(doneCallback) {
	// This function should retrieve current settings and return them through callback.

	var systemSettings = {};

	this.getSystemSettings(0, systemSettings, doneCallback);
}

TemplateSetting.prototype.set = function(systemSettings, doneCallback) {
	// This function should set system settings and notify through callback when done.
	
	this.setSystemSettings(0, systemSettings, doneCallback);
}

//

TemplateSetting.prototype.getSystemSettings = function(requestID, systemSettings, doneCallback) {
	// This is a helper function for executing sequential system settings retrieval.

	var requestCallback = this.handleGetResponse.bind(this, requestID, systemSettings, doneCallback);
	
	if(requestID == 0) {
		this.service.request("palm://com.palm.systemservice", {'method': "getPreferences", 
			'parameters': {'subscribe': false, 'keys': ["templateMode"]}, 
			'onComplete': requestCallback} );
	}
	else
		doneCallback(systemSettings);
}

TemplateSetting.prototype.handleGetResponse = function(requestID, systemSettings, doneCallback, serviceResponse) {
	// This is a helper function for handling the response and storing the settings data.

	if(serviceResponse.returnValue) {
		// System request was succesfull so store the data and move to next request.
		
		if(requestID == 0) {
			if(serviceResponse.templateMode == true)
				systemSettings.templateMode = 1;
			else if(serviceResponse.templateMode == false)
				systemSettings.templateMode = 0;
		}
	}
	
	this.getSystemSettings(++requestID, systemSettings, doneCallback);
}

//

TemplateSetting.prototype.setSystemSettings = function(requestID, systemSettings, doneCallback) {
	// This is a helper function for executing sequential system settings applying.

	var requestCallback = this.handleSetResponse.bind(this, requestID, systemSettings, doneCallback);
	
	if(requestID == 0) {
		if(systemSettings.templateMode == undefined)
			this.setSystemSettings(++requestID, systemSettings, doneCallback);
		else {
			if(systemSettings.templateMode == 1)
				var mode = true;
			else if(systemSettings.templateMode == 0)
				var mode = false;
				
			this.service.request("palm://com.palm.systemservice", {'method': "setPreferences", 
				'parameters': {'templateMode': mode}, 'onComplete': requestCallback});		
		}
	}
	else
		doneCallback();
}

//

TemplateSetting.prototype.handleSetResponse = function(requestID, systemSettings, doneCallback, serviceResponse) {
	// This is a helper function for handling the response of system settings applying.

	this.setSystemSettings(++requestID, systemSettings, doneCallback);
}	

