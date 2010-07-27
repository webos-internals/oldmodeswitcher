function AppsManager(serviceRequestWrapper) {
	this.service = serviceRequestWrapper;
	
	this.appsList = new Array();
	
	this.timers = new Array();
}

//

AppsManager.prototype.update = function(oldApps, newApps, start, close, callback) {
	for(var i = 0; i < this.timers.length; i++)
		clearTimeout(this.timers[i]);
		
	this.timers.clear();

	this.fetchRunningApps(oldApps, newApps, start, close, callback, 0);
}

//

AppsManager.prototype.fetchRunningApps = function(oldApps, newApps, start, close, callback) {
	this.service.request('palm://com.palm.applicationManager/', {
		'method': "running", 'parameters': {},
		'onComplete': this.handleRunningApps.bind(this, oldApps, newApps, start, close, callback)});	
}

AppsManager.prototype.handleRunningApps = function(oldApps, newApps, start, close, callback, response) {
	var appsForLaunch = new Array();
	
	var oldStatusApps = this.appsList;

	this.appsList = new Array();

	if(((close == 1) && (oldApps.length > 0)) || 
		((start == 2) || (close == 2)) && 
		(response.running.length > 0))
	{
		Mojo.Log.info("Closing configured applications");
			
		for(var i = 0 ; i < response.running.length ; i++) {
			var skip = false;
			
			// Always skip applications that would be started on newmode.

			for(var j = 0; j < oldApps.length; j++) {
				if((oldApps[j].launchMode != 1) && (oldApps[j].appid == response.running[i].id)) {
					if(oldApps[j].closeParams.length == 0)
						skip = true;
						
					break;
				}
			}
							
			for(var j = 0; j < newApps.length; j++) {
				if((newApps[j].launchMode != 2) && (newApps[j].appid == response.running[i].id)) {
					if(newApps[j].startParams.length == 0)
						skip = true;
						
					break;
				}
			}
		
			if((close == 1) && (!skip)) {
				// Skip applications that were not started by the oldmode.
			
				skip = true;
			
				for(var j = 0 ; j < oldApps.length; j++) {
					if((oldApps[j].launchMode != 2) && (oldApps[j].appid == response.running[i].id)) {
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
	
					if(oldApps.length == 0)
						this.appsList.push(response.running[i].id);
					else {					
						for(var j = 0 ; j < oldApps.length ; j++) {
							if(response.running[i].id == oldApps[j].appid) {
								skip = true;
					
								for(var k = 0; k < oldStatusApps.length; k++) {
									if(oldStatusApps[k] == oldApps[j].appid) {
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

	if(oldApps.length > 0) {
		for(var i = 0 ; i < oldApps.length ; i++) {
			if(oldApps[i].launchMode == 1)
				continue;
		
			var skip = false;

			// Only start applications that were not running.

			for(var j = 0 ; j < response.running.length ; j++) {
				if((response.running[j].id == oldApps[i].appid) &&
					(response.running[j].processid > 1010))
				{
					if(oldApps[i].closeParams.length == 0)
						skip = true;
					
					break;
				}
			}
		
			if(!skip) {
				appsForLaunch.push({
					"url": oldApps[i].url,
					"method": oldApps[i].method,
					"appid": oldApps[i].appid, 
					"delay": oldApps[i].launchDelay,
					"params": oldApps[i].closeParams });
			}
		}
	}
	
	if(newApps.length > 0) {
		for(var i = 0 ; i < newApps.length ; i++) {
			if(newApps[i].launchMode == 2)
				continue;
		
			var skip = false;

			// Only start applications that were not running.

			for(var j = 0 ; j < response.running.length ; j++) {
				if((response.running[j].id == newApps[i].appid) &&
					(response.running[j].processid > 1010))
				{
					if(newApps[i].startParams.length == 0)
						skip = true;
						
					break;
				}
			}
		
			if(!skip) {
				appsForLaunch.push({
					"url": newApps[i].url,
					"method": newApps[i].method,
					"appid": newApps[i].appid, 
					"delay": newApps[i].launchDelay,
					"params": newApps[i].startParams });
			}
		}
	}
	
	if(appsForLaunch.length > 0)
		Mojo.Log.info("Starting configured applications");

	appsForLaunch.done = 0;

	this.launchModeApplications(0, appsForLaunch, callback);
}

AppsManager.prototype.launchModeApplications = function(index, apps, callback) {
	if(index < apps.length) {
		Mojo.Log.info("Requesting application launch: ");
		Mojo.Log.info(apps[index].appid);

		var launch = this.launchApplication.bind(this, index, apps, callback);

		var timer = setTimeout(launch, apps[index].delay * 1000);
			
		this.timers.push(timer);
			
		this.launchModeApplications(++index, apps, callback)
	}
}

AppsManager.prototype.launchApplication = function(index, apps, callback) {
	try {eval("var params = " + apps[index].params);} catch(error) {var params = "";}

	if(apps[index].url.length > 0) {
		var url = apps[index].url;
		var method = apps[index].method;
	}
	else {
		var url = "palm://com.palm.applicationManager/";
		var method = "launch";
	}

	Mojo.Log.error("DEBUG: App Launch: " + url + " " + method + " " + apps[index].appid + " " + Object.toJSON(params));

	this.service.request(url, {
		'method': method, 'parameters': {'id': apps[index].appid, 'params': params },
		'onComplete': this.launchedApplication.bind(this, apps, callback)});
}

AppsManager.prototype.launchedApplication = function(apps, callback) {
	if((++apps.done == apps.length) && (callback))
		callback();
}

