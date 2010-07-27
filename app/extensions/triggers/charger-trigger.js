function ChargerTrigger(ServiceRequestWrapper, SystemAlarmsWrapper, SystemNotifierWrapper) {
	this.service = ServiceRequestWrapper;

	this.callback = null;
	this.initialized = false;

	this.config = null;
	this.enabled = false;
	
	this.charger = "none";

	this.powerSource = {};
	this.timeoutTrigger = null;
	this.triggerEvent = null;
}

//

ChargerTrigger.prototype.init = function(callback) {
	this.callback = callback;

	this.initialized = false;

	this.subscribeChargerStatus();
}

ChargerTrigger.prototype.shutdown = function() {
	this.initialized = false;

	this.charger = "none";

	if(this.subscribtionChargerStatus)
		this.subscribtionChargerStatus.cancel();
}

//

ChargerTrigger.prototype.enable = function(config) {
	this.config = config;
	
	this.enabled = true;
}

ChargerTrigger.prototype.disable = function() {
	this.enabled = false;
}

//

ChargerTrigger.prototype.check = function(config) {
	var charger = 0;

	var appController = Mojo.Controller.getAppController();
	var orientation = appController.getScreenOrientation();
	
	if(this.charger == "puck")
		charger = 1;
	else if(this.charger == "wall")
		charger = 2;
	else if(this.charger == "pc")
		charger = 3;	

	if((config.chargerCharger == charger) && ((config.chargerOrientation == 0) ||
		((config.chargerOrientation == 1) && (orientation == "left")) || 
		((config.chargerOrientation == 2) && (orientation == "right")) || 
		((config.chargerOrientation == 3) && (orientation == "up")) || 
		((config.chargerOrientation == 4) && (orientation == "down"))))
	{
		return true;
	}
	else
		return false; 		
}

//

ChargerTrigger.prototype.execute = function(connected, launchCallback) {
	Mojo.Log.info("Charger trigger received: " + connected);

	var startModes = new Array();
	var closeModes = new Array();

	for(var i = 0; i < this.config.modesConfig.length; i++) {
		for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
			if(this.config.modesConfig[i].triggersList[j].extension == "charger") {
				if((this.config.modesConfig[i].name != this.config.currentMode.name) &&
					(this.config.modifierModes.indexOf(this.config.modesConfig[i].name) == -1))
				{
					startModes.push(this.config.modesConfig[i]);
				}
				else {
					closeModes.push(this.config.modesConfig[i]);
				}
				
				break;
			}
		}
	}

	launchCallback(startModes, closeModes);
}

//

ChargerTrigger.prototype.subscribeChargerStatus = function() {
	this.subscribtionChargerStatus = new Mojo.Service.Request("palm://com.palm.bus/signal/", { 
		'method': "addmatch", 'parameters': {'category': "/com/palm/power", 'method': "chargerStatus"},
		'onSuccess': this.handleChargerStatus.bind(this),
		'onFailure': this.handleTriggerError.bind(this)});
		
	this.requestChargerStatus = new Mojo.Service.Request("palm://com.palm.power/com/palm/power/", {
		'method': "chargerStatusQuery"});
}

ChargerTrigger.prototype.handleChargerStatus = function(response) {
	if(response.type) {
		this.powerSource[response.type] = response.connected;
		
		// Save last connected state, needed for the charger trigger.

		var connected = this.charger;

		// Save current charger state and send trigger event if needed.

		if((this.powerSource['usb'] == true) || 
			(this.powerSource['inductive'] == true))
		{
			if((connected == "none") && (response.name)) {
				this.charger = response.name;

				if(this.enabled)
					this.handleChargerEvent(connected);
			}
		}
		else {
			this.charger = "none";
			
			if((this.enabled) && (connected != "none") )
				this.handleChargerEvent(connected);
		}
	}

	if(!this.initialized) {
		this.initialized = true;
		this.callback(true);
		this.callback = null;
	}
}

ChargerTrigger.prototype.handleTriggerError = function(response) {
	this.callback(false);
	this.callback = null;
}

//

ChargerTrigger.prototype.handleChargerEvent = function(connected) {

	// Delay the actual execution of the trigger to avoid executing 
	// multiple trigger events instead of one.

	// Keep record of first trigger event so we can only trigger the
	// event if the last event is the same as the first.

	// This should handle the case of very quick connect / disconnect 
	// charger events so that only intended events are handled.

	var charger = 0;
	var timeout = 3000;

	if(this.triggerEvent == null)
		this.triggerEvent = this.charger;
	
	if(this.timeoutTrigger)
		clearTimeout(this.timeoutTrigger);

	if((this.charger == "puck") || (connected == "puck"))
		charger = 1;
	else if((this.charger == "wall") || (connected == "wall"))
		charger = 2;
	else if((this.charger == "pc") || (connected == "pc"))
		charger = 3;

	for(var i = 0; i < this.config.modesConfig.length; i++) {
		if(this.config.modesConfig[i].name == this.config.currentMode.name) {
			for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
				if(this.config.modesConfig[i].triggersList[j].extension == "charger") {
					if(this.config.modesConfig[i].triggersList[j].chargerCharger == charger) {
						timeout = this.config.modesConfig[i].triggersList[j].chargerDelay * 1000;
				
						break;
					}
				}		
			}
			
			break;
		}
	}
	
	this.timeoutTrigger = setTimeout(this.handleChargerTrigger.bind(this), timeout);

}

ChargerTrigger.prototype.handleChargerTrigger = function() {
	// Only handle the trigger if the last trigger was the same as first.
	// Otherwise user changed his mind about the charging immediately.

	if(this.triggerEvent == this.charger) {
		this.service.request("palm://com.palm.applicationManager", {'method': "launch", 
			'parameters': {'id': Mojo.Controller.appInfo.id, 'params': {'action': "trigger", 
				'event': "charger", 'data': this.charger}}});
	}

	this.triggerEvent = null;
}

