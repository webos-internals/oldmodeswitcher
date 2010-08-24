/*
 *    AppAssistant - App Assistant for Mode Launcher
 */

function AppAssistant(appController) {
	/* This is the creator function for your app assistant object (the first created scene). */

	// Initialize global variables

	this.config = {
		'modeSwitcher': {},
		'modesConfig': [],
		'currentMode': null,
		'defaultMode': null, 
		'modifierModes': [] }; 

	this.running = false;

	this.background = false;

	this.initialized = false;

	this.historyList = new Array();

	this.applications = new Array();
	this.settings = new Array();
	this.triggers = new Array();

	// Initialize utility classes

	ServiceRequestWrapper = new ServiceRequest();

	AppsManagerWrapper = new AppsManager(ServiceRequestWrapper);
	ConfigManagerWrapper = new ConfigManager(ServiceRequestWrapper);

	DisplayControlWrapper = new DisplayControl(ServiceRequestWrapper);
	NotifyControlWrapper = new NotifyControl(ServiceRequestWrapper);

	SystemAlarmsWrapper = new SystemAlarms(ServiceRequestWrapper);

}

//

AppAssistant.prototype.setup = function() {
	/* This function is for setup tasks that have to happen when the scene is first created. */

	Mojo.Log.error("Setting up Mode Switcher launch");

	DisplayControlWrapper.setup();
	NotifyControlWrapper.setup();
}

AppAssistant.prototype.cleanup = function() {
	/* This function should do any cleanup needed before the execution is interrupted. */
	
	Mojo.Log.error("Cleaning up Mode Switcher close");
	
	DisplayControlWrapper.cleanup();
	NotifyControlWrapper.cleanup();
	
	this.shutdownAllExtensions();
}

//

AppAssistant.prototype.handleLaunch = function(params) {
	if((!this.running) && (!this.initialized)) {
		// Load config and init Mode Switcher.

		this.initialized = true;

		if((params) && (params.launchedAtBoot))
			this.background = true;

		Mojo.Log.error("Mode Switcher is loading config: " + 
			this.background);

		var callback = this.updateConfigData.bind(this);

		ConfigManagerWrapper.load(this.config, callback);
	}
	else if(this.running) {
		Mojo.Log.error("Mode Switcher was started normally: " + 
			Object.toJSON(params));

		if((params) && (params.launchPoint)) {
			var mainScene = function(stageController) {
				stageController.pushScene("scene", "launch");
			};
			
			var stageArgs = {name: "scene", lightweight: true, height: 1};
		
			this.controller.createStageWithCallback(stageArgs, 
				mainScene.bind(this), "popupalert");
		}

		this.executeLaunch(params);
	}
	else
		Mojo.Log.error("Mode Switcher is not initialized");
}

//

AppAssistant.prototype.executeLaunch = function(params) {
	ServiceRequestWrapper.request("palm://com.palm.power/com/palm/power", { 
		'method': "activityStart", 'parameters': {'id': Mojo.Controller.appInfo.id, 
		'duration_ms': 60000} });
	
	var stageController = this.controller.getStageController("config");
	
	var appController = Mojo.Controller.getAppController();

	if((!params) || (params.action == "config")) {
		var index = -1;
		
		if((params.action == "config") && (params.event == "edit"))
			index = this.config.modesConfig.find("name", params.name);

		if(stageController) {
			Mojo.Log.error("Config stage card already exists");

			if(index == -1)
				stageController.popScenesTo("config");
			else {
				stageController.swapScene("config", "edit", index);
			}
			
			stageController.activate();
		}
		else {
			Mojo.Log.error("Creating new config stage card");
			
			var mainScene = function(stageController) {
				if(index == -1)
					stageController.pushScene("config");
				else { 
					stageController.pushScene("config", "edit", index);
				}
			};
				
			var stageArgs = {name: "config", lightweight: true};
			
			this.controller.createStageWithCallback(stageArgs, 
				mainScene.bind(this), "card");
		}
	}

	else if(params.action == "control") {
		if(params.event == "enable") {
			this.enableModeSwitcher();
		}
		else if(params.event == "disable") {
			this.disableModeSwitcher();
		}		
		else if(params.event == "reload") {
			this.reloadModeSwitcher();
		}
		else if(params.event == "lock") {
			this.lockModeSwitcher();
		}
		else if(params.event == "unlock") {
			this.unlockModeSwitcher();
		}
	}
			
	else if(params.action == "execute") {
		if(this.config.modeSwitcher.activated != 1)
			return;

		if(params.event == "start") {
			this.executeStartMode(params.name);
		}
		else if(params.event == "close") {
			this.executeCloseMode(params.name);
		}
		else if(params.event == "toggle") {
			this.executeToggleMode(params.name);
		}
	}

	else if(params.action == "trigger") {
		if(this.config.modeSwitcher.activated != 1)
			return;

		if(params.event == "manual") {
			this.triggerManualMode(params.data);
		}
		else {
			var data = params.data;

			for(var i = 0; i < this.triggers.length; i++) {
				if(this.triggers[i].id == params.event) {
					this.triggers[i].trigger.execute(data, true);
					break;
				}
			}
		}
	}
	
	else if(params.action == "launcher") {
		if((params.event == "cancel") || 
			(params.event == "start") ||
			(params.event == "close"))
		{
			var event = params.event;
			var original = params.data.original;
			var modifiers = params.data.modifiers;

			this.processLaunching(original, modifiers);
		}
	}
	
	// FIXME: Hack for govnah extension data request
	
	else if(params.type == "govnah-profiles") {
		for(var i = 0; i < this.applications.length; i++) {
			if(this.applications[i].id == "govnah")
				this.applications[i].config.data(params);
		}
	}
}

//

