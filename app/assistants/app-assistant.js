/*
 *    AppAssistant - App Assistant for Mode Launcher
 */

function AppAssistant(appController) {
	/* This is the creator function for your app assistant object (the first created scene). */

	// Initialize global variables

	this.appid = "com.palm.org.e-lnx.wee.apps.modeswitcher";

	this.config = {}; 
	
	this.initiated = false;

	this.modesList = new Array();

	this.applications = new Array();
	this.settings = new Array();
	this.triggers = new Array();

	// Initialize utility classes

	ServiceRequestWrapper = new ServiceRequest();

	AppsManagerWrapper = new AppsManager(ServiceRequestWrapper);
	ConfigManagerWrapper = new ConfigManager(ServiceRequestWrapper);

	ScreenControlWrapper = new ScreenControl(ServiceRequestWrapper);

	SystemAlarmsWrapper = new SystemAlarms(ServiceRequestWrapper);
	SystemNotifierWrapper = new SystemNotifier(ServiceRequestWrapper);
}

//

AppAssistant.prototype.setup = function() {
	/* This function is for setup tasks that have to happen when the scene is first created. */

	Mojo.Log.error("DEBUG: Setting up Mode Switcher");

	ScreenControlWrapper.setup();
	
	// Default configuration.
		
	this.config.modeSwitcher = {activated: 0, timerStart: 10, timerClose: 10, apiVersion: 1, cfgVersion: 1}; 
	
	this.config.modesConfig = new Array(); this.config.currentMode = null; this.config.defaultMode = null;	

	// Available applications extensions.

	ExtDefaultConfig = new DefaultConfig(ServiceRequestWrapper); 
	ExtBrowserConfig = new BrowserConfig(ServiceRequestWrapper); 
	ExtGovnahConfig = new GovnahConfig(ServiceRequestWrapper);
	ExtPhoneConfig = new PhoneConfig(ServiceRequestWrapper);  
	ExtWWindowConfig = new WWindowConfig(ServiceRequestWrapper);
		
	this.applications.push({"id": "default", "appid": "default", "config": ExtDefaultConfig});
	this.applications.push({"id": "browser", "appid": "com.palm.app.browser", "config": ExtBrowserConfig});
	this.applications.push({"id": "govnah", "appid": "org.webosinternals.govnah", "config": ExtGovnahConfig});
	this.applications.push({"id": "phone", "appid": "com.palm.app.phone", "config": ExtPhoneConfig});
	this.applications.push({"id": "wwindow", "appid": "com.hiddenworldhut.weatherwindow", "config": ExtWWindowConfig});
		
	// Available setting group extensions.

	ExtConnectionConfig = new ConnectionConfig(); 
	ExtConnectionSetting = new ConnectionSetting(ServiceRequestWrapper); 

	ExtAirplaneConfig = new AirplaneConfig(); 
	ExtAirplaneSetting = new AirplaneSetting(ServiceRequestWrapper);
	
	ExtMessagingConfig = new MessagingConfig(); 
	ExtMessagingSetting = new MessagingSetting(ServiceRequestWrapper);
	
	ExtNetworkConfig = new NetworkConfig(); 
	ExtNetworkSetting = new NetworkSetting(ServiceRequestWrapper);
	
	ExtRingtoneConfig = new RingtoneConfig(); 
	ExtRingtoneSetting = new RingtoneSetting(ServiceRequestWrapper);
	
	ExtScreenConfig = new ScreenConfig(); 
	ExtScreenSetting = new ScreenSetting(ServiceRequestWrapper);
	
	ExtSoundConfig = new SoundConfig(); 
	ExtSoundSetting = new SoundSetting(ServiceRequestWrapper);
			
	this.settings.push({"id": "airplane", "config": ExtAirplaneConfig, "setting": ExtAirplaneSetting});
	this.settings.push({"id": "connection", "config": ExtConnectionConfig, "setting": ExtConnectionSetting});
	this.settings.push({"id": "messaging", "config": ExtMessagingConfig, "setting": ExtMessagingSetting});
	this.settings.push({"id": "network", "config": ExtNetworkConfig, "setting": ExtNetworkSetting});
	this.settings.push({"id": "ringtone", "config": ExtRingtoneConfig, "setting": ExtRingtoneSetting});
	this.settings.push({"id": "screen", "config": ExtScreenConfig, "setting": ExtScreenSetting});
	this.settings.push({"id": "sound", "config": ExtSoundConfig, "setting": ExtSoundSetting});

	// Available trigger extensions.

	ExtBatteryConfig = new BatteryConfig(); 
	ExtBatteryTrigger = new BatteryTrigger(ServiceRequestWrapper, SystemAlarmsWrapper, SystemNotifierWrapper);

	ExtBTProfileConfig = new BTProfileConfig(); 
	ExtBTProfileTrigger = new BTProfileTrigger(ServiceRequestWrapper, SystemAlarmsWrapper, SystemNotifierWrapper);

	ExtChargerConfig = new ChargerConfig(); 
	ExtChargerTrigger = new ChargerTrigger(ServiceRequestWrapper, SystemAlarmsWrapper, SystemNotifierWrapper);
	 
	ExtLocationConfig = new LocationConfig(); 
	ExtLocationTrigger = new LocationTrigger(ServiceRequestWrapper, SystemAlarmsWrapper, SystemNotifierWrapper);

	ExtTimeofdayConfig = new TimeofdayConfig(); 
	ExtTimeofdayTrigger = new TimeofdayTrigger(ServiceRequestWrapper, SystemAlarmsWrapper, SystemNotifierWrapper);

	ExtWirelessConfig = new WirelessConfig(); 
	ExtWirelessTrigger = new WirelessTrigger(ServiceRequestWrapper, SystemAlarmsWrapper, SystemNotifierWrapper);

	this.triggers.push({"id": "battery", "config": ExtBatteryConfig, "trigger": ExtBatteryTrigger});
	this.triggers.push({"id": "btprofile", "config": ExtBTProfileConfig, "trigger": ExtBTProfileTrigger});
	this.triggers.push({"id": "charger", "config": ExtChargerConfig, "trigger": ExtChargerTrigger});
	this.triggers.push({"id": "location", "config": ExtLocationConfig, "trigger": ExtLocationTrigger});
	this.triggers.push({"id": "timeofday", "config": ExtTimeofdayConfig, "trigger": ExtTimeofdayTrigger});
	this.triggers.push({"id": "wireless", "config": ExtWirelessConfig, "trigger": ExtWirelessTrigger});
}

