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
	Mojo.Log.error("Mode notification set: " + mode + " " + this.notifyMode);

	if((mode == "") || (this.notifyMode == ""))
		this.notifyMode = mode;
}

//

NotifyControl.prototype.notify = function(phase, oldMode, newMode) {	
	var appCtl = Mojo.Controller.getAppController();

	Mojo.Log.error("Mode notification with mode: " + this.notifyMode);

	if(this.notifyMode == "unknown") {
		if(oldMode == newMode)
			appCtl.showBanner($L("Unknown modifier mode launched"), {action: 'none'});
		else
			appCtl.showBanner($L("Unknown mode") + ": " + newMode, {action: 'none'});
	}
	else if(this.notifyMode == "startup") {
		if(phase == "init")
			appCtl.showBanner($L("Starting mode") + ": " + newMode, {action: 'none'});
		else if(phase == "done")
			appCtl.showBanner($L("Done starting") + ": " + newMode, {action: 'none'});
	}
	else if(this.notifyMode == "shutdown")	{
		if(phase == "init")
			appCtl.showBanner($L("Closing mode") + ": " + oldMode, {action: 'none'});
		else
			appCtl.showBanner($L("Done closing") + ": " + oldMode, {action: 'none'});
	}
	else if(this.notifyMode != "") {
		if(oldMode == newMode) {
			if(phase == "init")
				appCtl.showBanner($L("Updating mode") + ": " + newMode, {action: 'none'});
			else if(phase == "done")
				appCtl.showBanner($L("Done updating") + ": " + newMode, {action: 'none'});
		}
		else {
			if(phase == "init")
				appCtl.showBanner($L("Switching mode to") + ": " + newMode, {action: 'none'});
			else if(phase == "done")
				appCtl.showBanner($L("Done switching to") + ": " + newMode, {action: 'none'});
		}
	}

	if(phase == "done") {
		this.notifyMode = "";
	}
}