AppAssistant.prototype.processLaunch = function() {
	Mojo.Log.error("Mode Switcher is processing launch: " + this.background);
		
	if((!this.background) && (!this.running)) {
		var mainScene = function(stageController) {
			stageController.pushScene("config", "notify");
		};
			
		var stageArgs = {name: "config", lightweight: true};
		
		this.controller.createStageWithCallback(stageArgs, 
			mainScene.bind(this), "card");	

		var bgScene = function(stageController) {
			stageController.pushScene("appsrv");
		};
				
		var stageArgs = {name: "appsrv", lightweight: true};
			
		this.controller.createStageWithCallback(stageArgs, 
			bgScene.bind(this), "dashboard");
	}

	if(this.config.modeSwitcher.activated != 1) {
		this.running = true;
	}
	else {
		this.reloadModeSwitcher();
	}
}
		
//

AppAssistant.prototype.handleLaunching = function(startModes, closeModes) {
	Mojo.Log.error("Handling launching event for trigger: " + 
		startModes.length + " " + closeModes.length);

	var block = 0;
	var modifiers = this.config.modifierModes.slice(0);
	
	if((this.config.modeSwitcher.modeLocked == "yes") || 
		((startModes.length == 0) && (closeModes.length == 0)))
	{
		return;
	}

	// Determine the trigger blocking setting from current and active modifier modes.
	
	if(this.config.currentMode.type != "default") {
		for(var i = 0; i < this.config.modesConfig.length; i++) {
			if((this.config.modesConfig[i].name == this.config.currentMode.name) ||
				(this.config.modifierModes.indexOf(this.config.modesConfig[i].name) != -1))
			{
				if(block != 1) {
					if(((block == 2) && (this.config.modesConfig[i].triggers.block == 3)) ||
						((block == 3) && (this.config.modesConfig[i].triggers.block == 2)))
					{
						block = 1;
					}
					else
						block = this.config.modesConfig[i].triggers.block;		
				}
				else
					break;
			}
		}
	}

	// Check that other triggers and config for start modes and close modes are valid.
	
	for(var i = 0; i < startModes.length ; i++) {
		Mojo.Log.error("Checking start mode for launcher: " + startModes[i].name);
	
		if((this.config.currentMode.name != startModes[i].name) && ((block == 1) || 
			((startModes[i].type == "normal") && (block == 2)) || 
			((startModes[i].type == "modifier") && (block == 3))))
		{
			Mojo.Log.error("Removing blocked mode from start");
		
			startModes.splice(i--, 1);
		}
		else if((startModes[i].autoStartMode == 0) || (startModes[i].triggersList.length == 0) || 
			(!this.checkModeTriggers(startModes[i])) || (startModes[i].name == this.config.currentMode.name) ||
			(this.config.modifierModes.indexOf(startModes[i].name) != -1))
		{
			Mojo.Log.error("Removing invalid mode from start");
			
			startModes.splice(i--, 1);
		}
		else if(startModes[i].type == "modifier")
		{
			Mojo.Log.error("Removing modifier mode from start");
		
			modifiers.push(startModes[i].name);
			startModes.splice(i--, 1);
		}
	}

	for(var i = 0; i < closeModes.length ; i++) {
		Mojo.Log.error("Checking close mode for launcher: " + closeModes[i].name);
		
/*		if((this.config.currentMode.name != closeModes[i].name) && ((block == 1) || 
			((closeModes[i].type == "normal") && (block == 2)) || 
			((closeModes[i].type == "modifier") && (block == 3))))
		{
			Mojo.Log.error("Removing blocked mode from close");
		
			closeModes.splice(i--, 1);
		}
		else
*/
		if((closeModes[i].autoCloseMode == 0) || (closeModes[i].triggersList.length == 0) || 
			(this.checkModeTriggers(closeModes[i])) || ((closeModes[i].name != this.config.currentMode.name) &&
			(this.config.modifierModes.indexOf(closeModes[i].name) == -1)))
		{
			Mojo.Log.error("Removing invalid mode from close");
		
			closeModes.splice(i--, 1);
		}
		else if(closeModes[i].type == "modifier")
		{
			Mojo.Log.error("Removing modifier mode from close");
		
			modifiers.splice(modifiers.indexOf(closeModes[i].name), 1);
			closeModes.splice(i--, 1);
		}
	}

	// Check if we should do immediate start/close or execute the launcher scene.
	// If immediate is set and there are other start/close actions then use launcher.
	
	if((startModes.length == 1) && (startModes[0].autoStartMode == 3))
		this.processLaunching(startModes[0].name, modifiers);
	else if((closeModes.length == 1) && (closeModes[0].autoCloseMode == 3))
		this.processLaunching(this.config.defaultMode.name, modifiers);
	else if((startModes.length > 0) || (closeModes.length == 1))
		this.executeLaunching(startModes, closeModes[0], modifiers);
	else if(Object.toJSON(modifiers) != Object.toJSON(this.config.modifierModes))
		this.processLaunching(this.config.currentMode.name, modifiers);
}

AppAssistant.prototype.executeLaunching = function(startModes, closeMode, modifiers) {
	Mojo.Log.error("Executing launcher event from trigger: " + 
		startModes.length + " " + modifiers.length);

	var stageController = this.controller.getStageController("launcher");
	var appController = Mojo.Controller.getAppController();

	if(stageController) {
		Mojo.Log.error("Launcher stage card already exists");

		// FIXME: Should update the launcher!!!
	}
	else {
		Mojo.Log.error("Creating new launcher stage card");

		var launcherScene = function(stageController) {
			stageController.pushScene("launcher", startModes, closeMode, modifiers);};
			
		var stageArgs = {name: "launcher", lightweight: true, height: 177};
		
		this.controller.createStageWithCallback(stageArgs, 
			launcherScene.bind(this), "popupalert");
	}
}

AppAssistant.prototype.processLaunching = function(originalMode, modifierModes) {
	Mojo.Log.error("Processing launcher event from trigger: " + 
		originalMode.name + " " + modifierModes.length);

	var oldActiveModes = [this.config.defaultMode];

	var newActiveModes = [this.config.defaultMode];

	for(var i = 0; i < this.config.modesConfig.length; i++) {
		if(this.config.modesConfig[i].name == this.config.currentMode.name) {	
			oldActiveModes[0] = this.config.modesConfig[i];
		}
		else if(this.config.modifierModes.indexOf(this.config.modesConfig[i].name) != -1) {
			oldActiveModes.push(this.config.modesConfig[i]);
		}
		
		if(this.config.modesConfig[i].name == originalMode) {
			newActiveModes[0] = this.config.modesConfig[i];
		}
		else if(modifierModes.indexOf(this.config.modesConfig[i].name) != -1) {
			newActiveModes.push(this.config.modesConfig[i]);
		}
	}
	
	this.executeModeUpdate(oldActiveModes, newActiveModes, "init", 0);
}

