function LocationTrigger(ServiceRequestWrapper, SystemAlarmsWrapper) {
	this.service = ServiceRequestWrapper;
	this.alarms = SystemAlarmsWrapper;

	this.callback = null;
	this.initialized = false;

	this.config = null;
	this.enabled = false;
	
	this.latitude = null;
	this.longitude = null;
	
	this.accuracy = -1;
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

	this.latitude = null;
	this.longitude = null;

	this.accuracy = -1;
}

//

LocationTrigger.prototype.enable = function(config) {
	// Re-schedule and setup all timers including the location timeout. 

	this.config = config;

	var tracking = {entering: [], leaving: []};

	for(var i = 0; i <this.config.modesConfig.length; i++) {
		for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
			if(this.config.modesConfig[i].triggersList[j].extension == "location") {
				this.alarms.setupDelayTimeout("location", 5, tracking);
				
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
	if((this.latitude == null) || (this.longitude == null))
		return false;

	if(this.calculateTimeEstimation(config) == 0)
		return true;
	
	return false;
}

//

LocationTrigger.prototype.execute = function(tracking, launchCallback) {
	Mojo.Log.error("Location trigger received: " + Object.toJSON(tracking));

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
				if((this.config.modesConfig[i].triggersList[j].locationLatitude != "(failed)") &&
					(this.config.modesConfig[i].triggersList[j].locationLongitude != "(failed)"))
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

		this.fetchCurrentLocation(count, accuracy, tracking, launchCallback);
	}
}

//

LocationTrigger.prototype.fetchCurrentLocation = function(count, accuracy, tracking, launchCallback) {
	this.service.request("palm://com.palm.power/com/palm/power", {'method': "activityStart", 
		'parameters': {'id': Mojo.Controller.appInfo.id, 'duration_ms': 60000}});

	if(count < 10) {
		if(this.requestLocation)
			this.requestLocation.cancel();

		this.requestLocation = this.service.request("palm://com.palm.location/", {
			'method': "getCurrentPosition", 'parameters': {'accuracy': accuracy},
			'onComplete': this.handleCurrentLocation.bind(this, count, accuracy, tracking, launchCallback)});
	}
	else {
		// Failed to get location so lets try again after 5 minutes.

		this.alarms.setupDelayTimeout("location", 5, tracking);
	}
}

LocationTrigger.prototype.handleCurrentLocation = function(count, accuracy, tracking, launchCallback, response) {
	if(response.returnValue) {
		if((response.horizAccuracy == -1) || (response.horizAccuracy > accuracy)) {	
			Mojo.Log.error("Insufficient GPS accuracy: " + response.horizAccuracy);
		
			this.fetchCurrentLocation(++count, accuracy, tracking, launchCallback);
		}
		else {
			this.latitude = response.latitude;
			this.longitude = response.longitude;
			
			this.accuracy = response.horizAccuracy;
				
			this.handleLocationTrigger(tracking, launchCallback);
		}
	}
	else {
		Mojo.Log.error("Failed to retrieve current location: " + count);
		
		this.fetchCurrentLocation(++count, accuracy, tracking, launchCallback);
	}
}

//

LocationTrigger.prototype.handleLocationTrigger = function(tracking, launchCallback) {
	var startModes = new Array();
	var closeModes = new Array();

	var time = 24*60*60;
	
	var tmpTime = null;

	// Go through all modes, handle current modes differently than all others.
	
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

		// Different handling of active modes than modes waiting to get activated.

		if((this.config.currentMode.name != this.config.modesConfig[i].name) &&
			(this.config.modifierModes.indexOf(this.config.modesConfig[i].name) == -1))
		{
			// Reset the tracking of leaving area if the target is not active mode.
			// Then check if all triggers of the mode are already valid for mode start.
			// Also make sure that the tracking information is updated accordingly.
			// If triggers valid then add mode into launcherModes if not asked before.
			// If triggers not valid then calculate time for the next check execution.

			// Reset leaving tracking if the mode is not current anymore.
			
			var index = tracking.leaving.indexOf(this.config.modesConfig[i].name);
			
			if(index != -1)
				tracking.leaving.splice(index, 1);

			// First check if all start triggers of the mode are already valid!
			// If yes then add to list, if no then calculate new check time.
	
			if(hasValidTriggers) {
				Mojo.Log.error("Location trigger valid: " + this.config.modesConfig[i].name);
			
				// When we are on location the check time is set to 5 minutes.
					
				time = 5 * 60;
					
				// If not already asked then suggest mode for start process.
			
				if(tracking.entering.indexOf(this.config.modesConfig[i].name) == -1) {
					tracking.entering.push(this.config.modesConfig[i].name);
				
					startModes.push(this.config.modesConfig[i]);
				}
			}
			else {
				Mojo.Log.error("Location trigger invalid: " + this.config.modesConfig[i].name);

				// Remove mode from the tracking list since it is not valid.
			
				var index = tracking.entering.indexOf(this.config.modesConfig[i].name);
				
				if(index != -1)
					tracking.entering.splice(index, 1);				

				// Calculate the estimation for the time for the next check.

				for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
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
				Mojo.Log.error("Location trigger changed: " + this.config.currentMode.name);

				// Check if user has been already notified of closing.
		
				if(tracking.leaving.indexOf(this.config.currentMode.name) == -1) {
					tracking.leaving.push(this.config.currentMode.name);
			
					closeModes.push(this.config.modesConfig[i]);
				}
			}
		}
	}

	// Set new delay timer for checking location status.

	if(time < 5 * 60)
		time = 5 * 60;

	// Handle launching and closing of modes if needed.
	
	this.alarms.setupDelayTimeout("location", Math.floor(time / 60), tracking);

	launchCallback(startModes, closeModes);
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

	Mojo.Log.error("Location current coords: " + lat1 + " " + lng1);
	Mojo.Log.error("Location modes coords: " + lat2 + " " + lng2);

	Mojo.Log.error("Calculated location distance: " + distance);

	Mojo.Log.error("Location information accuracy: " + this.accuracy);

	// Reduce the radius - error from the distance.

	distance = distance - (trigger.locationRadius - this.accuracy);

	Mojo.Log.error("Calculated location result: " + distance);

	// Currently static calculation for car speed.
	
	if(distance > 0) {
		var time = distance / (100 / 3,6);
		
		if(time < 5 * 60)
			time = 5 * 60;
			
		return time;
	}
	else
		return 0;
}

