/*
 *    AppAssistant - App Assistant for Mode Launcher
 */

function AppAssistant(appController) {
	/* This is the creator function for your app assistant object (the first created scene). */

	// Initialize global variables

	this.config = {}; 

	this.initialized = false;

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
		
	this.config.modeSwitcher = {
		'activated': 0,
		'timerStart': 10, 
		'timerClose': 10, 
		'modeLocked': "no",
		'apiVersion': "1.0", 
		'cfgVersion': "1.0" }; 
	
	this.config.modesConfig = new Array();
	
	this.config.currentMode = null; 
	this.config.defaultMode = null; 
	
	this.config.modifierModes = new Array();
}

AppAssistant.prototype.cleanup = function() {
	/* This function should do any cleanup needed before the execution is interrupted. */
	
	Mojo.Log.error("DEBUG: Cleaning up Mode Switcher");
	
	ScreenControlWrapper.cleanup();
}

//

AppAssistant.prototype.handleLaunch = function(params) {
	if((params) && (params.launchedAtBoot == true)) {
		// Load config and init Mode Switcher.

		Mojo.Log.error("DEBUG: Mode Switcher Launched At Boot");

		this.initiating = true;

		var callback = this.updateConfigData.bind(this);

		ConfigManagerWrapper.load(this.config, callback);
	}
	else if(this.initialized) {
		// Handle normal Mode Switcher launch.

		Mojo.Log.error("DEBUG: Mode Switcher Started Normally " + Object.toJSON(params));

		this.executeLaunch(params);
	}
	else
		Mojo.Log.warn("Mode Switcher not running on background");
}

//