AppAssistant.prototype.cleanup = function() {
	/* This function should do any cleanup needed before the execution is interrupted. */
	
	Mojo.Log.error("DEBUG: Cleaning up Mode Switcher");
	
	ScreenControlWrapper.cleanup();
}

//

AppAssistant.prototype.screenOrientationChanged = function() {
}

//

AppAssistant.prototype.handleLaunch = function(params) {
	if((params) && (params.launchedAtBoot == true)) {
		// Load config and init Mode Switcher.

		Mojo.Log.error("DEBUG: Mode Switcher Launched At Boot");

		var callback = this.updateConfigData.bind(this);

		ConfigManagerWrapper.load(this.config, callback);
	}
	else if(this.initiated) {
		// Handle normal Mode Switcher launch.

		Mojo.Log.error("DEBUG: Mode Switcher Started Normally " + Object.toJSON(params));

		this.executeLaunch(params);
	}
	else
		Mojo.Log.error("DEBUG: Mode Switcher Not Launched Yet");
}

//

AppAssistant.prototype.executeLaunch = function(params) {
	ServiceRequestWrapper.request('palm://com.palm.power/com/palm/power', { 
		method: 'activityStart', parameters: {'id': this.appid, 'duration_ms': 60000} });
	
	var stageController = this.controller.getStageController("config");
	var appController = Mojo.Controller.getAppController();

	if(!params) {
		if(stageController) {
			Mojo.Log.info("Main config stage allready exists");

			stageController.popScenesTo("config");
			stageController.activate();
		}
		else {
			Mojo.Log.info("Creating main stage for config");
			
			var mainScene = function(stageController) {
				stageController.pushScene("config");};
				
			var stageArgs = {name: "config", lightweight: true};
			
			this.controller.createStageWithCallback(stageArgs, 
				mainScene.bind(this), "card");
		}
	}
	else {
		if(params.action == "control") {
			if(params.event == "init") {
				this.initModeSwitcher();
			}
			else if(params.event == "reload") {
				this.reloadModeSwitcher(params.modes);
			}
			else if(params.event == "shutdown") {
				this.shutdownModeSwitcher();
			}
		}
			
		else if(params.action == "execute") {
			if(this.config.modeSwitcher.activated != 1)
				return;
			
			if(params.event == "start")
				this.executeStartMode(params.name);
			else if(params.event == "close")
				this.executeCloseMode(params.name);
			else if(params.event == "toggle")
				this.executeToggleMode(params.name);
		}

		else if(params.action == "trigger") {
			if(this.config.modeSwitcher.activated != 1)
				return;

			var data = params.data;
			var callback = this.handleLauncher.bind(this);

			for(var i = 0; i < this.triggers.length; i++) {
				if(this.triggers[i].id == params.event) {
					this.triggers[i].trigger.execute(data, callback);
					break;
				}
			}
		}
		
		else if(params.type != undefined) {
			for(var i = 0; i < this.applications.length; i++) {
				this.applications[i].config.data(params);
			}
		}
	}
}

