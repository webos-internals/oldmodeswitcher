function NotifyControl(serviceRequestWrapper) {
	this.service = serviceRequestWrapper;

	this.forceNotify = false;

	this.notifyMode = "";
}

//

NotifyControl.prototype.setup = function() {	
}

NotifyControl.prototype.cleanup = function() {	
}

//

NotifyControl.prototype.mode = function(mode) {	
	if((mode == "") || (this.notifyMode == ""))
		this.notifyMode = mode;
}

//

NotifyControl.prototype.notify = function(phase, oldMode, newMode) {	
	var appCtl = Mojo.Controller.getAppController();
	
	if(this.notifyMode == "startup") {
		if(phase == "init")
			appCtl.showBanner("Starting mode: " + newMode, {action: 'none'});
		else if(phase == "done")
			appCtl.showBanner("Done starting: " + newMode, {action: 'none'});
	}
	else if(this.notifyMode == "shutdown")	{
		if(phase == "init")
			appCtl.showBanner("Closing mode: " + oldMode, {action: 'none'});
		else
			appCtl.showBanner("Done closing: " + oldMode, {action: 'none'});
	}
	else if(this.notifyMode != "") {
		if(oldMode == newMode) {
			if(phase == "init")
				appCtl.showBanner("Updating mode: " + newMode, {action: 'none'});
			else if(phase == "done")
				appCtl.showBanner("Done updating: " + newMode, {action: 'none'});
		}
		else {
			if(phase == "init")
				appCtl.showBanner("Switching mode to: " + newMode, {action: 'none'});
			else if(phase == "done")
				appCtl.showBanner("Done switching to: " + newMode, {action: 'none'});
		}
	}

	if(phase == "done") {
		this.notifyMode = "";
	}
}