//

AppAssistant.prototype.updateConfigData = function() {
	Mojo.Log.error("Mode Switcher updating loaded config");

	if((this.config.modeSwitcher.cfgVersion == undefined) || 
		(this.config.modeSwitcher.cfgVersion !== "1.2") ||
		(this.config.defaultMode == null))
	{
		if(this.config.modeSwitcher.cfgVersion === "1.0") {
			Mojo.Log.error("Mode Switcher updating 1.0 config");

			if(this.config.currentMode)
				this.config.currentMode.appsList.clear();
			
			if(this.config.defaultMode)
				this.config.defaultMode.appsList.clear();
			
			for(var i = 0; i < this.config.modesConfig.length; i++) {
				this.config.modesConfig[i].appsList.clear();
			}
			
			this.config.modeSwitcher.apiVersion = "1.1";
			this.config.modeSwitcher.cfgVersion = "1.1";
		}
		
		if(this.config.modeSwitcher.cfgVersion === "1.1") {
			Mojo.Log.error("Mode Switcher updating 1.1 config");

			for(var i = 0; i < this.config.modesConfig.length; i++) {
				for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
					if(this.config.modesConfig[i].triggersList[j].extension == "calevent") {
						this.config.modesConfig[i].triggersList[j].caleventMode = 0;
						this.config.modesConfig[i].triggersList[j].caleventCalendar = 0;
					}
					else if(this.config.modesConfig[i].triggersList[j].extension == "headset") {
						this.config.modesConfig[i].triggersList[j].headsetScenario = 0;
					}
				}
			}
			
			this.config.modeSwitcher.cfgVersion = "1.2";
		}
		
		if((this.config.modeSwitcher.cfgVersion !== "1.2") ||
			(this.config.defaultMode == null))
		{
			Mojo.Log.error("Mode Switcher resetting old config");

			this.config.modeSwitcher = {
				'activated': 0, 
				'timerStart': 10, 
				'timerClose': 10, 
				'modeLocked': "no", 
				'apiVersion': "1.1", 
				'cfgVersion': "1.2" }; 
	
			this.config.modesConfig = new Array();
		
			this.config.currentMode = null; 
			this.config.defaultMode = null; 
	
			this.config.modifierModes = new Array();
		}

		ConfigManagerWrapper.save(this.config);
	}

	this.initAllExtensions();
}

//

AppAssistant.prototype.initAllExtensions = function() {
	Mojo.Log.error("Mode Switcher loading all extensions");
	
	// Load available extensions.

	var settingExtensions = ["airplane", "calendar", "connection", "email", 
		"messaging", "network", "ringer", "screen", "security", "sound"];
			
	var applicationExtensions = ["default", "browser", "govnah", "modesw", 
		"phone", "wwindow"];		
	
	var triggerExtensions = ["application", "battery", "bluetooth", "calevent", 
		"charger", "display", "headset", "interval", "location", "silentsw", 
		"timeofday", "wireless"];

	for(var i = 0; i < settingExtensions.length; i++)
		setTimeout(this.initExtensionExec.bind(this, "setting", settingExtensions[i]));

	for(var i = 0; i < applicationExtensions.length; i++)
		setTimeout(this.initExtensionExec.bind(this, "application", applicationExtensions[i]));

	for(var i = 0; i < triggerExtensions.length; i++)
		setTimeout(this.initExtensionExec.bind(this, "trigger", triggerExtensions[i]));
	
	if(!this.background)
		setTimeout(this.processLaunch.bind(this), 5000);
	else
		setTimeout(this.processLaunch.bind(this), 15000);	
}

AppAssistant.prototype.shutdownAllExtensions = function() {
	for(var i = 0; i < this.settings.length; i++)
		this.settings[i].setting.shutdown();

	for(var i = 0; i < this.triggers.length; i++)
		this.triggers[i].trigger.shutdown();

	this.settings.clear();

	this.applications.clear();

	this.triggers.clear();		
}

//

AppAssistant.prototype.initExtensionExec = function(type, extension) {
	var className = extension.charAt(0).toUpperCase() + extension.slice(1);
	
	var extConfig = eval("new " + className + "Config();");

	var control = {'service': ServiceRequestWrapper, 'alarms': SystemAlarmsWrapper};
				
	if(type == "setting")	
		var extClass = eval ("new " + className + "Setting(control);");
	else if(type == "trigger")
		var extClass = eval ("new " + className + "Trigger(this.config, control);");
			
	if(extConfig.version() == this.config.modeSwitcher.apiVersion) {
		if(type == "application")
			this.initExtensionDone(type, extension, extConfig, extClass, true);
		else {
			var callback = this.initExtensionDone.bind(this, type, extension, extConfig, extClass);
			
			extClass.init(callback);
		}
	}
	else
		Mojo.Log.error("Invalid extension version: " + extension);
}

AppAssistant.prototype.initExtensionDone = function(type, extension, extConfig, extClass, state) {
	if(state) {
		Mojo.Log.error("Extension loading succesful: " + extension);
	
		if(type == "setting")
			this.settings.push({"id": extension, "config": extConfig, "setting": extClass});
		else if(type == "application")
			this.applications.push({"id": extension, "appid": extConfig.appid(), "config": extConfig});
		else if(type == "trigger")
			this.triggers.push({"id": extension, "config": extConfig, "trigger": extClass});
	}
	else
		Mojo.Log.error("Extension loading failed: " + extension);
}

//

