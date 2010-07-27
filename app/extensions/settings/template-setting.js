function TemplateSetting(ServiceRequestWrapper) {
	// The service request wrapper needs to be used for making system requests.
		
	this.service = ServiceRequestWrapper;
}

//

TemplateSetting.prototype.get = function(callback) {
	// This function should retrieve current settings and return them through callback.

	var settings = {};

	this.getSystemSettings(0, settings, callback);
}

TemplateSetting.prototype.set = function(settings, callback) {
	// This function should set system settings and notify through callback when done.
	
	this.setSystemSettings(0, settings, callback);
}

//

TemplateSetting.prototype.getSystemSettings = function(request, settings, callback) {
	// This is a helper function for executing sequential system settings retrieval.

	var completeCallback = this.handleGetResponse.bind(this, request, settings, callback);
	
	if(request == 0) {
		this.service.request("palm://com.palm.systemservice", {'method': "getPreferences", 
			'parameters': {'subscribe': false, 'keys': ["templateMode"]}, 
			'onComplete': completeCallback} );
	}
	else
		callback(settings);
}

TemplateSetting.prototype.handleGetResponse = function(request, settings, callback, response) {
	// This is a helper function for handling the response and storing the settings data.

	if(response.returnValue) {
		// System request was succesfull so store the data and move to next request.
		
		if(request == 0) {
			if(response.templateMode == true)
				settings.templateMode = 1;
			else if(response.templateMode == false)
				settings.templateMode = 0;
		}
	}
	
	this.getSystemSettings(++request, settings, callback);
}

//

TemplateSetting.prototype.setSystemSettings = function(request, settings, callback) {
	// This is a helper function for executing sequential system settings applying.

	var completeCallback = this.handleSetResponse.bind(this, request, settings, callback);
	
	if(request == 0) {
		if(settings.templateMode == undefined)
			this.setSystemSettings(++request, settings, callback);
		else {
			if(settings.templateMode == 1)
				var mode = true;
			else if(settings.templateMode == 0)
				var mode = false;
				
			this.service.request("palm://com.palm.systemservice", {'method': "setPreferences", 
				'parameters': {'templateMode': mode}, 'onComplete': completeCallback});		
		}
	}
	else
		callback();
}

//

TemplateSetting.prototype.handleSetResponse = function(request, settings, callback, response) {
	// This is a helper function for handling the response of system settings applying.

	this.setSystemSettings(++request, settings, callback);
}	