//

AppAssistant.prototype.handleLauncher = function(startModes, closeMode) {
	// Check that other triggers and config for start modes and close mode are valid.
	
	if((this.config.currentMode) && (this.config.currentMode.triggers.block == 1))
		startModes.clear();

	for(var i = 0; i < startModes.length ; i++) {
		if((startModes[i].autoStart == 0) || (startModes[i].triggersList.length == 0) || 
			(!this.checkModeTriggers(startModes[i])) || 
			((this.config.currentMode) && (this.config.currentMode.name == startModes[i].name)))
		{
			startModes.splice(i--, 1);
		}
	}

	if((!this.config.currentMode) || (this.config.currentMode.autoClose == 0) ||
		(this.checkModeTriggers(this.config.currentMode)))
	{
		closeMode = false;
	}
	
	// Check if we should do immediate start/close or execute the launcher scene.
	// If immediate is set and there are other start/close actions then use launcher.

	if(startModes.length > 0)
	{
		if((startModes.length == 1) && (startModes[0].autoStart == 3))
			this.executeStartMode(startModes[0].name);
		else
			this.executeLauncher("start", startModes, closeMode);
	}
	else if(closeMode)
	{
		if(this.config.currentMode.autoClose == 3)
			this.executeCloseMode(this.config.currentMode.name);
		else 
			this.executeLauncher("close", startModes, closeMode);
	}
}

AppAssistant.prototype.executeLauncher = function(event, startModes, closeMode) {
	var stageController = this.controller.getStageController("launcher");
	var appController = Mojo.Controller.getAppController();

	if(stageController) {
		Mojo.Log.info("Main launcher stage allready exists");

		// FIXME: Should update the launcher!!!
	}
	else {
		Mojo.Log.info("Creating main stage for launcher");

		var launcherScene = function(stageController) {
			stageController.pushScene("launcher", event, startModes, closeMode);};
			
		var stageArgs = {name: "launcher", lightweight: true, height: 177};
		
		this.controller.createStageWithCallback(stageArgs, 
			launcherScene.bind(this), "popupalert");
	}
}

//

