/*
 *    ConfigAssistant - Mode Launcher's Default Configuration Scene
 */

function ConfigAssistant(action, modeidx) {
	/* This is the creator function for your scene assistant object. It will be passed all the 
	 * additional parameters (after the scene name) that were passed to pushScene. The reference
	 * to the scene controller (this.controller) has not be established yet, so any initialization
	 * that needs the scene controller should be done in the setup function below. 
	 */

	this.action = action;
	this.modeidx = modeidx;

	this.appControl = Mojo.Controller.getAppController();
	this.appAssistant = this.appControl.assistant;

	this.config = this.appAssistant.config;

	this.applications = this.appAssistant.applications;

	this.settings = this.appAssistant.settings;
	
	this.activated = this.config.modeSwitcher.activated;
}    

ConfigAssistant.prototype.setup = function() {
	/* This function is for setup tasks that have to happen when the scene is first created
	 * Use Mojo.View.render to render view templates and add them to the scene, if needed.
    * Setup widgets and add event handlers to listen to events from widgets here. 
    */

	if(document.body) {	
		var script = document.createElement("script");

		script.type = "text/javascript";
		script.src = "http://maps.google.com/maps/api/js?sensor=true";
		
		document.body.appendChild(script);
	}

	// Application menu
	
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true},
		{visible: true, items: [ 
			{label: $L("Report Problem"), command: 'debug'},
			{label: $L("Import Mode"), command: 'import'},
			{label: $L("Donate"), command: 'donate'},
			{label: $L("Help"), command: 'help'}]});
	
	// Activated toggle button

	this.modelActivatedButton = { value: this.config.modeSwitcher.activated, disabled: false };

	this.controller.setupWidget('ActivatedButton', 
		{falseValue: 0, falseLabel: "Off", trueValue: 1, trueLabel: "On"},
      this.modelActivatedButton);

	Mojo.Event.listen(this.controller.get('ActivatedButton'), 
		Mojo.Event.propertyChange, this.setConfigData.bind(this));

	// Auto start & close timer selectors
	
	this.choicesStartSelector = [
		{label: "5 " + $L("Seconds"), value: 5},
		{label: "10 " + $L("Seconds"), value: 10},
		{label: "15 " + $L("Seconds"), value: 15},
		{label: "20 " + $L("Seconds"), value: 20},
		{label: "25 " + $L("Seconds"), value: 25},
		{label: "30 " + $L("Seconds"), value: 30}];

	this.modelStartSelector = {value: this.config.modeSwitcher.timerStart, disabled: false};
	   
	this.controller.setupWidget("StartSelector", {
		label: $L("Start Timer"),
		labelPlacement: "left", 							
		choices: this.choicesStartSelector},
		this.modelStartSelector);

	this.choicesCloseSelector = [
		{label: "5 " + $L("Seconds"), value: 5},
		{label: "10 " + $L("Seconds"), value: 10},
		{label: "15 " + $L("Seconds"), value: 15},
		{label: "20 " + $L("Seconds"), value: 20},
		{label: "25 " + $L("Seconds"), value: 25},
		{label: "30 " + $L("Seconds"), value: 30}];
		
	this.modelCloseSelector = {value: this.config.modeSwitcher.timerClose, disabled: false};
	   
	this.controller.setupWidget("CloseSelector", {
		label: $L("Close Timer"),
		labelPlacement: "left", 							
		choices: this.choicesCloseSelector},
		this.modelCloseSelector);
		
	Mojo.Event.listen(this.controller.get('StartSelector'), 
		Mojo.Event.propertyChange, this.setConfigData.bind(this));

	Mojo.Event.listen(this.controller.get('CloseSelector'), 
		Mojo.Event.propertyChange, this.setConfigData.bind(this));

	// Modes List
	
	this.modelModesList = {items: this.config.modesConfig};
	
	this.controller.setupWidget("ModesList", {
		itemTemplate: 'config/listitem-modes',
		swipeToDelete: true,
		autoconfirmDelete: false,
		reorderable: true},
		this.modelModesList);
	
	this.handleModesListTap = this.handleModesListTap.bindAsEventListener(this);

	Mojo.Event.listen(this.controller.get('ModesList'), Mojo.Event.listTap, 
		this.handleModesListTap);
					
	Mojo.Event.listen(this.controller.get('ModesList'), Mojo.Event.listReorder, 
		this.handleModesListReorder.bind(this));

	Mojo.Event.listen(this.controller.get('ModesList'), Mojo.Event.listDelete, 
		this.handleRemoveModeFromList.bind(this));

	// Add custom mode button

	this.modelAddModeButton = {buttonClass: '', disabled: false};

	this.controller.setupWidget('AddModeButton', 
		{label: $L("Add Custom Mode")}, this.modelAddModeButton);
	
	Mojo.Event.listen(this.controller.get('AddModeButton'), Mojo.Event.tap, 
		this.handleAddModeButtonPress.bind(this));

	// Edit default mode button

	this.modelDefModeButton = {buttonClass: '', disabled: false};

	this.controller.setupWidget('DefModeButton', 
		{label: $L("Edit Default Mode")}, this.modelDefModeButton);
	
	Mojo.Event.listen(this.controller.get('DefModeButton'), Mojo.Event.tap, 
		this.handleDefModeButtonPress.bind(this));
	
