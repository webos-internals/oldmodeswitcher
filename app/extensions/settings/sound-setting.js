function SoundSetting(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
	
	this.labels = new Array("ringer volume", "system volume", "media volume");
}

//

SoundSetting.prototype.get = function(callback) {
	var settings = {"soundRingerVolume": 50, "soundSystemVolume": 50, "soundMediaVolume": 50};
	
	this.getSystemSettings(0, 0, settings, callback);
}

SoundSetting.prototype.set = function(settings, callback) {
	this.setSystemSettings(0, 0, settings, callback);
}

//

SoundSetting.prototype.getSystemSettings = function(request, retry, settings, callback) {
	var completeCallback = this.handleGetResponse.bind(this, request, retry, settings, callback);
	
	if(request == 0) {
		this.service.request('palm://com.palm.audio/ringtone/', { method: 'getVolume',
			parameters: {}, onComplete: completeCallback }); 
	}
	else if(request == 1) {
		this.service.request('palm://com.palm.audio/system/', { method: 'status',
			parameters: {}, onComplete: completeCallback }); 
	}
	else if(request == 2) {
		this.service.request('palm://com.palm.audio/media/', { method: 'status',
			parameters: {}, onComplete: completeCallback }); 
	}
	else
		callback(settings);
}

SoundSetting.prototype.handleGetResponse = function(request, retry, settings, callback, response) {
	if((response.returnValue) || (response.returnValuer == undefined)) {
		// System request was succesfull so store the data and move to next request.
		
		Mojo.Log.info("Succesful " + this.labels[request] + " request");
		
		if(request == 0) {
			settings.soundRingerVolume = response.volume;
		}
		else if(request == 1) {
			settings.soundSystemVolume = response.volume;
		}
		else if(request == 2) {
			settings.soundMediaVolume = response.volume;
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

SoundSetting.prototype.setSystemSettings = function(request, retry, settings, callback) {
	var completeCallback = this.handleSetResponse.bind(this, request, retry, settings, callback);
	
	if(request == 0) {
		var volume = settings.soundRingerVolume;
			
		this.service.request('palm://com.palm.audio/ringtone/', { method: 'setVolume',
			parameters: {"volume": volume}, onComplete: completeCallback });
	}
	else if(request == 1) {
		var volume = settings.soundSystemVolume;
	
		this.service.request('palm://com.palm.audio/system/', { 	method: 'setVolume',
			parameters: {"volume": volume}, onComplete: completeCallback });
	}
	else if(request == 2) {
		var volume = settings.soundMediaVolume;

		this.service.request('palm://com.palm.audio/media/', { method: 'setVolume',
			parameters: {"scenario": "media_back_speaker", "volume": volume},
			onComplete: completeCallback });
	}
	else
		callback();
}

SoundSetting.prototype.handleSetResponse = function(request, retry, settings, callback, response) {
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

