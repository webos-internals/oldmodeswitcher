function RingerSetting(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
}

//

RingerSetting.prototype.init = function(callback) {
	callback(true);
}

RingerSetting.prototype.shutdown = function() {
}

//

RingerSetting.prototype.get = function(callback) {
	var settings = {};
	
	this.getSystemSettings(0, settings, callback);
}

RingerSetting.prototype.set = function(settings, callback) {
	this.setSystemSettings(0, settings, callback);
}

//

RingerSetting.prototype.getSystemSettings = function(request, settings, callback) {
	var completeCallback = this.handleGetResponse.bind(this, request, settings, callback);
	
	if(request == 0) {
		this.service.request("palm://com.palm.audio/vibrate/", {'method': "get",
			'parameters': {}, 'onComplete': completeCallback});
	}
	else if(request == 1) {
		this.service.request("palm://com.palm.systemservice/", {'method': "getPreferences", 
			'parameters': {'subscribe': false, 'keys': ["ringtone"]}, 
			'onComplete': completeCallback });
	}
	else
		callback(settings);
}

RingerSetting.prototype.handleGetResponse = function(request, settings, callback, response) {
	if(response.returnValue) {
		if(request == 0) {
			if(response.VibrateWhenRingerOn == false)
				settings.ringerRingerOn = 0;
			else
				settings.ringerRingerOn = 1;

			if(response.VibrateWhenRingerOff == false)
				settings.ringerRingerOff = 0;
			else
				settings.ringerRingerOff = 1;
		}
		else if(request == 1) {
			settings.ringerRingtone = {
				'name': response.ringtone.name,
				'path': response.ringtone.fullPath };
		}
	}

	this.getSystemSettings(++request, settings, callback);
}

//

RingerSetting.prototype.setSystemSettings = function(request, settings, callback) {
	var completeCallback = this.handleSetResponse.bind(this, request, settings, callback);
	
	if(request == 0) {
		if((settings.ringerRingerOn == undefined) && (settings.ringerRingerOff == undefined))
			this.setSystemSettings(++request, settings, callback);
		else {
			var params = {};

			if(settings.ringerRingerOn != undefined) {
				if(settings.ringerRingerOn == 1)
					params.VibrateWhenRingerOn = true;
				else
					params.VibrateWhenRingerOn  = false;
			}
			
			if(settings.ringerRingerOff != undefined) {			
				if(settings.ringerRingerOff == 1)
					params.VibrateWhenRingerOff = true;
				else
					params.VibrateWhenRingerOff = false;
			}
			
			this.service.request("palm://com.palm.audio/vibrate/", {'method': "set", 
				'parameters': params, 'onComplete': completeCallback});
		}
	}
	else if(request == 1) {
		if(settings.ringerRingtone == undefined)
			this.setSystemSettings(++request, settings, callback);
		else {
			var ringtone = {
				'name': settings.ringerRingtone.name,
				'fullPath': settings.ringerRingtone.path };
			
			this.service.request("palm://com.palm.systemservice/", {'method': "setPreferences", 
				'parameters': {'ringtone': ringtone}, 'onComplete': completeCallback});
		}
	}
	else
		callback();
}

RingerSetting.prototype.handleSetResponse = function(request, settings, callback, response) {
	this.setSystemSettings(++request, settings, callback);
}	

