function ScreenSetting(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;
}

//

ScreenSetting.prototype.init = function(callback) {
	callback(true);
}

ScreenSetting.prototype.shutdown = function() {
}

//

ScreenSetting.prototype.get = function(callback) {
	var settings = {};
	
	this.getSystemSettings(0, settings, callback);
}

ScreenSetting.prototype.set = function(settings, callback) {
	this.setSystemSettings(0, settings, callback);
}

//

ScreenSetting.prototype.getSystemSettings = function(request, settings, callback) {
	var completeCallback = this.handleGetResponse.bind(this, request, settings, callback);
	
	if(request == 0) {
		this.service.request("palm://com.palm.display/control/", {'method': "getProperty",
			'parameters': {'properties': ["maximumBrightness", "timeout"]}, 
			'onComplete': completeCallback});
	}
	else if(request == 1) {
		this.service.request("palm://com.palm.systemservice/", {'method': "getPreferences", 
			'parameters': {'subscribe': false, 'keys': ["BlinkNotifications", 
			"showAlertsWhenLocked", "wallpaper"]}, 'onComplete': completeCallback});
	}
	else
		callback(settings);
}

ScreenSetting.prototype.handleGetResponse = function(request, settings, callback, response) {
	if(response.returnValue) {
		if(request == 0) {
			settings.screenBrightnessLevel = response.maximumBrightness;
			settings.screenTurnOffTimeout = response.timeout;
		}
		else if(request == 1) {
			if(response.BlinkNotifications)
				settings.screenBlinkNotify = 1;
			else
				settings.screenBlinkNotify = 0;			

			if(response.showAlertsWhenLocked)
				settings.screenLockedNotify = 1;
			else
				settings.screenLockedNotify = 0;			

			if(response.wallpaper.wallpaperName.length != 0) {
				settings.screenWallpaper = {
					'name': response.wallpaper.wallpaperName,
					'path': response.wallpaper.wallpaperFile };
			}
		}
	}

	this.getSystemSettings(++request, settings, callback);
}

//

ScreenSetting.prototype.setSystemSettings = function(request, settings, callback) {
	var completeCallback = this.handleSetResponse.bind(this, request, settings, callback);
	
	if(request == 0) {
		if((settings.screenBrightnessLevel == undefined) && (settings.screenTurnOffTimeout == undefined))
			this.setSystemSettings(++request, settings, callback);
		else {
			var params = {};

			if(settings.screenBrightnessLevel != undefined)
				params.maximumBrightness = settings.screenBrightnessLevel;
			
			if(settings.screenTurnOffTimeout != undefined)
				params.timeout = settings.screenTurnOffTimeout;
		
			this.service.request("palm://com.palm.display/control/", {'method': "setProperty",
				'parameters': params, 'onComplete': completeCallback });
		}
	}
	else if(request == 1) {
		if((settings.screenBlinkNotify == undefined) && (settings.screenLockedNotify == undefined) &&
			(settings.screenWallpaper == undefined))
		{
			this.setSystemSettings(++request, settings, callback);
		}
		else {
			var params = {};
			
			if(settings.screenBlinkNotify != undefined) {
				if(settings.screenBlinkNotify == 1)
					params.BlinkNotifications = true;
				else
					params.BlinkNotifications = false;
			}
			
			if(settings.screenLockedNotify != undefined) {
				if(settings.screenLockedNotify == 1)
					params.showAlertsWhenLocked = true;
				else
					params.showAlertsWhenLocked = false;
			}
			
			if(settings.screenWallpaper != undefined) {
				params.wallpaper = {
					'wallpaperName': settings.screenWallpaper.name,
					'wallpaperFile': settings.screenWallpaper.path };
			}
			
			this.service.request("palm://com.palm.systemservice/", {'method': "setPreferences", 
				'parameters': params, 'onComplete': completeCallback});
		}
	}
	else
		callback();
}

ScreenSetting.prototype.handleSetResponse = function(request, settings, callback, response) {
	this.setSystemSettings(++request, settings, callback);
}	

