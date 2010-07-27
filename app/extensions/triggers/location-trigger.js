function LocationTrigger(ServiceRequestWrapper, SystemAlarmsWrapper, SystemNotifierWrapper) {
	this.service = ServiceRequestWrapper;

	this.alarms = SystemAlarmsWrapper;

	this.notifier = SystemNotifierWrapper;

	this.callback = null;
	this.initialized = false;

	this.config = null;
	this.enabled = false;
	
	this.previous = true;
	
	this.latitude = 0;
	this.longitude = 0;
}

//

LocationTrigger.prototype.init = function(callback) {
	this.callback = callback;

	this.initialized = true;
	this.callback(true);
	this.callback = null;
}

LocationTrigger.prototype.shutdown = function() {
	this.initialized = false;
}

//

LocationTrigger.prototype.enable = function(config) {
	// Re-schedule and setup all timers including the location timeout. 

	this.config = config;

	for(var i = 0; i <this.config.modesConfig.length; i++) {
		for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
			if(this.config.modesConfig[i].triggersList[j].extension == "location") {
				this.alarms.setupDelayTimeout("location", 5, "none");
				
				break;
			}
		}
	}
}

LocationTrigger.prototype.disable = function() {
	// Disable location timer and all timeout trigger timers.

	this.alarms.clearDelayTimeout("location");
}

//

LocationTrigger.prototype.check = function(config) {
	if((this.latitude == 0) && (this.longitude == 0))
		return this.previous;

	if(this.calculateTimeEstimation(config) == 0) {
		this.previous = true;
		return true;
	}
	
	this.previous = false;
	return false;
}

//

LocationTrigger.prototype.execute = function(tracking, launchCallback) {
	Mojo.Log.info("Location trigger received: " + tracking);

	// Go through all locations to find the needed accuracy level.
	// If there is no modes with location trigger then do nothing.
	// Then check current location until success (max 5 attemps).
	// If current location fails then reschedule the timer (5 min).
	// If location retrieved succesfully then handleCurrentLocation.

	var count = 0;
	var accuracy = 0;

	for(var i = 0; i <this.config.modesConfig.length; i++) {
		for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
			if(this.config.modesConfig[i].triggersList[j].extension == "location") {
				if((this.config.modesConfig[i].triggersList[j].locationLatitude != 0) &&
					(this.config.modesConfig[i].triggersList[j].locationLongitude != 0))
				{
					if(this.config.modesConfig[i].triggersList[j].locationRadius > 0)
						accuracy = 1;
					if(this.config.modesConfig[i].triggersList[j].locationRadius > 500)
						accuracy = 2;
				}
			}
		}
	}
	
	if(accuracy != 0) {
		// This will call handleLocationTrigger on successful retrieval.

		//this.fetchCurrentLocation(count, accuracy, tracking, launchCallback);
	}
}

//

LocationTrigger.prototype.fetchCurrentLocation = function(count, accuracy, tracking, launchCallback) {
	this.service.request("palm://com.palm.power/com/palm/power", {'method': "activityStart", 
		'parameters': {'id': Mojo.Controller.appInfo.id, 'duration_ms': 60000}});

	if(count < 5) {
		if(this.requestLocation)
			this.requestLocation.cancel();

		this.requestLocation = this.service.request("palm://com.palm.location/", {
			'method': "getCurrentPosition", 'parameters': {'accuracy': accuracy},
			'onComplete': this.handleCurrentLocation.bind(this, count, accuracy, tracking, launchCallback)});
	}
	else {
		// Failed to get location so lets try again after 5 minutes.

		this.latitude = 0;
		this.longitude = 0;

		this.alarms.setupDelayTimeout("location", 5, tracking);
	}
}

LocationTrigger.prototype.handleCurrentLocation = function(count, accuracy, tracking, launchCallback, response) {
	if(response.returnValue) {
		this.latitude = response.latitude;
		this.longitude = response.longitude;
				
		this.handleLocationTrigger(tracking, launchCallback);
	}
	else
		this.fetchCurrentLocation(++count, accuracy, tracking, launchCallback);
}

