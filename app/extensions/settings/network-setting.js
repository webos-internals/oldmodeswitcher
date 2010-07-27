function NetworkSetting(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
}

//

NetworkSetting.prototype.get = function(callback) {
	var settings = {};
	
	this.getSystemSettings(0, settings, callback);
}

NetworkSetting.prototype.set = function(settings, callback) {
	var current = {};
	
	var applyCallback = this.apply.bind(this, current, settings, callback);
	
	this.getSystemSettings(0, current, applyCallback);
}

//

NetworkSetting.prototype.apply = function(current, requested, callback) {
	var settings = {};

	if((requested.networkType != undefined) && (current.networkType != requested.networkType))
		settings.networkType = requested.networkType;
		
	if((requested.networkData != undefined) && (current.networkData != requested.networkData))
		settings.networkData = requested.networkData;

	if((requested.networkVoice != undefined) && (current.networkVoice != requested.networkVoice))
		settings.networkVoice = requested.networkVoice;

	this.setSystemSettings(0, settings, callback);
}

//

NetworkSetting.prototype.getSystemSettings = function(request, settings, callback) {
	var completeCallback = this.handleGetResponse.bind(this, request, settings, callback);
	
	if(request == 0) {
		this.service.request("palm://com.palm.telephony/", {'method': "ratQuery",
			'parameters': {'subscribe': false}, 'onComplete': completeCallback});
	}
	else if(request == 1) {
		this.service.request("palm://com.palm.preferences/appProperties/", {'method': "Get", 
			'parameters': {'appId': "com.palm.wan", 'key': "roamguard"}, 
			'onComplete': completeCallback});
	}
	else if(request == 2) {
		this.service.request("palm://com.palm.telephony/", {'method': "roamModeQuery", 
			'parameters': {'subscribe': false}, 'onComplete': completeCallback});
	}
	else
		callback(settings);
}

NetworkSetting.prototype.handleGetResponse = function(request, settings, callback, response) {
	if(response.returnValue) {
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
			if(response.extended) {
				if(response.extended.mode == "homeonly")
					settings.networkVoice = 2;
				else if(response.extended.mode == "roamonly")
					settings.networkVoice = 3;
				else
					settings.networkVoice = 1;
			}
		}		
	}

	this.getSystemSettings(++request, settings, callback);
}

//

NetworkSetting.prototype.setSystemSettings = function(request, settings, callback) {
	var completeCallback = this.handleSetResponse.bind(this, request, settings, callback);
	
	if(request == 0) {
		if(settings.networkType == undefined)
			this.setSystemSettings(++request, settings, callback);
		else {		
			if(settings.networkType == 2)
				var mode = "gsm";
			else if(settings.networkType == 3)
				var mode = "umts";
			else 
				var mode = "automatic";
	
			this.service.request("palm://com.palm.telephony/", {'method': "ratSet", 
				'parameters': {'mode': mode}, 'onComplete': completeCallback});
		}
	}
	else if(request == 1) {
		if(settings.networkData == undefined)
			this.setSystemSettings(++request, settings, callback);
		else {	
			if(settings.networkData == 1)
				var roamguard = "disable";
			else
				var roamguard = "enable";
	
			this.service.request("palm://com.palm.wan/", {'method': "set", 
				'parameters': {'roamguard': roamguard}, 
				'onComplete': completeCallback });
		}
	}
	else if(request == 2) {
		if(settings.networkVoice == undefined)
			this.setSystemSettings(++request, settings, callback);
		else {
			if(settings.networkVoice == 2)
				var roammode = "homeonly";
			else if(settings.networkVoice == 3)
				var roammode = "roamonly";
			else
				var roammode = "any";
			
			this.service-request("palm://com.palm.telephony/", {'method': "roamModeSet", 
				'parameters': {'mode': roammode,	'client': Mojo.appName}});
		}
	}
	else
		callback();
}

NetworkSetting.prototype.handleSetResponse = function(request, settings, callback, response) {
	this.setSystemSettings(++request, settings, callback);
}	

