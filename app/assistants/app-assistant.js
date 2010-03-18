/*
 *    AppAssistant - App Assistant for Mode Launcher
 */

function AppAssistant(appController) {
	/* This is the creator function for your app assistant object (the first created scene). */

	this.config = {activated: 0, timerStart: 10, timerClose: 10, apiVersion: 1, configVersion: 4}; // Saved as: modeSwitcher

	this.status = {apps: [], charger: "none", latitude: 0, longitude: 0, timestamp: ""}; // This is not saved
	
	this.modes = new Array(); // Saved as: modesConfig
	
	this.curmode = null; // Saved as: currentMode
	this.defmode = null; // Saved as: defaultMode

	this.oldmode = null; // This is not saved
	this.newmode = null; // This is not saved

	this.timeoutTrigger = null; // This is not saved
	this.triggerEvent = null; // This is not saved
	
	this.launcherModes = new Array(); // This is not saved
	this.launcherClose = null; // This is not saved	
	
	this.configOptions = new Array(); // This is not saved
	this.currentAction = null; // This is not saved
		
	this.configCount = 0; // This is not saved
	this.retryCount = 0; // This is not saved
	
	this.displayOff = false;
	this.chargerSet = false;
	this.powerSource = {};
}

//

AppAssistant.prototype.setup = function() {
	/* This function is for setup tasks that have to happen when the scene is first created. */

	this.configOptions = [
		"connectionWiFi", "connectionBT", "connectionGPS", 
		"connectionData", "connectionPhone", 
		"messagingIMStatus", "messagingSoundMode", 
		"ringerRingerOn", "ringerRingerOff", "ringerRingtonePath", 
		"screenBrightnessLevel", "screenTurnOffTimeout", "screenWallpaperPath", 
		"soundRingerVolume", "soundSystemVolume", "soundMediaVolume"];
}

AppAssistant.prototype.cleanup = function() {
	/* This function should do any cleanup needed before the execution is interrupted. */
}

//

AppAssistant.prototype.screenOrientationChanged = function() {
}

//

AppAssistant.prototype.handleLaunch = function(params) {
	// Load config data and then execute launch

	if((params) && (params.launchedAtBoot == true)) {
		this.loadConfigData(params);
	}
	else {
		this.executeLaunch(params);
	}
}

//

AppAssistant.prototype.executeLaunch = function(params) {
	// FIXME: When background app then separate stages for config and launcher.

	var stageController = this.controller.getStageController("config");
	var appController = Mojo.Controller.getAppController();

	if(!params) {
		if(stageController) {
			Mojo.Log.info("Main config stage allready exists");

			// Do nothing if user tries to open config when launcher active.
			
			if((this.currentAction) && (this.currentAction == "config")) {
				stageController.popScenesTo("config");
				stageController.activate();
			}
		}
		else {
			Mojo.Log.info("Creating main stage for config");
			
			this.currentAction = "config";
			
			this.haltModeSwitcher();
			
			var mainScene = function(stageController) {
				stageController.pushScene("config");};
				
			var stageArgs = {name: "config", lightweight: true};
			
			this.controller.createStageWithCallback(stageArgs, 
				mainScene.bind(this), "card");
		}
	}
	else {
		if(this.config.activated != 1)
			return;
	
		// FIXME: this dropped launches needs to be handled somehow!

//		if((stageController) && (this.currentAction == "config"))
//			return;

		if((this.currentAction) && (this.currentAction == "execute"))
			return;

		if(params.action == "startup") {
			this.currentAction = "startup";
/*			
			if(params.event == "init") {
				this.status.charger = "none";
				this.status.latitude = 0;
				this.status.longitude = 0;
				
				this.queryChargerStatus();
			}
			else*/
			if (params.event == "ready") {
				this.initModeSwitcher(params, true);
				
				this.subscribeChargerStatus();
				//this.subscribeDisplayStatus();
			}
			else if (params.event == "reload") {
				this.initModeSwitcher(params, false);
			}
		}
		
		else if(params.action == "execute") {
			if(this.config.activated != 1)
				return;

			this.currentAction = "execute";
	
			if(params.event == "start")
				this.executeStartMode(params);
			else if(params.event == "close")
				this.executeCloseMode(params);
			else if(params.event == "toggle")
				this.toggleCurrentMode(params);
		}

		else if(params.action == "trigger") {
			if(this.config.activated != 1)
				return;
			
			this.currentAction = "trigger";
			
			if(params.event == "charger")
				this.checkChargerTrigger(params);
			else if(params.event == "timeout")
				this.checkTimeoutTrigger(params);
			else if(params.event == "location")
				this.checkLocationTrigger(params);
		}
		
		else if(params.action == "clear") {
			this.config.activated = 0;
			this.config.timerStart = 10;
			this.config.timerClose = 10;
			
			this.status.charger = "none";
			this.status.latitude = 0;
			this.status.longitude = 0;

			this.modes = new Array();
			this.curmode = null;
			this.sysmode = null;

			this.saveConfigData("all");
		}
		
		else if(params.action == "none") {
			// Do nothing...
		}
	}
}

//

AppAssistant.prototype.handleLauncher = function() {
	// Check if we should do immediate start/close or execute the launcher scene.
	// If immediate is set and there are other start/close actions then use launcher.

	if(this.launcherModes.length > 0)
	{
		if((this.launcherModes.length == 1) &&
			(this.launcherModes[0].autoStart == 3))
		{
			var name = this.launcherModes[0].name;
			var params = {"name": name};
			this.executeStartMode(params);
		}
		else
			this.executeLauncher("start");
	}
	else if(this.launcherClose != null)
	{
		if(this.launcherClose.autoClose == 3)
		{
			var name = this.launcherClose.name;
			var params = {"name": name};
			this.executeCloseMode(params);
		}
		else 
			this.executeLauncher("close");
	}
	else
		this.currentAction = null;
}

AppAssistant.prototype.executeLauncher = function(event) {
	// FIXME: When background app then separate stages for config and launcher.

	var stageController = this.controller.getStageController("launcher");
	var appController = Mojo.Controller.getAppController();

	if(stageController) {
		Mojo.Log.info("Main launcher stage allready exists");

		// This should only happen if config screen is active in which
		// case launcher should not be shown anyway. If user activates 
		// charger trigger when launcher is already visible we ignore 
		// it, at least for now. If timeout activation happens same
		// time than user puts phone on charger it is also ignored.
		
		// Timeout based launches should not happen on top of each other 
		// since they are timed in 5 minute intervals which means that 
		// the launcher has plenty of time to finish before it needs to 
		// be shown again. Old timeouts are processed separately since 
		// the relaunch of app can only process one timeout.
		
		// FIXME: When background app then should update launcher.
	}
	else {
		Mojo.Log.info("Creating main stage for launcher");

		this.currentAction = "launcher";

		// FIXME: When background app then no need for this.

		if(this.timeoutTrigger)
			clearTimeout(this.timeoutTrigger);

		var launcherScene = function(stageController) {
			stageController.pushScene("launcher", event);};
			
		var stageArgs = {name: "launcher", lightweight: true, height: 177};
		
		this.controller.createStageWithCallback(stageArgs, 
			launcherScene.bind(this), "popupalert");
	}
}

//

AppAssistant.prototype.loadConfigData = function(params) {	
	// Load all mode swticher related system preferences.

	if(this.requestLoad)
		this.requestLoad.cancel();

	this.requestLoad = new Mojo.Service.Request("palm://com.palm.systemservice/", {
		method: 'getPreferences',
		parameters: {"subscribe": false, "keys": ["modeSwitcher","statusCache",
			"modesConfig", "currentMode","defaultMode"]},
		onSuccess: this.handleConfigData.bind(this, params),
		onFailure: this.handleConfigData.bind(this, params) });
}

