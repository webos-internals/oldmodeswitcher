function ChargerTrigger(Config, Control) {
	this.config = Config;

	this.service = Control.service;

	this.initialized = false;

	this.startupCallback = null;
	this.executeCallback = null;

	this.activeCharger = "none";
	this.currentCharger = "none";

	this.powerSource = {};
	this.timeoutTrigger = null;
}

//

ChargerTrigger.prototype.init = function(startupCallback) {
	this.initialized = false;

	this.startupCallback = startupCallback;

	this.subscribeChargerStatus();
}

ChargerTrigger.prototype.shutdown = function() {
	this.initialized = false;

	this.startupCallback = null;

	this.activeCharger = "none";

	this.powerSource = {};
	this.timeoutTrigger = null;
	this.triggerEvent = null;
	
	if(this.subscribtionChargerStatus)
		this.subscribtionChargerStatus.cancel();
}

//

ChargerTrigger.prototype.enable = function(executeCallback) {
	this.executeCallback = executeCallback;
	
}

ChargerTrigger.prototype.disable = function() {
	this.executeCallback = null;
}

//

ChargerTrigger.prototype.check = function(triggerConfig, modeName) {
	var charger = 0;

	var appController = Mojo.Controller.getAppController();
	var orientation = appController.getScreenOrientation();
	
	if(this.currentCharger == "puck")
		charger = 1;
	else if(this.currentCharger == "wall")
		charger = 2;
	else if(this.currentCharger == "pc")
		charger = 3;	

	if((triggerConfig.chargerCharger == charger) && ((triggerConfig.chargerOrientation == 0) ||
		((triggerConfig.chargerOrientation == 1) && (orientation == "left")) || 
		((triggerConfig.chargerOrientation == 2) && (orientation == "right")) || 
		((triggerConfig.chargerOrientation == 3) && (orientation == "up")) || 
		((triggerConfig.chargerOrientation == 4) && (orientation == "down"))))
	{
		return true;
	}
	
	return false; 		
}

//

ChargerTrigger.prototype.execute = function(triggerData, manualLaunch) {
	Mojo.Log.error("Charger trigger received: " + Object.toJSON(triggerData));

	var startModes = new Array();
	var closeModes = new Array();

	if(triggerData.charger) {
		if(manualLaunch) {
			this.currentCharger = triggerData.charger;
			this.activeCharger = "unknown";
		}

		if(this.activeCharger != triggerData.charger) {
			this.activeCharger = triggerData.charger;

			for(var i = 0; i < this.config.modesConfig.length; i++) {
				for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
					if(this.config.modesConfig[i].triggersList[j].extension == "charger") {
						if((this.config.modesConfig[i].name != this.config.currentMode.name) &&
							(this.config.modifierModes.indexOf(this.config.modesConfig[i].name) == -1))
						{
							if(this.check(this.config.modesConfig[i].triggersList[j])) {
								startModes.push(this.config.modesConfig[i]);
								break;
							}
						}
						else {
							if(!this.check(this.config.modesConfig[i].triggersList[j])) {
								closeModes.push(this.config.modesConfig[i]);
								break;
							}
						}
					}
				}
			}
		
			if((this.executeCallback) && ((startModes.length > 0) || (closeModes.length > 0)))
				this.executeCallback(startModes, closeModes);
		}
	}
}

//

ChargerTrigger.prototype.subscribeChargerStatus = function() {
	this.subscribtionChargerStatus = this.service.request("palm://com.palm.bus/signal/", { 
		'method': "addmatch", 'parameters': {'category': "/com/palm/power", 'method': "chargerStatus"},
		'onSuccess': this.handleChargerStatus.bind(this),
		'onFailure': this.handleTriggerError.bind(this)});
		
	this.requestChargerStatus = this.service.request("palm://com.palm.power/com/palm/power/", {
		'method': "chargerStatusQuery"});
}

ChargerTrigger.prototype.handleChargerStatus = function(serviceResponse) {
	if(serviceResponse.type) {
		this.powerSource[serviceResponse.type] = serviceResponse.connected;
	
		// Save current charger state and send trigger event if needed.

		if((this.powerSource['usb'] == true) || 
			(this.powerSource['inductive'] == true))
		{
			if(!this.initialized) {
				if(serviceResponse.name) {
					this.activeCharger = serviceResponse.name;
					this.currentCharger = serviceResponse.name;
				}
				
				this.initialized = true;
				this.startupCallback(true);
				this.startupCallback = null;
			}

			if((this.currentCharger == "none") && (serviceResponse.name))
				this.handleChargerEvent(serviceResponse.name);
		}
		else {
			if(!this.initialized) {
				this.activeCharger = "none";
				this.currentCharger = "none";
	
				this.initialized = true;
				this.startupCallback(true);
				this.startupCallback = null;
			}
		
			if(this.currentCharger != "none")
				this.handleChargerEvent("none");
		}
	}
}

//

ChargerTrigger.prototype.handleChargerEvent = function(connectedCharger) {

	// Delay the actual execution of the trigger to avoid executing 
	// multiple trigger events instead of one.

	// Keep record of first trigger event so we can only trigger the
	// event if the last event is the same as the first.

	// This should handle the case of very quick connect / disconnect 
	// charger events so that only intended events are handled.

	this.currentCharger = connectedCharger;

	var charger = 0;
	var timeout = 3000;

	if(this.timeoutTrigger)
		clearTimeout(this.timeoutTrigger);

	if((this.activeCharger == "puck") || (connectedCharger == "puck"))
		charger = 1;
	else if((this.activeCharger == "wall") || (connectedCharger == "wall"))
		charger = 2;
	else if((this.activeCharger == "pc") || (connectedCharger == "pc"))
		charger = 3;

	if(connectedCharger == "none") {
		for(var i = 0; i < this.config.modesConfig.length; i++) {
			if((this.config.modesConfig[i].name == this.config.currentMode.name) ||
				(this.config.modifierModes.indexOf(this.config.modesConfig[i].name) != -1))
			{
				for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
					if(this.config.modesConfig[i].triggersList[j].extension == "charger") {
						if(this.config.modesConfig[i].triggersList[j].chargerCharger == charger) {
					
							if(timeout < this.config.modesConfig[i].triggersList[j].chargerDelay * 1000)
								timeout = this.config.modesConfig[i].triggersList[j].chargerDelay * 1000;
						}
					}		
				}
			}
		}
	}
	
	this.service.request("palm://com.palm.power/com/palm/power", { 
		'method': "activityStart", 'parameters': {'id': Mojo.Controller.appInfo.id + "-charger", 
		'duration_ms': timeout + 15000} });
		
	this.timeoutTrigger = setTimeout(this.execute.bind(this, {'charger': connectedCharger}, false), timeout);
}

//

ChargerTrigger.prototype.handleTriggerError = function(serviceResponse) {
	if(this.startupCallback) {
		this.startupCallback(false);
		this.startupCallback = null;
	}
}