AppAssistant.prototype.enableModeSwitcher = function() {
	Mojo.Log.error("Enabling of Mode Switcher requestes");

	if(!this.background) {
		var stageController = this.controller.getStageController("appsrv");

		if(stageController)
			stageController.delegateToSceneAssistant("updateNameState", "enable");
	}
	
	// On init inform the user even if notifications are disabled.

	NotifyControlWrapper.mode("startup");

	// Initialize enabled trigger extensions on mode switcher init.

	clearTimeout(this.initTriggersTimer);
	
	this.initTriggersTimer = setTimeout(this.enableModeTriggers.bind(this), 30000);

	// Start the default mode when Mode Switcher is initialized.
	
	this.config.modifierModes.clear();
	
	this.executeStartMode(this.config.defaultMode.name);
}

AppAssistant.prototype.reloadModeSwitcher = function() {
	Mojo.Log.error("Reloading of Mode Switcher requested");

	// On reload inform the user even if notifications are disabled.

	NotifyControlWrapper.mode("reload");

	// For restored configuration the reloading is a bit different.

	if((this.config.currentMode == null) || 
		(this.config.modifierModes == null))
	{
		clearTimeout(this.initTriggersTimer);
	
		this.initTriggersTimer = setTimeout(this.reloadModeTriggers.bind(this), 30000);

		// Start the default mode when Mode Switcher is initialized.
	
		this.executeStartMode(this.config.defaultMode.name);
	}
	else {
		// Initialize enabled trigger extensions after configuration.

		this.reloadModeTriggers();

		// Check whether last active or default mode should be activated.

		var curActiveModes = [this.config.defaultMode];

		if((this.running) || (this.config.defaultMode.miscOnStartup == 0)) {
			// Check that original mode still exists and triggers are valid.

			if(this.config.currentMode.type == "normal") {
				var index = this.config.modesConfig.find("name", this.config.currentMode.name);
	
				if(index != -1) {
					if(this.config.modesConfig[index].type == "normal") {
						if(this.checkModeTriggers(this.config.modesConfig[index]))
							curActiveModes[0] = this.config.modesConfig[index]
					}
				}
			}

			// Check that modifier modes still exists and triggers are valid.

			for(var i = 0; i < this.config.modifierModes.length; i++) {
				var index = this.config.modesConfig.find("name", this.config.modifierModes[i]);

				if(index != -1) {
					if(this.config.modesConfig[index].type == "modifier") {
						if(this.checkModeTriggers(this.config.modesConfig[index]))
							curActiveModes.push(this.config.modesConfig[index]);
					}
				}
			}
		}

		// Execute the actual updating of current mode (if there's changes).

		this.executeModeUpdate(curActiveModes, curActiveModes, "init", 0);
	}
}

AppAssistant.prototype.disableModeSwitcher = function() {
	Mojo.Log.error("Disabling of Mode Switcher requested");

	if(!this.background) {
		var stageController = this.controller.getStageController("appsrv");

		if(stageController)
			stageController.delegateToSceneAssistant("updateNameState", "disable");
	}
	
	// On shutdown inform the user even if notifications are disabled.

	NotifyControlWrapper.mode("shutdown");

	// Shutdown enabled trigger extensions on mode switcher shutdown.

	clearTimeout(this.shutdownTriggersTimer);
	
	this.shutdownTriggersTimer = setTimeout(this.disableModeTriggers.bind(this), 0);
	
	// Close the current mode (set system settings from default mode).

	this.config.modifierModes.clear();
	
	this.executeCloseMode(this.config.defaultMode.name);
}

//

AppAssistant.prototype.enableModeTriggers = function() {
	Mojo.Log.error("Enabling all loaded trigger extensions");

	// Only enable triggers that are in configuration.

	var callback = this.handleLaunching.bind(this);

	for(var i = 0; i < this.triggers.length; i++)
		this.triggers[i].trigger.enable(callback);
}

AppAssistant.prototype.reloadModeTriggers = function() {
	Mojo.Log.error("Reloading all loaded trigger extensions");

	var callback = this.handleLaunching.bind(this);
	
	for(var i = 0; i < this.triggers.length; i++) {
		if(this.running)
			this.triggers[i].trigger.disable();
			
		this.triggers[i].trigger.enable(callback);
	}
}

AppAssistant.prototype.disableModeTriggers = function() {
	Mojo.Log.error("Disabling all loaded trigger extensions");
	
	for(var i = 0; i < this.triggers.length; i++)
		this.triggers[i].trigger.disable();
}

//

AppAssistant.prototype.lockModeSwitcher = function() {
	Mojo.Log.error("Locking mode and preventing triggers");

	this.config.modeSwitcher.modeLocked = "yes";
	
	ConfigManagerWrapper.save(this.config, "modeSwitcher");
}

AppAssistant.prototype.unlockModeSwitcher = function() {
	Mojo.Log.error("Unlocking mode and allowing triggers");
	
	this.config.modeSwitcher.modeLocked = "no";
	
	ConfigManagerWrapper.save(this.config, "modeSwitcher");
}

//

AppAssistant.prototype.executeStartMode = function(modeName) {
	Mojo.Log.error("Executing starting of: " + modeName);

	// Check and find information for requested mode.

	var requestedMode = null;

	if(modeName == "Default Mode") {
		requestedMode = this.config.defaultMode;
	}
	else {
		if(modeName == "Current Mode") {
			modeName = this.config.currentMode.name;
		}
		else if(modeName == "Previous Mode") {
			if(this.historyList.length > 1) {
				modeName = this.historyList[this.historyList.length - 1];
			}
		}

		var index = this.config.modesConfig.find("name", modeName);
		
		if(index != -1)
			requestedMode = this.config.modesConfig[index];
	}
		
	// If requested mode not found then do nothing.
	
	if(requestedMode == null)
		return;
	
	// Define and locate original mode for update.

	var oldActiveModes = [this.config.defaultMode];
	var newActiveModes = [this.config.defaultMode];

	if(requestedMode.type != "modifier")
		newActiveModes[0] = requestedMode;
	
	var index = this.config.modesConfig.find("name", this.config.currentMode.name);

	if(index != -1) {
		oldActiveModes[0] = this.config.modesConfig[index];
		
		if(requestedMode.type == "modifier")
			newActiveModes[0] = this.config.modesConfig[index];
	}
	
	// Generate list of modifier modes for update.

	for(var i = 0; i < this.config.modifierModes.length; i++) {
		var index = this.config.modesConfig.find("name", this.config.modifierModes[i]);
		
		if(index != -1) {
			oldActiveModes.push(this.config.modesConfig[index]);

			if(this.config.modesConfig[index].type == "modifier") {
				if(this.config.modifierModes[i] != modeName)
					newActiveModes.push(this.config.modesConfig[index]);
			}
		}
	}
	
	if(requestedMode.type == "modifier")
		newActiveModes.push(requestedMode);

	// Initiate the actual updating of the mode.

	this.executeModeUpdate(oldActiveModes, newActiveModes, "init", 0);
}

