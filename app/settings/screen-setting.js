function ScreenSetting(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
	
	this.labels = new Array("screen params", "screen config");
}

//

ScreenSetting.prototype.get = function(callback) {
	var settings = {"screenBrightnessLevel": 0, "screenTurnOffTimeout": 0, "screenBlinkNotify": 0, "screenWallpaperName": "", "screenWallpaperPath": ""};
	
	this.getSystemSettings(0, 0, settings, callback);
}

ScreenSetting.prototype.set = function(settings, callback) {
	this.setSystemSettings(0, 0, settings, callback);
}

//

ScreenSetting.prototype.getSystemSettings = function(request, retry, settings, callback) {
	var completeCallback = this.handleGetResponse.bind(this, request, retry, settings, callback);
	
	if(request == 0) {
		this.service.request('palm://com.palm.display/control/', { method: 'getProperty',
			parameters:{properties:['maximumBrightness','timeout']}, onComplete: completeCallback });
	}
	else if(request == 1) {
		this.service.request('palm://com.palm.systemservice/', { method: 'getPreferences', 
			parameters: {'subscribe':false, 'keys': ["BlinkNotifications", "wallpaper"]}, onComplete: completeCallback });
	}
	else
		callback(settings);
}

ScreenSetting.prototype.handleGetResponse = function(request, retry, settings, callback, response) {
	if((response.returnValue) || (response.returnValue == undefined)) {
		// System request was succesfull so store the data and move to next request.
		
		Mojo.Log.info("Succesful " + this.labels[request] + " request");
		
		if(request == 0) {
			settings.screenBrightnessLevel = response.maximumBrightness;
			settings.screenTurnOffTimeout = response.timeout;
		}
		else if(request == 1) {
			if(response.BlinkNotifications)
				settings.screenBlinkNotify = 1;
			else
				settings.screenBlinkNotify = 0;			

			settings.screenWallpaperName = response.wallpaper.wallpaperName;
			settings.screenWallpaperPath = response.wallpaper.wallpaperFile;
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

ScreenSetting.prototype.setSystemSettings = function(request, retry, settings, callback) {
	var completeCallback = this.handleSetResponse.bind(this, request, retry, settings, callback);
	
	if(request == 0) {
		var brightness = settings.screenBrightnessLevel;
		
		var timeout = settings.screenTurnOffTimeout;
	
		this.service.request('palm://com.palm.display/control/', { method: 'setProperty',
			parameters: {'maximumBrightness': brightness, 'timeout': timeout},
			onComplete: completeCallback });
	}
	else if(request == 1) {
		if(settings.screenBlinkNotify == 1)
			var blinkNotify = true;
		else
			var blinkNotify = false;
	
		var wallpaper = {
			wallpaperName: settings.screenWallpaperName,
			wallpaperFile: settings.screenWallpaperPath
		}
		
		this.service.request("palm://com.palm.systemservice/", { method: 'setPreferences', 
			parameters: {"BlinkNotifications": blinkNotify, "wallpaper": wallpaper}, onComplete: completeCallback });
	}
	else
		callback();
}

ScreenSetting.prototype.handleSetResponse = function(request, retry, settings, callback, response) {
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

