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
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 0}];  

	controller.setupWidget("BlinkSelector", {'label': "Blink Notify", 
		'labelPlacement': "left", 'modelProperty': "screenBlinkNotify",
		'choices': this.choicesBlinkSelector});
		
	this.choicesTimeoutSelector = [
		{'label': "15 Seconds", 'value': 15},
		{'label': "30 Seconds", 'value': 30},
		{'label': "1 Minute", 'value': 60},
		{'label': "2 Minutes", 'value': 120},
		{'label': "3 Minutes", 'value': 180},
		{'label': "5 Minutes", 'value': 300}];  

	controller.setupWidget("TimeoutSelector",	{'label': "Turn off After", 
		'labelPlacement': "left", 'modelProperty': "screenTurnOffTimeout",
		'choices': this.choicesTimeoutSelector});
}

//

ScreenConfig.prototype.load = function(config, preferences) {
	config.push({'screenBrightnessLevel': preferences.screenBrightnessLevel,
		'screenTurnOffTimeout': preferences.screenTurnOffTimeout, 
		'screenBlinkNotify': preferences.screenBlinkNotify, 
		'screenWallpaperName': preferences.screenWallpaperName, 
		'screenWallpaperPath': preferences.screenWallpaperPath});
}

ScreenConfig.prototype.save = function(config, preferences) {
	preferences.push({'screenBrightnessLevel': config.screenBrightnessLevel,
		'screenTurnOffTimeout': config.screenTurnOffTimeout, 
		'screenBlinkNotify': config.screenBlinkNotify, 
		'screenWallpaperName': config.screenWallpaperName, 
		'screenWallpaperPath': config.screenWallpaperPath});
}

//

ScreenConfig.prototype.append = function(config, saveCallback) {
	config.push({'screenBrightnessLevel': "(querying)", 'screenTurnOffTimeout': "(querying)", 
		'screenBlinkNotify': "(querying)", 'screenWallpaperName': "(querying)", 'screenWallpaperPath': ""});
	
	saveCallback();
}

ScreenConfig.prototype.remove = function(config, index, saveCallback) {
	config.splice(index,1);

	saveCallback();
}

//

ScreenConfig.prototype.changed = function(config, event, saveCallback) {
	saveCallback();
}

ScreenConfig.prototype.tapped = function(config, event, saveCallback) {
	if(event.target.id == "Wallpaper") {
		this.executeWallpaperSelect(config, saveCallback);
	}
}

//

ScreenConfig.prototype.executeWallpaperSelect = function(config, saveCallback) {
	Mojo.FilePicker.pickFile({'defaultKind': "image", 'kinds': ["image"], 'actionType': "open", 
		'actionName': "Select wallpaper", 'crop': {'width': 318, 'height': 479}, 'onSelect': 
			function(config, saveCallback, payload) {
				if((!payload) || (!payload.fullPath)) {
					config.screenWallpaperName = "Default";
					config.screenWallpaperPath = "";

					saveCallback();
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
					'onSuccess': function(config, saveCallback, payload) {
						if(payload.wallpaper) {
							config.screenWallpaperName = payload.wallpaper.wallpaperName;
							config.screenWallpaperPath = payload.wallpaper.wallpaperFile;
						}
						else {
							config.screenWallpaperName = "Default";
							config.screenWallpaperPath = "";
						}
					
						saveCallback();
					}.bind(this, config, saveCallback),
					'onFailure': function(payload) {
						config.screenWallpaperName = "Default";
						config.screenWallpaperPath = "";
				
						saveCallback();
					}.bind(this, config, saveCallback)});
			}.bind(this, config, saveCallback)},
		this.controller.stageController);
}