AppAssistant.prototype.executeCloseMode = function(modeName) {
	Mojo.Log.error("Executing closing of: " + modeName);

	// Check that requested mode is currently active.

	var requestedMode = null;

	if(modeName == "Default Mode") {
		requestedMode = this.config.defaultMode;
	}
	else {
		if(modeName == "Current Mode") {
			modeName = this.config.currentMode.name;
		}
		else if(modeName == "Previous Mode") {
			if(this.historyList.length > 1) {
				modeName = this.historyList[this.historyList.length - 1];
			}
		}

		var index = this.config.modesConfig.find("name", modeName);
		
		if(index != -1)
			requestedMode = this.config.modesConfig[index];
	}	
	
	// If requested mode not found then do nothing.
	
	if(requestedMode == null)
		return;
	
	// Define and locate original mode for update.

	var oldActiveModes = [this.config.defaultMode];
	var newActiveModes = [this.config.defaultMode];

	var index = this.config.modesConfig.find("name", this.config.currentMode.name);

	if(index != -1) {
		oldActiveModes[0] = this.config.modesConfig[index];
	
		if(requestedMode.type == "modifier")
			newActiveModes[0] = this.config.modesConfig[index];
	}
	
	// Generate list of modifier modes for update.

	for(var i = 0; i < this.config.modifierModes.length; i++) {
		var index = this.config.modesConfig.find("name", this.config.modifierModes[i]);
		
		if(index != -1) {
			oldActiveModes.push(this.config.modesConfig[index]);
					
			if(this.config.modesConfig[index].type == "modifier") {
				if(this.config.modifierModes[i] != modeName)
					newActiveModes.push(this.config.modesConfig[index]);
			}
		}
	}
	
	// Initiate the actual updating of the mode.

	this.executeModeUpdate(oldActiveModes, newActiveModes, "init", 0);
}

AppAssistant.prototype.executeToggleMode = function(modeName) {
	Mojo.Log.error("Executing toggling of: " + modeName);

	if(modeName == "Current Mode") {
		modeName = this.config.currentMode.name;
	}
	else if(modeName == "Previous Mode") {
		if(this.historyList.length > 1) {
			modeName = this.historyList[this.historyList.length - 1];
		}
	}

	if((this.config.currentMode.name == modeName) || 
		(this.config.modifierModes.indexOf(modeName) != -1))
	{
		NotifyControlWrapper.mode("close");
	
		this.executeCloseMode(modeName);
	}
	else if(this.config.modesConfig.find("name", modeName) != -1)
	{
		NotifyControlWrapper.mode("start");

		this.executeStartMode(modeName);
	}
	else {
		NotifyControlWrapper.mode("unknown");
	
		NotifyControlWrapper.notify("done");
	}
}

//

AppAssistant.prototype.triggerManualMode = function(modeName) {
	Mojo.Log.error("Manual triggering of mode requested: " + modeName);
	
	if((modeName == "All Modes") || 
		(modeName == "All Normal Modes") || 
		(modeNAme == "All Modifier Modes"))
	{
		var startModes = new Array();
		var closeModes = new Array();
			
		for(var i = 0; i < this.config.modesConfig.length; i++) {
			if((modeName == "All Modes") || 
				((modeName == "All Normal Modes") &&
				(this.config.modesConfig[i].type == "normal")) || 
				((modeName == "All Modifier Modes") && 
				(this.config.modesConfig[i].type == "modifier")))
			{
				if((this.config.modesConfig[i].name != this.config.currentMode.name) &&
					(this.config.modifierModes.indexOf(this.config.modesConfig[i].name) == -1))
				{
					startModes.push(this.config.modesConfig[i]);
				}
				else {
					closeModes.push(this.config.modesConfig[i]);
				}
			}
		}	
		
		this.handleLaunching(startModes, closeModes);
	}
	else {
		if(modeName == "Default Mode")
			this.executeModeStart(this.config.defaultMode.name);
		else {
			if(modeName == "Current Mode") {
				modeName = this.config.currentMode.name;
			}
			else if(modeName == "Previous Mode") {
				if(this.historyList.length > 1) {
					modeName = this.historyList[this.historyList.length - 1];
				}
			}

			var index = this.config.modesConfig.find("name", modeName);
		
			if(index != -1) {
				if((this.config.currentMode.name != modeName) &&
					(this.config.modifierModes.indexOf(modeName) == -1))
				{
					if(this.checkModeTriggers(this.config.modesConfig[index]))
						this.executeStartMode(modeName);
				}
				else {
					if(!this.checkModeTriggers(this.config.modesConfig[index]))
						this.executeCloseMode(modeName);
				}
			}
		}
	}
}

//

