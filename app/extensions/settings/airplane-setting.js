function AirplaneSetting(Control) {
	this.service = Control.service;
}

//

AirplaneSetting.prototype.init = function(doneCallback) {
	doneCallback(true);
}

AirplaneSetting.prototype.shutdown = function() {
}

//

AirplaneSetting.prototype.get = function(doneCallback) {
	var systemSettings = {};

	this.getSystemSettings(0, systemSettings, doneCallback);
}

AirplaneSetting.prototype.set = function(systemSettings, doneCallback) {
	this.setSystemSettings(0, systemSettings, doneCallback);
	
/*	var currentSettings = {};
	
	var applyCallback = this.apply.bind(this, currentSettings, systemSettings, doneCallback);
	
	this.getSystemSettings(0, currentSettings, applyCallback);
*/
}

//

AirplaneSetting.prototype.apply = function(currentSettings, requestedSettings, doneCallback) {
	var systemSettings = {};

	if((requestedSettings.airplaneMode) && (currentSettings.airplaneMode != requestedSettings.airplaneMode))
		systemSettings.airplaneMode = requestedSettings.airplaneMode;
	
	this.setSystemSettings(0, systemSettings, doneCallback);
}

//

AirplaneSetting.prototype.getSystemSettings = function(requestID, systemSettings, doneCallback) {
	var requestCallback = this.handleGetResponse.bind(this, requestID, systemSettings, doneCallback);
	
	if(requestID == 0) {
		this.service.request("palm://com.palm.systemservice/", {'method': "getPreferences", 
			'parameters': {'subscribe': false, 'keys': ["airplaneMode"]}, 
			'onComplete': requestCallback});
	}
	else
		doneCallback(systemSettings);
}

AirplaneSetting.prototype.handleGetResponse = function(requestID, systemSettings, doneCallback, serviceResponse) {
	if(serviceResponse.returnValue) {	
		if(requestID == 0) {
			if(serviceResponse.airplaneMode == true)
				systemSettings.airplaneMode = 1;
			else if(serviceResponse.airplaneMode == false)
				systemSettings.airplaneMode = 0;
		}
	}
	
	this.getSystemSettings(++requestID, systemSettings, doneCallback);
}

//

AirplaneSetting.prototype.setSystemSettings = function(requestID, systemSettings, doneCallback) {
	var requestCallback = this.handleSetResponse.bind(this, requestID, systemSettings, doneCallback);
	
	if(requestID == 0) {
		if(systemSettings.airplaneMode == undefined)
			this.setSystemSettings(++requestID, systemSettings, doneCallback);
		else {
			if(systemSettings.airplaneMode == 1)
				var airplaneMode = true;
			else if(systemSettings.airplaneMode == 0)
				var airplaneMode = false;
				
			this.service.request("palm://com.palm.systemservice/", {'method': "setPreferences", 
				'parameters': {'airplaneMode': airplaneMode}, 'onSuccess': requestCallback});		
		}
	}
	else
		doneCallback();
}

AirplaneSetting.prototype.handleSetResponse = function(requestID, systemSettings, doneCallback, serviceResponse) {
	this.setSystemSettings(++requestID, systemSettings, doneCallback);
}	