AppAssistant.prototype.handleConfigData = function(params, payload) {	
	// FIXME: remove at some point when everybody should have latest version.

   var appController = Mojo.Controller.getAppController();

	if(payload.modeSwitcher != undefined) {
		if((payload.modeSwitcher.configVersion == undefined) ||
			(payload.modeSwitcher.configVersion < 2))
		{
			this.saveConfigData("config");
//			this.saveConfigData("status");		
			this.saveConfigData("modes");
			this.saveConfigData("curmode");
			this.saveConfigData("defmode");	

			appController.launch("com.palm.app.modeswitcher", {"action": "startup", "event": "ready"}, null, null);

			return;
		}
	}
	
	if(payload.modeSwitcher != undefined) {
		this.config = payload.modeSwitcher;
		
		Mojo.Log.info("Config loaded succesfully");
	}
	else
		Mojo.Log.info("Using default config");

	if((payload.statusCache != undefined) && (payload.statusCache != "none"))
		this.status = payload.statusCache;
	
	if((payload.modesConfig != undefined) && (payload.modesConfig != "none"))
		this.modes = payload.modesConfig;

	if((payload.currentMode != undefined) && (payload.currentMode != "none"))
		this.curmode = payload.currentMode;
	
	if((payload.defaultMode != undefined) && (payload.defaultMode != "none"))
		this.defmode = payload.defaultMode;

	// FIXME: remove at some point when everybody should have latest version.
	
	if(payload.modeSwitcher != undefined) {
		if(payload.modeSwitcher.configVersion == 2) {
			for(var i = 0; i < this.modes.length; i++) {
				if(this.modes[i].apps.start == undefined)
					this.modes[i].apps.start = 0;
				if(this.modes[i].apps.close == 2)
					this.modes[i].apps.close = 1;
		
				for(var j = 0; j < this.modes[i].triggersList.length; j++) {
					if(this.modes[i].triggersList[j].type == "timeout") {
						if(this.modes[i].triggersList[j].timeoutCustom == undefined) {
							this.modes[i].triggersList[j].timeoutCustom = new Array();
						
							this.modes[i].triggersList[j].timeoutCustom.push(false);
							this.modes[i].triggersList[j].timeoutCustom.push(false);
							this.modes[i].triggersList[j].timeoutCustom.push(false);
							this.modes[i].triggersList[j].timeoutCustom.push(false);
							this.modes[i].triggersList[j].timeoutCustom.push(false);
							this.modes[i].triggersList[j].timeoutCustom.push(false);
							this.modes[i].triggersList[j].timeoutCustom.push(false);
						}
					}
				}
			}
				
			if(this.defmode) {
				this.defmode.apps.start = 0;
				this.defmode.apps.close = 0;
			}

			this.config.configVersion = 3;
		}
		if(payload.modeSwitcher.configVersion == 3) {
			for(var i = 0; i < this.modes.length; i++) {
				this.modes[i].type = "custom";
			}
				
			if(this.defmode != null)
				this.defmode.type = "default";
				
			this.config.configVersion = 4;
		}
	}

	appController.launch("com.palm.app.modeswitcher", {"action": "startup", "event": "ready"}, null, null);
}

AppAssistant.prototype.saveConfigData = function(configData) {
	var config = this.config;

	var status = this.status;

	if(this.modes.length == 0)
		var modes = "none";
	else
		var modes = this.modes;

	if(this.curmode == null)
		var curmode = "none";
	else
		var curmode = this.curmode;

	if(this.defmode == null)
		var defmode = "none";
	else
		var defmode = this.defmode;

	if((this.requestSave) || (configData == "all")) {
		var params = {
			"modeSwitcher": config, 
			"modesConfig": modes, 
//			"statusCache": status,
			"currentMode": curmode, 
			"defaultMode": defmode
		};
			
		this.requestSave.cancel();
	}
	else if(configData == "config")
		var params = {"modeSwitcher": config};
	else if(configData == "modes")
		var params = {"modesConfig": modes};
//	else if(configData == "status")
//		var params = {"statusCache": status};
	else if(configData == "curmode")
		var params = {"currentMode": curmode};
	else if(configData == "defmode")
		var params = {"defaultMode": defmode};
	else
		return;		
				
	this.requestSave = new Mojo.Service.Request("palm://com.palm.systemservice/", {
		method: 'setPreferences', parameters: params,
		onSuccess: function() {Mojo.Log.info("Config saved succesfully");}, 
		onFailure: function() {Mojo.Log.error("Saving of config failed");} });
}

//

AppAssistant.prototype.subscribeChargerStatus = function() {
	// Subscribe to Charger Notifications
	this.chargerNotificationSession = new Mojo.Service.Request('palm://com.palm.bus/signal/', {
		method: 'addmatch',
		parameters: {"category":"/com/palm/power","method":"chargerStatus"},
		onSuccess: this.handleChargerStatus.bind(this)});
		
	// Get the Initial Value for charger status (returned as signals)
	this.chargerStatusReq = new Mojo.Service.Request('palm://com.palm.power/com/palm/power/', {
		method: 'chargerStatusQuery' });
}

AppAssistant.prototype.handleChargerStatus = function(payload) {
   var appController = Mojo.Controller.getAppController();

	if(this.config.activated != 1)
		return;

	if(payload.type) {
		this.powerSource[payload.type] = payload.connected;

		// Assume not charging
		this.isCharging = false;
		
		// See if any power source is connected (and presumably charging)
		['usb','inductive'].each(function(source){
			if (this.powerSource[source] == true)
				this.isCharging = true;			
		}.bind(this));
						
		if(this.isCharging) {
			if((!this.chargerSet) && (payload.name)) {
/*		if(this.displayMode == 2) {
			this.requestDisplayBlock = new Mojo.Service.Request('palm://com.palm.display/control/', {
				method: "setProperty", parameters: {"requestBlock": false, "client": "topbar"} });
		}*/
//				this.status.charger = payload.name;
		
				appController.launch("com.palm.app.modeswitcher", {"action": "trigger", "event": "charger", "connected": payload.name}, null, null);
			}
			
			this.chargerSet = true;
		}
		else {
	
			if(this.chargerSet) {
		
		/*+	if((this.currentMode != null) && (this.connectedCharger != "none")) {
+		if(this.currentMode.settings.charging == 2) {
+			this.displayMode = 2;
+		
+			if(this.requestDisplayBlock)
+				this.requestDisplayBlock.cancel();
+			
+			this.requestDisplayBlock = new Mojo.Service.Request('palm://com.palm.display/control/', {
+				method: "setProperty", parameters: {"requestBlock": true, "client": "topbar"} });
+		}
+		else if(this.currentMode.settings.charging == 3) {
+			this.displayMode = 3;
}
}
+	*/		
		
				appController.launch("com.palm.app.modeswitcher", {"action": "trigger", "event": "charger", "connected": "none"}, null, null);
			}
	
			this.chargerSet = false;
		
//		this.status.charger = "none";
		}
	}
//	this.saveConfigData("status");

//	this.currentAction = null;
}

//

AppAssistant.prototype.subscribeDisplayStatus = function() {
			this.displayStatusSubscription = new Mojo.Service.Request('palm://com.palm.display/control/', {
				method: 'status', parameters: {'subscribe': true}, 
				onSuccess: this.handleDisplayStatus.bind(this) });

			this.systemManagerSubscription = new Mojo.Service.Request('palm://com.palm.systemmanager/', {
				method: 'getLockStatus', parameters: {'subscribe': true},
				onSuccess: this.handleDisplayStatus.bind(this) });
		//}
	//}
}

AppAssistant.prototype.handleDisplayStatus = function(payload) {
	if(this.currentMode != null) {
		if(this.currentMode.settings.charging == 3) {
			if((payload.event == "displayOn") && (this.displayOff)) {
				if(this.setupTouchPanelState)
					this.setupTouchPanelState.cancel();
			
				this.setupTouchPanelState = new Mojo.Service.Request('palm://com.palm.hidd/HidTouchpanel/', {
					method: 'State', parameters:{'mode':'set', 'value':'on'} });
			}
			else if((payload.event == "displayOff") || (payload.event == "displayInactive") || (payload.locked)) {
				if((this.status.charger != "none") && (!this.displayOff)) {
					if(this.currentMode.settings.charging == 3) {
						if(this.setupTouchPanelState)
							this.setupTouchPanelState.cancel();
		
						this.setupTouchPanelState = new Mojo.Service.Request('palm://com.palm.hidd/HidTouchpanel/', {
							method: 'State', parameters:{'mode':'set', 'value':'off'},
							onSuccess: function(payload) {
								if(this.setupBacklightState)
									this.setupBacklightState.cancel();

								this.setupBacklightState = new Mojo.Service.Request('palm://com.palm.power/backlight/', {
									method: 'set', parameters:{keypad: {brightness: 0}, display: {brightness: -1}} });
							}.bind(this)});
					
						this.displayOff = true;
					}
				}
			}
		}
	}
}

//