AppAssistant.prototype.updateConfigData = function(params, callback, payload) {
	// FIXME: Remove at some point when everybody should have the stable version!

	Mojo.Log.error("DEBUG: Mode Switcher Updating Config");
	
	if((this.config.modeSwitcher.cfgVersion == undefined) || 
		(this.config.modeSwitcher.cfgVersion <= 0))
	{
		Mojo.Log.error("DEBUG: Mode Switcher Resetting Old Config");

		this.config.modeSwitcher = {activated: 0, timerStart: 10, timerClose: 10, apiVersion: 1, cfgVersion: 1}; 
			
		this.config.modesConfig = new Array(); this.config.currentMode = null; this.config.defaultMode = null;
	}

	// Allow normal operation after configuration is loaded.

	this.initiated = true;

	// If mode switcher is activated then execute init.
	
	if(this.config.modeSwitcher.activated == 1)
		this.initModeSwitcher();
}

//

AppAssistant.prototype.initModeSwitcher = function() {
	Mojo.Log.error("DEBUG: Initializing Mode Switcher");
	
	Mojo.Log.info("Initializing mode switcher");

	// On init inform the user even if notifications are disabled.

	SystemNotifierWrapper.force();

	// Initialize enabled trigger extensions on mode switcher init.

	for(var i = 0; i < this.triggers.length; i++)
		this.triggers[i].trigger.init(this.config);
	
	if((this.config.currentMode == null) || 
		(this.config.defaultMode.miscOnStartup == 1) ||
		(!this.checkModeTriggers(this.config.currentMode)))
	{
		if((this.config.currentMode == null) || 
			(this.config.currentMode.type != "default")) 
		{
			this.config.currentMode = null;

			this.executeStartMode("Default Mode");	
		}
		else
			this.modeAppsStart(null, this.config.defaultMode, false);
	}
	else 	
		this.modeAppsStart(null, this.config.currentMode, false);
}

AppAssistant.prototype.reloadModeSwitcher = function(modes) {
	Mojo.Log.error("DEBUG: Reloading Mode Switcher");
	
	Mojo.Log.info("Reinitializing mode switcher");

	// On reinit inform the user even if notifications are disabled.

	SystemNotifierWrapper.force();

	// Reinitialize enabled trigger extensions on mode switcher reinit.

	for(var i = 0; i < this.triggers.length; i++)
		this.triggers[i].trigger.reload(modes);

	// Check the existence of the current mode and is it valid or not.

	if(this.config.currentMode != null) {
		// Check that the current mode still exists (not removed).
	
		for(var i = 0; i < this.config.modesConfig.length; i++) {
			if((this.config.currentMode.name == this.config.modesConfig[i].name) ||
				(this.config.currentMode.type == "default"))
			{
				// Find whether current mode has been edited or no.
		
				for(var i = 0; i < modes.length; i++) {
					if(modes[i] == this.config.currentMode.name) {
						// Restart the mode if valid or close if not.

						if((this.config.currentMode.autoClose == 0) || 
							(this.config.currentMode.type == "default") || 
							(this.checkModeTriggers(this.config.currentMode)))
						{
							this.executeStartMode(this.config.currentMode.name);			
						}

						break;
					}
				}
				
				if((this.config.currentMode.autoClose != 0) && 
					(this.config.currentMode.type == "custom") && 
					(!this.checkModeTriggers(this.config.currentMode)))
				{
					this.executeCloseMode(this.config.currentMode.name);
				}
				 
				// If not edited or restart / closing initiated.
				
				return;
			}
		}
		
		// If reaches this far then current mode was deleted.
	}
	
	// If no current mode then start default mode.

	this.executeStartMode(this.config.defaultMode.name);
}

AppAssistant.prototype.shutdownModeSwitcher = function() {
	Mojo.Log.error("DEBUG: Shutting Down Mode Switcher");
	
	Mojo.Log.info("Shutting down mode switcher");

	// On shutdown inform the user even if notifications are disabled.

	SystemNotifierWrapper.force();

	// Shutdown enabled trigger extensions on mode switcher shutdown.

	for(var i = 0; i < this.triggers.length; i++)
		this.triggers[i].trigger.shutdown();
	
	// Close the current mode (set system settings from default mode).

	if(this.config.currentMode)
		this.executeCloseMode(this.config.currentMode.name);
}