AppAssistant.prototype.executeModeUpdate = function(oldActiveModes, newActiveModes, roundPhase, roundCount) {
	Mojo.Log.error("Executing mode updating: " + roundPhase + " " + roundCount);

	var activeModes = Object.toJSON(newActiveModes);

	var lock = false;

	var config = new Array();
	var check = new Array();

	var modesA = [oldActiveModes, newActiveModes];
	var modesB = [newActiveModes, oldActiveModes];

	if(roundPhase == "init")
		var events = ["close", "start"];
	else
		var events = ["closed", "started"];

	for(var loop = 0; loop < 2; loop++) {
		config.clear();
		check.clear();
	
		for(var i = 0; i < modesA[loop].length; i++) {
			if((modesB[loop].find("name", modesA[loop][i].name) == -1) || (!this.running)) {
				for(var j = 0; j < modesA[loop][i].appsList.length; j++) {
					if(modesA[loop][i].appsList[j].type == "ms") {
						// Should check for: reloading, starting, switching and closing.
					
						if(((modesA[loop][i].appsList[j].event == events[loop]) ||
							((modesA[loop][i].appsList[j].event == "switch") && (roundPhase == "init")) ||
							((modesA[loop][i].appsList[j].event == "switched") && (roundPhase == "done"))) &&
							((((newActiveModes[0].type != "default") ||
							(oldActiveModes[0].type == "default")) && 
							((events[loop] == "start") || (events[loop] == "started"))) ||
							(modesA[loop][i].appsList[j].force == "yes") || 
							(((newActiveModes[0].type == "default") || 
							(modesA[loop][i].type == "modifier")) &&
							((events[loop] == "close") || (events[loop] == "closed"))))) 
						{					
							if(modesA[loop][i].appsList[j].action == "lock")
								lock = true;
							else if(modesA[loop][i].appsList[j].action == "require") {
								check.push({'mode': modesA[loop][i].name, 
									'require': modesA[loop][i].appsList[j].mode});
							}
							else {
								config.push(modesA[loop][i].appsList[j]);
							}
						}
					}
				}
			}
		}

		for(var i = 0; i < config.length; i++) {
			var modeName = config[i].mode;

			if(modeName == "All Normal Modes") {
				if(config[i].action == "trigger") {
					for(var j = 0; j < this.config.modesConfig.length; j++) {
						if((this.config.modesConfig[j].type == "normal") &&
							(this.config.modesConfig[j].autoStartMode != 0) &&
							(this.config.modesConfig[j].name != newActiveModes[0].name) &&
							(this.checkModeTriggers(this.config.modesConfig[j])))
						{
							newActiveModes.splice(0, 1, this.config.modesConfig[j]);
					
							break;
						}
					}			
				}
			}
			else if(modeName == "All Modifier Modes") {
				if(config[i].action == "close") {
					newActiveModes.splice(1, newActiveModes.length - 1);
				}
				else if((config[i].action == "start") || (config[i].action == "trigger")) {
					for(var j = 0; j < this.config.modesConfig.length; j ++) {
						if((this.config.modesConfig[j].type == "modifier") &&
							(newActiveModes.find("name", this.config.modesConfig[j].name) == -1))
						{
							if((config[i].action == "start") ||
								((this.config.modesConfig[j].autoStartMode != 0) &&
								(this.checkModeTriggers(this.config.modesConfig[j]))))
							{
								newActiveModes.push(this.config.modesConfig[j]);
							}
						}
					}			
				}
			}
			else {
				if(modeName == "Current Mode")
					modeName = newActiveModes[0].name;
				else if(modeName == "Previous Mode")
					modeName = this.historyList[this.historyList.length - 1];

				var index = this.config.modesConfig.find("name", modeName);

				if(index != -1) {
					if(config[i].action == "close") {
						var index = newActiveModes.find("name", modeName);

						if(index != -1) {
							if(newActiveModes[index].type == "normal")
								newActiveModes.splice(0, 1, this.config.defaultMode);
							else if(newActiveModes[index].type == "modifier"){
								newActiveModes.splice(index, 1);}
						}			
					}
					else if((config[i].action == "start") || ((config[i].action == "trigger") &&
							(this.config.modesConfig[index].autoStartMode != 0) &&
							(this.checkModeTriggers(this.config.modesConfig[index]))))
					{
						if(this.config.modesConfig[index].type == "normal")
							newActiveModes.splice(0, 1, this.config.modesConfig[index]);
						else if(this.config.modesConfig[index].type == "modifier") {
							if(newActiveModes.find("name", modeName) == -1)
								newActiveModes.push(this.config.modesConfig[index]);
						}			
					}			
				}
			}
		}
		
		for(var i = 0; i < check.length; i++) {
			if((events[loop] == "start") || (events[loop] == "started")) {
				if(newActiveModes.find("name", check[i].require) == -1) {
					var index = newActiveModes.find("name", check[i].mode);

					if(index != -1) {
						if(newActiveModes[index].type == "normal")
							newActiveModes.splice(0, 1, oldActiveModes[0]);
						else if(newActiveModes[index].type == "modifier")
							newActiveModes.splice(index, 1);
					}
				}
			}
			else if((events[loop] == "close") || (events[loop] == "closed")) {
				if(newActiveModes.find("name", check[i].require) != -1) {
					if(newActiveModes.find("name", check[i].mode) == -1) {
						var index = oldActiveModes.find("name", check[i].mode);

						if(oldActiveModes[index].type == "normal")
							newActiveModes.splice(0, 1, oldActiveModes[0]);
						else if(oldActiveModes[index].type == "modifier")
							newActiveModes.push(oldActiveModes[index]);
					}
				}
			}
		}
	}
	
	if(roundPhase == "init") {
		if((activeModes != Object.toJSON(newActiveModes)) && (roundCount < 5))
			this.executeModeUpdate(oldActiveModes, newActiveModes, "init", ++roundCount);
		else {
			this.updateCurrentMode(oldActiveModes, newActiveModes, lock);

			if(this.config.currentMode.settings.notify == 2)
				NotifyControlWrapper.mode("normal");	

			if(!this.running) {
				Mojo.Log.error("Skipping settings updating on startup");
		
				this.prepareApplicationsUpdate(oldActiveModes, newActiveModes, roundCount);
			}
			else
				this.prepareSettingsUpdate(oldActiveModes, newActiveModes, roundCount);

			if(!this.background) {
				var stageController = this.controller.getStageController("appsrv");

				if(stageController)
					stageController.delegateToSceneAssistant("updateNameState", "update");
			}
		}
	}
	else if(roundPhase == "done") {
		if((activeModes != Object.toJSON(newActiveModes)) && (roundCount < 5))
			this.executeModeUpdate(oldActiveModes, newActiveModes, "init", ++roundCount);
		else {
			this.updateHistoryList(oldActiveModes, newActiveModes);

			NotifyControlWrapper.mode("");	

			if((lock) && (this.config.modeSwitcher.modeLocked == "no")) {			
				this.config.modeSwitcher.modeLocked = "yes";	
	
				ConfigManagerWrapper.save(this.config, "modeSwitcher");
			}
			
			this.running = true;
		}
	}
}

