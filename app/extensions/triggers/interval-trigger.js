function IntervalTrigger(Config, Control) {
	this.config = Config;

	this.service = Control.service;
	this.alarms = Control.alarms;

	this.initialized = false;

	this.startupCallback = null;
	this.executeCallback = null;

	this.sysDelays = new Array();
	
	this.delayId = 0;
}

//

IntervalTrigger.prototype.init = function(startupCallback) {
	this.initialized = true;

	startupCallback(true);
}

IntervalTrigger.prototype.shutdown = function() {
	this.initialized = false;
}

//

IntervalTrigger.prototype.enable = function(executeCallback) {
	this.executeCallback = executeCallback;



	for(var i = 0; i < this.config.modesConfig.length; i++) {
		for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
 			if(this.config.modesConfig[i].triggersList[j].extension == "interval") {
 				if(this.config.modesConfig[i].triggersList[j].intervalMode == 0) {
	 				if((this.config.modesConfig[i].name == this.config.currentMode.name) ||
						(this.config.modifierModes.indexOf(this.config.modesConfig[i].name) != -1))
					{
	 					var data = {'phase': "active", 'mode': this.config.modesConfig[i].name};
 					
						var time = this.config.modesConfig[i].triggersList[j].intervalActive;

	 					this.sysDelays.push({'delay': this.delayId, 'data': data, 'time': time});
			
						this.alarms.setupDelayTimeout("interval", time, data, this.delayId++);
					}

				 	var data = {'phase': "activate", 'mode': this.config.modesConfig[i].name};
 					
					var time = this.config.modesConfig[i].triggersList[j].intervalActivate;
					
 					this.sysDelays.push({'delay': this.delayId, 'data': data, 'time': time});
			
					this.alarms.setupDelayTimeout("interval", time, data, this.delayId++);
				}
			}
		}
	}
}

IntervalTrigger.prototype.disable = function() {
	this.executeCallback = null;

	for(var i = 0; i < this.sysDelays.length; i++) {
		this.alarms.clearDelayTimeout("interval", this.sysDelays[i].delay);
	}
}

//

IntervalTrigger.prototype.check = function(triggerConfig, modeName) {
	for(var i = 0; i < this.sysDelays.length; i++) {
		if((this.sysDelays[i].data.mode == modeName) &&
			(this.sysDelays[i].data.phase == "active"))
		{	
			return true;
		}
	}

	return false;
}

//

IntervalTrigger.prototype.execute = function(triggerData, manualLaunch) {
	Mojo.Log.error("Interval trigger received: " + Object.toJSON(triggerData));

	var startModes = new Array();
	var closeModes = new Array();

	if((triggerData.phase) && (triggerData.mode)) {
		for(var i = 0; i < this.sysDelays.length; i++) {
			if((this.sysDelays[i].data.mode == triggerData.mode) &&
				(this.sysDelays[i].data.phase == triggerData.phase))
			{	
				this.sysDelays.splice(i--, 1);
			}
		}

		if(triggerData.phase == "active") {
			if((triggerData.mode == this.config.currentMode.name) ||
				(this.config.modifierModes.indexOf(triggerData.mode) != -1))
			{
				for(var i = 0; i < this.config.modesConfig.length; i++) {
					if(this.config.modesConfig[i].name == triggerData.mode) {
						closeModes.push(this.config.modesConfig[i]);
						break;
					}
				}
			}
		}
		else if(triggerData.phase == "activate") {		
			if((triggerData.mode != this.config.currentMode.name) &&
				(this.config.modifierModes.indexOf(triggerData.mode) == -1))
			{
				for(var i = 0; i < this.config.modesConfig.length; i++) {
					if(this.config.modesConfig[i].name == triggerData.mode) {
						for(var j = 0; j < this.config.modesConfig[i].triggersList.length; j++) {
				 			if(this.config.modesConfig[i].triggersList[j].extension == "interval") {
				 				var data = {'phase': "active", 'mode': triggerData.mode};
 					
								var time = this.config.modesConfig[i].triggersList[j].intervalActive;

			 					this.sysDelays.push({'delay': this.delayId, 'data': data, 'time': time});
			
								this.alarms.setupDelayTimeout("interval", time, data, this.delayId++);

								var data = {'phase': "activate", 'mode': this.config.modesConfig[i].name};
 					
								var time = this.config.modesConfig[i].triggersList[j].intervalActivate;
					
			 					this.sysDelays.push({'delay': this.delayId, 'data': data, 'time': time});
			
								this.alarms.setupDelayTimeout("interval", time, data, this.delayId++);

								startModes.push(this.config.modesConfig[i]);
												
								break;
							}
						}
					}
				}
			}
		}

		if((this.executeCallback) && ((startModes.length > 0) || (closeModes.length > 0)))
			this.executeCallback(startModes, closeModes);
	}		
}

