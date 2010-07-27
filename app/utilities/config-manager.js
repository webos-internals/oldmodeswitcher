function ConfigManager(serviceRequestWrapper) {
	this.service = serviceRequestWrapper;
}

//

ConfigManager.prototype.load = function(params, callback) {	
	// Load all requested system preferences.

	Mojo.Log.info("Loading config from system preferences");

	var keys = new Array();

	for(var key in params)
		keys.push(key);

	if(this.requestLoad)
		this.requestLoad.cancel();
	
	this.requestLoad = this.service.request('palm://com.palm.systemservice/', {
		'method': 'getPreferences', 'parameters': {'subscribe': false, 'keys': keys},
		onSuccess: this.handleConfigData.bind(this, params, callback),
		onFailure: this.handleConfigData.bind(this, params, callback),
		onComplete: function() {this.requestLoad = null;}.bind(this) });
}

ConfigManager.prototype.save = function(params, target) {
	// Save all requested system preferences.
	
	Mojo.Log.info("Saving config to system preferences");

	var parameters = {};

	for(var key in params) {
		var config = params[key];
		
		if(config == null)
			config = "none";

		if((target == undefined) || (target == key) || (this.requestSave)) {
			Mojo.Log.info("Adding config for saving: " + key);

			eval("parameters." + key + " = config");
		}
	}
	
	if(this.requestSave)	
		this.requestSave.cancel();

	this.requestSave = this.service.request('palm://com.palm.systemservice/', {
		'method': 'setPreferences', 'parameters': parameters,
		onSuccess: function() {Mojo.Log.info("Config saved succesfully");}, 
		onFailure: function() {Mojo.Log.error("Saving of config failed");},
		onComplete: function() {this.requestSave = null;}.bind(this) });
}

//

ConfigManager.prototype.handleConfigData = function(params, callback, payload) {
	// Handle all requested system preferences.

	for(var key in params) {
		eval("var config = payload." + key);
		
		if((config != undefined) && (config != "none")) {
			Mojo.Log.info("Config loaded succesfully: " + key);

			eval("params." + key + " = config");
		}
		else
			Mojo.Log.error("Config loading failed: " + key);
	}

	callback();
}

