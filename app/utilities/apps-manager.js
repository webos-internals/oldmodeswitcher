function AppsManager(serviceRequestWrapper) {
	this.service = serviceRequestWrapper;
	
	this.startedAppsList = new Array();
	
	this.timers = new Array();
}

//

AppsManager.prototype.update = function(startApps, closeApps, doneCallback) {
	for(var i = 0; i < this.timers.length; i++)
		clearTimeout(this.timers[i]);
		
	this.timers.clear();

	this.service.request('palm://com.palm.applicationManager/', {
		'method': "running", 'parameters': {}, 'onComplete': 
			function(startApps, closeApps, doneCallback, response) {
				this.execute(startApps, closeApps, response.running, doneCallback);		
			}.bind(this, startApps, closeApps, doneCallback)});	
}

//

AppsManager.prototype.execute = function(startApps, closeApps, runningApps, doneCallback) {
	if(closeApps == "all")
		closeApps = runningApps;

	runningApps.reverse();

	Mojo.Log.error("Executing applications update: " + startApps.length + " " + closeApps.length);

	// Remove apps that would have been closed and started right after.

	for(var i = 0; i < closeApps.length; i++) {
		if(closeApps[i].processid == undefined) {
			for(var j = 0; j < startApps.length; j++) {
				if((closeApps[i].appid == startApps[j].appid) &&
					(closeApps[i].params == startApps[j].params))
				{
					closeApps.splice(i--, 1);
					startApps.splice(j--, 1);
					
					break;
				}
			}
		}
	}

	// Close the app if it is not set to be started and is started by MS.

	for(var i = 0; i < closeApps.length; i++) {
		var appid = null;
		var processid = 0;
	
		if(closeApps[i].processid == undefined) {
			for(var j = 0; j < this.startedAppsList.length; j++) {
				if((this.startedAppsList[j].appid == closeApps[i].appid) &&
					(this.startedAppsList[j].params == closeApps[i].params))
				{
					for(var k = 0; k < runningApps.length; k++) {
						if(((this.startedAppsList[j].processid < 1010) &&
							(runningApps[k].id == this.startedAppsList[j].appid)) ||
							((runningApps[k].processid == this.startedAppsList[j].processid) &&
							(runningApps[k].id == this.startedAppsList[j].appid)))
						{
							appid = runningApps[k].id;
							processid = runningApps[k].processid;
						
							break;
						}
					}
					
					this.startedAppsList.splice(j--, 1);
				}
			}
		}
		else {
			appid = closeApps[i].id;
			processid = closeApps[i].processid;
		}
		
		if((appid) && (processid)) {
			this.close(appid, processid);
		}
	}

	// Start requested apps and collect and save the processid information.

	for(var i = 0; i < startApps.length; i++) {
		var launch = this.launch.bind(this, startApps[i].appid, startApps[i].params);

		var timer = setTimeout(launch, startApps[i].delay * 1000);
			
		this.timers.push(timer);
	}
	
	if(doneCallback)
		doneCallback();
}

//

AppsManager.prototype.launch = function(appid, params) {
	try {eval("var parameters = " + params);} catch(error) {var parameters = "";}

	Mojo.Log.error("App launched: " + appid);

	this.service.request("palm://com.palm.applicationManager/", {
		'method': "launch", 'parameters': {'id': appid, 'params': parameters },
		'onComplete': function(appid, params, response) {
				this.startedAppsList.push({'appid': appid, 'params': params, 'processid': response.processId});
			}.bind(this, appid, params)});
}

AppsManager.prototype.close = function(appid, processid) {
	if((processid > 1010) && (appid != "com.palm.systemui") && (appid != "com.palm.app.phone") && 
		(appid != Mojo.Controller.appInfo.id))
	{
		Mojo.Log.error("Closing app: " + appid);
	
		this.service.request('palm://com.palm.applicationManager/', {
			'method': "close", 'parameters': {'processId': processid}});
	}
}

