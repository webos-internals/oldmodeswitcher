function SystemNotifier(serviceRequestWrapper) {
	this.service = serviceRequestWrapper;

	this.forceNotify = false;
}

//

SystemNotifier.prototype.force = function() {	
	this.forceNotify = true;
}

//

SystemNotifier.prototype.notify = function(phase, oldmode, newmode) {	
	var appCtl = Mojo.Controller.getAppController();

	if(newmode != null) {
		if((newmode.notifyMode == 1) || (this.forceNotify)) {
			if(oldmode != null) {
				if(oldmode.name == newmode.name) {
					if(phase != "done")
						appCtl.showBanner("Reloading mode: " + newmode.name, {action: 'none'});
					else
						appCtl.showBanner("Done reloading: " + newmode.name, {action: 'none'});
				}
				else {
					if(phase != "done")
						appCtl.showBanner("Switching mode to: " + newmode.name, {action: 'none'});
					else
						appCtl.showBanner("Done switching to: " + newmode.name, {action: 'none'});
				}
			}
			else {
				if(phase == "start")	
					appCtl.showBanner("Starting mode: " + newmode.name, {action: 'none'});
				else
					appCtl.showBanner("Done starting: " + newmode.name, {action: 'none'});
			}
		}
	}
	else if(oldmode != null) {
		if((oldmode.notifyMode == 1) || (this.forceNotify)) {
			if(phase == "close")
				appCtl.showBanner("Closing mode: " + oldmode.name, {action: 'none'});
			else
				appCtl.showBanner("Done closing: " + oldmode.name, {action: 'none'});
		}
	}

	this.forceNotify = false;
}

