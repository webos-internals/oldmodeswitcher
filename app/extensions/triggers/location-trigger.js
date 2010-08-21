function LocationTrigger(Config, Control) {
	this.config = Config;

	this.service = Control.service;
	this.alarms = Control.alarms;

	this.initialized = false;

	this.startupCallback = null;
	this.executeCallback = null;

	this.gpsLatitude = null;
	this.gpsLongitude = null;
	
	this.gpsAccuracy = -1;
}

//

LocationTrigger.prototype.init = function(startupCallback) {
	this.initialized = true;
	
	startupCallback(true);
}

LocationTrigger.prototype.shutdown = function() {
	this.initialized = false;

	this.gpsLatitude = null;
	this.gpsLongitude = null;

	this.gpsAccuracy = -1;
}

//

LocationTrigger.prototype.enable = function(executeCallback) {
	// Re-schedule and setup all timers including the location timeout. 

	this.executeCallback = executeCallback;

	var tracking = {entering: [], leaving: []};

	this.alarms.setupDelayTimeout("location", 5, tracking, 0);
}

LocationTrigger.prototype.disable = function() {
	// Disable location timer and all timeout trigger timers.

	this.executeCallback = null;

	this.alarms.clearDelayTimeout("location", 0);
}

//

LocationTrigger.prototype.check = function(triggerConfig, modeName) {
	if((this.gpsLatitude == null) || (this.gpsLongitude == null))
		return false;

	if((triggerConfig.locationActive == 0) && (this.calculateTimeEstimation(triggerConfig) == 0))
		return true;
	
	if((triggerConfig.locationActive == 1) && (this.calculateTimeEstimation(triggerConfig) != 0))
		return true;
	
	return false;
}

//

LocationTrigger.prototype.execute = function(triggerData, manualLaunch) {
	Mojo.Log.error("Location trigger received: " + Object.toJSON(triggerData));

	// Go through all locations to find the needed accuracy level.
	// If there is no modes with location trigger then do nothing.
	// Then check current location until success (max 5 attemps).
	// If current location fails then reschedule the timer (5 min).
	// If location retrieved succesfully then handleCurrentLocation.

	if((triggerData.entering) && (triggerData.leaving)) {
		var gpsAccuracy = 0;

		for(var i = 0; i <this.config.modesConfig.length; i++) {
			for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
				if(this.config.modesConfig[i].triggersList[j].extension == "location") {
					if((this.config.modesConfig[i].triggersList[j].locationLatitude != "(failed)") &&
						(this.config.modesConfig[i].triggersList[j].locationLongitude != "(failed)"))
					{
						if(this.config.modesConfig[i].triggersList[j].locationRadius > 0)
							gpsAccuracy = 1;
						if(this.config.modesConfig[i].triggersList[j].locationRadius > 500)
							gpsAccuracy = 2;
					}
				}
			}
		}
	
		if(gpsAccuracy != 0) {
			// This will call handleLocationTrigger on successful retrieval.

			this.fetchCurrentLocation(0, gpsAccuracy, triggerData);
		}
	}
}

//

LocationTrigger.prototype.fetchCurrentLocation = function(retryCount, gpsAccuracy, trackingData) {
	this.service.request("palm://com.palm.power/com/palm/power", {'method': "activityStart", 
		'parameters': {'id': Mojo.Controller.appInfo.id, 'duration_ms': 60000}});

	if(retryCount < 10) {
		if(this.requestLocation)
			this.requestLocation.cancel();

		this.requestLocation = this.service.request("palm://com.palm.location/", {
			'method': "getCurrentPosition", 'parameters': {'accuracy': gpsAccuracy},
			'onComplete': this.handleCurrentLocation.bind(this, retryCount, gpsAccuracy, trackingData)});
	}
	else {
		// Failed to get location so lets try again after 5 minutes.

		this.alarms.setupDelayTimeout("location", 5, trackingData, 0);
	}
}

LocationTrigger.prototype.handleCurrentLocation = function(retryCount, gpsAccuracy, trackingData, serviceResponse) {
	if((serviceResponse.returnValue) && (!serviceResponse.errorCode)) {
		if((serviceResponse.horizAccuracy == -1) || (serviceResponse.horizAccuracy > 50 * gpsAccuracy)) {	
			Mojo.Log.error("Insufficient GPS accuracy: " + serviceResponse.horizAccuracy);
		
			this.fetchCurrentLocation(++retryCount, gpsAccuracy, trackingData);
		}
		else {
		Mojo.Log.error("AAA " + Object.toJSON(serviceResponse));
		
			this.gpsLatitude = serviceResponse.latitude;
			this.gpsLongitude = serviceResponse.longitude;
			
			this.gpsAccuracy = serviceResponse.horizAccuracy;
				
			this.handleLocationTrigger(trackingData);
		}
	}
	else {
		Mojo.Log.error("Failed to retrieve current location: " + retryCount);
		
		this.fetchCurrentLocation(++retryCount, gpsAccuracy, trackingData);
	}
}

//

LocationTrigger.prototype.handleLocationTrigger = function(trackingData) {
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
			
				if(this.check(this.config.modesConfig[i].triggersList[j])) {
					hasValidTriggers = true;
					break;
				}
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
			
			var index = trackingData.leaving.indexOf(this.config.modesConfig[i].name);
			
			if(index != -1)
				trackingData.leaving.splice(index, 1);

			// First check if all start triggers of the mode are already valid!
			// If yes then add to list, if no then calculate new check time.
	
			if(hasValidTriggers) {
				Mojo.Log.error("Location trigger valid: " + this.config.modesConfig[i].name);
			
				// When we are on location the check time is set to 5 minutes.
					
				time = 5 * 60;
					
				// If not already asked then suggest mode for start process.
			
				if(trackingData.entering.indexOf(this.config.modesConfig[i].name) == -1) {
					trackingData.entering.push(this.config.modesConfig[i].name);
				
					startModes.push(this.config.modesConfig[i]);
				}
			}
			else {
				Mojo.Log.error("Location trigger invalid: " + this.config.modesConfig[i].name);

				// Remove mode from the tracking list since it is not valid.
			
				var index = trackingData.entering.indexOf(this.config.modesConfig[i].name);
				
				if(index != -1)
					trackingData.entering.splice(index, 1);				

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
		
				if(trackingData.leaving.indexOf(this.config.currentMode.name) == -1) {
					trackingData.leaving.push(this.config.currentMode.name);
			
					closeModes.push(this.config.modesConfig[i]);
				}
			}
		}
	}

	// Set new delay timer for checking location status.

	if(time < 5 * 60)
		time = 5 * 60;

	// Handle launching and closing of modes if needed.
	
	this.alarms.setupDelayTimeout("location", Math.floor(time / 60), trackingData), 0;

	if((this.executeCallback) && ((startModes.length > 0) || (closeModes.length > 0)))
		this.executeCallback(startModes, closeModes);
}

//

LocationTrigger.prototype.calculateTimeEstimation = function(triggerConfig) {
	var lat1 = this.gpsLatitude;
	var lng1 = this.gpsLongitude;
	var lat2 = triggerConfig.locationLatitude;
	var lng2 = triggerConfig.locationLongitude;
	
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

	Mojo.Log.error("Location information accuracy: " + this.gpsAccuracy);

	// Reduce the radius - error from the distance.

	distance = distance - (triggerConfig.locationRadius - this.gpsAccuracy);

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

