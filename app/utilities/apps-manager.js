function AppsManager(serviceRequestWrapper) {
	this.service = serviceRequestWrapper;
	
	this.appsList = new Array();
}

//

AppsManager.prototype.update = function(newapps, oldapps, start, close, callback) {
	this.fetchRunningApps(0, newapps, oldapps, start, close, callback);
}

//

AppsManager.prototype.fetchRunningApps = function(retry, newapps, oldapps, start, close, callback) {
	if(retry < 3) {
		this.service.request('palm://com.palm.applicationManager/', {
			'method': "running", 'parameters': {},
			'onSuccess': this.handleRunningApps.bind(this, newapps, oldapps, start, close, callback),
			'onFailure': this.fetchRunningApps.bind(this, ++retry, newapps, oldapps, start, close, callback) });	
	}
	else
		callback();
}

AppsManager.prototype.handleRunningApps = function(newapps, oldapps, start, close, callback, response) {
	var appsForLaunch = new Array();
	
	var oldStatusApps = this.appsList;

	this.appsList = new Array();

	if(((close == 1) && (oldapps.length > 0)) || 
		((start == 2) || (close == 2)) && 
		(response.running.length > 0))
	{
		Mojo.Log.info("Closing configured applications");
			
		for(var i = 0 ; i < response.running.length ; i++) {
			var skip = false;
			
			// Always skip applications that would be started on newmode.
				
			for(var j = 0; j < newapps.length; j++) {
				if(newapps[j].appid == response.running[i].id) {
					skip = true;
					break;
				}
			}
		
			if((close == 1) && (!skip)) {
				// Skip applications that were not started by the oldmode.
			
				skip = true;
			
				for(var j = 0 ; j < oldapps.length; j++) {
					if(oldapps[j].appid == response.running[i].id) {
						skip = false;
						
						// Skip applications that were running when mode was started.
				
						for(var k = 0; k < oldStatusApps.length; k++) {
							if(oldStatusApps[k] == response.running[i].id) {
								skip = true;
								break;
							}
						}
					}
				}
			}
		
			if((!skip) && (response.running[i].processid > 1010) && 
				(response.running[i].id != "com.palm.systemui") && 
				(response.running[i].id != this.appid))
			{
				Mojo.Log.info("Requesting application close: ");
				Mojo.Log.info(response.running[i].id);
			
				this.service.request('palm://com.palm.applicationManager/', {
					'method': "close", 'parameters': {'processId': response.running[i].processid}});
			}
		}

		// If all apps closed then no need to save the list.	
		
		if(close == 1) {
			if(response.running.length > 0) {
				Mojo.Log.info("Storing list of running apps");
		
				for(var i = 0 ; i < response.running.length ; i++) {
					// Only store apps that were not part of old mode.
	
					var skip = false;
	
					if(oldapps.length == 0)
						this.appsList.push(response.running[i].id);
					else {					
						for(var j = 0 ; j < oldapps.length ; j++) {
							if(response.running[i].id == oldapps[j].appid) {
								skip = true;
					
								for(var k = 0; k < oldStatusApps.length; k++) {
									if(oldStatusApps[k] == oldapps[j].appid) {
										skip = false;
									}
								}
							}
						}
			
						if(!skip)
							this.appsList.push(response.running[i].id);						
					}
				}
			}
		}	
	}
	
	if(newapps.length > 0) {
		Mojo.Log.info("Starting configured applications");

		for(var i = 0 ; i < newapps.length ; i++) {
			var skip = false;

			// Only start applications that were not running.

			for(var j = 0 ; j < response.running.length ; j++) {
				if((response.running[j].id == newapps[i].appid) &&
					(response.running[j].processid > 1010))
				{
					skip = true;
					break;
				}
			}
		
			if(!skip) {
				appsForLaunch.push({"appid": newapps[i].appid, 
					"params": newapps[i].params});
			}
		}
	}

	this.launchModeApplications(0, 0, appsForLaunch, callback);
}

AppsManager.prototype.launchModeApplications = function(index, retry, apps, callback) {
	if(index >= apps.length) {
		if(callback)
			callback();
	}
	else {
		if(retry < 3) {
			if(retry == 0) {
				Mojo.Log.info("Requesting application launch: ");
				Mojo.Log.info(apps[index].appid);
			}
			else {
				Mojo.Log.warn("Retrying application launch: ");
				Mojo.Log.warn(apps[index].appid);
			}

			try {eval("var params = " + apps[index].params);} catch(error) {var params = "";}

			this.service.request('palm://com.palm.applicationManager/', {
				'method': "launch", 'parameters': {'id': apps[index].appid, 'params': params },
				'onSuccess': this.launchModeApplications.bind(this, ++index, 0, apps, callback),
				'onFailure': this.launchModeApplications.bind(this, index, ++retry, apps, callback) });
		}		
		else {
			Mojo.Log.error("Skipping application launch: ");
			Mojo.Log.error(apps[index].appid);
			
			this.launchModeApplications(++index, 0, apps, callback);	
		}
	}
}