//
// Check for need of initial default mode setup
//

	if(this.config.defaultMode == null) {
		Mojo.Log.error("DEBUG: Mode Switcher Rerieving Settings");

		this.mode = {
			'name': "Default Mode", 'type': "default", 

			'miscOnStartup': 0, 'miscAppsMode': 1,						

			'settings': {'notify': 2, 'charging': 1}, 'settingsList': [],
			
			'apps': {'start':0, 'close': 0}, 'appsList': []
		};

		this.modelDefModeButton.disabled = true;
		this.controller.modelChanged(this.modelDefModeButton, this);		

		this.controller.showAlertDialog({
			title: $L("Initial setup of Mode Switcher!"),
			message: "<div align='justify'>" + $L("<i>Mode Switcher</i> needs to retrieve your current system settings for <i>Default Mode</i>. This operation should only take few seconds to finish. You can modify the <i>Default Mode</i> afterwards by clicking the <i>Edit Default Mode</i> button.") + "</div>",
			choices:[{label:$L("Continue"), value:"ok", type:'default'}],
			preventCancel: true,
			allowHTMLMessage: true,
			onChoose: function(appControl, appAssistant, value) {
				Mojo.Log.info("Retrieving default settings from system");
			
				appControl.showBanner($L("Retrieving current system settings"), {});

				this.retrieveDefaultSettings(0);
			}.bind(this, this.appControl, this.appAssistant)}); 
	}
	else if(this.action == "edit") {
		var type = this.config.modesConfig[this.modeidx].type;
	
		this.controller.stageController.pushScene("editmode", type, this.modeidx);
	}
}

//

ConfigAssistant.prototype.retrieveDefaultSettings = function(index, settings) {
	// Store settings from last round if returned by the extension.

	if((index > 0) && (settings != undefined)) {
		settings.extension = this.settings[index - 1].id;
		
		this.mode.settingsList.push(settings);
	}

	if(index < this.settings.length) {
		Mojo.Log.info($L("Retrieving") + " " + this.settings[index].id + " " + $L("settings"));

		var callback = this.retrieveDefaultSettings.bind(this, index + 1);

		this.settings[index].setting.get(callback);
	}
	else {
		Mojo.Log.info("Retrieving of default settings done");

		this.appControl.showBanner($L("Retrieving system settings finished"), {});

		this.modelDefModeButton.disabled = false;

		this.controller.modelChanged(this.modelDefModeButton, this);		

		this.appAssistant.config.currentMode = this.mode;
		this.appAssistant.config.defaultMode = this.mode;
		
		this.appAssistant.saveConfigData();
	}
}

//

ConfigAssistant.prototype.getConfigData = function() {
	this.config = this.appAssistant.config;

	this.modelActivatedButton.value = this.config.modeSwitcher.activated;
	this.modelStartSelector.value = this.config.modeSwitcher.timerStart;
	this.modelCloseSelector.value = this.config.modeSwitcher.timerClose;

	this.modelModesList.items = this.config.modesConfig;

	this.controller.modelChanged(this.modelActivatedButton, this);
	this.controller.modelChanged(this.modelStartSelector, this);
	this.controller.modelChanged(this.modelCloseSelector, this);

	this.controller.modelChanged(this.modelModesList, this);
}

ConfigAssistant.prototype.setConfigData = function() {
	this.appAssistant.config.modeSwitcher.activated = this.modelActivatedButton.value;
	this.appAssistant.config.modeSwitcher.timerStart = this.modelStartSelector.value;
	this.appAssistant.config.modeSwitcher.timerClose = this.modelCloseSelector.value;

	this.appAssistant.saveConfigData("modeSwitcher");
}

//

ConfigAssistant.prototype.handleModesListTap = function(event) {
	var index = event.model.items.indexOf(event.item);

	var type = this.config.modesConfig[index].type;

	if (index >= 0) {
		this.controller.stageController.pushScene("editmode", type, index);
	}
}

ConfigAssistant.prototype.handleModesListReorder = function(event) {
	var tempMode = this.modelModesList.items[event.fromIndex];
	
	this.modelModesList.items.splice(event.fromIndex,1);
	this.modelModesList.items.splice(event.toIndex,0,tempMode);

	this.appAssistant.modes = this.modelModesList.items;
	this.appAssistant.saveConfigData("modesConfig");
}

ConfigAssistant.prototype.handleRemoveModeFromList = function(event) {
	this.modelModesList.items.splice(event.index,1);

	this.appAssistant.modes = this.modelModesList.items;
	this.appAssistant.saveConfigData("modesConfig");
}