AppAssistant.prototype.checkStartTriggers = function(mode) {
	if(mode.triggers.required == 1)
		var state = {charger: true, location: true, timeout: true};
	else if(mode.triggers.required == 2)
		var state = {charger: false, location: false, timeout: false};

	var charger = 0;

	if(this.status.charger == "puck")
		charger = 1;
	else if(this.status.charger == "wall")
		charger = 2;
	else if(this.status.charger == "pc")
		charger = 3;	

	for(var i = 0; i < mode.triggersList.length; i++) {
		if(mode.triggersList[i].type == "charger") {
			state.charger = false;
			
			if(mode.triggersList[i].chargerCharger == charger) {
				state.charger = true;
				break;
			}
		}		
	}
	
	for(var i = 0; i < mode.triggersList.length; i++) {
		if(mode.triggersList[i].type == "location") {
			state.location = false;
		
			if((this.status.latitude != 0) && (this.status.longitude != 0) && 
				(this.calculateTimeEstimation(mode.triggersList[i]) == 0))
			{
				state.location = true;
				break;
			}
		}		
	}
	
	for(var i = 0; i < mode.triggersList.length; i++) {
		if(mode.triggersList[i].type == "timeout") {
			state.timeout = false;
		
			var limits = this.getTimeOfDayLimits(mode.triggersList[i]);
		
			if((limits.curTime >= limits.fromTime) && (limits.curTime < limits.toTime))
			{
				state.timeout = true;
				break;
			}
		}		
	}

	if(mode.triggers.required == 1) {
		if((state.charger) && (state.location) && (state.timeout))
			return true;
		else
			return false;
	}
	else if(mode.triggers.required == 2) {
		if((state.charger) || (state.location) || (state.timeout))
			return true;
		else
			return false;
	}
	else
		return null;
}

AppAssistant.prototype.checkCloseTriggers = function(mode) {
	var state = {charger: false, location: false, timeout: false};

	if(mode == null)
		return false;

	var charger = 0;

	if(this.status.charger == "puck")
		charger = 1;
	else if(this.status.charger == "wall")
		charger = 2;
	else if(this.status.charger == "pc")
		charger = 3;	

	for(var i = 0; i < mode.triggersList.length; i++) {
		if(mode.triggersList[i].type == "charger") {
			if(mode.triggersList[i].chargerCharger == charger) {
				state.charger = false;
				break;
			}
			else
				state.charger = true;
		}		
	}

	for(var i = 0; i < mode.triggersList.length; i++) {
		if(mode.triggersList[i].type == "location") {
			if((this.status.latitude != 0) && (this.status.longitude != 0) && 
				(this.calculateTimeEstimation(mode.triggersList[i]) == 0))
			{
				state.location = false;
				break;
			}
			else
				state.location = true;
		}		
	}

	for(var i = 0; i < mode.triggersList.length; i++) {
		if(mode.triggersList[i].type == "timeout") {
			var limits = this.getTimeOfDayLimits(mode.triggersList[i]);
	
			if((limits.curTime >= limits.fromTime) && (limits.curTime < limits.toTime)) {
				state.timeout = false;
				break;
			}
			else
				state.timeout = true;
		}
	}

	if(mode.triggers.required == 1) {
		if((state.charger) || (state.location) || (state.timeout))
			return true;
		else
			return false;
	}
	else if(mode.triggers.required == 2) {
		if((state.charger) && (state.location) && (state.timeout))
			return true;
		else
			return false;
	}
	else
		return null;
}

//

AppAssistant.prototype.initModeSwitcher = function(params, startup) {
	Mojo.Log.info("Initializing mode switcher: " + this.status.charger);

	// If mode switcher not activated then make sure that no current mode.

	if(this.config.activated != 1) {
		if(this.curmode) {
			var appCtl = Mojo.Controller.getAppController();

			params.name = this.curmode.name;
				
			this.executeCloseMode(params);
		}
		else
			this.currentAction = null;
//		else
//			this.saveConfigData("status");
		
		return;
	}

	// Re-schedule and setup all timers including the location timeout. 

	var hasLocationTrigger = false;

	for(var i = 0; i < this.modes.length; i++) {
		hasLocationTrigger = false;

		for(var j = 0; j < this.modes[i].triggersList.length; j++) {
 			if(this.modes[i].triggersList[j].type == "location") {
 				hasLocationTrigger = true;
 				
 				var params = {"tracking": "none"};
				this.checkLocationTrigger(params);
					
 				break;
			}
		}

		if(hasLocationTrigger)
			continue;

		for(var j = 0; j < this.modes[i].triggersList.length; j++) {
 			if(this.modes[i].triggersList[j].type == "timeout") {
				this.setTimeOfDayLimits(this.modes[i].triggersList[j]);
 		
				this.setupAlarmTimeout("start", this.modes[i].triggersList[j]);
				this.setupAlarmTimeout("close", this.modes[i].triggersList[j]);
			}
		}
	}
	
	this.currentAction = null;
/*
	if(startup) {
		// Start applications of the current mode if any configured.
		
//		if((this.curmode) && (this.curmode.appsList.length > 0)) {
//			Mojo.Log.info("Starting configured applications");

//			for(var i = 0 ; i < this.curmode.appsList.length ; i++) {
//				var launchAppRequest = new Mojo.Service.Request('palm://com.palm.applicationManager/', {
//					method: "launch", parameters: {"id": this.newmode.appsList[i].appid, 
//						"params": this.newmode.appsList[i].params}});
//			}
//		}
			
		// Look for mode(s) that should be active / not active.

		this.launcherModes = new Array();
		this.launcherClose = null;

		for(var i = 0 ; i < this.modes.length ; i++) {
			if((!this.curmode) || (this.modes[i].name != this.curmode.name)) {
				if((this.modes[i].autoStart != 0) && (this.modes[i].triggersList.length > 0)) {
					if(this.checkStartTriggers(this.modes[i])) {
						this.launcherModes.push(this.modes[i]);
					}
				}
			}
		}
	
		if(this.launcherModes.length > 0)
		{
			if((this.curmode) && (this.curmode.name != "Default Mode")) {
				if(this.checkCloseTriggers(this.curmode))
					this.launcherClose = this.curmode;
			}

			this.handleLauncher();
			return;
		}		
	}
	else {
		// Check the existence of the current mode and is it valid or not.

		if((this.curmode != null) && (this.curmode.name != "Default Mode")) {
			var mode = null;

			for(var i = 0; i < this.modes.length; i++) {
				if(this.modes[i].name == this.curmode.name) {
					mode = this.modes[i];
					break;
				}
			}

			if(mode != null) {
				if(mode.autoClose == 0) {
					params.name = mode.name;
				
					this.executeStartMode(params);
					return;
				}
				else {
					if(this.checkCloseTriggers(mode)) {
						params.name = mode.name;
			
						this.executeCloseMode(params);
						return;
					}
					else {
						params.name = mode.name;
			
						this.executeStartMode(params);
						return;
					}
				}
			}
		}

		// If current not valid then start the default mode.

		var params = {"name": this.defmode.name};

		this.executeStartMode(params);
	}
	*/
}

AppAssistant.prototype.haltModeSwitcher = function(params) {
	if(this.timeoutTrigger)
		clearTimeout(this.timeoutTrigger);

	if(this.config.activated == 1) {
		for(var i = 0; i < this.modes.length; i++) {
			var hasLocationTrigger = false;

			for(var j = 0; j < this.modes[i].triggersList.length; j++) {
	 			if(this.modes[i].triggersList[j].type == "location") {
	 				hasLocationTrigger = true;
	 				this.clearDelayTimeout();
	 				break;
				}
			}

			if(!hasLocationTrigger) {
				for(var j = 0; j < this.modes[i].triggersList.length; j++) {
		 			if(this.modes[i].triggersList[j].type == "timeout") {
						this.clearAlarmTimeout("start", this.modes[i].triggersList[j]);
						this.clearAlarmTimeout("close", this.modes[i].triggersList[j]);
					}
				}
			}
		}
	}
}

//

