function NotifyControl(serviceRequestWrapper) {
	this.service = serviceRequestWrapper;

	this.forceNotify = false;

	this.stateOverride = "";
}

//

NotifyControl.prototype.setup = function() {	
}

NotifyControl.prototype.cleanup = function() {	
}

//

NotifyControl.prototype.override = function(state) {	
	this.forceNotify = true;
	
	this.stateOverride = state;
}

//

NotifyControl.prototype.notify = function(phase, oldCurrentMode, newCurrentMode) {	
	var appCtl = Mojo.Controller.getAppController();
	
	if(this.stateOverride == "startup") {
		if(phase == "init")
			appCtl.showBanner("Starting mode: " + newCurrentMode.name, {action: 'none'});
		else if(phase == "done")
			appCtl.showBanner("Done starting: " + newCurrentMode.name, {action: 'none'});
	}
	else if(this.stateOverride == "shutdown")	{
		if(phase == "init")
			appCtl.showBanner("Closing mode: " + oldCurrentMode.name, {action: 'none'});
		else
			appCtl.showBanner("Done closing: " + oldCurrentMode.name, {action: 'none'});
	}
	else {
		if((newCurrentMode.settings.notify == 2) || (this.forceNotify)) {
			if(oldCurrentMode.name == newCurrentMode.name) {
				if(phase == "init")
					appCtl.showBanner("Updating mode: " + newCurrentMode.name, {action: 'none'});
				else if(phase == "done")
					appCtl.showBanner("Done updating: " + newCurrentMode.name, {action: 'none'});
			}
			else {
				if(phase == "init")
					appCtl.showBanner("Switching mode to: " + newCurrentMode.name, {action: 'none'});
				else if(phase == "done")
					appCtl.showBanner("Done switching to: " + newCurrentMode.name, {action: 'none'});
			}
		}
	}

	if(phase == "done") {
		this.forceNotify = false;
		this.stateOverride = "";
	}
}