ConfigAssistant.prototype.handleAddModeButtonPress = function() {
	this.controller.stageController.pushScene("editmode", "normal");
}

ConfigAssistant.prototype.handleDefModeButtonPress = function() {
	this.controller.stageController.pushScene("editmode", "default", 0);
}

ConfigAssistant.prototype.handleCommand = function(event) {
	if(event.type == Mojo.Event.back) {
		this.controller.stageController.deactivate();		
	}
	else if(event.type == Mojo.Event.command) {
		if(event.command == "debug") {
			this.controller.serviceRequest("palm://com.palm.applicationManager", {
			  method: 'open', parameters: {id: "com.palm.app.email", params: {
	          summary: "Mode Switcher Problems",
	          text: "Give a detailed description of your problem. Your messages log and configuration is already attached for debugging purposes. If you don't want to include your messages log then please remove the attachment.<br><br>Configuration:<br><br>" + Object.toJSON(this.config),
	          attachments: [{fullPath: "/var/log/messages"}],
	          recipients: [{
	              type:"email",
	              role:1,
	              value:"scorpio.iix@gmail.com",
	              contactDisplay:"Mode Switcher Author"
	          }]}}}); 
		}
		else if(event.command == "donate") {
			window.open('https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=7A4RPR9ZX3TYS&lc=FI&item_name=Mode%20Switcher%20Application&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted');
		}
		else if(event.command == "import") {
			this.controller.stageController.pushScene("scene", "importGDoc", null, this.importMode.bind(this));
		}
		else if(event.command == "help") {
			this.controller.stageController.pushScene("scene", "showHelp");
		}
	}
}

ConfigAssistant.prototype.importMode = function(mode) {
	if((mode.name != undefined) && (mode.type != undefined) &&
		(mode.autoStartMode != undefined) && (mode.autoCloseMode != undefined) &&
		(mode.settings != undefined) && (mode.settings.notify != undefined) &&
		(mode.settings.charging != undefined) && (mode.apps != undefined) &&
		(mode.apps.start != undefined) && (mode.apps.close != undefined) &&
		(mode.triggers != undefined) && (mode.triggers.required != undefined) &&
		(mode.triggers.block != undefined) && (mode.settingsList != undefined) &&
		(mode.appsList != undefined) && (mode.triggersList != undefined))
	{
		if((mode.name.length == 0) || (mode.name == "Current Mode") || 
			(mode.name == "Default Mode") || 
			(mode.name == "Previous Mode") ||
			(mode.name == "All Modes") ||
			(mode.name == "All Normal Modes") ||
			(mode.name == "All Modifier Modes"))
		{
			Mojo.Log.error("Invalid mode name in import");
		}
		else {
			var modeName = mode.name;

			for(var i = 0; i < 100; i++) {
				if(i > 0)
					var modeName = mode.name + "-" + i;

				var exists = false;
	
				for(var j = 0 ; j < this.config.modesConfig.length ; j++) {
					if(this.config.modesConfig[j].name == modeName) {
						exists = true;
						break;
					}
				}

				if(exists)
					continue;
				else {
					mode.name = modeName;
		
					break;
				}
			}

			this.config.modesConfig.push(mode);

			this.getConfigData();	
		}
	}
	else
		Mojo.Log.error("Malformed mode data in import");
}

//

ConfigAssistant.prototype.activate = function(event) {
	/* Put in event handlers here that should only be in effect when this scene is active. 
	 *	For  example, key handlers that are observing the document. 
	 */

	this.getConfigData();
}
	
ConfigAssistant.prototype.deactivate = function(event) {
	/* Remove any event handlers you added in activate and do any other cleanup that should 
	 * happen before this scene is popped or another scene is pushed on top. 
	 */
}

ConfigAssistant.prototype.cleanup = function(event) {
	/* This function should do any cleanup needed before the scene is destroyed as a result
	 * of being popped off the scene stack.
	 */ 

	if((this.activated == 0) && (this.config.modeSwitcher.activated == 1)) {
		this.controller.serviceRequest("palm://com.palm.applicationManager", {
			method: 'launch', parameters: {"id": Mojo.Controller.appInfo.id, "params": {
				"action": "control", "event": "enable"}} });
	}
	else if((this.activated == 1) && (this.config.modeSwitcher.activated == 1)) {
		this.controller.serviceRequest("palm://com.palm.applicationManager", {
			method: 'launch',	parameters: {"id": Mojo.Controller.appInfo.id, "params": {
				"action": "control", "event": "reload"}} });
	}
	else if((this.activated == 1) && (this.config.modeSwitcher.activated == 0)) {
		this.controller.serviceRequest("palm://com.palm.applicationManager", {
			method: 'launch',	parameters: {"id": Mojo.Controller.appInfo.id, "params": {
				"action": "control", "event": "disable"}} });
	}
}