AppAssistant.prototype.configOptionDone = function(success, cfgopt) {
//	Mojo.Log.info("CONFIG OPTION DONE " + success + " " + cfgopt);

	// FIXME: Bug in mojo, on gps request success called twice!
	//			 Also bt request may call both success and failure.
	//			 Currently checked that if cfgopt is the current.

	var index = this.configOptions.length - this.configCount;

	if((cfgopt != "appsList") && (cfgopt != this.configOptions[index]))
		return;

	if(this.configTimeout)
		clearTimeout(this.configTimeout);

	// Check the status of config execution and act accordingly.

	// FIXME: Possible bug in Mojo, something interrupts system
	//			 requests. So add timer to control things.

	if(success) {
		this.retryCount = 0;

		if(this.configCount > 1) {
			this.configCount--;

			this.configTimeout = setTimeout(this.configOptionDone.bind(this, false, this.configOptions[index + 1]), 3000);

			this.updateSystemConfig(this.configOptions[index + 1]);
		}
		else if(this.configCount == 1) {
			this.configCount--;
			
			this.configTimeout = setTimeout(this.configOptionDone.bind(this, false, this.configOptions[index + 1]), 30000);
			
			this.updateRunningApps();
		}
		else if(this.configCount == 0) {
			this.saveConfigData("curmode");
//			this.saveConfigData("status");
			
			if(((this.oldmode) && (this.oldmode.notifyMode == 1)) || 
				((this.newmode) && (this.newmode.notifyMode == 1)) ||
				((this.currentAction == "startup") || (this.currentAction == "toggle")))
			{
				var appCtl = Mojo.Controller.getAppController();

				if(this.curmode == null)
					appCtl.showBanner("Done closing: " + this.newmode.name, {action: 'none'});
				else if(this.oldmode == null)
					appCtl.showBanner("Done starting: " + this.newmode.name, {action: 'none'});
				else {
					if(this.oldmode.name == this.newmode.name) 
						appCtl.showBanner("Done reloading: " + this.newmode.name, {action: 'none'});
					else
						appCtl.showBanner("Done switching to: " + this.newmode.name, {action: 'none'});
				}
			}
			
			this.currentAction = null;
		}
	}
	else if (this.retryCount == 2) {
		this.retryCount = 0;
		
		Mojo.Log.info("Skipping " + cfgopt + " config");

		this.configOptionDone(true, cfgopt);
	}
	else {
		this.retryCount++;

		if(this.configCount == 0)
		{
			Mojo.Log.info("Skipping applications update");

			this.configOptionDone(true, "appsList");
		}
		else {
			Mojo.Log.info("Retrying " + cfgopt + " config");

			this.configTimeout = setTimeout(this.configOptionDone.bind(this, false, this.configOptions[index + 1]), 3000);

			this.updateSystemConfig(cfgopt);
		}
	}
}

AppAssistant.prototype.configOptionCheck = function(mode, option) {
	var index = null;

	for(var i = 0; i < mode.settingsList.length; i++) {
		if(mode.settingsList[i].type == option)
			index = i;
	}

	return index;
}

//

AppAssistant.prototype.executeStartMode = function(params) {
	Mojo.Log.info("Start mode action received: " + params.name);

	// Check and set state of old, new and cur modes.

	this.oldmode = this.curmode;
	
	this.newmode = null;
	
	if(params.name == "Default Mode")
		this.newmode = this.defmode;
	else {
		for(var i = 0 ; i < this.modes.length ; i++) {
			if(this.modes[i].name == params.name) {
				this.newmode = this.modes[i];
				break;
			}
		}
	}

	if(this.newmode == null)
		return;

	if(this.config.activated != 1)
		this.newmode = null;

	this.curmode = this.newmode;

	//this.saveConfigData("curmode");

	// Notify about the start action if configured.

	if((this.newmode.notifyMode == 1) || 
		(this.currentAction == "startup") || (this.currentAction == "toggle"))
	{
		var appCtl = Mojo.Controller.getAppController();

		if(this.oldmode != null) {
			if(this.oldmode.name == this.newmode.name)
				appCtl.showBanner("Reloading mode: " + params.name, {action: 'none'});
			else
				appCtl.showBanner("Switching mode to: " + params.name, {action: 'none'});
		}
		else
			appCtl.showBanner("Starting mode: " + params.name, {action: 'none'});
	}

	// Initiate the actual starting of the mode.
	
	this.configCount = this.configOptions.length;
	this.retryCount = 0;
	
	this.updateSystemConfig(this.configOptions[0]);
}

AppAssistant.prototype.executeCloseMode = function(params) {
	Mojo.Log.info("Close mode action received: " + params.name);

	// Check and set state of old, new and cur modes.

	this.oldmode = this.curmode;
	
	this.newmode = this.defmode;

	if(this.oldmode.name != params.name)
		return;
	
	if(this.config.activated != 1)
		this.newmode = null;

	this.curmode = this.newmode;

	//this.saveConfigData("curmode");
	
	// Notify about the start action if configured.

	if((this.oldmode.notifyMode == 1) || 
		(this.currentAction == "startup") || (this.currentAction == "toggle"))
	{
		var appCtl = Mojo.Controller.getAppController();
	
		if(this.newmode != null)
			appCtl.showBanner("Switching mode to: " + this.curmode.name, {action: 'none'});
		else
			appCtl.showBanner("Closing mode: " + params.name, {action: 'none'});
	}

	// Initiate the actual starting of the mode.

	this.configCount = this.configOptions.length;
	this.retryCount = 0;
		
	this.updateSystemConfig(this.configOptions[0]);
}

AppAssistant.prototype.toggleCurrentMode = function(params) {
	this.currentAction = "toggle";

	if(this.curmode != null) {
		if(this.curmode.name == params.name) {
			params.event = "close";
		
			this.executeCloseMode(params);
			return;
		}
	}

	for(var i = 0; i < this.modes.length ; i++) {
		if(this.modes[i].name == params.name) {
			params.event = "start";

			this.executeStartMode(params);
			return;
		}
	}

	var appCtl = Mojo.Controller.getAppController();
	
	appCtl.showBanner("Unknown mode: " + params.name, {action: 'none'});

	this.currentAction = null;
}

//

