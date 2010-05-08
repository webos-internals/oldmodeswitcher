function RingtoneSetting(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
	
	this.labels = new Array("ringer", "ringtone");
}

//

RingtoneSetting.prototype.get = function(callback) {
	var settings = {"ringerRingerOn": 1, "ringerRingerOff": 1, "ringerRingtoneName": "", "ringerRingtonePath": ""};
	
	this.getSystemSettings(0, 0, settings, callback);
}

RingtoneSetting.prototype.set = function(settings, callback) {
	this.setSystemSettings(0, 0, settings, callback);
}

//

RingtoneSetting.prototype.getSystemSettings = function(request, retry, settings, callback) {
	var completeCallback = this.handleGetResponse.bind(this, request, retry, settings, callback);
	
	if(request == 0) {
		this.service.request('palm://com.palm.audio/vibrate/', { method: 'get',
			parameters: {}, onComplete: completeCallback });
	}
	else if(request == 1) {
		this.service.request("palm://com.palm.systemservice/", { method: 'getPreferences', 
			parameters: {'subscribe':false, 'keys': ["ringtone"]}, onComplete: completeCallback });
	}
	else
		callback(settings);
}

RingtoneSetting.prototype.handleGetResponse = function(request, retry, settings, callback, response) {
	if((response.returnValue) || (response.returnValue == undefined)) {
		// System request was succesfull so store the data and move to next request.
		
		Mojo.Log.info("Succesful " + this.labels[request] + " request");
		
		if(request == 0) {
			if(response.VibrateWhenRingerOn == false)
				settings.ringerRingerOn = 2;
			else
				settings.ringerRingerOn = 1;

			if(response.VibrateWhenRingerOff == false)
				settings.ringerRingerOff = 2;
			else
				settings.ringerRingerOff = 1;
		}
		else if(request == 1) {
			settings.ringerRingtoneName = response.ringtone.name;
			settings.ringerRingtonePath = response.ringtone.fullPath;
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

RingtoneSetting.prototype.setSystemSettings = function(request, retry, settings, callback) {
	var completeCallback = this.handleSetResponse.bind(this, request, retry, settings, callback);
	
	if(request == 0) {
		if(settings.ringerRingerOn == 1)
			var ringerOn = true;
		else
			var ringerOn = false;

		if(settings.ringerRingerOff == 1)
			var ringerOff = true;
		else
			var ringerOff = false;

		this.service.request('palm://com.palm.audio/vibrate/', { method: 'set', 
			parameters: {"VibrateWhenRingerOn": ringerOn, "VibrateWhenRingerOff": ringerOff}, 
			onComplete: completeCallback });
	}
	else if(request == 1) {
		var ringtone = {
			name: settings.ringerRingtoneName, 
			fullPath: settings.ringerRingtonePath
		};
	
		this.service.request("palm://com.palm.systemservice/", { method: 'setPreferences', 
			parameters: {"ringtone": ringtone}, onComplete: completeCallback });
	}
	else
		callback();
}

RingtoneSetting.prototype.handleSetResponse = function(request, retry, settings, callback, response) {
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

