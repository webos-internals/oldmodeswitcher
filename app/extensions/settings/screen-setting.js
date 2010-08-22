function ScreenSetting(Control) {
	this.service = Control.service;
}

//

ScreenSetting.prototype.init = function(doneCallback) {
	doneCallback(true);
}

ScreenSetting.prototype.shutdown = function() {
}

//

ScreenSetting.prototype.get = function(doneCallback) {
	var systemSettings = {};
	
	this.getSystemSettings(0, systemSettings, doneCallback);
}

ScreenSetting.prototype.set = function(systemSettings, doneCallback) {
	this.setSystemSettings(0, systemSettings, doneCallback);
}

//

ScreenSetting.prototype.getSystemSettings = function(requestID, systemSettings, doneCallback) {
	var requestCallback = this.handleGetResponse.bind(this, requestID, systemSettings, doneCallback);
	
	if(requestID == 0) {
		this.service.request("palm://com.palm.display/control/", {'method': "getProperty",
			'parameters': {'properties': ["maximumBrightness", "timeout"]}, 
			'onComplete': requestCallback});
	}
	else if(requestID == 1) {
		this.service.request("palm://com.palm.systemservice/", {'method': "getPreferences", 
			'parameters': {'subscribe': false, 'keys': ["BlinkNotifications", 
			"showAlertsWhenLocked", "wallpaper"]}, 'onComplete': requestCallback});
	}
	else
		doneCallback(systemSettings);
}

ScreenSetting.prototype.handleGetResponse = function(requestID, systemSettings, doneCallback, serviceResponse) {
	if(serviceResponse.returnValue) {
		if(requestID == 0) {
			systemSettings.screenBrightnessLevel = serviceResponse.maximumBrightness;
			systemSettings.screenTurnOffTimeout = serviceResponse.timeout;
		}
		else if(requestID == 1) {
			if(serviceResponse.BlinkNotifications)
				systemSettings.screenBlinkNotify = 1;
			else
				systemSettings.screenBlinkNotify = 0;			

			if(serviceResponse.showAlertsWhenLocked)
				systemSettings.screenLockedNotify = 1;
			else
				systemSettings.screenLockedNotify = 0;			

			if(serviceResponse.wallpaper.wallpaperName.length != 0) {
				systemSettings.screenWallpaper = {
					'name': serviceResponse.wallpaper.wallpaperName,
					'path': serviceResponse.wallpaper.wallpaperFile };
			}
		}
	}

	this.getSystemSettings(++requestID, systemSettings, doneCallback);
}

//

ScreenSetting.prototype.setSystemSettings = function(requestID, systemSettings, doneCallback) {
	var requestCallback = this.handleSetResponse.bind(this, requestID, systemSettings, doneCallback);
	
	if(requestID == 0) {
		if((systemSettings.screenBrightnessLevel == undefined) && (systemSettings.screenTurnOffTimeout == undefined))
			this.setSystemSettings(++requestID, systemSettings, doneCallback);
		else {
			var params = {};

			if(systemSettings.screenBrightnessLevel != undefined)
				params.maximumBrightness = systemSettings.screenBrightnessLevel;
			
			if(systemSettings.screenTurnOffTimeout != undefined)
				params.timeout = systemSettings.screenTurnOffTimeout;
		
			this.service.request("palm://com.palm.display/control/", {'method': "setProperty",
				'parameters': params, 'onComplete': requestCallback });
		}
	}
	else if(requestID == 1) {
		if((systemSettings.screenBlinkNotify == undefined) && (systemSettings.screenLockedNotify == undefined) &&
			(systemSettings.screenWallpaper == undefined))
		{
			this.setSystemSettings(++requestID, systemSettings, doneCallback);
		}
		else {
			var params = {};
			
			if(systemSettings.screenBlinkNotify != undefined) {
				if(systemSettings.screenBlinkNotify == 1)
					params.BlinkNotifications = true;
				else
					params.BlinkNotifications = false;
			}
			
			if(systemSettings.screenLockedNotify != undefined) {
				if(systemSettings.screenLockedNotify == 1)
					params.showAlertsWhenLocked = true;
				else
					params.showAlertsWhenLocked = false;
			}
			
			if(systemSettings.screenWallpaper != undefined) {
				params.wallpaper = {
					'wallpaperName': systemSettings.screenWallpaper.name,
					'wallpaperFile': systemSettings.screenWallpaper.path };
			}
			
			this.service.request("palm://com.palm.systemservice/", {'method': "setPreferences", 
				'parameters': params, 'onComplete': requestCallback});
		}
	}
	else
		doneCallback();
}

ScreenSetting.prototype.handleSetResponse = function(requestID, systemSettings, doneCallback, serviceResponse) {
	this.setSystemSettings(++requestID, systemSettings, doneCallback);
}	