AppAssistant.prototype.updateSystemConfig = function(cfgopt) {

	// This updates the device configuration according to curmode.

	if(cfgopt.substr(0, 10) == "connection")
		var category = "connection";
	else if(cfgopt.substr(0, 9) == "messaging")
		var category = "messaging";
	else if(cfgopt.substr(0, 6) == "ringer")
		var category = "ringer";
	else if(cfgopt.substr(0, 6) == "screen")
		var category = "screen";
	else if(cfgopt.substr(0, 5) == "sound")
		var category = "sound";

	if(this.newmode == null)
		this.newmode = this.defmode;

	var action = "Setting";
	
	var index = this.configOptionCheck(this.newmode, category);

	var mode = this.newmode;

	if(index == null) {
		if((this.oldmode) && (this.configOptionCheck(this.oldmode, category) != null)) {
			action = "Resetting";
	
			index = this.configOptionCheck(this.defmode, category);

			mode = this.defmode;			
		}
		else {
			this.configOptionDone(true, cfgopt);
			
			return;
		}
	}

	if(cfgopt == "connectionWiFi") {
		Mojo.Log.info(action + " WiFi connection config");

		if(mode.settingsList[index].connectionWiFi == 1)
			var wifiState = "enabled";
		else
			var wifiState = "disabled";
			
		var setStateRequest = new Mojo.Service.Request('palm://com.palm.wifi/', {
			method: 'setstate',
			parameters: {'state': wifiState},
			onSuccess: this.configOptionDone.bind(this, true, cfgopt),
			onFailure: this.configOptionDone.bind(this, false, cfgopt)});
	}
	else if(cfgopt == "connectionBT") {
		Mojo.Log.info(action + " BT connection config");

		if(mode.settingsList[index].connectionBT == 1) {
			var btmethod = "radioon";
			var btstates = true;
		}
		else {
			var btmethod = "radiooff";
			var btstates = false;
		}				

		var setStateRequest = new Mojo.Service.Request('palm://com.palm.btmonitor/monitor/', {
			method: btmethod,
			parameters: {'visible': btstates, 'connectable': btstates},
			onSuccess: this.configOptionDone.bind(this, true, cfgopt),
			onFailure: this.configOptionDone.bind(this, false, cfgopt)});
	}
	else if(cfgopt == "connectionGPS") {
		Mojo.Log.info(action + " GPS connection config");
	
		if(mode.settingsList[index].connectionGPS == 1)
			var useGps = true;
		else
			var useGps = false;

		var setUseGpsRequest = new Mojo.Service.Request('palm://com.palm.location/', {
			method: 'setUseGps',
			parameters: {"useGps": useGps},
			onSuccess: this.configOptionDone.bind(this, true, cfgopt),
			onFailure: this.configOptionDone.bind(this, false, cfgopt)});
	}
	else if(cfgopt == "connectionData") {
		Mojo.Log.info(action + " data connection config");
	
		if(mode.settingsList[index].connectionData == 1)
			var disabled = "off";
		else
			var disabled = "on";

		var setWanStatusRequest = new Mojo.Service.Request('palm://com.palm.wan/', {
			method: 'set',
			parameters: {"disablewan": disabled},
			onSuccess: this.configOptionDone.bind(this, true, cfgopt),
			onFailure: this.configOptionDone.bind(this, false, cfgopt)});
	}
	else if(cfgopt == "connectionPhone") {
		Mojo.Log.info(action + " phone connection config");
	
		if(mode.settingsList[index].connectionPhone == 1)
			var state = "on";
		else
			var state = "off";

		var setPhonePowerRequest = new Mojo.Service.Request('palm://com.palm.telephony', {
			method: 'powerSet',
			parameters: {"state": state},
			onSuccess: this.configOptionDone.bind(this, true, cfgopt),
			onFailure: this.configOptionDone.bind(this, false, cfgopt)});
	}
	else if(cfgopt == "messagingIMStatus") {
		Mojo.Log.info(action + " instant messaging status");

		var setMyAvailabilityRequest = new Mojo.Service.Request('palm://com.palm.messaging/', {
			method: 'setMyAvailability',
			parameters: {"availability": mode.settingsList[index].messagingIMStatus},
			onSuccess: this.configOptionDone.bind(this, true, cfgopt),
			onFailure: this.configOptionDone.bind(this, false, cfgopt)});
	}
	else if(cfgopt == "messagingSoundMode") {
		Mojo.Log.info(action + " messaging sound mode");
		
		var setNotificationRequest = new Mojo.Service.Request("palm://com.palm.messaging/", {
			method: 'setNotificationPreferences', 
			parameters: {"isEnabledNotificationSound": mode.settingsList[index].messagingSoundMode},
			onSuccess: this.configOptionDone.bind(this, true, cfgopt),
			onFailure: this.configOptionDone.bind(this, false, cfgopt)});
	}		
	else if(cfgopt == "ringerRingerOn") {
		Mojo.Log.info(action + " ringer on mode");		

		if(mode.settingsList[index].ringerRingerOn == 1)
			var vibrate = true;
		else
			var vibrate = false;

		var setVibrateRequest = new Mojo.Service.Request('palm://com.palm.audio/vibrate/', {
			method: 'set',
			parameters: {"VibrateWhenRingerOn": vibrate},
			onSuccess: this.configOptionDone.bind(this, true, cfgopt),
			onFailure: this.configOptionDone.bind(this, false, cfgopt)});
	}
	else if(cfgopt == "ringerRingerOff") {
		Mojo.Log.info(action + " ringer off mode");		

		if(mode.settingsList[index].ringerRingerOff == 1)
			var vibrate = true;
		else
			var vibrate = false;

		var setVibrateRequest = new Mojo.Service.Request('palm://com.palm.audio/vibrate/', {
			method: 'set',
			parameters: {"VibrateWhenRingerOff": vibrate},
			onSuccess: this.configOptionDone.bind(this, true, cfgopt),
			onFailure: this.configOptionDone.bind(this, false, cfgopt)});
	}
	else if(cfgopt == "ringerRingtonePath") {
		Mojo.Log.info(action + " ringer ringtone");		

		var ringtone = {
			name: mode.settingsList[index].ringerRingtoneName, 
			fullPath: mode.settingsList[index].ringerRingtonePath
		};
	
		new Mojo.Service.Request("palm://com.palm.systemservice/", {
			method: 'setPreferences', 
			parameters: {"ringtone": ringtone},
			onSuccess: this.configOptionDone.bind(this, true, cfgopt),
			onFailure: this.configOptionDone.bind(this, false, cfgopt)});
	}
	else if(cfgopt == "screenBrightnessLevel") {
		Mojo.Log.info(action + " brightness level");

		var setBrightnessRequest = new Mojo.Service.Request('palm://com.palm.display/control/', {
			method: 'setProperty',
			parameters: {'maximumBrightness': mode.settingsList[index].screenBrightnessLevel},
			onSuccess: this.configOptionDone.bind(this, true, cfgopt),
			onFailure: this.configOptionDone.bind(this, false, cfgopt)});
	}
	else if(cfgopt == "screenTurnOffTimeout") {
		Mojo.Log.info(action + " turn off timeout");

		var setBrightnessRequest = new Mojo.Service.Request('palm://com.palm.display/control/', {
			method: 'setProperty',
			parameters: {'timeout': mode.settingsList[index].screenTurnOffTimeout},
			onSuccess: this.configOptionDone.bind(this, true, cfgopt),
			onFailure: this.configOptionDone.bind(this, false, cfgopt)});
	}
	else if(cfgopt == "screenWallpaperPath") {
		Mojo.Log.info(action + " wallpaper file");
		
		var wallpaper = {
			wallpaperName: mode.settingsList[index].screenWallpaperName,
			wallpaperFile: mode.settingsList[index].screenWallpaperPath
		}
		
		this.setWallpaperReq = new Mojo.Service.Request("palm://com.palm.systemservice/", {
			method: 'setPreferences', 
			parameters: {"wallpaper": wallpaper},
			onSuccess: this.configOptionDone.bind(this, true,cfgopt),
			onFailure: this.configOptionDone.bind(this, false, cfgopt)});
	}
	else if(cfgopt == "soundRingerVolume") {
		Mojo.Log.info(action + " ringer sound volume");

		var setVolumeRequest = new Mojo.Service.Request('palm://com.palm.audio/ringtone/', {
			method: 'setVolume',
			parameters: {"volume": mode.settingsList[index].soundRingerVolume},
			onSuccess: this.configOptionDone.bind(this, true , cfgopt),
			onFailure: this.configOptionDone.bind(this, false, cfgopt)});
	}
	else if(cfgopt == "soundSystemVolume") {		
		Mojo.Log.info(action + " system sound volume");

		var setSystemVolumeRequest = new Mojo.Service.Request('palm://com.palm.audio/system/', {
			method: 'setVolume',
			parameters: {"volume": mode.settingsList[index].soundSystemVolume},
			onSuccess: this.configOptionDone.bind(this, true, cfgopt),
			onFailure: this.configOptionDone.bind(this, false, cfgopt)});	
	}
	else if(cfgopt == "soundMediaVolume") {		
		Mojo.Log.info(action + " media sound volume");

		var setMediaVolumeRequest = new Mojo.Service.Request('palm://com.palm.audio/media/', {
			method: 'setVolume',
			parameters: {"scenario": "media_back_speaker", "volume": mode.settingsList[index].soundMediaVolume},
			onSuccess: this.configOptionDone.bind(this, true, cfgopt),
			onFailure: this.configOptionDone.bind(this, false, cfgopt)});	
	}
}

AppAssistant.prototype.updateRunningApps = function() {
	var getRunningAppsRequest = new Mojo.Service.Request('palm://com.palm.applicationManager/', {
		method: 'running',
		parameters: {},
		onSuccess: function(payload) {
			var appsForLaunch = new Array();
			var oldStatusApps = this.status.apps;

			this.status.apps = new Array();

			if(((this.oldmode) && (this.oldmode.apps.close == 2)) ||
				((this.newmode) && (this.newmode.apps.start == 2))) 
			{
				Mojo.Log.info("Closing all applications");
				
				for(var i = 0 ; i < payload.running.length ; i++) {
					var skip = false;
					
					// Always skip applications that would be started on newmode.
						
					for(var j = 0; j < this.newmode.appsList.length; j++) {
						if(this.newmode.appsList[j].appid == payload.running[i].id) {
							skip = true;
							break;
						}
					}

					if(!skip) {
						if((payload.running[i].processid > 1010) && 
							(payload.running[i].id != "com.palm.app.modeswitcher") &&
							(payload.running[i].id != "com.palm.systemui"))
						{
							var closeAppRequest = new Mojo.Service.Request('palm://com.palm.applicationManager/', {
								method: "close",
						      parameters: {"processId": payload.running[i].processid}});
						}
					}
				}
			}
			else {
				if((this.oldmode) && (this.oldmode.apps.close == 1)) {
					Mojo.Log.info("Closing launched applications");

					for(var i = 0 ; i < this.oldmode.appsList.length ; i++) {
						var skip = false;
						
						if(this.newmode.name != this.oldmode.name) {
							// Skip applications that were running when mode was started.
							// This is done only if we are not reloading current mode.
						
							for(var j = 0; j < oldStatusApps.length; j++) {
								if(oldStatusApps[j] == this.oldmode.appsList[i].appid) {
									skip = true;
									break;
								}
							}
						}
					
						// Always skip applications that would be started on newmode.
						
						if(!skip) {
							for(var j = 0; j < this.newmode.appsList.length; j++) {
								if(this.newmode.appsList[j].appid == this.oldmode.appsList[i].appid) {
									skip = true;
									break;
								}
							}
						}
																					
						if(!skip) {
							for(var j = 0 ; j < payload.running.length ; j++) {
								if(this.oldmode.appsList[i].appid == payload.running[j].id) {
									var closeAppRequest = new Mojo.Service.Request('palm://com.palm.applicationManager/', {
										method: "close",
								      parameters: {"processId": payload.running[j].processid}});
									break;
								}
							}
						}
					}
				}
			
				if(payload.running.length > 0) {
					Mojo.Log.info("Storing list of running apps");
				
					for(var i = 0 ; i < payload.running.length ; i++) {
						// Only store apps that were not part of old mode.
				
						var skip = false;
				
						if(!this.oldmode)
							this.status.apps.push(payload.running[i].id);
						else {					
							for(var j = 0 ; j < this.oldmode.appsList.length ; j++) {
								if(payload.running[i].id == this.oldmode.appsList[j].appid) {
									skip = true;
								
									for(var k = 0; k < oldStatusApps.length; k++) {
										if(oldStatusApps[k] == this.oldmode.appsList[j].appid) {
											skip = false;
										}
									}
								}
							}
						
							if(!skip)
								this.status.apps.push(payload.running[i].id);						
						}
					}
				}
			}

			if(this.newmode.appsList.length > 0) {
				Mojo.Log.info("Starting configured applications");

				for(var i = 0 ; i < this.newmode.appsList.length ; i++) {
					var skip = false;

					if(this.oldmode) {
						// Only start applications that are not in old mode.
			
						for(var j = 0; j < this.oldmode.appsList.length; j++) {
							if(this.oldmode.appsList[j].appid == this.newmode.appsList[i].appid) {
								if(this.currentAction != "startup")
									skip = true;
								break;
							}
						}
					}
					
					if(!skip) {
						appsForLaunch.push({"appid": this.newmode.appsList[i].appid, "params": this.newmode.appsList[i].params});
					}
				}
			}

			if(appsForLaunch.length > 0)
				this.launchModeApplications(appsForLaunch, 0, 0);
			else
				this.configOptionDone(true, "appsList");

		}.bind(this),
		onFailure: this.configOptionDone.bind(this, false, "appsList")});
}