AppAssistant.prototype.executeLaunch = function(params) {
	ServiceRequestWrapper.request('palm://com.palm.power/com/palm/power', { 
		method: 'activityStart', parameters: {'id': Mojo.Controller.appInfo.id, 'duration_ms': 60000} });
	
	var stageController = this.controller.getStageController("config");
	var appController = Mojo.Controller.getAppController();

	if((!params) || (params.action == "config")) {
		var mode = null;

		if((params.action == "config") && (params.event == "edit")) {
			for(var i = 0; i < this.config.modesConfig.length; i++) {
				if(this.config.modesConfig[i].name == params.name) {
					mode = i;
					
					break;
				}
			}
		}

		if(stageController) {
			Mojo.Log.info("Main config stage allready exists");

			if(mode == null)
				stageController.popScenesTo("config");
			else
				stageController.swapScene("config", "edit", mode);

			stageController.activate();
		}
		else {
			Mojo.Log.info("Creating main stage for config");
			
			var mainScene = function(stageController) {
				if(mode == null)
					stageController.pushScene("config");
				else
					stageController.pushScene("config", "edit", mode);
			};
				
			var stageArgs = {name: "config", lightweight: true};
			
			this.controller.createStageWithCallback(stageArgs, 
				mainScene.bind(this), "card");
		}
	}

	else if(params.action == "control") {
		if(params.event == "init") {
			this.initModeSwitcher();
		}
		else if(params.event == "reload") {
			this.reloadModeSwitcher();
		}
		else if(params.event == "shutdown") {
			this.shutdownModeSwitcher();
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
			var cb = this.handleLauncher.bind(this);

			for(var i = 0; i < this.triggers.length; i++) {
				if(this.triggers[i].id == params.event) {
					this.triggers[i].trigger.execute(data, cb);
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

			this.processLauncher(event, original, modifiers);
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

AppAssistant.prototype.handleLauncher = function(startModes, closeModes) {
	Mojo.Log.info("Handling launcher event: " + startModes.length + " " + closeModes.length);

	var block = 0;
	var current = this.config.defaultMode;
	var modifiers = this.config.modifierModes.slice(0);
	
	if((this.config.modeSwitcher.modeLocked == "yes") || 
		((startModes.length == 0) && (closeModes.length == 0)))
	{
		return;
	}

	// Determine the current mode and the trigger blocking setting from active modes.
	
	if(this.config.currentMode.type != "default") {
		for(var i = 0; i < this.config.modesConfig.length; i++) {
			if(this.config.modesConfig[i].name == this.config.currentMode.name)
				current = this.config.modesConfig[i];

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
			}
		}
	}

	// Check that other triggers and config for start modes and close modes are valid.
	
	for(var i = 0; i < startModes.length ; i++) {
		if(((current.type != "default") && (block == 1)) || 
			((current.type == "normal") && (startModes[i].type == "normal") && (block == 2)) ||
			((current.type == "modifier") && (startModes[i].type == "modifier") && (block == 3)))
		{
			Mojo.Log.error("DEBUG: Removing Blocked Mode");
		
			startModes.splice(i--, 1);
		}
		else if((startModes[i].autoStartMode == 0) || (startModes[i].triggersList.length == 0) || 
			(!this.checkModeTriggers(startModes[i])) || (startModes[i].name == current.name) ||
			(this.config.modifierModes.indexOf(startModes[i].name) != -1))
		{
			Mojo.Log.error("DEBUG: Removing Invalid Mode");
			
			startModes.splice(i--, 1);
		}
		else if(startModes[i].type == "modifier")
		{
			Mojo.Log.error("DEBUG: Removing Modifier Mode");
		
			modifiers.push(startModes[i].name);
			startModes.splice(i--, 1);
		}
	}

	for(var i = 0; i < closeModes.length ; i++) {
		if(((current.type != "default") && (block == 1)) || 
			((current.type == "normal") && (closeModes[i].type == "normal") && (block == 2)) ||
			((current.type == "modifier") && (closeModes[i].type == "modifier") && (block == 3)))
		{
			Mojo.Log.error("DEBUG: Removing Blocked Mode");
		
			closeModes.splice(i--, 1);
		}
		else if((closeModes[i].autoCloseMode == 0) || (closeModes[i].triggersList.length == 0) || 
			(this.checkModeTriggers(closeModes[i])) || ((closeModes[i].name != current.name) &&
			(this.config.modifierModes.indexOf(closeModes[i].name) == -1)))
		{
			Mojo.Log.error("DEBUG: Removing Invalid Mode " + this.checkModeTriggers(closeModes[i]));
		
			closeModes.splice(i--, 1);
		}
		else if(closeModes[i].type == "modifier")
		{
			Mojo.Log.error("DEBUG: Removing Modifier Mode");
		
			modifiers.splice(this.config.modifiersodes.indexOf(closeModes[i].name), 1);
			closeModes.splice(i--, 1);
		}
	}

	// Check if we should do immediate start/close or execute the launcher scene.
	// If immediate is set and there are other start/close actions then use launcher.

	if((startModes.length == 1) && (startModes[0].autoStartMode == 3))
		this.updateCurrentMode(startModes[0], modifiers);
	else if((closeModes.length == 1) && (closeModes[0].autoCloseMode == 3))
		this.updateCurrentMode(this.config.defaultMode, modifiers);
	else if((startModes.length > 0) || (closeModes.length > 0))
		this.executeLauncher(startModes, closeModes[0], modifiers);
	else if(modifiers.length != this.config.modifierModes.length) 
		this.updateCurrentMode(current, modifiers);
}

AppAssistant.prototype.executeLauncher = function(startModes, closeMode, modifiers) {
	var stageController = this.controller.getStageController("launcher");
	var appController = Mojo.Controller.getAppController();

	if(stageController) {
		Mojo.Log.info("Main launcher stage allready exists");

		// FIXME: Should update the launcher!!!
	}
	else {
		Mojo.Log.info("Creating main stage for launcher");

		var launcherScene = function(stageController) {
			stageController.pushScene("launcher", startModes, closeMode, modifiers);};
			
		var stageArgs = {name: "launcher", lightweight: true, height: 177};
		
		this.controller.createStageWithCallback(stageArgs, 
			launcherScene.bind(this), "popupalert");
	}
}

AppAssistant.prototype.processLauncher = function(event, originalMode, modifierModes) {
	Mojo.Log.info("Processing launcher request: " + originalMode);

	var original = this.config.defaultMode;
	var modifiers = new Array();

	for(var i = 0; i < this.config.modesConfig.length; i++) {
		if(this.config.modesConfig[i].name == originalMode) {
			if(event != "close")
				original = this.config.modesConfig[i];
		}
		else if(modifierModes.indexOf(this.config.modesConfig[i].name) != -1) {
			modifiers.push(this.config.modesConfig[i]);
		}
	}
	
	this.updateCurrentMode(original, modifiers);
}

//

AppAssistant.prototype.updateConfigData = function() {
	// FIXME: Remove at some point when everybody should have the stable version!

	Mojo.Log.error("DEBUG: Mode Switcher Updating Config");
	
	if((this.config.modeSwitcher.cfgVersion == undefined) || 
		(this.config.modeSwitcher.cfgVersion !== "1.0") ||
		(this.config.currentMode == null) || (this.config.defaultMode == null))
	{
		//if(this.config.modeSwitcher.cfgVersion === "1.0") {
		//}
		//else {

		if((this.config.currentMode == null) ||
			(this.config.defaultMode == null))
		{
			Mojo.Log.error("DEBUG: Uninitialized Mode Switcher Config");
		}
		else
			Mojo.Log.error("DEBUG: Mode Switcher Resetting Old Config");

		this.config.modeSwitcher = {
			'activated': 0, 
			'timerStart': 10, 
			'timerClose': 10, 
			'modeLocked': "no", 
			'apiVersion': "1.0", 
			'cfgVersion': "1.0" }; 
		
		this.config.modesConfig = new Array();
			
		this.config.currentMode = null; 
		this.config.defaultMode = null; 
		
		this.config.modifierModes = new Array();
		//}

		ConfigManagerWrapper.save(this.config);
	}

	this.initExtensionsExec("setting");
}

//

AppAssistant.prototype.initExtensionsExec = function(type) {
	
	// Load available extensions.

	if(type == "setting")
		extensions = ["airplane", "calendar", "connection", "email", 
			"messaging", "network", "ringer", "screen", "security", "sound"];
	else if(type == "application")
		var extensions = ["default", "browser", "govnah", 
			"modesw", "phone", "wwindow"];		
	else if(type == "trigger")
		var extensions = ["battery", "btprofile", "charger", 
			"location", "timeofday", "wireless"];

	this.initExtensionExec(type, extensions, 0);
}

AppAssistant.prototype.initExtensionsDone = function(type) {
	if(type == "setting")
		this.initExtensionsExec("application");
	else if(type == "application")
		this.initExtensionsExec("trigger");
	else {
		// If mode switcher is activated then execute startup.
	
		this.reloadModeSwitcher(true);
	}
}

//

AppAssistant.prototype.initExtensionExec = function(type, extensions, index) {
	var id = extensions[index];
	var ext = id.charAt(0).toUpperCase() + id.slice(1);
	
	var extConfig = eval("new " + ext + "Config(ServiceRequestWrapper);");
				
	if(type == "setting")	
		var extClass = eval ("new " + ext + "Setting(ServiceRequestWrapper);");
	else if(type == "trigger")
		var extClass = eval ("new " + ext + "Trigger(ServiceRequestWrapper, SystemAlarmsWrapper, SystemNotifierWrapper);");
			
	if(extConfig.version() == this.config.modeSwitcher.apiVersion) {
		var callback = this.initExtensionDone.bind(this, type, extensions, index, extConfig, extClass);
	
		if(type == "application")
			callback(true);
		else 
			extClass.init(callback);
	}
	else
		Mojo.Log.error("Invalid extension version: " + id);
}

AppAssistant.prototype.initExtensionDone = function(type, extensions, index, extConfig, extClass, state) {

	var id = extensions[index];

	if(state) {
		Mojo.Log.info("Loading " + type + " extension: " + id);
	
		if(type == "setting")
			this.settings.push({"id": id, "config": extConfig, "setting": extClass});
		else if(type == "application")
			this.applications.push({"id": id, "appid": extConfig.appid(), "config": extConfig});
		else if(type == "trigger")
			this.triggers.push({"id": id, "config": extConfig, "trigger": extClass});
	}
	else
		Mojo.Log.error("Extension loading failed: " + id);

	if(index >= (extensions.length - 1))
		this.initExtensionsDone(type);
	else
		this.initExtensionExec(type, extensions, ++index);
}

//

AppAssistant.prototype.initModeSwitcher = function() {
	Mojo.Log.error("DEBUG: Initializing Mode Switcher");
	
	Mojo.Log.info("Initializing mode switcher");

	// On init inform the user even if notifications are disabled.

	SystemNotifierWrapper.override("startup");

	// Initialize enabled trigger extensions on mode switcher init.

	clearTimeout(this.initTriggersTimer);
	
	this.initTriggersTimer = setTimeout(this.enableModeTriggers.bind(this), 30000);

	// Start the default mode when Mode Switcher is initialized.
	
	this.config.modifierModes.clear();
	
	this.executeStartMode(this.config.defaultMode.name);
}

AppAssistant.prototype.reloadModeSwitcher = function(startup) {
	Mojo.Log.error("DEBUG: Reloading Mode Switcher");
	
	Mojo.Log.info("Reinitializing mode switcher");

	if(this.config.modeSwitcher.activated != 1) {
		this.initialized = true;
		
		return;
	}

	// On reload inform the user even if notifications are disabled.

	SystemNotifierWrapper.override("reload");

	// Shutdown enabled trigger extensions for mode switcher reload.

	if(startup != true) {
		clearTimeout(this.shutdownTriggersTimer);

		this.shutdownTriggersTimer = setTimeout(this.disableModeTriggers.bind(this), 0);
	}
	
	// Check that original mode still exists and triggers are valid.

	var original = this.config.defaultMode;
	
	if(this.config.currentMode.type == "normal") {
		for(var i = 0; i < this.config.modesConfig.length; i++) {
			if(this.config.modesConfig[i].name == this.config.currentMode.name) {
				if(this.config.modesConfig[i].type == "normal") {
					if(this.checkModeTriggers(this.config.modesConfig[i]))
						original = this.config.modesConfig[i]
				}

				break;
			}
		}
	}

	// Check that modifier modes still exists and triggers are valid.

	var modifiers = new Array();

	for(var i = 0; i < this.config.modifierModes.length; i++) {
		for(var j = 0; j < this.config.modesConfig.length; j++) {
			if(this.config.modifierModes[i] == this.config.modesConfig[j].name) {
				if(this.config.modesConfig[j].type == "modifier") {
					if(this.checkModeTriggers(this.config.modesConfig[j]))
						modifiers.push(this.config.modesConfig[j]);
				}
			
				break;
			}
		}
	}

	// Execute the actual updating of current mode (if there's changes).

	this.updateCurrentMode(original, modifiers);
	
	// Initialize enabled trigger extensions after mode switcher reload.

	clearTimeout(this.initTriggersTimer);
	
	if(this.initialized)
		this.initTriggersTimer = setTimeout(this.enableModeTriggers.bind(this), 0);
	else
		this.initTriggersTimer = setTimeout(this.enableModeTriggers.bind(this), 30000);
}

AppAssistant.prototype.shutdownModeSwitcher = function() {
	Mojo.Log.error("DEBUG: Shutting Down Mode Switcher");
	
	Mojo.Log.info("Shutting down mode switcher");

	// On shutdown inform the user even if notifications are disabled.

	SystemNotifierWrapper.override("shutdown");

	// Shutdown enabled trigger extensions on mode switcher shutdown.

	clearTimeout(this.shutdownTriggersTimer);
	
	this.shutdownTriggersTimer = setTimeout(this.disableModeTriggers.bind(this), 0);
	
	// Close the current mode (set system settings from default mode).

	this.config.modifierModes.clear();
	
	this.executeCloseMode(this.config.defaultMode.name);
}

//

AppAssistant.prototype.enableModeTriggers = function() {
	for(var i = 0; i < this.triggers.length; i++)
		this.triggers[i].trigger.enable(this.config);
}

AppAssistant.prototype.disableModeTriggers = function() {
	for(var i = 0; i < this.triggers.length; i++)
		this.triggers[i].trigger.disable();
}

//

AppAssistant.prototype.lockModeSwitcher = function() {
	Mojo.Log.error("DEBUG: Locking Mode Switcher");
	
	Mojo.Log.info("Locking mode switcher");

	this.config.modeSwitcher.modeLocked = "yes";
	
	ConfigManagerWrapper.save(this.config, "modeSwitcher");
}

AppAssistant.prototype.unlockModeSwitcher = function() {
	Mojo.Log.error("DEBUG: Unlocking Mode Switcher");
	
	Mojo.Log.info("Unlocking mode switcher");
	
	this.config.modeSwitcher.modeLocked = "no";
	
	ConfigManagerWrapper.save(this.config, "modeSwitcher");
}

//

AppAssistant.prototype.executeStartMode = function(modeName) {
	Mojo.Log.info("Start mode action received: " + modeName);

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
			if(this.modesList.length > 1) {
				modeName = this.modesList[this.modesList.length - 2];
			}
		}

		for(var i = 0; i < this.config.modesConfig.length; i++) {
			if(this.config.modesConfig[i].name == modeName) {
				requestedMode = this.config.modesConfig[i];
			
				break;
			}
		}
	}
		
	// If requested mode not found then do nothing.
	
	if(requestedMode == null)
		return;
	
	// Define and locate original mode for update.

	if(requestedMode.type != "modifier") {
		var original = requestedMode;
	}
	else {
		var original = this.config.defaultMode;
		
		for(var i = 0; i < this.config.modesConfig.length; i++) {
			if(this.config.modesConfig[i].name == this.config.currentMode.name) {
				original = this.config.modesConfig[i];
			
				break;
			}
		}
	}
	
	// Generate list of modifier modes for update.

	var modifiers = new Array();

	for(var i = 0; i < this.config.modifierModes.length; i++) {
		if(this.config.modifierModes[i] == modeName)
			continue;

		for(var j = 0; j < this.config.modesConfig.length; j++) {
			if(this.config.modifierModes[i] == this.config.modesConfig[j].name) {
				if(this.config.modesConfig[j].type == "modifier")
					modifiers.push(this.config.modesConfig[j]);
				
				break;
			}
		}
	}
	
	if(requestedMode.type == "modifier")
		modifiers.push(requestedMode);

	// Initiate the actual updating of the mode.

	this.updateCurrentMode(original, modifiers);
}

AppAssistant.prototype.executeCloseMode = function(modeName) {
	Mojo.Log.info("Close mode action received: " + modeName);

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
			if(this.modesList.length > 1) {
				modeName = this.modesList[this.modesList.length - 2];
			}
		}

		for(var i = 0 ; i < this.config.modesConfig.length ; i++) {
			if(this.config.modesConfig[i].name == modeName) {
				requestedMode = this.config.modesConfig[i];
		
				break;
			}
		}
	}	
	
	// If requested mode not found then do nothing.
	
	if(requestedMode == null)
		return;
	
	// Define and locate original mode for update.

	if(requestedMode.type != "modifier") {
		var original = this.config.defaultMode;
	}
	else {
		var original = this.config.defaultMode;
	
		for(var i = 0; i < this.config.modesConfig.length; i++) {
			if(this.config.modesConfig[i].name == this.config.currentMode.name) {
				original = this.config.modesConfig[i];
		
				break;
			}
		}
	}
	
	// Generate list of modifier modes for update.

	var modifiers = new Array();

	for(var i = 0; i < this.config.modifierModes.length; i++) {
		if(this.config.modifierModes[i] == modeName)
			continue;
		
		for(var j = 0; j < this.config.modesConfig.length; j++) {
			if(this.config.modifierModes[i] == this.config.modesConfig[j].name) {
				if(this.config.modesConfig[j].type == "modifier")
					modifiers.push(this.config.modesConfig[j]);
				
				break;
			}
		}
	}
	
	// Initiate the actual closing of the mode.

	this.updateCurrentMode(original, modifiers);
}