//

AppAssistant.prototype.updateCurrentMode = function(oldActiveModes, newActiveModes, lock) {
	Mojo.Log.error("Updating and storing current mode");

	var currentMode = {
		'name': newActiveModes[0].name, 'type': newActiveModes[0].type,
		'settings': {'notify': 0, 'charging': 0}, 'settingsList': [], 
		'apps': {'start': 0, 'close': 0}, 'appsList': [] };

	var modifierModes = new Array();

	// Combine settings from original and modifier modes.

	var modes = [this.config.defaultMode].concat(newActiveModes);

	for(var i = 0; i < modes.length; i++) {
		if(modes[i].type == "modifier")
			modifierModes.push(modes[i].name);

		if(modes[i].settings.notify != 0)
			currentMode.settings.notify = modes[i].settings.notify;
		
		if(modes[i].settings.charging != 0)
			currentMode.settings.charging = modes[i].settings.charging;

		for(var j = 0; j < modes[i].settingsList.length; j++) {
			var index = currentMode.settingsList.find("extension", modes[i].settingsList[j].extension);
			
			if(index == -1) {
				var settings = {};
				
				Object.extend(settings, modes[i].settingsList[j]);
				
				currentMode.settingsList.push(settings);
			}
			else {
				Object.extend(currentMode.settingsList[index], modes[i].settingsList[j]);
			}     	
		}

		if((i > 0) && ((!this.running) || 
			(modes[i].type != "default") || 
			(modes[i].miscAppsMode == 0)))
		{
			if(modes[i].apps.start == 2)
				currentMode.apps.start = 2;

			if(modes[i].apps.close == 2)
				currentMode.apps.close = 2;

			for(var j = 0; j < modes[i].appsList.length; j++) {
				currentMode.appsList.push(modes[i].appsList[j]);
			}
		}
	}

	// Save current mode and its modifiers.

	var oldCurrentMode = this.config.currentMode;
	
	if(lock)
		this.config.modeSwitcher.modeLocked = "yes";	
	else
		this.config.modeSwitcher.modeLocked = "no";	
	
	this.config.currentMode = currentMode;
	
	this.config.modifierModes = modifierModes;

	var newCurrentMode = this.config.currentMode;	

	ConfigManagerWrapper.save(this.config);

	// Setup screen mode from new current mode.

	if(this.config.currentMode.settings.charging == 1)
		DisplayControlWrapper.setMode("default");
	else if(this.config.currentMode.settings.charging == 2)
		DisplayControlWrapper.setMode("alwayson");
	else if(this.config.currentMode.settings.charging == 3)
		DisplayControlWrapper.setMode("turnoff");
}

AppAssistant.prototype.updateHistoryList = function(oldActiveModes, newActiveModes) {
	// Add to list if this is a new mode if already last in the list then remove.

	Mojo.Log.error("Updating normal mode history list");

	if((oldActiveModes[0].name != newActiveModes[0].name) &&
		(oldActiveModes[0].name != "Default Mode"))
	{
		if(this.historyList.length == 0)
			this.historyList.push(oldActiveModes[0].name);
		else {
			if(this.historyList.length == 10)
				this.historyList.shift();

			this.historyList.push(oldActiveModes[0].name);
		}
	}
	else if(this.historyList.length > 0) {
		var last = this.historyList.length - 1;
	
		if(this.historyList[last] == newActiveModes[0].name)
			this.historyList.pop();
	}
}

//

AppAssistant.prototype.prepareSettingsUpdate = function(oldActiveModes, newActiveModes, roundCount) {
	var modeSettings = new Array();

	var oldSettings = new Array();
	var newSettings = new Array();

	for(var i = 0; i < newActiveModes.length; i++) {
		for(var j = 0; j < newActiveModes[i].settingsList.length; j++) {
			var index = newSettings.find("extension", newActiveModes[i].settingsList[j].extension);
			
			if(index == -1) {
				var settings = {};
				
				Object.extend(settings, newActiveModes[i].settingsList[j]);
				
				newSettings.push(settings);
			}
			else {
				Object.extend(newSettings[index], newActiveModes[i].settingsList[j]);
			}     	
		}
	}

	for(var i = 0; i < oldActiveModes.length; i++) {
		for(var j = 0; j < oldActiveModes[i].settingsList.length; j++) {
			var index = oldSettings.find("extension", oldActiveModes[i].settingsList[j].extension);
			
			if(index == -1) {
				var settings = {};
				
				Object.extend(settings, oldActiveModes[i].settingsList[j]);
				
				oldSettings.push(settings);
			}
			else {
				Object.extend(oldSettings[index], oldActiveModes[i].settingsList[j]);
			}     	
		}
	}
	
	// Generate changed settings list for the actual update.
 
	if(Object.toJSON(oldActiveModes) == Object.toJSON(newActiveModes))
		modeSettings = newSettings;
	else {
		for(var i = 0; i < newSettings.length; i++) {
			var index = oldSettings.find("extension", newSettings[i].extension);

			if((index == -1) || (Object.toJSON(oldSettings[index]) != Object.toJSON(newSettings[i])))
				modeSettings.push(newSettings[i]);
		}
	}			

	this.executeSettingsUpdate(oldActiveModes, newActiveModes, modeSettings, roundCount, 0);
}

AppAssistant.prototype.executeSettingsUpdate = function(oldActiveModes, newActiveModes, modeSettings, roundCount, index) {
	if(index == 0) {
		// Notify about starting of mode updating if configured.

		Mojo.Log.error("Updating of mode settings started");

		NotifyControlWrapper.notify("init", oldActiveModes[0].name, newActiveModes[0].name);
	}
	
	if(index < modeSettings.length) {
		// Request extensions to set the current mode settings.

		var callback = this.executeSettingsUpdate.bind(this, oldActiveModes, newActiveModes, modeSettings, roundCount, index + 1);
		
		for(var i = 0; i < this.settings.length; i++) {
			if(this.settings[i].id == modeSettings[index].extension) {
				Mojo.Log.error("Applying system settings: " + this.settings[i].id);
			
				this.settings[i].setting.set(modeSettings[index], callback);
			
				return;
			}
		}
	}
	
	// Notify about finishing of mode updating if configured.

	Mojo.Log.error("Updating of mode settings finished");

	NotifyControlWrapper.notify("done", oldActiveModes[0].name, newActiveModes[0].name);

	this.prepareApplicationsUpdate(oldActiveModes, newActiveModes, roundCount);
}

