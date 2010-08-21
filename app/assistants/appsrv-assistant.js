function AppsrvAssistant() {
	this.appController = Mojo.Controller.getAppController();
	this.appAssistant = this.appController.assistant;

	this.config = this.appAssistant.config;
}

AppsrvAssistant.prototype.setup = function() {
	this.updateNameState("update");

/*	this.controller.get('start').addEventListener(Mojo.Event.tap, 
		this.toggleModeState.bindAsEventListener(this, "start"));

	this.controller.get('close').addEventListener(Mojo.Event.tap, 
		this.toggleModeState.bindAsEventListener(this, "close"));
*/
	this.controller.get('lock').addEventListener(Mojo.Event.tap, 
		this.toggleModeLock.bindAsEventListener(this));
}

//

AppsrvAssistant.prototype.updateNameState = function(event) {
	if(event == "enable") {
		this.controller.get("mode-name").innerHTML = "Mode Switcher is";
	
		this.controller.get("mode-state").innerHTML = "Activating...";

		this.controller.get('lock').removeClassName("unlock");
		this.controller.get('lock').addClassName("lock");
	}
	else if(event == "disable") {
		this.controller.get("mode-name").innerHTML = "Mode Switcher is";
	
		this.controller.get("mode-state").innerHTML = "Deactivating...";

		this.controller.get('lock').removeClassName("unlock");
		this.controller.get('lock').addClassName("lock");
	}
	else {
		if(this.config.modeSwitcher.activated == 0) {
			this.controller.get("mode-name").innerHTML = "Mode Switcher is";
		
			this.controller.get("mode-state").innerHTML = "Not Activated";

			this.controller.get('lock').removeClassName("unlock");
			this.controller.get('lock').addClassName("lock");
		}
		else {
			this.controller.get("mode-name").innerHTML = this.config.currentMode.name;

			if(this.config.modifierModes.length == 0) {
				if(this.config.currentMode.type == "default")		
					this.controller.get("mode-state").innerHTML = "Default settings";
				else
					this.controller.get("mode-state").innerHTML = "Normal settings";
			}
			else
				this.controller.get("mode-state").innerHTML = "Modified settings";
	
			if(this.config.modeSwitcher.modeLocked == "yes") {
				this.controller.get('lock').removeClassName("lock");
				this.controller.get('lock').addClassName("unlock");
			}
		}
	}
}

//

AppsrvAssistant.prototype.toggleModeState = function(action, event) {
}

AppsrvAssistant.prototype.toggleModeLock = function(event) {
	if(this.config.modeSwitcher.activated == 0)
		return;
	
	if(this.config.modeSwitcher.modeLocked == "no") {
		this.appAssistant.lockModeSwitcher();
		this.controller.get('lock').removeClassName("lock");
		this.controller.get('lock').addClassName("unlock");
	}
	else {
		this.appAssistant.unlockModeSwitcher();
		this.controller.get('lock').removeClassName("unlock");
		this.controller.get('lock').addClassName("lock");
	}
}
	
//

AppsrvAssistant.prototype.activate = function(event) {
}

AppsrvAssistant.prototype.deactivate = function(event) {
}

AppsrvAssistant.prototype.cleanup = function() {
}

