function ConfigManager(serviceRequestWrapper) {
	this.service = serviceRequestWrapper;
}

//

ConfigManager.prototype.load = function(params, callback) {	
	// Load all requested system preferences.

	Mojo.Log.error("Loading config from system preferences");

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
	
	Mojo.Log.error("Saving config to system preferences");

	var parameters = {};

	for(var key in params) {
		var config = params[key];
		
		if(config == null)
			config = "none";

		if((target == undefined) || (target == key) || (this.requestSave)) {
			Mojo.Log.error("Adding config for saving: " + key);

			eval("parameters." + key + " = config");
		}
	}
	
	if(this.requestSave)	
		this.requestSave.cancel();

	this.requestSave = this.service.request('palm://com.palm.systemservice/', {
		'method': 'setPreferences', 'parameters': parameters,
		onSuccess: function() {Mojo.Log.error("Saving of requested config succesful");}, 
		onFailure: function() {Mojo.Log.error("Saving of requested config failed");},
		onComplete: function() {this.requestSave = null;}.bind(this) });
}

//

ConfigManager.prototype.handleConfigData = function(params, callback, payload) {
	// Handle all requested system preferences.

	for(var key in params) {
		eval("var config = payload." + key);

		if((config != undefined) && (config != "none")) {
			Mojo.Log.error("Config loaded succesfully: " + key);

			eval("params." + key + " = config");
		}
		else
			Mojo.Log.error("Config loading failed: " + key);
	}

	callback();
}

