function ChargerTrigger(ServiceRequestWrapper) {
	this.service = ServiceRequestWrapper;

	this.charger = "none";

	this.powerSource = {};
	this.timeoutTrigger = null;
	this.triggerEvent = null;
	
	this.appid = "com.palm.org.e-lnx.wee.apps.modeswitcher";
}

//

ChargerTrigger.prototype.init = function(config) {
	this.config = config;

	this.subscribeChargerStatus();
}

ChargerTrigger.prototype.reload = function(modes) {
}

ChargerTrigger.prototype.shutdown = function() {
	if(this.subscribtionChargerStatus)
		this.subscribtionChargerStatus.cancel();
}

//

ChargerTrigger.prototype.check = function(config) {
	var charger = 0;

	if(this.charger == "puck")
		charger = 1;
	else if(this.charger == "wall")
		charger = 2;
	else if(this.charger == "pc")
		charger = 3;	

	if(config.chargerCharger == charger)
		return true;

	return false; 		
}

//

ChargerTrigger.prototype.execute = function(connected, launchCallback) {
	Mojo.Log.info("Charger trigger received: " + connected);

	// Form a list of modes that the trigger involves and are valid.

	var modes = new Array();

	if(this.charger == "none") {
		for(var i = 0; i < this.config.currentMode.triggersList.length; i++) {
			if(this.config.currentMode.triggersList[i].type == "charger") {
				launchCallback(modes, true);
					
				break;
			}		
		}
	}
	else {
		for(var i = 0; i < this.config.modesConfig.length; i++) {
			for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
				if(this.config.modesConfig[i].triggersList[j].type == "charger") {
					modes.push(this.config.modesConfig[i]);
					
					break;
				}
			}
		}

		launchCallback(modes, false);
	}
}

//

ChargerTrigger.prototype.subscribeChargerStatus = function() {
	// Subscribe to Charger Notifications
	this.subscribtionChargerStatus = this.service.request('palm://com.palm.bus/signal/', { 
		method: 'addmatch', parameters: {"category":"/com/palm/power","method":"chargerStatus"},
		onSuccess: this.handleChargerStatus.bind(this)});
		
	// Get the Initial Value for charger status (returned as signals)
	this.requestChargerStatus = this.service.request('palm://com.palm.power/com/palm/power/', {
		method: 'chargerStatusQuery' });
}

ChargerTrigger.prototype.handleChargerStatus = function(payload) {
	if(payload.type) {
		this.powerSource[payload.type] = payload.connected;
		
		// Save last connected state, needed for the charger trigger.

		var connected = this.charger;

		// Save current charger state and send trigger event if needed.

		if((this.powerSource['usb'] == true) || 
			(this.powerSource['inductive'] == true))
		{
			if((connected == "none") && (payload.name)) {
				this.charger = payload.name;

				this.handleChargerEvent(connected);
			}
		}
		else {
			this.charger = "none";
			
			if(connected != "none") 
				this.handleChargerEvent(connected);
		}
	}
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

	for(var i = 0; i < this.config.currentMode.triggersList.length; i++) {
		if(this.config.currentMode.triggersList[i].type == "charger") {
			if(this.config.currentMode.triggersList[i].chargerCharger == charger) {
				timeout = this.config.currentMode.triggersList[i].chargerDelay * 1000;
				break;
			}
		}		
	}
	
	this.timeoutTrigger = setTimeout(this.handleChargerTrigger.bind(this), timeout);

}

ChargerTrigger.prototype.handleChargerTrigger = function() {
	// Only handle the trigger if the last trigger was the same as first.
	// Otherwise user changed his mind about the charging immediately.

	if(this.triggerEvent == this.charger) {
		this.service.request("palm://com.palm.applicationManager", {'method': "launch", 
			'parameters': {'id': this.appid, 'params': {
				'action': "trigger", 'event': "charger", 'data': this.charger}} });
	}

	this.triggerEvent = null;
}