AppAssistant.prototype.prepareApplicationsUpdate = function(oldActiveModes, newActiveModes, roundCount) {
	Mojo.Log.error("Executing apps and services update");

	var oldCloseAll = false;
	var newCloseAll = false;

	var closeApps = new Array();
	var startApps = new Array();

	var closeServices = new Array();
	var startServices = new Array();

	for(var i = 0; i < newActiveModes.length; i++) {
		if((!this.running) || 
			(newActiveModes[i].type != "default") || (newActiveModes[i].miscAppsMode == 0))
		{
			var index = oldActiveModes.find("name", newActiveModes[i].name);

			if((!this.running) || (index == -1)) {
				if(newActiveModes[i].apps.start == 2)
					newCloseAll = true;

				for(var j = 0; j < newActiveModes[i].appsList.length; j++) {
					if((newActiveModes[i].appsList[j].event == "start") ||
						(newActiveModes[i].appsList[j].event == "both"))
					{
						if(newActiveModes[i].appsList[j].type == "app")
							startApps.push(newActiveModes[i].appsList[j]);
						else if(newActiveModes[i].appsList[j].type == "srv")
							startServices.push(newActiveModes[i].appsList[j]);
					}
				}
			}
		}
	}

	for(var i = 0; i < oldActiveModes.length; i++) {
		if(newActiveModes.find("name", oldActiveModes[i].name) == -1)
		{
			if(oldActiveModes[i].apps.close == 2)
				oldCloseAll = true;

			for(var j = 0; j < oldActiveModes[i].appsList.length; j++) {
				if((oldActiveModes[i].appsList[j].event == "start") ||
					(oldActiveModes[i].appsList[j].event == "both"))
				{
					if((oldActiveModes[i].appsList[j].type == "app") &&
						(oldActiveModes[i].apps.close == 1))
					{
						closeApps.push(oldActiveModes[i].appsList[j]);
					}
				}
				
				if((oldActiveModes[i].appsList[j].event == "close") ||
					(oldActiveModes[i].appsList[j].event == "both"))
				{
					if((oldActiveModes[i].appsList[j].type == "app") && 
						(!newCloseAll))
					{
						startApps.push(oldActiveModes[i].appsList[j]);
					}
					else if(oldActiveModes[i].appsList[j].type == "srv")
						closeServices.push(oldActiveModes[i].appsList[j]);
				}
			}
		}
	}

	if((oldCloseAll) || (newCloseAll))
		closeApps = "all";

	// Execute services.

	for(var i = 0; i < closeServices.length; i++) {
		Mojo.Log.error("Executing service closing: " + closeServices[i].name);

		var params = closeServices[i].params.close;

		try {eval("var parameters = " + params);} catch(error) {var parameters = "";}

		ServiceRequestWrapper.request(closeServices[i].url, {'method': closeServices[i].method, 
			'parameters': parameters});
	}

	for(var i = 0; i < startServices.length; i++) {
		Mojo.Log.error("Executing service starting: " + startServices[i].name);

		var params = startServices[i].params.start;

		try {eval("var parameters = " + params);} catch(error) {var parameters = "";}

		ServiceRequestWrapper.request(startServices[i].url, {'method': startServices[i].method, 
			'parameters': parameters});
	}

	// Update apps.

	var doneCallback = this.executeModeUpdate.bind(this, oldActiveModes, newActiveModes, "done", roundCount);

	AppsManagerWrapper.update(startApps, closeApps, doneCallback);
}

//

AppAssistant.prototype.checkModeTriggers = function(mode) {
	// If mode does not have triggers then always return true.

	if(mode.triggersList.length == 0)
		return true;

	var hadTriggers = false;

	var grouped = new Array(10);

	if(mode.triggers.required == 2)
		var groups = 10;
	else
		var groups = 1;
	
	// Loop through triggers and test are they valid or no.

	for(var i = 0; i < this.triggers.length; i++) {
		for(var group = 0; group < groups; group++) {
			var triggerState = "unknown";
	
			if(grouped[group] != false) {
				for(var j = 0; j < mode.triggersList.length; j++) {
					if((mode.triggersList[j].group == undefined) ||
						(mode.triggersList[j].group == group))
					{
						if(this.triggers[i].id == mode.triggersList[j].extension) {
							hadTriggers = true;
						
							triggerState = this.triggers[i].trigger.check(mode.triggersList[j], mode.name);

							if(triggerState == true)
								break;
						}
					}
				}		

				if((mode.triggers.required == 2) && (triggerState != "unknown"))
					grouped[group] = triggerState;
			}
		}
		
		// If all unique then single invalid trigger is enough and
		// if any trigger then single valid trigger is enough.
		
		// For grouped modes we need to loop all triggers through.
				
		if((mode.triggers.required == 0) && (triggerState == false))
			return false;
		else if((mode.triggers.required == 1) && (triggerState == true))
			return true;
	}

	// If all unique and all valid then mode triggers are valid and
	// if any trigger and all invalid then mode triggers are invalid.

	if((hadTriggers) && (mode.triggers.required == 0)) 		
		return true;
	else if((hadTriggers) && (mode.triggers.required == 1))
		return false;
	else if((hadTriggers) && (mode.triggers.required == 2)) {
		for(var i = 0; i < grouped.length; i++) {
			if(grouped[i] == true)
				return true;
		}
		
		return false;
	}
	
	// If triggers left on group pages then triggers are invalid.
	
	return true;
}

//

AppAssistant.prototype.saveConfigData = function(target) {
	// Helper for other assistants for requesting config saving.

	ConfigManagerWrapper.save(this.config, target);
}