//

AppAssistant.prototype.checkModeTriggers = function(mode) {
	for(var i = 0; i < this.triggers.length; i++) {
		if(mode.triggers.required == 1)
			var triggerState = true;
		else if(mode.triggers.required == 2)
			var triggerState = false;

		for(var j = 0; j < mode.triggersList.length; j++) {
			if(mode.triggersList[j].type == this.triggers[i].id) {
				triggerState = false;
				
				if(this.triggers[i].trigger.check(mode.triggersList[j])) {
					triggerState = true;
					
					break;
				}
			}		
		}

		if((mode.triggers.required == 1) && (!triggerState))
			return false;
		else if((mode.triggers.required == 2) && (triggerState))
			return true;
	}

	if(mode.triggers.required == 1) 		
		return true;
	else if(mode.triggers.required == 2)
		return false;
}

//

AppAssistant.prototype.executeStartMode = function(modeName) {
	Mojo.Log.info("Start mode action received: " + modeName);

	// Check and set state of old, new and cur modes.

	var oldmode = this.config.currentMode;
	var newmode = null;
	
	if(modeName == "Default Mode") {
		this.modesList.clear();
	}
	else if(oldmode) {
		for(var i = 0; i < this.modesList.length; i++) {
			if(this.modesList[i] == oldmode.name)
				this.modesList.splice(i--, 1);
		}
		
		this.modesList.push(oldmode.name);
	}
	
	if(modeName == this.config.defaultMode.name) {
		newmode = this.config.defaultMode;
			
//		this.modesList = new Array();
	}
	else {
		for(var i = 0 ; i < this.config.modesConfig.length ; i++) {
			if(this.config.modesConfig[i].name == modeName) {
				newmode = this.config.modesConfig[i];
				break;
			}
		}
	}
	
	// If requested mode not found then do nothing.
	
	if(newmode == null)
		return;

	// Notify about the start action if configured.

	SystemNotifierWrapper.notify("start", oldmode, newmode);

	// Initiate the actual starting of the mode.

	if(this.config.modeSwitcher.activated != 0)
		this.config.currentMode = newmode;
	else
		this.config.currentMode = null;

	this.modeChangeExecute(oldmode, newmode, 0);
}

AppAssistant.prototype.executeCloseMode = function(modeName) {
	Mojo.Log.info("Close mode action received: " + modeName);

	// Check and set state of old, new and cur modes.

	if(this.config.currentMode.name != modeName)
		return;

	var oldmode = this.config.currentMode;
	var newmode = null;
		
	while(this.modesList.length > 0) {
		modeName = this.modesList.pop();
		
		for(var i = 0; i < this.config.modesConfig.length; i++) {
			if(this.config.modesConfig[i].name == modeName) {
				if(this.checkModeTriggers(this.config.modesConfig[i]))
					newmode = this.config.modesConfig[i];

				break;
			}
		}
		
		if(newmode != null)
			break;
	}

	if(newmode == null) {
		this.modesList.clear();
		
		newmode = this.config.defaultMode;
	}
	
	// Notify about the start action if configured.

	SystemNotifierWrapper.notify("close", oldmode, newmode);

	// Initiate the actual closing of the mode.

	if(this.config.modeSwitcher.activated != 0)
		this.config.currentMode = newmode;
	else
		this.config.currentMode = null;

	this.modeChangeExecute(oldmode, newmode, 0);
}

AppAssistant.prototype.executeToggleMode = function(modeName) {
	Mojo.Log.info("Toggle mode action received: " + modeName);

	SystemNotifierWrapper.force();

	if(this.config.currentMode != null) {
		if(this.config.currentMode.name == modeName) {
			this.executeCloseMode(modeName);

			return;
		}
	}

	for(var i = 0; i < this.config.modesConfig.length ; i++) {
		if(this.config.modesConfig[i].name == modeName) {
			this.executeStartMode(modeName);
			
			return;
		}
	}

	var appCtl = Mojo.Controller.getAppController();
	
	appCtl.showBanner("Unknown mode: " + modeName, {action: 'none'});
}

