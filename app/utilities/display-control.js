/*
 * Display Control Class - allows controlling of screen behavior when on charger (default, turnoff, alwayson)
 */

function DisplayControl(serviceRequestWrapper) {
	this.service = serviceRequestWrapper;

	this.chargerSet = false;
	this.powerSource = {};

	this.displayOff = false;
	this.displayBlock = false;
	
	this.displayMode = "default";
}

DisplayControl.prototype.setup = function() {
	this.subscribeChargerStatus();
		
	this.subscribeDisplayStatus();
}

DisplayControl.prototype.cleanup = function() {
	if(this.subscribeChargerStatus)
		this.subscribeChargerStatus.cancel();
	
	if(this.subscribeDisplayStatus)
		this.subscribeDisplayStatus.cancel();

	if(this.subscribeLockStatus)
		this.subscribeLockStatus.cancel();
}

//

DisplayControl.prototype.setMode = function(mode) {
//	Mojo.Log.error("DEBUG: handle display setmode " + mode);

	this.displayMode = mode;
	
	this.checkDisplayBlock();

	if(this.subscribeLockStatus)
		this.subscribeLockStatus.cancel();
	
	this.subscribeLockStatus = this.service.request('palm://com.palm.systemmanager/', {
		method: 'getLockStatus', parameters: {'subscribe': true},
		onSuccess: this.handleDisplayStatus.bind(this) });
}

//

DisplayControl.prototype.subscribeChargerStatus = function() {
	// Subscribe to charger status notifications
	
	this.subscribeChargerStatus = this.service.request('palm://com.palm.bus/signal/', {
		method: 'addmatch', parameters: {"category":"/com/palm/power","method":"chargerStatus"},
		onSuccess: this.handleChargerStatus.bind(this)});
		
	// Get the initial value for charger status 
	
	this.requestChargerStatus = this.service.request('palm://com.palm.power/com/palm/power/', {
		method: 'chargerStatusQuery' });
}

DisplayControl.prototype.handleChargerStatus = function(response) {
//	Mojo.Log.error("DEBUG: handle display charger " + response.type + " " + this.chargerSet);

	if(response.type) {
		Mojo.Log.error("DEBUG: handle display charger2 " + response.connected + " " + this.powerSource['usb'] + " " + this.powerSource['inductive']);
	
		this.powerSource[response.type] = response.connected;
		
		// See if any power source is connected
		
		if((this.powerSource['usb'] == true) || 
			(this.powerSource['inductive'] == true))
		{
			if(!this.chargerSet) {
				this.chargerSet = true;
				
				this.checkDisplayBlock();
			}
		}
		else {
			if(this.chargerSet) {
				this.chargerSet = false;			

				this.checkDisplayBlock();
			}
		}
	}
}

//

DisplayControl.prototype.subscribeDisplayStatus = function() {
	this.subscribeDisplayStatus = this.service.request('palm://com.palm.display/control/', {
		method: 'status', parameters: {'subscribe': true}, 
		onSuccess: this.handleDisplayStatus.bind(this) });

	this.subscribeLockStatus = this.service.request('palm://com.palm.systemmanager/', {
		method: 'getLockStatus', parameters: {'subscribe': true},
		onSuccess: this.handleDisplayStatus.bind(this) });
}

DisplayControl.prototype.handleDisplayStatus = function(response) {
	Mojo.Log.error("DEBUG: handle display state " + response.event + " " + this.chargerSet + " " + this.displayOff);
	
	if(response.event == "unblockedDisplay") {
		this.displayBlock = false;

		if((this.chargerSet) && (this.displayMode == "alwayson"))
			this.setupDisplayBlock("on", 0);
	}
	else if((response.event == "displayOn") && (this.displayOff))
	{
		this.displayOff = false;

		this.setupDisplayState("on", 0);
	}
	else if(((response.event == "displayOff") || (response.event == "displayInactive") || 
				(response.locked)) && (this.chargerSet) && (!this.displayOff))
	{
		if(this.displayMode == "turnoff") {
			this.displayOff = true;
			
			this.setupDisplayState("off", 0);
		}
	}
}

//

DisplayControl.prototype.setupDisplayState = function(state, retry) {
	Mojo.Log.error("DEBUG: setup display state " + state + " " + retry + " " + this.displayOff);

	if(state == "on") {
		if(!this.displayOff) {
			if(this.setupTouchPanelState)
				this.setupTouchPanelState.cancel();
				
			if(this.setupBacklightState)
				this.setupBacklightState.cancel();

			if(retry < 3) {
				retry++;

				this.setupTouchPanelState = this.service.request('palm://com.palm.hidd/HidTouchpanel/', {
					method: 'State', parameters:{'mode':'set', 'value':'on'},
					onFailure: this.setupDisplayState.bind(this, state, retry),
					onComplete: function() {this.setupTouchPanelState = null;}.bind(this) });
			}
		}
	}
	else if(state == "off") {
		if(this.displayOff) {
			if(this.setupTouchPanelState)
				this.setupTouchPanelState.cancel();

			if(retry < 3) {
				this.setupTouchPanelState = this.service.request('palm://com.palm.hidd/HidTouchpanel/', {
					method: 'State', parameters:{'mode':'set', 'value':'off'},
					onSuccess: function(response) {
						if(this.setupBacklightState)
							this.setupBacklightState.cancel();

						this.setupBacklightState = this.service.request('palm://com.palm.power/backlight/', {
							method: 'set', parameters:{keypad: {brightness: 0}, display: {brightness: -1}},
							onFailure: this.setupDisplayState.bind(this, state, ++retry),
							onComplete: function() {this.setupBacklightState = null;}.bind(this) });	
					}.bind(this),
					onFailure: this.setupDisplayState.bind(this, state, ++retry),
					onComplete: function() {this.setupTouchPanelState = null;}.bind(this) });
			}
		}
	}
}

//

DisplayControl.prototype.checkDisplayBlock = function() {
//	Mojo.Log.error("DEBUG: check display block " + this.displayBlock + " " + this.chargerSet + " " + this.displayMode);

	if((!this.displayBlock) && (this.chargerSet) && (this.displayMode == "alwayson"))
		this.setupDisplayBlock("on", 0);
	else if((this.displayBlock) && ((!this.chargerSet) || (this.displayMode != "alwayson")))
		this.setupDisplayBlock("off", 0);
}

DisplayControl.prototype.setupDisplayBlock = function(state, retry) {
//	Mojo.Log.error("DEBUG: setup display block " + state + " " + retry + " " + this.displayBlock);

	if(state == "on") {
		if(!this.displayBlock) {
			this.displayBlock = true;

			if(this.requestDisplayBlock)
				this.requestDisplayBlock.cancel();

			if(retry < 3) {
				this.requestDisplayBlock = this.service.request('palm://com.palm.display/control/', {
					method: "setProperty", parameters: {"requestBlock": true, "client": "modeswitcher"},
					onFailure: this.setupDisplayBlock.bind(this, state, ++retry),
					onComplete: function() {this.requestDisplayBlock = null;}.bind(this) });
			}
		}
	}
	else if(state == "off") {
		if(this.displayBlock) {
			this.displayBlock = false;
	
			if(this.requestDisplayBlock)
				this.requestDisplayBlock.cancel();

			if(retry < 3) {
				this.requestDisplayBlock = this.service.request('palm://com.palm.display/control/', {
					method: "setProperty", parameters: {"requestBlock": false, "client": "modeswitcher"},
					onFailure: this.setupDisplayBlock.bind(this, state, ++retry),
					onComplete: function() {this.requestDisplayBlock = null;}.bind(this) });
			}
		}	
	}
}