//

LocationTrigger.prototype.handleLocationTrigger = function(tracking, launchCallback) {
	var startModes = new Array();
	var closeModes = new Array();

	var time = 24*60*60;
	
	var tmpTime = null;

	// Set the initial state of the tracking variable according to parameters.

	if(tracking == "none")
		tracking = {entering: [], leaving: ""};

	// Go through all modes, handle current mode differently than all others.
	
	for(var i = 0; i < this.config.modesConfig.length ; i++) {
		// If the mode does not have any location triggers configured then skip.	

		var hasLocationTriggers = false;
		var hasValidTriggers = false;
		
		for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
			if(this.config.modesConfig[i].triggersList[j].extension == "location") {
				hasLocationTriggers = true;
			
				if(this.check(this.config.modesConfig[i].triggersList[j]))
					hasValidTriggers = true;
			}
		}
	
		if(!hasLocationTriggers)
			continue;

		// Different handling of current mode than modes waiting to get activated.

		if((!this.config.currentMode) || (this.config.currentMode.name != this.config.modesConfig[i].name)) {
			// Reset the tracking of leaving area if the target is not current mode.
			// Then check if all triggers of the mode are already valid for mode start.
			// Also make sure that the tracking information is updated accordingly.
			// If triggers valid then add mode into launcherModes if not asked before.
			// If triggers not valid then calculate time for the next check execution.

			// Reset leaving tracking if the mode is not current anymore.
			
			if(this.config.modesConfig[i].name == tracking.leaving)
				tracking.leaving = "";

			// First check if all start triggers of the mode are already valid!
			// If yes then add to list, if no then calculate new check time.
	
			if(hasValidTriggers) {
				Mojo.Log.info("TRIGGERI OK " + this.config.modesConfig[i].name);
			
				// When we are on location the check time is set to 5 minutes.
					
				time = 5 * 60;
					
				// If not already asked then suggest mode for start process.
			
				if(tracking.entering.indexOf(this.config.modesConfig[i].name) == -1) {
					tracking.entering.push(this.config.modesConfig[i].name);
				
					startModes.push(this.config.modesConfig[i]);
				}
			}
			else {
				Mojo.Log.info("TRIGGERI EI OK " + this.config.modesConfig[i].name);

				// Remove mode from the tracking list since it is not valid.
			
				var index = tracking.entering.indexOf(this.config.modesConfig[i].name);
				
				if(index != -1)
					tracking.entering.splice(index, 1);				

				// Calculate the estimation for the time for the next check.

				for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
					// FIXME: maybe get back the usage of time triggers in calculating the next time...
								
					if(this.config.modesConfig[i].triggersList[j].extension == "location") {
						tmpTime = this.calculateTimeEstimation(this.config.modesConfig[i].triggersList[j]);

						// If calculated time 0 it means that some other trigger is holding on.
						
						if(tmpTime == 0)
							tmpTime = 15 * 60;
							
						if(tmpTime < time)
							time = tmpTime;
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
		
			if(!hasValidTriggers) {
				Mojo.Log.info("EI VALIDI ENÄÄ " + this.config.currentMode.name);

				// Check if user has been already notified of closing.
		
				if(tracking.leaving == "") {
					tracking.leaving = this.config.currentMode.name;
			
					closeMode = true;			
				}
			}
		}
	}

	// Set new delay timer for checking location status.

	if(time < 5 * 60)
		time = 5 * 60;

	// Handle launching and closing of modes if needed.
	
	this.alarms.setupDelayTimeout("location", Math.floor(time / 60), tracking);

	launchCallback(startModes, closeMode);
}

//

LocationTrigger.prototype.calculateTimeEstimation = function(trigger) {
	var lat1 = this.latitude;
	var lng1 = this.longitude;
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