//

AppAssistant.prototype.modeChangeExecute = function(oldmode, newmode, index) {
	// Check the status of config execution and act accordingly.

	if(index < this.settings.length) {
		// If newmode then settings taken from there, otherwise from defmode.

		var settings = null;

		if(newmode)
			var mode = newmode;
		else
			var mode = this.config.defaultMode;

		for(var i = 0; i < mode.settingsList.length; i++) {
			if(mode.settingsList[i].type == this.settings[index].id) {
				
				settings = mode.settingsList[i];
			
				break;
			}
		}

		if(settings) {
			// If config set in newmode then execute the config setting.
	
			Mojo.Log.info("Setting " + this.settings[index].id + " settings");
		}
		else {
			// If newmode has no config set then check if it was set in oldmode.
	
			if((oldmode) && (oldmode.type == "custom")) {
				for(var i = 0; i < oldmode.settingsList.length; i++) {
					if(oldmode.settingsList[i].type == this.settings[index].id) {
						settings = oldmode.settingsList[i];
						
						break;
					}
				}
			}
			
			if((!oldmode) || (settings)) {
				// If config set in oldmode then execute the config resetting.

				for(var i = 0; i < this.config.defaultMode.settingsList.length; i++) {
					if(this.config.defaultMode.settingsList[i].type == this.settings[index].id) {
						Mojo.Log.info("Resetting " + this.settings[index].id + " settings");

						settings = this.config.defaultMode.settingsList[i];
						break;
					}
				}
			}
		}

		if(settings) {
			var callback = this.modeChangeExecute.bind(this, oldmode, newmode, index + 1);

			this.settings[index].setting.set(settings, callback);
		}
		else {
			// If neither (old and new) mode has config set then skip it.
		
			Mojo.Log.info("Skipping " + this.settings[index].id + " settings");	
			
			this.modeChangeExecute(oldmode, newmode, index + 1);
		}
	}
	else {
		// Settings done so start the applicaitons.
	
		this.modeAppsStart(oldmode, newmode, true);
	}
}

AppAssistant.prototype.modeAppsStart = function(oldmode, newmode, notify) {
	var newapps = new Array();
	var start = 0;
	var oldapps = new Array();
	var close = 0;

	if(newmode) {
		if((!oldmode) || (newmode.type == "custom") || 
			(newmode.miscAppsMode == 1))
		{
			newapps = newmode.appsList;
		}
		
		start = newmode.apps.start;
	}

	if(oldmode) {
		oldapps = oldmode.appsList;
		close = oldmode.apps.close;
	}

	var callback = this.modeChangeDone.bind(this, oldmode, newmode);

	if(notify)
		AppsManagerWrapper.update(newapps, oldapps, start, close, callback);
	else
		AppsManagerWrapper.update(newapps, oldapps, start, close, null);
}

AppAssistant.prototype.modeChangeDone = function(oldmode, newmode) {
	// Mode starting is now completely done so save curmode.

	Mojo.Log.info("Mode switching completed");

	ConfigManagerWrapper.save(this.config, "currentMode");
	
	ServiceRequestWrapper.request('palm://com.palm.power/com/palm/power', { 
	method: 'activityEnd', parameters: {'id': this.appid} });

	// Set the display mode according to config.

	if(newmode.settings.charging == 1)
		ScreenControlWrapper.setMode("default");
	else if(newmode.settings.charging == 2)
		ScreenControlWrapper.setMode("alwayson");
	else if(newmode.settings.charging == 3)
		ScreenControlWrapper.setMode("turnoff");

	SystemNotifierWrapper.notify("done", oldmode, newmode);
}

//

AppAssistant.prototype.saveConfigData = function(target) {
	ConfigManagerWrapper.save(this.config, target);
}

