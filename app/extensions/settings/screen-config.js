function ScreenConfig() {
}

ScreenConfig.prototype.version = function() {
	return "1.1";
}

//

ScreenConfig.prototype.label = function() {
	return "Screen Settings";
}

//

ScreenConfig.prototype.activate = function() {
}

ScreenConfig.prototype.deactivate = function() {
}

//

ScreenConfig.prototype.setup = function(sceneController) {
	// Screen brightness slider, timeout and wallpaper selector
	
	this.controller = sceneController;

	this.choicesScreenSelector = [
		{'label': sceneController.defaultChoiseLabel, 'value': -1},
		{'label': "Minimum", 'value': 0},
		{'label': "Maximum", 'value': 100} ];  

	sceneController.setupWidget("ScreenBrightnessSelector", {'label': "Brightness", 
		'labelPlacement': "left", 'modelProperty': "screenBrightnessLevel",
		'choices': this.choicesScreenSelector});
		
	sceneController.setupWidget("ScreenBrightnessSlider", {'minValue': -1, 'maxValue': 100, 
		'round': true, 'modelProperty': "screenBrightnessLevel"});

	this.choicesBlinkSelector = [
		{'label': sceneController.defaultChoiseLabel, 'value': -1},		
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 0} ];  

	sceneController.setupWidget("ScreenBlinkSelector", {'label': "Blink Notify", 
		'labelPlacement': "left", 'modelProperty': "screenBlinkNotify",
		'choices': this.choicesBlinkSelector});

	this.choicesLockedSelector = [
		{'label': sceneController.defaultChoiseLabel, 'value': -1},		
		{'label': "Enabled", 'value': 1},
		{'label': "Disabled", 'value': 0} ];  

	sceneController.setupWidget("ScreenLockedSelector", {'label': "Locked Notify", 
		'labelPlacement': "left", 'modelProperty': "screenLockedNotify",
		'choices': this.choicesBlinkSelector});
		
	this.choicesTimeoutSelector = [
		{'label': sceneController.defaultChoiseLabel, 'value': -1},
		{'label': "15 Seconds", 'value': 15},
		{'label': "30 Seconds", 'value': 30},
		{'label': "1 Minute", 'value': 60},
		{'label': "2 Minutes", 'value': 120},
		{'label': "3 Minutes", 'value': 180},
		{'label': "5 Minutes", 'value': 300} ];  

	sceneController.setupWidget("ScreenTimeoutSelector",	{'label': "Turn off After", 
		'labelPlacement': "left", 'modelProperty': "screenTurnOffTimeout",
		'choices': this.choicesTimeoutSelector});

	this.choicesWallpaperSelector = [
		{'label': sceneController.defaultChoiseLabel, 'value': ""},
		{'label': "Select", 'value': "select"} ];  

	sceneController.setupWidget("ScreenWallpaperSelector", {'label': "Wallpaper", 
		'labelPlacement': "left", 'modelProperty': "screenWallpaperName",
		'choices': this.choicesWallpaperSelector});
			
	// Listen for tap event for wallpaper selector
	
	sceneController.listen(sceneController.get("SettingsList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

ScreenConfig.prototype.config = function() {
	var settingConfig = {
		'screenBrightnessLevel': -1, 
		'screenTurnOffTimeout': -1, 
		'screenBlinkNotify': -1, 
		'screenLockedNotify': -1, 
		'screenWallpaperName': "", 
		'screenWallpaperPath': "" };
	
	return settingConfig;
}

//

ScreenConfig.prototype.load = function(preferences) {
	var settingConfig = this.config();
	
	if(preferences.screenBrightnessLevel != undefined)
		settingConfig.screenBrightnessLevel = preferences.screenBrightnessLevel;

	if(preferences.screenTurnOffTimeout != undefined)
		settingConfig.screenTurnOffTimeout = preferences.screenTurnOffTimeout;

	if(preferences.screenBlinkNotify != undefined)
		settingConfig.screenBlinkNotify = preferences.screenBlinkNotify;

	if(preferences.screenLockedNotify != undefined)
		settingConfig.screenLockedNotify = preferences.screenLockedNotify; 

	if(preferences.screenWallpaper != undefined) {
		settingConfig.screenWallpaperName = preferences.screenWallpaper.name;
		settingConfig.screenWallpaperPath = preferences.screenWallpaper.path;
	}
	
	return settingConfig;
}

ScreenConfig.prototype.save = function(settingConfig) {
	var preferences = {};

	if(settingConfig.screenBrightnessLevel != -1)
		preferences.screenBrightnessLevel = settingConfig.screenBrightnessLevel;

	if(settingConfig.screenTurnOffTimeout != -1)
		preferences.screenTurnOffTimeout = settingConfig.screenTurnOffTimeout;
	
	if(settingConfig.screenBlinkNotify != -1)
		preferences.screenBlinkNotify = settingConfig.screenBlinkNotify;
		
	if(settingConfig.screenLockedNotify != -1)
		preferences.screenLockedNotify = settingConfig.screenLockedNotify;
			
	if(settingConfig.screenWallpaperName.length != 0) {
		preferences.screenWallpaper = {
			'name': settingConfig.screenWallpaperName,
			'path': settingConfig.screenWallpaperPath };
	}
	
	return preferences;
}

//

ScreenConfig.prototype.handleListChange = function(changeEvent) {
	if(changeEvent.property == "screenWallpaperName") {
		changeEvent.model.screenWallpaperName = "";
		changeEvent.model.screenWallpaperPath = "";		
		
		this.controller.modelChanged(changeEvent.model, this);

		if(changeEvent.value == "select") {
			this.executeWallpaperSelect(changeEvent.model);
		}
	}	
}

//

ScreenConfig.prototype.executeWallpaperSelect = function(eventModel) {
	Mojo.FilePicker.pickFile({'defaultKind': "image", 'kinds': ["image"], 'actionType': "open", 
		'actionName': "Select wallpaper", 'crop': {'width': 318, 'height': 479}, 'onSelect': 
			function(eventModel, serviceResponse) {
				if((!serviceResponse) || (!serviceResponse.fullPath)) {
					eventModel.screenWallpaperName = "";
					eventModel.screenWallpaperPath = "";

					this.controller.modelChanged(eventModel, this);
					
					return;
				}
	
				var params = {'target': encodeURIComponent(serviceResponse.fullPath)};
	
				if(serviceResponse.cropInfo.window) {
					if(serviceResponse.cropInfo.window.scale)
						params['scale'] = serviceResponse.cropInfo.window.scale;
		
					if(serviceResponse.cropInfo.window.focusX)
						params['focusX'] = serviceResponse.cropInfo.window.focusX;
		
					if(serviceResponse.cropInfo.window.focusY)
						params['focusY'] = serviceResponse.cropInfo.window.focusY;
				}			
		
				this.controller.serviceRequest("palm://com.palm.systemservice/wallpaper/", {
					'method': "importWallpaper", 
					'parameters': params,
					'onSuccess': function(eventModel, serviceResponse) {
						if(serviceResponse.wallpaper) {
							eventModel.screenWallpaperName = serviceResponse.wallpaper.wallpaperName;
							eventModel.screenWallpaperPath = serviceResponse.wallpaper.wallpaperFile;
						}
						else {
							eventModel.screenWallpaperName = "";
							eventModel.screenWallpaperPath = "";
						}
						
						this.controller.modelChanged(eventModel, this);
					}.bind(this, eventModel),
					'onFailure': function(serviceResponse) {
						eventModel.screenWallpaperName = "";
						eventModel.screenWallpaperPath = "";

						this.controller.modelChanged(eventModel, this);			
					}.bind(this, eventModel)});
			}.bind(this, eventModel)},
		this.controller.stageController);
}

