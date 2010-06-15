function NetworkSetting(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
	
	this.labels = new Array("network type", "data roaming", "voice roaming");
}

//

NetworkSetting.prototype.get = function(callback) {
	var settings = {"networkType": 0, "networkData": 0, "networkVoice": 0};
	
	this.getSystemSettings(0, 0, settings, callback);
}

NetworkSetting.prototype.set = function(settings, callback) {
	var current = {"networkType": 0, "networkData": 0, "networkVoice": 0};
	
	this.getSystemSettings(0, 0, current, this.apply.bind(this, current, settings, callback));
}

//

NetworkSetting.prototype.apply = function(current, requested, callback) {
	var settings = {"networkType": 0, "networkData": 0, "networkVoice": 0};

	if(current.networkType != requested.networkType)
		settings.networkType = requested.networkType;
		
	if(current.networkData != requested.networkData)
		settings.networkData = requested.networkData;

	if(current.networkVoice != requested.networkVoice)
		settings.networkVoice = requested.networkVoice;

	this.setSystemSettings(0, 0, settings, callback);
}

//

NetworkSetting.prototype.getSystemSettings = function(request, retry, settings, callback) {
	var completeCallback = this.handleGetResponse.bind(this, request, retry, settings, callback);
	
	if(request == 0) {
		this.service.request("palm://com.palm.telephony/", { method: 'ratQuery',
			parameters: {'subscribe': false}, onComplete: completeCallback });
	}
	else if(request == 1) {
		this.service.request("palm://com.palm.preferences/appProperties/", { method: 'Get', 
			parameters: {'appId': "com.palm.wan", 'key': "roamguard"}, onComplete: completeCallback });
	}
	else if(request == 2) {
		this.service.request("palm://com.palm.telephony/", { method: 'roamModeQuery', 
			parameters: {'subscribe':false}, onComplete: completeCallback });
	}
	else
		callback(settings);
}

NetworkSetting.prototype.handleGetResponse = function(request, retry, settings, callback, response) {
	if((response.returnValue) || (response.returnValue == undefined)) {
		// System request was succesfull so store the data and move to next request.
		
		Mojo.Log.info("Succesful " + this.labels[request] + " request");

		if(request == 0) {
			if(response.extended.mode == "automatic")
				settings.networkType = 1;
			else if(response.extended.mode == "gsm")
				settings.networkType = 2;
			else
				settings.networkType = 3;
		}
		else if(request == 1) {
			if(response.roamguard.roamguard == "neverblock")
				settings.networkData = 1;
			else
				settings.networkData = 2;
		}
		else if(request == 2) {
			Mojo.Log.error("DEBUG VOICE ROAM " + Object.toJSON(response));
		
			if(response.extended) {
				if(response.extended.mode == "homeonly")
					settings.networkVoice = 2;
				else if(response.extended.mode == "roamonly")
					settings.networkVoice = 3;
				else
					settings.networkVoice = 1;
			}
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

//

NetworkSetting.prototype.setSystemSettings = function(request, retry, settings, callback) {
	var completeCallback = this.handleSetResponse.bind(this, request, retry, settings, callback);
	
	if(request == 0) {
		if(settings.networkType == 0)
			this.setSystemSettings(++request, 0, settings, callback);
		else {		
			if(settings.networkType == 2)
				var mode = "gsm";
			else if(settings.networkType == 3)
				var mode = "umts";
			else 
				var mode = "automatic";
	
			this.service.request('palm://com.palm.telephony/', { method: 'ratSet', 
				parameters: {'mode': mode}, onComplete: completeCallback });
		}
	}
	else if(request == 1) {
		if(settings.networkData == 0)
			this.setSystemSettings(++request, 0, settings, callback);
		else {	
			if(settings.networkData == 1)
				var roamguard = "disable";
			else
				var roamguard = "enable";
	
			this.service.request('palm://com.palm.wan/', { method: 'set', 
				parameters: {'roamguard': roamguard}, onComplete: completeCallback });
		}
	}
	else if(request == 2) {
		if(settings.networkVoice == 0)
			this.setSystemSettings(++request, 0, settings, callback);
		else {
			if(settings.networkVoice == 2)
				var roammode = "homeonly";
			else if(settings.networkVoice == 3)
				var roammode = "roamonly";
			else
				var roammode = "any";
			
			this.service-request('palm://com.palm.telephony', {
				method: 'roamModeSet', parameters: {mode: roammode,
				client: Mojo.appName} });
		}
	}
	else
		callback();
}

NetworkSetting.prototype.handleSetResponse = function(request, retry, settings, callback, response) {
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