AppAssistant.prototype.executeToggleMode = function(modeName) {
	Mojo.Log.info("Toggle mode action received: " + modeName);

	if(modeName == "Current Mode") {
		modeName = this.config.currentMode.name;
	}
	else if(modeName == "Previous Mode") {
		if(this.modesList.length > 1) {
			modeName = this.modesList[this.modesList.length - 2];
		}
	}

	if(this.config.currentMode != null) {
		if((this.config.currentMode.name == modeName) || 
			(this.config.modifierModes.indexOf(modeName) != -1))
		{
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

AppAssistant.prototype.triggerManualMode = function(modeName) {
	Mojo.Log.info("Manual trigger action received: " + modeName);
	
	if(modeName == "Default Mode")
		this.executeModeStart(this.config.defaultMode.name);
	else {
		if(modeName == "Current Mode") {
			modeName = this.config.currentMode.name;
		}
		else if(modeName == "Previous Mode") {
			if(this.modesList.length > 1) {
				modeName = this.modesList[this.modesList.length - 2];
			}
		}

		for(var i = 0 ; i < this.config.modesConfig.length ; i++) {
			if(this.config.modesConfig[i].name == modeName) {
				if((this.config.currentMode.name != modeName) &&
					(this.config.modifierModes.indexOf(modeName) == -1))
				{
					if(this.checkModeTriggers(this.config.modesConfig[i]))
						this.executeStartMode(modeName);
				}
				else {
					if(!this.checkModeTriggers(this.config.modesConfig[i]))
						this.executeCloseMode(modeName);
				}
	
				break;
			}
		}
	}
}

//



AppAssistant.prototype.updateCurrentMode = function(original, modifiers) {
	// Save old mode and generate the new mode.

	var oldModifierModes = this.config.modifierModes;
	
	var newModifierModes = new Array();

	var oldCurrentMode = this.config.currentMode;
	
	var newCurrentMode = {
		'name': original.name, 'type': original.type,
		'settings': {}, 'settingsList': [],
		'apps': original.apps, 'appsList': original.appsList };

	if(original.type == "default")
		var modes = [this.config.defaultMode].concat(modifiers);
	else
		var modes = [this.config.defaultMode].concat([original], modifiers);
	
	for(var i = 0; i < modes.length; i++) {
		if(modes[i].type == "modifier")
			newModifierModes.push(modes[i].name);
	
		if(modes[i].settings.notify != 0)
			newCurrentMode.settings.notify = modes[i].settings.notify;
		
		if(modes[i].settings.charging != 0)
			newCurrentMode.settings.charging = modes[i].settings.charging;

		for(var j = 0; j < modes[i].settingsList.length; j++) {
			var index = newCurrentMode.settingsList.length;
		
			for(var k = 0; k < newCurrentMode.settingsList.length; k++) {
				if(newCurrentMode.settingsList[k].extension == modes[i].settingsList[j].extension) {
					index = k;
					break;
				}
			}
		
			if(index == newCurrentMode.settingsList.length) {
				var settings = {};
				
				Object.extend(settings, modes[i].settingsList[j]);
				
				newCurrentMode.settingsList.push(settings);
			}
			else {
				Object.extend(newCurrentMode.settingsList[k], modes[i].settingsList[j]);
			}     	
	  }
	}
	
	// Save current mode and its modifiers.

	this.config.modeSwitcher.modeLocked = "no";	
	
	this.config.currentMode = newCurrentMode;
	
	this.config.modifierModes = newModifierModes;
	
	ConfigManagerWrapper.save(this.config);
			
	// Execute the actual mode changing.

	if(Object.toJSON(oldCurrentMode) != Object.toJSON(newCurrentMode))	
		this.modeUpdateInit(oldCurrentMode, newCurrentMode);
	else
		this.updateRunningApps(oldCurrentMode, newCurrentMode);
}

AppAssistant.prototype.updateHistoryList = function(oldCurrentMode, newCurrentMode) {
	// Add to list if this is a new mode.

	if((oldCurrentMode.name != newCurrentMode.name) &&
		(newCurrentMode.name != "Default Mode"))
	{
		if(this.modesList.length == 0)
			this.modesList.push(newCurrentMode.name);
		else {
			if(this.modesList[this.modesList.length-1] != newCurrentMode.name) {
				if(this.modesList.length == 10)
					this.modesList.shift();

				this.modesList.push(newCurrentMode.name);
			}
			else {
				this.modesList.pop();
			}
		}
	}
}

AppAssistant.prototype.updateRunningApps = function(oldCurrentMode, newCurrentMode) {
	var oldApps = new Array();
	var newApps = new Array();

	var start = newCurrentMode.apps.start;
	var close = oldCurrentMode.apps.close;

	oldApps = oldCurrentMode.appsList;

	if((!this.initialized) || 
		(newCurrentMode.type != "default") || 
		(newCurrentMode.miscAppsMode == 1))
	{
		newApps = newCurrentMode.appsList;
	}

	AppsManagerWrapper.update(oldApps, newApps, start, close, null);

	this.initialized = true;
}

//

AppAssistant.prototype.modeUpdateInit = function(oldCurrentMode, newCurrentMode) {
	// Initiate the mode updating process.

	Mojo.Log.info("Mode updating initialized");

	// Notify about mode updating if configured.
	
	SystemNotifierWrapper.notify("init", oldCurrentMode, newCurrentMode);
	
	// Update the normal modes history list.

	this.updateHistoryList(oldCurrentMode, newCurrentMode);

	// Setup screen mode from current mode.
	
	if(newCurrentMode.settings.charging == 1)
		ScreenControlWrapper.setMode("default");
	else if(newCurrentMode.settings.charging == 2)
		ScreenControlWrapper.setMode("alwayson");
	else if(newCurrentMode.settings.charging == 3)
		ScreenControlWrapper.setMode("turnoff");
	
	// Execute the actual mode updating process.
	
	this.modeUpdateExec(oldCurrentMode, newCurrentMode, 0);
}

AppAssistant.prototype.modeUpdateExec = function(oldCurrentMode, newCurrentMode, index) {
	// Check the status of config execution and act accordingly.

	if(index < newCurrentMode.settingsList.length) {
		var callback = this.modeUpdateExec.bind(this, oldCurrentMode, newCurrentMode, index + 1);

		for(var i = 0; i < this.settings.length; i++) {
			if(this.settings[i].id == newCurrentMode.settingsList[index].extension) {
				Mojo.Log.info("Setting settings: " + this.settings[i].id);
				
				this.settings[i].setting.set(newCurrentMode.settingsList[index], callback);
				
				break;
			}
		}
	}
	else {
		this.modeUpdateDone(oldCurrentMode, newCurrentMode);	
	}
}

AppAssistant.prototype.modeUpdateDone = function(oldCurrentMode, newCurrentMode) {
	Mojo.Log.info("Mode updating completed");

	// Update running apps according to config.

	this.updateRunningApps(oldCurrentMode, newCurrentMode);

	// Notify about mode updating if configured.
	
	SystemNotifierWrapper.notify("done", oldCurrentMode, newCurrentMode);
}

//

AppAssistant.prototype.checkModeTriggers = function(mode) {

	for(var i = 0; i < mode.triggersList.length; i++) {
		var triggerState = false;

		for(var j = 0; j < this.triggers.length; j++) {
			if(mode.triggersList[i].extension == this.triggers[j].id) {
				if(this.triggers[j].trigger.check(mode.triggersList[i])) {
					triggerState = true;
					
					break;
				}
			}		
		}

		if((mode.triggers.required == 0) && (!triggerState))
			return false;
		else if((mode.triggers.required == 1) && (triggerState))
			return true;
	}

	if(mode.triggersList.length == 0)
		return true; 		
	else if(mode.triggers.required == 0) 		
		return true;
	else if(mode.triggers.required == 1)
		return false;
}

//

AppAssistant.prototype.saveConfigData = function(target) {
	ConfigManagerWrapper.save(this.config, target);
}

