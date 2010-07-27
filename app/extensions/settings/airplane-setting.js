function AirplaneSetting(ServiceRequestWrapper) {
	
	this.service = ServiceRequestWrapper;
}

//

AirplaneSetting.prototype.init = function(callback) {
	callback(true);
}

AirplaneSetting.prototype.shutdown = function() {
}

//

AirplaneSetting.prototype.get = function(callback) {
	var settings = {};

	this.getSystemSettings(0, settings, callback);
}

AirplaneSetting.prototype.set = function(settings, callback) {
	var current = {};
	
	var applyCallback = this.apply.bind(this, current, settings, callback);
	
	this.getSystemSettings(0, current, applyCallback);
}

//

AirplaneSetting.prototype.apply = function(current, requested, callback) {
	var settings = {};

	if((requested.airplaneMode) && (current.airplaneMode != requested.airplaneMode))
		settings.airplaneMode = requested.airplaneMode;
	
	this.setSystemSettings(0, settings, callback);
}

//

AirplaneSetting.prototype.getSystemSettings = function(request, settings, callback) {
	var completeCallback = this.handleGetResponse.bind(this, request, settings, callback);
	
	if(request == 0) {
		this.service.request("palm://com.palm.systemservice/", {'method': "getPreferences", 
			'parameters': {'subscribe': false, 'keys': ["airplaneMode"]}, 
			'onComplete': completeCallback});
	}
	else
		callback(settings);
}

AirplaneSetting.prototype.handleGetResponse = function(request, settings, callback, response) {
	if(response.returnValue) {	
		if(request == 0) {
			if(response.airplaneMode == true)
				settings.airplaneMode = 1;
			else if(response.airplaneMode == false)
				settings.airplaneMode = 0;
		}
	}
	
	this.getSystemSettings(++request, settings, callback);
}

//

AirplaneSetting.prototype.setSystemSettings = function(request, settings, callback) {
	var completeCallback = this.handleSetResponse.bind(this, request, settings, callback);
	
	if(request == 0) {
		if(settings.airplaneMode == undefined)
			this.setSystemSettings(++request, settings, callback);
		else {
			if(settings.airplaneMode == 1)
				var airplaneMode = true;
			else if(settings.airplaneMode == 0)
				var airplaneMode = false;
				
			this.service.request("palm://com.palm.systemservice/", {'method': "setPreferences", 
				'parameters': {'airplaneMode': airplaneMode}, 'onSuccess': completeCallback});		
		}
	}
	else
		callback();
}

AirplaneSetting.prototype.handleSetResponse = function(request, settings, callback, response) {
	this.setSystemSettings(++request, settings, callback);
}	

