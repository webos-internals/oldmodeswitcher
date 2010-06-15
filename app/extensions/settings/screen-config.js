function ScreenConfig() {
}

//

ScreenConfig.prototype.label = function() {
	return "Screen Settings";
}

//

ScreenConfig.prototype.setup = function(controller) {
	// Screen brightness slider, timeout and wallpaper selector
	
	this.controller = controller;
	
	controller.setupWidget("ScreenSlider", {'minValue': 0, 'maxValue': 100, 
		'round': true, 'modelProperty': "screenBrightnessLevel"});

	this.choicesBlinkSelector = [
		{'label': "Do Not Set", 'value': 0},		
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 2}];  

	controller.setupWidget("BlinkSelector", {'label': "Blink Notify", 
		'labelPlacement': "left", 'modelProperty': "screenBlinkNotify",
		'choices': this.choicesBlinkSelector});
		
	this.choicesTimeoutSelector = [
		{'label': "Do Not Set", 'value': 0},
		{'label': "15 Seconds", 'value': 15},
		{'label': "30 Seconds", 'value': 30},
		{'label': "1 Minute", 'value': 60},
		{'label': "2 Minutes", 'value': 120},
		{'label': "3 Minutes", 'value': 180},
		{'label': "5 Minutes", 'value': 300}];  

	controller.setupWidget("TimeoutSelector",	{'label': "Turn off After", 
		'labelPlacement': "left", 'modelProperty': "screenTurnOffTimeout",
		'choices': this.choicesTimeoutSelector});
	
	// Listen for tap event for wallpaper selector
	
	Mojo.Event.listen(controller.get("SettingsList"), Mojo.Event.listTap, 
		this.handleListTap.bind(this));
}

//

ScreenConfig.prototype.load = function(preferences) {
	var config = {
		'screenBrightnessLevel': preferences.screenBrightnessLevel,
		'screenTurnOffTimeout': preferences.screenTurnOffTimeout, 
		'screenBlinkNotify': preferences.screenBlinkNotify, 
		'screenWallpaperName': preferences.screenWallpaperName, 
		'screenWallpaperPath': preferences.screenWallpaperPath };
	
	return config;
}

ScreenConfig.prototype.save = function(config) {
	var preferences = {
		'screenBrightnessLevel': config.screenBrightnessLevel,
		'screenTurnOffTimeout': config.screenTurnOffTimeout, 
		'screenBlinkNotify': config.screenBlinkNotify, 
		'screenWallpaperName': config.screenWallpaperName, 
		'screenWallpaperPath': config.screenWallpaperPath };
	
	return preferences;
}

//

ScreenConfig.prototype.config = function() {
	var config = {
		'screenBrightnessLevel': 50, 
		'screenTurnOffTimeout': 0, 
		'screenBlinkNotify': 0, 
		'screenWallpaperName': "Do Not Set*", 
		'screenWallpaperPath': "" };
	
	return config;
}

//

ScreenConfig.prototype.handleListTap = function(event) {
	if(event.model.screen != undefined) {
		if(event.originalEvent.target.id == "WallpaperSelect") {
			this.executeWallpaperSelect(event.model.screen[0]);
		}
	}	
}

//

ScreenConfig.prototype.executeWallpaperSelect = function(config) {
	Mojo.FilePicker.pickFile({'defaultKind': "image", 'kinds': ["image"], 'actionType': "open", 
		'actionName': "Select wallpaper", 'crop': {'width': 318, 'height': 479}, 'onSelect': 
			function(config, payload) {
				if((!payload) || (!payload.fullPath)) {
					config.screenWallpaperName = "Default";
					config.screenWallpaperPath = "";

					this.controller.get("SettingsList").mojo.invalidateItems(0);
					
					return;
				}
	
				var params = {'target': encodeURIComponent(payload.fullPath)};
	
				if(payload.cropInfo.window) {
					if(payload.cropInfo.window.scale)
						params['scale'] = payload.cropInfo.window.scale;
		
					if(payload.cropInfo.window.focusX)
						params['focusX'] = payload.cropInfo.window.focusX;
		
					if(payload.cropInfo.window.focusY)
						params['focusY'] = payload.cropInfo.window.focusY;
				}			
		
				this.controller.serviceRequest("palm://com.palm.systemservice/wallpaper/", {
					'method': "importWallpaper", 
					'parameters': params,
					'onSuccess': function(config, payload) {
						if(payload.wallpaper) {
							config.screenWallpaperName = payload.wallpaper.wallpaperName;
							config.screenWallpaperPath = payload.wallpaper.wallpaperFile;
						}
						else {
							config.screenWallpaperName = "Default";
							config.screenWallpaperPath = "";
						}
						
						this.controller.get("SettingsList").mojo.invalidateItems(0);
					}.bind(this, config),
					'onFailure': function(payload) {
						config.screenWallpaperName = "Default";
						config.screenWallpaperPath = "";

						this.controller.get("SettingsList").mojo.invalidateItems(0);				
					}.bind(this, config)});
			}.bind(this, config)},
		this.controller.stageController);
}