AppAssistant.prototype.launchModeApplications = function(apps, index, retry) {
	if(retry == 2)
		index++;

	if(index >= apps.length) {
		this.configOptionDone(true, "appsList");
		return;
	}
	
	try {
		eval("var params = {" + apps[index].params + "}");
	}
	catch(error) {
		var params = "";
	}
	
	var launchAppRequest = new Mojo.Service.Request('palm://com.palm.applicationManager/', {
		method: "launch", parameters: {"id": apps[index].appid, "params": params },
		onSuccess: this.launchModeApplications.bind(this, apps, ++index, 0).delay(3),
		onFailure: this.launchModeApplications.bind(this, apps, index, ++retry).delay(3) });
}

//

AppAssistant.prototype.checkChargerTrigger = function(params) {
	Mojo.Log.info("Charger trigger received: " + params.connected);

	var requestActivityStart = new Mojo.Service.Request('palm://com.palm.power/com/palm/power', { 
		method: 'activityStart', parameters: { id: 'com.palm.app.modeswitcher', duration_ms: '60000' }});

	// Delay the actual execution of the trigger to avoid executing 
	// multiple trigger events instead of one.

	// Keep record of first trigger event so we can only trigger the
	// event if the last event is the same as the first.

	// This should handle the case of very quick connect / disconnect 
	// charger events so that only intended events are handled.

	var timeout = 3000;

	this.status.charger = params.connected;

//	this.saveConfigData("status");
	
	if(this.triggerEvent == null)
		this.triggerEvent = params.connected;
	
	if(this.timeoutTrigger)
		clearTimeout(this.timeoutTrigger);

	if((this.curmode) && (params.connected == "none")) {
		var charger = 0;

		if(this.status.charger == "puck")
			charger = 1;
		else if(this.status.charger == "wall")
			charger = 2;
		else if(this.status.charger == "pc")
			charger = 3;	

		for(var i = 0; i < this.curmode.triggersList.length; i++) {
			if(this.curmode.triggersList[i].type == "charger") {
				if(this.curmode.triggersList[i].chargerCharger == charger) {
					timeout = this.curmode.triggersList[i].chargerDelay * 1000;
					break;
				}
			}		
		}
	}
	
	this.timeoutTrigger = setTimeout(this.handleChargerTrigger.bind(this, params), timeout);
}

AppAssistant.prototype.handleChargerTrigger = function(params) {
	// Only handle the trigger if the last trigger was the same as first.
	// Otherwise user changed his mind about the charging immediately.

	// If trigger event valid then check if modes that match the trigger.
	// If time trigger also set then also check that the time is valid.

	if(this.triggerEvent == params.connected) {
		this.triggerEvent = null;

		this.launcherModes = new Array();
		this.launcherClose = null;

		if(params.connected != "none") {
			for(var i = 0; i < this.modes.length ; i++) {
				if((!this.curmode) || (this.curmode.name != this.modes[i].name)) {
					if((this.modes[i].autoStart != 0) && (this.modes[i].triggersList.length > 0)) {
						if(this.checkStartTriggers(this.modes[i])) {
							this.launcherModes.push(this.modes[i]);
						}
					}
				}
			}

			this.handleLauncher();
		}
		else if(params.connected == "none") {
			if((this.curmode) && (this.curmode.name != "Default Mode")) {
				if((this.checkCloseTriggers(this.curmode)) && (this.curmode.autoClose != 0)) {			
					this.launcherClose = this.curmode;		
				}
			}
							
			this.handleLauncher();
		}
	}
	else 
		this.currentAction = null;
}

//

AppAssistant.prototype.checkTimeoutTrigger = function(params) {
	Mojo.Log.info("Timeout trigger received: " + params.timestamp);

	var requestActivityStart = new Mojo.Service.Request('palm://com.palm.power/com/palm/power', { 
		method: 'activityStart', parameters: {'id':'com.palm.app.modeswitcher','duration_ms':'60000'}});

	// Check that the timeout really is current and not old which should be ignored.
	
	var curTime = new Date();
	
	if(params.timestamp < ((curTime.getTime() / 1000) - 60)) {
		Mojo.Log.info("Old timeout received: " + ((curTime.getTime() / 1000) - 60));
	
		this.currentAction = null;
		return;
	}
	
	this.handleTimeoutTrigger(params);
}

AppAssistant.prototype.handleTimeoutTrigger = function(params) {
	// Process timeout event for generating the launcherModes list for the launcher.

	// Find the corresponding mode config(s) that matches the timestamp parameter.
	// Check that time trigger is enabled and if yes then re-schedule the timeout.
	// Make sure that if current mode active that the mode is not the current mode.
	// If charger trigger enabled check that the configured charger is connected.
	// If location trigger enabled check that the location is within the limits.
	// If all above is OK then add the mode into the launcherModes list.

	this.launcherModes = new Array();

	for(var i = 0; i < this.modes.length ; i++) {	
		for(var j = 0; j < this.modes[i].triggersList.length; j++) {
			if(this.modes[i].triggersList[j].type == "timeout") {
				if(this.modes[i].triggersList[j].timeoutStart == params.timestamp) {
					this.setTimeOfDayLimits(this.modes[i].triggersList[j]);
					
					this.setupAlarmTimeout("start", this.modes[i].triggersList[j]);
				}
			}
		}

		if((!this.curmode) || (this.modes[i].name != this.curmode.name)) {
			if((this.modes[i].autoStart != 0) && (this.modes[i].triggersList.length > 0)) {
				if(this.checkStartTriggers(this.modes[i])) {
					this.launcherModes.push(this.modes[i]);
				}
			}
		}
	}

	// Process timeout event for setting the launcherClose variable for the launcher.
	
	// Find the corresponding mode config(s) that matches the timestamp parameter.
	// Check that the time trigger is enabled and if yes then re-schedule the timeout.
	// Make sure that if current mode active that the mode is the current mode.
	// If all above is OK then set the launcherClose to point into that mode.
	// Break when OK, no need to go through all modes since only one current mode.

	this.launcherClose = null;

	for(var i = 0; i < this.modes.length ; i++) {
		for(var j = 0; j < this.modes[i].triggersList.length; j++) {
			if(this.modes[i].triggersList[j].type == "timeout") {
				if(this.modes[i].triggersList[j].timeoutClose == params.timestamp) {
					this.setTimeOfDayLimits(this.modes[i].triggersList[j]);
					
					this.setupAlarmTimeout("close", this.modes[i].triggersList[j]);
				}
			}
		}
	}
	
	if((this.curmode) && (this.curmode.name != "Default Mode")) {
		if((this.checkCloseTriggers(this.curmode)) && (this.curmode.autoClose != 0))
			this.launcherClose = this.curmode;		
	}
		
	this.handleLauncher();
}

//

