function AirplaneSetting(ServiceRequestWrapper) {
	
	this.service = ServiceRequestWrapper;
	
	this.labels = new Array("flight mode");
	
}

AirplaneSetting.prototype.get = function(callback) {
	var settings = {"airplaneMode": 0};

	this.getSystemSettings(0, 0, settings, callback);
}

AirplaneSetting.prototype.set = function(settings, callback) {
	this.setSystemSettings(0, 0, settings, callback);
}

AirplaneSetting.prototype.getSystemSettings = function(request, retry, settings, callback) {
	var completeCallback = this.handleGetResponse.bind(this, request, retry, settings, callback);
	
	if(request == 0) {
		this.service.request('palm://com.palm.systemservice', { method: 'getPreferences', 
			parameters: {'subscribe': false}, onComplete: completeCallback });
	}
	else
		callback(settings);
}

AirplaneSetting.prototype.handleGetResponse = function(request, retry, settings, callback, response) {
	if((response.returnValue) || (response.returnValuer == undefined)) {
		// System request was succesfull so store the data and move to next request.
		
		if(request == 0) {
			if (response.airplaneMode == true)
				settings.airplaneMode = 1;
			else
				settings.airplaneMode = 0;
		}
		
		this.getSystemSettings(++request, 0, settings, callback);
	}
	else {
		// System request failed so retry or skip the request.

		if(retry < 2) {
			Mojo.Log.warn("Retrying " + this.labels[request] + " request");
			
			this.getSystemSettings(request, ++retry, settings, callback);
		}
		else {
			Mojo.Log.error("Skipping " + this.labels[request] + " request");
			
			this.getSystemSettings(++request, 0, settings, callback);
		}
	}
}

AirplaneSetting.prototype.setSystemSettings = function(request, retry, settings, callback) {
	var completeCallback = this.handleSetResponse.bind(this, request, retry, settings, callback);
	
	if(request == 0) {
		if(settings.airplaneMode == 1)
			var mode = true;
		else if(settings.airplaneMode == 2)
			var mode = false;
				
		this.service.request('palm://com.palm.systemservice', {
		    method: 'setPreferences',
		    parameters: {"airplaneMode": mode},
		    onSuccess: completeCallback
		});		
	}
	else
		callback();
}

//

AirplaneSetting.prototype.handleSetResponse = function(request, retry, settings, callback, response) {
	if((response.returnValue) || (response.returnValuer == undefined)) {
		// System request was succesful so move to next request.
		
		Mojo.Log.info("Succesful " + this.labels[request] + " request");
		
		this.setSystemSettings(++request, 0, settings, callback);
	}
	else {
		// System request failed so retry or skip the request.
		
		if(retry < 2) {
			Mojo.Log.warn("Retrying " + this.labels[request] + " request");
			
			this.setSystemSettings(request, ++retry, settings, callback);
		}
		else {
			Mojo.Log.error("Skipping " + this.labels[request] + " request");
			
			this.setSystemSettings(++request, 0, settings, callback);
		}
	}
}	