AppAssistant.prototype.checkLocationTrigger = function(params) {
	Mojo.Log.info("Location trigger received");

	var requestActivityStart = new Mojo.Service.Request('palm://com.palm.power/com/palm/power', { 
		method: 'activityStart', parameters: {'id':'com.palm.app.modeswitcher','duration_ms':'90000'}});
		
	// Go through all locations to find the needed accuracy level.
	// If there is no modes with location trigger then do nothing.
	// Then check current location until success (max 5 attemps).
	// If current location fails then reschedule the timer (5 min).
	// If location retrieved succesfully then handleCurrentLocation.

	params.count = 0;
	params.accuracy = 0;

	for(var i = 0; i <this.modes.length; i++) {
		for(var j = 0; j < this.modes[i].triggersList.length; j++) {
			if(this.modes[i].triggersList[j].type == "location") {
				if((this.modes[i].triggersList[j].locationLatitude != 0) &&
					(this.modes[i].triggersList[j].locationLongitude != 0))
				{
					if(this.modes[i].triggersList[j].locationRadius > 0)
						params.accuracy = 1;
					if(this.modes[i].triggersList[j].locationRadius > 500)
						params.accuracy = 2;
				}
			}
		}
	}
	
	if(params.accuracy != 0) {
		// This will call handleLocationTrigger on successful retrieval.

		this.fetchCurrentLocation(params);
	}
}

AppAssistant.prototype.handleLocationTrigger = function(params) {
	this.launcherModes = new Array();
	this.launcherClose = null;

	var time = 24*60*60;
	
	var tmpTime = null;

	// Set the initial state of the tracking variable according to parameters.

	if(params.tracking == "none")
		var tracking = {entering: [], leaving: ""};
	else
		var tracking = params.tracking;

	// Go through all modes, handle current mode differently than all others.
	
	for(var i = 0; i < this.modes.length ; i++) {
		// If the mode does not have any location triggers configured then skip.	

		var hasLocationTriggers = false;
		
		for(var j = 0; j < this.modes[i].triggersList.length; j++) {
			if(this.modes[i].triggersList[j].type == "location") {
				hasLocationTriggers = true;
				break;
			}
		}
	
		if(!hasLocationTriggers)
			continue;

		// Different handling of current mode than modes waiting to get activated.

		if((!this.curmode) || (this.curmode.name != this.modes[i].name)) {
			// Reset the tracking of leaving area if the target is not current mode.
			// Then check if all triggers of the mode are already valid for mode start.
			// Also make sure that the tracking information is updated accordingly.
			// If triggers valid then add mode into launcherModes if not asked before.
			// If triggers not valid then calculate time for the next check execution.

			// Reset leaving tracking if the mode is not current anymore.
			
			if(this.modes[i].name == tracking.leaving)
				tracking.leaving = "";

			// First check if all start triggers of the mode are already valid!
			// If yes then add to list, if no then calculate new check time.
	
			if(this.checkStartTriggers(this.modes[i])) {
				Mojo.Log.info("TRIGGERIT OK " + this.modes[i].name);
			
				// When we are on location the check time is set to 5 minutes.
					
				time = 5 * 60;
					
				// If not already asked then suggest mode for start process.
			
				if(tracking.entering.indexOf(this.modes[i].name) == -1) {
					tracking.entering.push(this.modes[i].name);
				
					this.launcherModes.push(this.modes[i]);
				}
			}
			else {
				Mojo.Log.info("TRIGGERIT EI OK " + this.modes[i].name);

				// Remove mode from the tracking list since it is not valid.
			
				var index = tracking.entering.indexOf(this.modes[i].name);
				
				if(index != -1)
					tracking.entering.splice(index, 1);				

				// Calculate the estimation for the time for the next check.

				for(var j = 0; j < this.modes[i].triggersList.length; j++) {
					if(this.modes[i].triggers.required == 1) {
						// Timeouts limit refresh time only when all unique triggers are required.
							
						if(this.modes[i].triggersList[j].type == "timeout") {
							var limits = this.getTimeOfDayLimits(this.modes[i].triggersList[j]);

							if((limits.curTime < limits.fromTime) || (limits.curTime >= limits.toTime)) {
								Mojo.Log.info("EI AIKA RAJOISSA " + this.modes[i].name);
				
								tmpTime = (limits.fromTime.getTime() - limits.curTime.getTime()) / 1000;
				
								if(tmpTime < time)
									time = tmpTime;					
							}
						}
					}
					else {
						if(this.modes[i].triggersList[j].type == "location") {
							tmpTime = this.calculateTimeEstimation(this.modes[i].triggersList[j]);

							// If calculated time 0 it means that some other trigger is holding on.
							
							if(tmpTime == 0)
								tmpTime = 15 * 60;
								
							if(tmpTime < time)
								time = tmpTime;
							}		
						}
					}	
				}
			}
			else {
			// Check if there is current mode and it has location trigger set.
			// Check that all the triggers of the current mode are still valid.
			// If not valid then set the launcherClose point to current mode.
		
			// When there is active location mode the check time is 5 min.

			time = 5 * 60;

			// Check if all triggers of the current mode are still valid.
			
			if(this.checkCloseTriggers(this.curmode)) {
				Mojo.Log.info("EI VALIDI ENÄÄ " + this.curmode.name);
	
				// Check if user has been already notified of closing.
				
				if(tracking.leaving == "") {
					tracking.leaving = this.curmode.name;
					
					if(this.curmode.autoClose != 0)
						this.launcherClose = this.curmode;			
				}
			}
		}
	}

	// Set new delay timer for checking location status.

	if(time < 5 * 60)
		time = 5 * 60;

	this.setupDelayTimeout(tracking, Math.floor(time / 60));

	// Handle launching and closing of modes if needed.
	
	this.handleLauncher();
}

//

AppAssistant.prototype.fetchCurrentLocation = function(params) {
	if(params.count < 5) {
		params.count = params.count + 1;

		this.requestLocation = new Mojo.Service.Request('palm://com.palm.location/', {
			method:'getCurrentPosition',
			parameters:{Accuracy: params.accuracy},
			onSuccess: function(params, event){
				this.status.latitude = event.latitude;
				this.status.longitude = event.longitude;
				
//				this.saveConfigData("status");
				
				this.handleLocationTrigger(params);
			}.bind(this, params),
			onFailure: function(params){
				this.fetchCurrentLocation(params);
			}.bind(this, params)});
	}
	else {
		// Failed to get location so lets try again after 5 minutes.

		this.status.latitude = 0;
		this.status.longitude = 0;

//		this.saveConfigData("status");

		this.setupDelayTimeout(params.tracking, 5);
	}
}

AppAssistant.prototype.calculateTimeEstimation = function(trigger) {
	var lat1 = this.status.latitude;
	var lng1 = this.status.longitude;
	var lat2 = trigger.locationLatitude;
	var lng2 = trigger.locationLongitude;
	
	var radius = 6371; // in kilometers (change for miles)
	
	var diffLat = (lat2-lat1) * Math.PI / 180;
	var diffLng = (lng2-lng1) * Math.PI / 180;
	
	var tmp = Math.sin(diffLat/2) * Math.sin(diffLat/2) +
		Math.cos(lat1 * Math.PI / 180 ) * Math.cos(lat2 * Math.PI / 180 ) *
		Math.sin(diffLng/2) * Math.sin(diffLng/2);
	var tmp2 = 2 * Math.atan2(Math.sqrt(tmp), Math.sqrt(1-tmp));

	var distance = Math.round(radius * tmp2 * 1000);

	Mojo.Log.info("Current coords: " + lat1 + " " + lng1);
	Mojo.Log.info("Modes coords: " + lat2 + " " + lng2);

	Mojo.Log.info("Calculated distance: " + distance + " meters");

	// Reduce the radius - error from the distance.

	if(trigger.locationRadius > 0)
		distance = distance - trigger.locationRadius + 100;
	
	if(trigger.locationRadius > 500)
		distance = distance + 250;

	// Currently static calculation for car speed.
	
	if(distance > 0) {
		var time = distance / (100 / 3,6);
		
		if(time < 5 * 60)
			time = 5 * 60;
	}
	else
		var time = 0;

	return time;
}

//

AppAssistant.prototype.clearAlarmTimeout = function(timeout, trigger) {
	var key = "com.palm.app.modeswitcher";

	if(timeout == "start")
		var timestamp = trigger.timeoutStart;
	else if(timeout == "close")
		var timestamp = trigger.timeoutClose;
	
	var alarm = new Date(timestamp * 1000);
	
	var alarmStr = this.convertDateToUtfStr(alarm);
	
	Mojo.Log.info("Timeout clear " + timeout + " at " + alarmStr);
		
	this.schedulerSetRequest = new Mojo.Service.Request("palm://com.palm.power/timeout", {
		method: "clear",
		parameters: {"key": key + "." + timestamp} });
}

AppAssistant.prototype.setupAlarmTimeout = function(timeout, trigger) {
	var key = "com.palm.app.modeswitcher";
	
	if(timeout == "start")
		var timestamp = trigger.timeoutStart;
	else if(timeout == "close") 
		var timestamp = trigger.timeoutClose;

	var alarm = new Date(timestamp * 1000);
	
	// Setup the actual start / close timeout with the above times.

	var alarmStr = this.convertDateToUtfStr(alarm);
	
	Mojo.Log.info("Timeout setup " + timeout + " at " + alarmStr);
	
	var timeoutRequest = new Mojo.Service.Request('palm://com.palm.power/timeout', {
 		method: "set", parameters: {
 			"wakeup": true,
 			"key": key + "." + timestamp,
 			"uri": "palm://com.palm.applicationManager/launch",
 			"params": {"id":"com.palm.app.modeswitcher","params":{"action":"trigger", "event":"timeout", "timestamp":timestamp}},
			"at": alarmStr} }); 
}

AppAssistant.prototype.clearDelayTimeout = function() {
	var key = "com.palm.app.modeswitcher";

	Mojo.Log.info("Timeout for tracking event canceled");
		
	this.schedulerSetRequest = new Mojo.Service.Request("palm://com.palm.power/timeout", {
		method: "clear",
		parameters: {"key": key + ".delay"} });
}

AppAssistant.prototype.setupDelayTimeout = function(timeout, delay) {
	// We set the delay to closed 2,5 minute so they don't happen 
	// at the same time than those Alarm timeouts.

	var key = "com.palm.app.modeswitcher";

	var date = new Date();
	
	var hours = Math.floor(delay / 60);
	var minutes = Math.ceil((date.getMinutes() + Math.floor(delay - (hours * 60))) / 5) * 5 - date.getMinutes() + 2;
	
	if(hours < 10)
		hours = "0" + hours;

	if(minutes < 10)
		minutes = "0" + minutes;
	
	var delayStr = hours + ":" + minutes + ":00";
	
	Mojo.Log.info("DELAY TIMEOUT " + timeout + " " + minutes);
	
	// Setup the actual delay timeout with the above delay.

	Mojo.Log.info("Timeout for tracking set for: " + delayStr);
	
	var timeoutRequest = new Mojo.Service.Request('palm://com.palm.power/timeout', {
 		method: "set", parameters: {
 			"wakeup": true,
 			"key": key + ".delay",
 			"uri": "palm://com.palm.applicationManager/launch",
 			"params": {"id":"com.palm.app.modeswitcher","params":{"action":"trigger", "event":"location", "tracking":timeout}},
			"in": delayStr} });
}

//

AppAssistant.prototype.convertDateToUtfStr = function(date) {
	var day = date.getUTCDate();
	if(day < 10) day = "0" + day;
	var month = date.getUTCMonth()+1;
	if(month < 10) month = "0" + month;
	var year = date.getUTCFullYear();

	var hours = date.getUTCHours();
	if(hours < 10) hours = "0" + hours;
	var minutes = date.getUTCMinutes();
	if(minutes < 10) minutes = "0" + minutes;

	var seconds = date.getUTCSeconds();
	if(seconds < 10) seconds = "0" + seconds;
	
	var str = month + "/" + day + "/" + year + " " + hours + ":" + minutes + ":" + seconds;

	return str;
}

//

AppAssistant.prototype.getTimeOfDayLimits = function(trigger) {
	/* Returns current time limits with correct day information */

	var curTime = new Date();
	var fromTime = new Date(trigger.timeoutStart * 1000);
	var toTime = new Date(trigger.timeoutClose * 1000);

	// Fix the current time to be one minute more so that "close calls" are moved.

	curTime.setMinutes(curTime.getMinutes() + 1);

	// Hours, Minutes, Seconds and Milliseconds should be correct (set in editmode).

	fromTime.setFullYear(curTime.getFullYear(), curTime.getMonth(), curTime.getDate());
	toTime.setFullYear(curTime.getFullYear(), curTime.getMonth(), curTime.getDate());

	// First check if toTime is set for the following day (toTime before fromTime).

	if(fromTime.getTime() > toTime.getTime())
		toTime.setDate(toTime.getDate() + 1);

	// Move the fromTime / toTime for the next day if toTime is already past.

	if(toTime.getTime() < curTime.getTime()) {
		if(fromTime.getTime() != toTime.getTime()) {
			fromTime.setDate(fromTime.getDate() + 1);
			toTime.setDate(toTime.getDate() + 1);
		}
	}
	
	// Fix the fromTime / toTime according to the setup (workdays / weekends).

	if(trigger.timeoutDays == 0) {
		// If set to be active whole day then move the toTime to be correct.
		// This is kinda special case that most likely is miss configuration.
	
		if(fromTime.getTime() == toTime.getTime()) {
			toTime.setDate(toTime.getDate() + 1);
		}
	}
	else if(trigger.timeoutDays == 1) {
		if(fromTime.getDay() == 0) {
			fromTime.setDate(fromTime.getDate() + 1);
			toTime.setDate(toTime.getDate() + 1);
		}
		else if(fromTime.getDay() == 6) {
			fromTime.setDate(fromTime.getDate() + 2);
			toTime.setDate(toTime.getDate() + 2);
		}
		
		// If set to be active full 24 hours then move the toTime to be correct.
		
		if(fromTime.getTime() == toTime.getTime()) {
			toTime.setDate(toTime.getDate() + (6 - toTime.getDay()));
		}
	}
	else if(trigger.timeoutDays == 2) {
		if((fromTime.getDay() >= 1) && (fromTime.getDay() <= 5)) {
			var days = 6 - fromTime.getDay();
			
			fromTime.setDate(fromTime.getDate() + days);
			toTime.setDate(toTime.getDate() + days);
		}

		// If set to be active full 24 hours then move the toTime to be correct.
		
		if(fromTime.getTime() == toTime.getTime()) {
			if(toTime.getDay() == 0) {
				toTime.setDate(toTime.getDate() + 1);
			}
			else if(toTime.getDay() == 6) {
				toTime.setDate(toTime.getDate() + 2);
			}
		}
	}
	else if(trigger.timeoutDays == 3) {
		for(var i = 0; i < 7; i++) {
			if(trigger.timeoutCustom[fromTime.getDay()] != true) {
				fromTime.setDate(fromTime.getDate() + 1);
				toTime.setDate(toTime.getDate() + 1);
			}
			else {
				// If set to be active full 24 hours then move the toTime to be correct.
		
				if(fromTime.getTime() == toTime.getTime()) {
					for(var j = 0; j < 7; j++) {
						if(trigger.timeoutCustom[toTime.getDay()] == true) {
							toTime.setDate(toTime.getDate() + 1);
						}
						else {
							break;
						}
					}
				}
		
				break;
			}
		}
	}

	// Fix the current time back once the comparison is already done.
	
	curTime.setMinutes(curTime.getMinutes() - 1);

//	Mojo.Log.info("From time: " + fromTime.getHours() + ":" + fromTime.getMinutes() + " " + fromTime.getDate() + "/" + (fromTime.getMonth() + 1) + "/" + fromTime.getFullYear() + ", To Time: " + toTime.getHours() + ":" + toTime.getMinutes() + " " + toTime.getDate() + "/" + (toTime.getMonth() + 1) + "/" + toTime.getFullYear());

	return {"curTime": curTime, "fromTime": fromTime, "toTime": toTime};
}

AppAssistant.prototype.setTimeOfDayLimits = function(trigger) {
	var limits = this.getTimeOfDayLimits(trigger);

	// To be sure that the from time will be in future in close calls too!

	limits.curTime.setMinutes(limits.curTime.getMinutes() + 1);

	/* Moves start and close limits for the next possible time */

	if(limits.fromTime < limits.curTime)
		limits.fromTime.setDate(limits.fromTime.getDate() + 1);
	
	if(trigger.timeoutDays == 1) {
		if(limits.fromTime.getDay() == 0)
			limits.fromTime.setDate(limits.fromTime.getDate() + 1);
		if(limits.fromTime.getDay() == 6)
			limits.fromTime.setDate(limits.fromTime.getDate() + 2);
	}

	else if(trigger.timeoutDays == 2) {
		if((limits.fromTime.getDay() >= 1) && (limits.fromTime.getDay() <= 5))
			limits.fromTime.setDate(limits.fromTime.getDate() + (6 - limits.fromTime.getDay()));
	}
	
	else if(trigger.timeoutDays == 3) {
		for(var i = 0; i < 7; i++) {
			if(trigger.timeoutCustom[limits.fromTime.getDay()] != true) {
				limits.fromTime.setDate(limits.fromTime.getDate() + 1);
			}
			else {
				break;
			}
		}
	}
	
	trigger.timeoutStart = limits.fromTime.getTime() / 1000;
	trigger.timeoutClose = limits.toTime.getTime() / 1000;
	
	this.saveConfigData("modes");
}

