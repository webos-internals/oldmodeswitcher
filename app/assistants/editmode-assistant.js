/*
 *    EditmodeAssistant - Mode Launcher's Mode Edition Scene
*/

function EditmodeAssistant(type, modeidx) {
	/* This is the creator function for your scene assistant object. It will be passed all the 
	 * additional parameters (after the scene name) that were passed to pushScene. The reference
	 * to the scene controller (this.controller) has not be established yet, so any initialization
	 * that needs the scene controller should be done in the setup function below. 
	 */

	this.appControl = Mojo.Controller.getAppController();
	this.appAssistant = this.appControl.assistant;

	this.config = this.appAssistant.config;

	this.applications = this.appAssistant.applications;

	this.settings = this.appAssistant.settings;

	this.triggers = this.appAssistant.triggers;

	this.loaded = {'settings': [], 'apps': [], 'triggers': []};

	this.unloaded = {'settings': [], 'apps': [], 'triggers': []};

	this.retrieving = false;

	this.groupidx = 0;
	
	this.type = type;
	
	this.modeidx = modeidx;
	
	this.mode = this.getModeData();
}    

EditmodeAssistant.prototype.setup = function() {
	/* This function is for setup tasks that have to happen when the scene is first created
	 * Use Mojo.View.render to render view templates and add them to the scene, if needed.
    * Setup widgets and add event handlers to listen to events from widgets here. 
    */

//
// Application menu
//
	
	if(this.type == "default") {
		this.controller.setupWidget(Mojo.Menu.appMenu, 
			{'omitDefaultItems': true}, {'visible': true, 'items': [ 
			{'label': $L("Get System Settings"), 'command': "settings-all"}]} );
	}
	else {
		this.controller.setupWidget(Mojo.Menu.appMenu, 
			{'omitDefaultItems': true}, {'visible': true, 'items': [ 
			{'label': $L("Add to Launcher"), 'command': "launchpoint"},
			{'label': $L("Export Mode"), 'command': "export"}]} );
	}
	
//
// View Menu
//

	this.currentView = "Configuration";

	this.configurationView = this.controller.get("ConfigurationView");
	
	this.configurationView.style.display = 'block';
		
	if(this.type == "default")
		this.itemsViewMenu = [{'label': $L("Default Mode Settings"), 'command': "configuration", 'width': 320}];
	else
		this.itemsViewMenu = [{'label': $L("Mode Configuration"), 'command': "configuration", 'width': 320}];

	this.modelViewMenu = {'visible': true, 'items': this.itemsViewMenu};

	this.controller.setupWidget(Mojo.Menu.viewMenu, undefined, this.modelViewMenu);

//
// Command menu
//

	this.settingsView = this.controller.get("ModeSettingsView");
	this.appsView = this.controller.get("ModeAppsView");
	this.triggersView = this.controller.get("ModeTriggersView");

	this.customCfg = this.controller.get("ConfigurationCustom");
	this.defaultCfg = this.controller.get("ConfigurationDefault");

	if(this.type == "default") {
		this.defaultCfg.style.display = 'block';

		this.itemsCommandMenu = [
			{'width': 35},
			{'label': $L("Settings"), 'command': "settings", 'width': 110},
			{'width': 30},
			{'label': $L("Apps"), 'command': "applications", 'width': 110},
			{'width': 35} ];
	}
	else {
		this.customCfg.style.display = 'block';
	
		this.itemsCommandMenu = [
			{'width': 5},
			{'label': $L("Settings"), 'command': "settings", 'width': 100},
			{'label': $L("Apps"), 'command': "applications", 'width': 80},
			{'label': $L("Triggers"), 'command': "triggers", 'width': 100},
			{'width': 5} ];
	}

	this.modelCommandMenu = {'visible': true, 'items': this.itemsCommandMenu};
		
	this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.modelCommandMenu);
	
//
// MODE CONFIGURATION
//

	// Mode name text field
	
	if(this.type == "default")
		this.modelNameText = {'value': $L(this.mode.name), 'disabled': true};
	else
		this.modelNameText = {'value': this.mode.name, 'disabled': false};
		   
	this.controller.setupWidget("NameText", { 'hintText': $L("Unique Mode Name"), 
		'multiline': false, 'enterSubmits': false, 'focus': true},
		this.modelNameText);

	Mojo.Event.listen(this.controller.get("NameText"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	// Mode type selector

	if(this.mode.type == "default")
		this.modelTypeSelector = {'value': this.mode.type, 'disabled': true};
	else
		this.modelTypeSelector = {'value': this.mode.type, 'disabled': false};
		
	if(this.mode.type == "default") {
		this.choicesTypeSelector = [
			{'label': $L("Default"), 'value': "default"}];  
	}
	else {
		this.choicesTypeSelector = [
			{'label': $L("Normal"), 'value': "normal"},
			{'label': $L("Modifier"), 'value': "modifier"}];  
	}

	this.controller.setupWidget("ModeTypeSelector", {'label': $L("Mode Type"), 
		'labelPlacement': "left", 'choices': this.choicesTypeSelector}, 
		this.modelTypeSelector);

	Mojo.Event.listen(this.controller.get("ModeTypeSelector"), Mojo.Event.propertyChange, 
		this.setModeType.bind(this));

	// Auto start and close selectors

	this.modelStartSelector = {'value': this.mode.autoStartMode, 'disabled': false};

	if(this.mode.type == "normal") {
		this.choicesStartSelector = [
			{'label': $L("Only Manually"), 'value': 0},
			{'label': $L("By Selection"), 'value': 1},
			{'label': $L("After Timer"), 'value': 2},
			{'label': $L("Immediate"), 'value': 3}];  
	}
	else {
		this.choicesStartSelector = [
			{'label': $L("Only Manually"), 'value': 0},
			{'label': $L("Immediate"), 'value': 3}];  
	}
				
	this.controller.setupWidget("StartSelector",	{'label': $L("Auto Start"),
		'labelPlacement': "left", 'choices': this.choicesStartSelector},
		this.modelStartSelector);
	
	Mojo.Event.listen(this.controller.get("StartSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));
		
	this.modelCloseSelector = {'value': this.mode.autoCloseMode, 'disabled': false};

	if(this.mode.type == "normal") {
		this.choicesCloseSelector = [
			{'label': $L("Only Manually"), 'value': 0},
			{'label': $L("By Selection"), 'value': 1},
			{'label': $L("After Timer"), 'value': 2},
			{'label': $L("Immediate"), 'value': 3}];  
	}
	else {
		this.choicesCloseSelector = [
			{'label': "Only Manually", 'value': 0},
			{'label': "Immediate", 'value': 3}];  
	}

	this.controller.setupWidget("CloseSelector",	{'label': $L("Auto Close"), 
		'labelPlacement': "left", 'choices': this.choicesCloseSelector},
		this.modelCloseSelector);
	
	Mojo.Event.listen(this.controller.get("CloseSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	// Mode startup selector

	this.modelStartupSelector = {'value': this.mode.miscOnStartup, 'disabled': false};

	this.choicesStartupSelector = [
		{'label': $L("Active Mode"), 'value': 0},
		{'label': $L("Default Mode"), 'value': 1}];  
	
	this.controller.setupWidget("StartupSelector", {'label': $L("On Startup"), 
		'labelPlacement': "left", 'choices': this.choicesStartupSelector}, 
		this.modelStartupSelector);

	Mojo.Event.listen(this.controller.get("StartupSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));
	
	// Apps startup selector
	
	this.modelAppsSelector = {'value': this.mode.miscAppsMode, 'disabled': false};

	this.choicesAppsSelector = [
		{'label': $L("Everytime"), 'value': 0},
		{'label': $L("On Startup"), 'value': 1} ];  

	this.controller.setupWidget("AppsSelector", {'label': $L("Applications"), 
		'labelPlacement': "left", 'choices': this.choicesAppsSelector},
		this.modelAppsSelector);	

	Mojo.Event.listen(this.controller.get("AppsSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));
			
//
// SETTINGS
//

	// Mode notify selector

	this.modelNotifySelector = {'value': this.mode.settings.notify, 'disabled': false};

	if(this.mode.type == "normal") {
		this.choicesNotifySelector = [
			{'label': $L("Default"), 'value': 0},
			{'label': $L("Disabled"), 'value': 1},
			{'label': $L("Use Banner"), 'value': 2}/*,
			{'label': "System Alert", 'value': 3},
			{'label': "Short Vibrate", 'value': 4}*/];  
	}
	else {
		this.choicesNotifySelector = [
			{'label': $L("Do Not Set"), 'value': 0},
			{'label': $L("Disabled"), 'value': 1},
			{'label': $L("Use Banner"), 'value': 2}/*,
			{'label': "System Alert", 'value': 3},
			{'label': "Short Vibrate", 'value': 4}*/];  
	}
		
	this.controller.setupWidget("NotifySelector", {'label': $L("Notify"), 
		'labelPlacement': "left", 'choices': this.choicesNotifySelector}, 
		this.modelNotifySelector);

	Mojo.Event.listen(this.controller.get("NotifySelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));
		
	// On charger selector

	this.modelChargingSelector = {'value': this.mode.settings.charging, 'disabled': false};

	if(this.mode.type == "normal") {
		this.choicesChargingSelector = [
			{'label': $L("Default"), 'value': 0},
			{'label': $L("Lock Screen"), 'value': 1},
			{'label': $L("Always On"), 'value': 2},
			{'label': $L("Turn Off"), 'value': 3}];  
	}
	else {
		this.choicesChargingSelector = [
			{'label': $L("Do Not Set"), 'value': 0},
			{'label': $L("Lock Screen"), 'value': 1},
			{'label': $L("Always On"), 'value': 2},
			{'label': $L("Turn Off"), 'value': 3}];  
	}
		
	this.controller.setupWidget("ChargingSelector",	{'label': $L("On Charger"), 
		'labelPlacement': "left", 'choices': this.choicesChargingSelector}, 
		this.modelChargingSelector);

	Mojo.Event.listen(this.controller.get("ChargingSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	// Settings list

	this.modelSettingsList = {'items': this.mode.settingsList};
	
	this.controller.setupWidget("SettingsList", {
		'itemTemplate': 'editmode/listitem-lists',
		'swipeToDelete': true, 'reorderable': false,
		'autoconfirmDelete': true},
		this.modelSettingsList);

	// Settings extensions lists

	for(var i = 0; i < this.settings.length; i++) {
		var id = this.settings[i].id;
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

		this.controller.setupWidget(element, {
			'itemTemplate': '../extensions/settings/' + id + '-listitem',
			'swipeToDelete': false, 'reorderable': false, 'itemsProperty': id});
	}

	for(var i = 0; i < this.loaded.settings.length; i++) {
		var id = this.loaded.settings[i].extension;
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

		var setting = {'list': "<div name='" + element + "' x-mojo-element='List'></div>"};
		
		setting[id] = [this.loaded.settings[i]];

		setting['extension'] = this.loaded.settings[i].extension;

		this.mode.settingsList.push(setting);
	}

	Mojo.Event.listen(this.controller.get("SettingsList"), Mojo.Event.listDelete, 
		this.handleListDelete.bind(this, "settings"));

	Mojo.Event.listen(this.controller.get("SettingsList"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, true));

//
// SETTINGS LIST ITEMS
//

	if(this.mode.type == "normal")
		this.controller.defaultChoiseLabel = $L("Default");
	else
		this.controller.defaultChoiseLabel = $L("Do Not Set");

	for(var i = 0; i < this.settings.length; i++)
		this.settings[i].config.setup(this.controller);
	
//
// APPLICATIONS
//

	// Application start selector
	
	this.choicesAppsStartSelector = [
		{'label': $L("Do Nothing"), 'value': 0},
		{'label': $L("Close All Apps"), 'value': 2}];  
		
	this.modelAppsStartSelector = {'value': this.mode.apps.start, 'disabled': false};
		
	this.controller.setupWidget("AppsStartSelector", {'label': $L("On Start"), 
		'labelPlacement': "left", 'choices': this.choicesAppsStartSelector},
		this.modelAppsStartSelector);

	Mojo.Event.listen(this.controller.get("AppsStartSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	// Application close selector

	this.choicesAppsCloseSelector = [
		{'label': $L("Do Nothing"), 'value': 0},
		{'label': $L("Close Started"), 'value': 1},
		{'label': $L("Close All Apps"), 'value': 2}];  
		
	this.modelAppsCloseSelector = {'value': this.mode.apps.close, 'disabled': false};
		
	this.controller.setupWidget("AppsCloseSelector", {'label': $L("On Close"), 
		'labelPlacement': "left", 'choices': this.choicesAppsCloseSelector},
		this.modelAppsCloseSelector);

	Mojo.Event.listen(this.controller.get("AppsCloseSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	// Applications list

	this.modelAppsList = {'items': this.mode.appsList};
	
	this.controller.setupWidget("AppsList", {
		'itemTemplate': 'editmode/listitem-lists',
		'swipeToDelete': true, 'reorderable': true,
		'autoconfirmDelete': true},
		this.modelAppsList);

	// Applications extensions lists

	for(var i=0; i < this.applications.length; i++) {
		var id = this.applications[i].id;
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";
		
		this.controller.setupWidget(element, {
			'itemTemplate': '../extensions/applications/' + id + '-listitem',
			'swipeToDelete': false, 'reorderable': false, 'itemsProperty': id});
	}

	for(var i = 0; i < this.loaded.apps.length; i++) {
		var id = this.loaded.apps[i].extension;
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";
		
		var app = {'list': "<div name='" + element + "' x-mojo-element='List'></div>"};
		
		app[id] = [this.loaded.apps[i]]; 

		this.mode.appsList.push(app);
	}

	Mojo.Event.listen(this.controller.get("AppsList"), Mojo.Event.listDelete, 
		this.handleListDelete.bind(this, "apps"));

	Mojo.Event.listen(this.controller.get("AppsList"), Mojo.Event.listReorder, 
		this.handleListReorder.bind(this, "apps"));

	Mojo.Event.listen(this.controller.get("AppsList"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, true));

//
// APPS LIST ITEM
//

	for(var i = 0; i < this.applications.length; i++)
		this.applications[i].config.setup(this.controller);

//
// TRIGGERS
//

	// Trigger selector

	if(this.type == "default") {
		this.modelRequiredSelector = {'disabled': true};

		this.controller.setupWidget("RequiredSelector",	{'label': $L("Required"), 
			'labelPlacement': "left", 'choices': []}, this.modelRequiredSelector);	

		this.modelBlockSelector = {'disabled': true};

		this.controller.setupWidget("BlockSelector",	{'label': $L("Block"), 
			'labelPlacement': "left", 'choices': []}, this.modelBlockSelector);	

		this.modelTriggersList = {'items': []};
	
		this.controller.setupWidget("TriggersList", {},
			this.modelTriggersList);
	}
	else if(this.type != "default") {
		this.modelRequiredSelector = {'value': this.mode.triggers.required, 'disabled': false};

		this.choicesTriggerSelector = [
			{'label': $L("All Unique"), 'value': 0},
			{'label': $L("One Trigger"), 'value': 1},
			{'label': $L("Any Grouped"), 'value': 2} ];  

		this.controller.setupWidget("RequiredSelector",	{'label': $L("Required"), 
			'labelPlacement': "left", 'choices': this.choicesTriggerSelector},
			this.modelRequiredSelector);	
	
		Mojo.Event.listen(this.controller.get("RequiredSelector"), Mojo.Event.propertyChange, 
			this.setTriggersView.bind(this));

		// Block selector

		this.modelBlockSelector = {'value': this.mode.triggers.block, 'disabled': false};

		this.choicesBlockSelector = [
			{'label': $L("No Blocking"), 'value': 0},
			{'label': $L("Other Modes"), 'value': 1},
			{'label': $L("Normal Modes"), 'value': 2},
			{'label': $L("Modifier Modes"), 'value': 3}];  

		this.controller.setupWidget("BlockSelector",	{ 'label': $L("Block Mode"), 
			'labelPlacement': 'left', 'choices': this.choicesBlockSelector},
			this.modelBlockSelector);	
	
		Mojo.Event.listen(this.controller.get("BlockSelector"), Mojo.Event.propertyChange, 
			this.setModeData.bind(this, false));

		// Triggers list

		this.modelTriggersList = {'items': this.mode.triggersList};
	
		this.controller.setupWidget("TriggersList", {
			'itemTemplate': "editmode/listitem-lists",
			'swipeToDelete': true, 'reorderable': false,
			'autoconfirmDelete': true},
			this.modelTriggersList);

		// Triggers extensions lists

		for(var i=0; i < this.triggers.length; i++) {
			var id = this.triggers[i].id;
			var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

			this.controller.setupWidget(element, {
				'itemTemplate': "../extensions/triggers/" + id + "-listitem",
				'swipeToDelete': false, 'reorderable': false, 'itemsProperty': id});
		}

		for(var i = 0; i < this.loaded.triggers.length; i++) {
			if(this.loaded.triggers[i].group == this.groupidx) {
				var id = this.loaded.triggers[i].extension;
				var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

				var trigger = {'list': "<div name='" + element + "' x-mojo-element='List'></div>"};

				trigger[id] = [this.loaded.triggers[i]];
	
				trigger['extension'] = this.loaded.triggers[i].extension;
	
				this.mode.triggersList.push(trigger);
			}
		}		

		Mojo.Event.listen(this.controller.get("TriggersList"), Mojo.Event.listDelete, 
			this.handleListDelete.bind(this, "triggers"));

		Mojo.Event.listen(this.controller.get("TriggersList"), Mojo.Event.propertyChange, 
			this.handleListChange.bind(this, "triggers"));

	//
	// TRIGGERS LIST ITEM
	//

		for(var i = 0; i < this.triggers.length; i++)
			this.triggers[i].config.setup(this.controller);
	}
}

//

EditmodeAssistant.prototype.getModeData = function() {
	var cfgIndex = 0;

	if(this.type == "default") {
			var mode = {
			'name': "", 'type': "default", 
					
			'miscOnStartup': 0, 'miscAppsMode': 1,

			'settings': {'notify': 2, 'charging': 1}, 'settingsList': [],
		
			'apps': {'start':0, 'close': 0}, 'appsList': []
		};
	}
	else {
			var mode = {
			'name': "", 'type': "normal", 
		
			'autoStartMode': 1, 'autoCloseMode': 1,
		
			'settings': {'notify': 0, 'charging': 0}, 'settingsList': [],
		
			'apps': {'start':0, 'close': 1}, 'appsList': [],
		
			'triggers': {'required': 0, 'block': 0}, 'triggersList': []
		};		
	}
	
	if(this.type != "default") {
		if(this.modeidx == undefined)
			return mode;
	
		var config = this.config.modesConfig[this.modeidx];
	}
	else
		var config = this.config.defaultMode;

	// Actual loading of the configuration.

	mode.name =  config.name;
	mode.type =  config.type;
						
	if(this.type == "default") {
		mode.miscOnStartup = config.miscOnStartup;
		mode.miscAppsMode = config.miscAppsMode;
	}
	else {
		mode.autoStartMode = config.autoStartMode;
		mode.autoCloseMode = config.autoCloseMode;
	}
				
	mode.settings.notify = config.settings.notify;
	mode.settings.charging = config.settings.charging;

	for(var i = 0; i < config.settingsList.length; i++) {
		var cfgIndex = this.appAssistant.find("id", config.settingsList[i].extension, this.settings);

		if(cfgIndex != -1) {
			var data = this.settings[cfgIndex].config.load(config.settingsList[i]);
			
			data.extension = this.settings[cfgIndex].id;
			
			this.loaded.settings.push(data);
		}
		else
			this.unloaded.settings.push(config.settingsList[i]);
	}

	mode.apps.start = config.apps.start;
	mode.apps.close = config.apps.close;

	for(var i = 0; i < config.appsList.length; i++) {
		var cfgIndex = this.appAssistant.find("id", config.appsList[i].extension, this.applications);
		
		if(cfgIndex != -1) {
			var data = this.applications[cfgIndex].config.load(config.appsList[i]);
	
			data.extension = this.applications[cfgIndex].id;

			this.loaded.apps.push(data);
		}
		else
			this.unloaded.apps.push(config.appsList[i]);
	}

	if(this.type != "default") {
		mode.triggers.block = config.triggers.block;
		mode.triggers.required = config.triggers.required;
	
		for(var i = 0; i < config.triggersList.length; i++) {
			var cfgIndex = this.appAssistant.find("id", config.triggersList[i].extension, this.triggers);
		
			if(cfgIndex != -1) {
				var data = this.triggers[cfgIndex].config.load(config.triggersList[i]);
		
				data.extension = this.triggers[cfgIndex].id;
				
				if(config.triggersList[i].group == undefined)
					data.group = 0;
				else
					data.group = config.triggersList[i].group;
				
				this.loaded.triggers.push(data);
			}
			else
				this.unloaded.triggers.push(config.triggersList[i]);
		}
	}
	
	return mode;
}

EditmodeAssistant.prototype.setModeData = function(refresh) {
	var cfgIndex = 0;

	if(refresh) {
		// FIXME: hack so that the list position is not resetted.

		var tmp = this.controller.sceneScroller.mojo.getState();

		if(this.currentView == "Settings")
			this.controller.modelChanged(this.modelSettingsList, this);
		else if(this.currentView == "Applications")
			this.controller.modelChanged(this.modelAppsList, this);
		else if(this.currentView == "Triggers")
			this.controller.modelChanged(this.modelTriggersList, this);

		this.controller.sceneScroller.mojo.setState(tmp);
	}

	if(this.type == "default") {
		var config = this.config.defaultMode;

		var mode = {
			'name': "", 'type': "default", 
		
			'miscOnStartup': 0, 'miscAppsMode': 1,
		
			'settings': {'notify': 2, 'charging': 1}, 'settingsList': [],
		
			'apps': {'start':0, 'close': 0}, 'appsList': []
		};
	}
	else {
		var config = this.config.modesConfig[this.modeidx];

		var mode = {
			'name': "", 'type': "normal", 
		
			'autoStartMode': 1, 'autoCloseMode': 1,
		
			'settings': {'notify': 0, 'charging': 0}, 'settingsList': [],
		
			'apps': {'start':0, 'close': 1}, 'appsList': [],
		
			'triggers': {'required': 0, 'block': 0}, 'triggersList': []
		};
	}

	if(this.type != "default") {
		this.checkModeName();
	}

	mode.name = this.modelNameText.value;
	mode.type = this.modelTypeSelector.value;
	
	if(this.type == "default") {
		mode.miscOnStartup = this.modelStartupSelector.value;
		mode.miscAppsMode = this.modelAppsSelector.value;			
	}
	else {
		mode.autoStartMode = this.modelStartSelector.value;
		mode.autoCloseMode = this.modelCloseSelector.value;
	}
	
	mode.settings.notify = 	this.modelNotifySelector.value;
	mode.settings.charging = this.modelChargingSelector.value;
		
	for(var i = 0; i < this.loaded.settings.length; i++) {
		var cfgIndex = this.appAssistant.find("id", this.loaded.settings[i].extension, this.settings);
	
		if(cfgIndex != -1) {
			var data = this.settings[cfgIndex].config.save(this.loaded.settings[i]);
			
			data.extension = this.loaded.settings[i].extension;
			
			mode.settingsList.push(data);
		}
	}

	for(var i = 0; i < this.unloaded.settings.length; i++)
		mode.settingsList.push(this.unloaded.settings[i]);

	mode.apps.start = this.modelAppsStartSelector.value;
	mode.apps.close = this.modelAppsCloseSelector.value;								

	for(var i = 0; i < this.loaded.apps.length; i++) {
		var cfgIndex = this.appAssistant.find("id", this.loaded.apps[i].extension, this.applications);
	
		if(cfgIndex != -1) {
			var data = this.applications[cfgIndex].config.save(this.loaded.apps[i]);
	
			data.extension = this.loaded.apps[i].extension;

			mode.appsList.push(data);
		}
	}

	for(var i = 0; i < this.unloaded.apps.length; i++)
		mode.appsList.push(this.unloaded.apps[i]);
		
	if(this.type != "default") {
		mode.triggers.block = this.modelBlockSelector.value;
		mode.triggers.required = this.modelRequiredSelector.value;

		for(var i = 0; i < this.loaded.triggers.length; i++) {
			var cfgIndex = this.appAssistant.find("id", this.loaded.triggers[i].extension, this.triggers);
		
			if(cfgIndex != -1) {
				var data = this.triggers[cfgIndex].config.save(this.loaded.triggers[i]);
			
				data.extension = this.loaded.triggers[i].extension;
					
				data.group = this.loaded.triggers[i].group;
			
				mode.triggersList.push(data);
			}
		}

		for(var i = 0; i < this.unloaded.triggers.length; i++)
			mode.triggersList.push(this.unloaded.triggers[i]);

		if(this.modeidx == undefined)
		{
			this.modeidx = this.appAssistant.config.modesConfig.length;
			this.appAssistant.config.modesConfig.push(mode);
		}
		else {
			this.appAssistant.config.modesConfig.splice(this.modeidx, 1, mode);
		}

		this.appAssistant.saveConfigData("modesConfig");
	}
	else {
		this.appAssistant.config.defaultMode = mode;
		
		this.appAssistant.saveConfigData("defaultMode");
	}
	
	return mode;
}

//

EditmodeAssistant.prototype.setModeType = function(event) {
	if(event.value == "normal") {
		this.type = "normal";
	
		this.modelStartSelector.value = 1;
		this.modelCloseSelector.value = 1;
		
		this.modelStartSelector.choices = [
			{'label': $L("Only Manually"), 'value': 0},
			{'label': $L("By Selection"), 'value': 1},
			{'label': $L("After Timer"), 'value': 2},
			{'label': $L("Immediate"), 'value': 3} ];  

		this.modelCloseSelector.choices = [
			{'label': $L("Only Manually"), 'value': 0},
			{'label': $L("By Selection"), 'value': 1},
			{'label': $L("After Timer"), 'value': 2},
			{'label': $L("Immediate"), 'value': 3} ];  

		this.choicesNotifySelector[0].label = $L("Default");
		this.choicesChargingSelector[0].label = $L("Default");

		this.controller.defaultChoiseLabel = $L("Default");

		for(var i = 0; i < this.settings.length; i++)
			this.settings[i].config.setup(this.controller);
	}
	else {
		this.type = "modifier";
		
		this.modelStartSelector.value = 3;
		this.modelCloseSelector.value = 3;

		this.modelStartSelector.choices = [
			{'label': $L("Only Manually"), 'value': 0},
			{'label': $L("Immediate"), 'value': 3} ];  

		this.modelCloseSelector.choices = [
			{'label': $L("Only Manually"), 'value': 0},
			{'label': $L("Immediate"), 'value': 3} ];  

		this.choicesNotifySelector[0].label = $L("Do Not Set");
		this.choicesChargingSelector[0].label = $L("Do Not Set");

		this.controller.defaultChoiseLabel = $L("Do Not Set");

		for(var i = 0; i < this.settings.length; i++)
			this.settings[i].config.setup(this.controller);
	}
	
	this.controller.modelChanged(this.modelStartSelector, this);
	this.controller.modelChanged(this.modelCloseSelector, this);

	this.controller.modelChanged(this.modelNotifySelector, this);
	this.controller.modelChanged(this.modelChargingSelector, this);
	
	this.controller.modelChanged(this.modelSettingsList, this);
	
	this.setModeData(false);	
}

EditmodeAssistant.prototype.setTriggersView = function(event) {
	if(event.value != 2) {
		this.groupidx = 0;

		this.controller.get("TriggersTitle").innerHTML = $L("Activation Triggers");

		this.modelCommandMenu.items[0].disabled = true;
		this.modelCommandMenu.items[2].disabled = true;

		this.controller.modelChanged(this.modelCommandMenu, this);

		this.mode.triggersList.clear();
		
		for(var i = 0; i < this.loaded.triggers.length; i++) {
			if(this.loaded.triggers[i].group == this.groupidx) {
				var id = this.loaded.triggers[i].extension;
				var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

				var trigger = {'list': "<div name='" + element + "' x-mojo-element='List'></div>"};

				trigger[id] = [this.loaded.triggers[i]];

				trigger['extension'] = this.loaded.triggers[i].extension;

				this.mode.triggersList.push(trigger);
			}
		}		

		this.controller.modelChanged(this.modelTriggersList, this);
	}
	else {
		this.controller.get("TriggersTitle").innerHTML = $L("Activation Triggers (0)");
	
		this.modelCommandMenu.items[2].disabled = false;

		this.controller.modelChanged(this.modelCommandMenu, this);
	}

	this.setModeData(false);
}

//

EditmodeAssistant.prototype.retrieveCurrentSettings = function(index, target) {
	if((index == 0) || (target == "single")) {
		Mojo.Log.info("Retrieving current system settings");

		this.appControl.showBanner($L("Retrieving current system settings"), {});

		this.retrieving = true;
	}

	if(index < this.settings.length) {
		Mojo.Log.info("Retrieving " + this.settings[index].id + " settings");

		var callback = this.retrievedCurrentSettings.bind(this, index, target);

		this.settings[index].setting.get(callback);
	}
	else {
		Mojo.Log.info("Retrieving system settings finished");

		this.appControl.showBanner($L("Retrieving system settings finished"), {});

		this.retrieving = false;
	}
}

EditmodeAssistant.prototype.retrievedCurrentSettings = function(index, target, settings) {
	if(settings != undefined) {
		var data = this.settings[index].config.load(settings);

		data.extension = this.settings[index].id;

		this.loaded.settings.push(data);

		this.loaded.settings.sort(this.sortAlphabeticallyFunction);

		var id = this.settings[index].id;
		
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

		var setting = {'list': "<div name='" + element + "' x-mojo-element='List'></div>"};
		
		setting[id] = [data]; 

		setting['extension'] = this.settings[index].id;

		this.mode.settingsList.push(setting);
		
		this.mode.settingsList.sort(this.sortAlphabeticallyFunction);

		this.setModeData(true);
	}

	if(target == "everything")
		this.retrieveCurrentSettings(++index, target);
	else
		this.retrieveCurrentSettings(this.settings.length, target);
}

//

EditmodeAssistant.prototype.handleCommand = function(event) {
	if(event.type == Mojo.Event.back) {
		event.stop();

		if(this.retrieving) {
			this.appControl.showBanner($L("Retrieving process still in progress"), {});
									 
			return;
		}

		if(this.currentView == "Configuration") {
			this.setModeData(false);
		
			this.controller.stageController.popScene();
			return;
		}
	}
		
	if((event.type == Mojo.Event.command) || (event.type == Mojo.Event.back)) {
		if((event.command == "configuration") || (event.type == Mojo.Event.back)) {
			this.setModeData(true);

			this.currentView = "Configuration";

			this.modelCommandMenu.items.clear();

			if(this.type == "default") {			
				this.modelCommandMenu.items.push({'width': 35});
				this.modelCommandMenu.items.push({'label': $L("Settings"), 'command': "settings", 'width': 110});
				this.modelCommandMenu.items.push({'width': 30});
				this.modelCommandMenu.items.push({'label': $L("Apps"), 'command': "applications", 'width': 110});
				this.modelCommandMenu.items.push({'width': 35});
			}
			else {
				this.modelCommandMenu.items.push({'width': 5});
				this.modelCommandMenu.items.push({'label': $L("Settings"), 'command': "settings", 'width': 100});
				this.modelCommandMenu.items.push({'label': $L("Apps"), 'command': "applications", 'width': 80});
				this.modelCommandMenu.items.push({'label': $L("Triggers"), 'command': "triggers", 'width': 100});
				this.modelCommandMenu.items.push({'width': 5});				
			}

			this.controller.modelChanged(this.modelCommandMenu, this);
			
			this.appsView.style.display = "none";
			this.settingsView.style.display = "none";
			this.triggersView.style.display = "none";
			
			this.configurationView.style.display = "block";

			// FIXME: bug in Mojo if name field changed while hidden it is not shown properly.
			
			var name = this.modelNameText.value;
			this.modelNameText.value = "";
			this.controller.modelChanged(this.modelNameText, this);
			this.modelNameText.value = name;
			this.controller.modelChanged(this.modelNameText, this);
			
			this.controller.sceneScroller.mojo.revealTop(0);

			var transition = this.controller.prepareTransition(Mojo.Transition.crossFade);
	
			transition.run();
		}
		else if(event.command == "settings") {
			this.setModeData(true);

			this.currentView = "Settings";
			
			this.modelCommandMenu.items.clear();

			if(this.loaded.settings.length == this.settings.length)
				this.modelCommandMenu.items.push({'label': "+ " + $L("All"), 'command': "settings-all", 'disabled': true});
			else
				this.modelCommandMenu.items.push({'label': "+ " + $L("All"), 'command': "settings-all", 'disabled': false});
				
			this.modelCommandMenu.items.push({'label': $L("Add Setting"), 'command': "settings-add", 'disabled': false});

			if(this.loaded.settings.length == 0)
				this.modelCommandMenu.items.push({'label': $L("All") + " -", 'command': "settings-none", 'disabled': true});
			else
				this.modelCommandMenu.items.push({'label': $L("All") + " -", 'command': "settings-none", 'disabled': false});
			
			this.controller.modelChanged(this.modelCommandMenu, this);
			
			this.configurationView.style.display = "none";
			this.settingsView.style.display = "block";
			
			this.controller.sceneScroller.mojo.revealTop(0);

			// FIXME: Bug in slider widget, it has to be visible on setup or refreshed.

			this.controller.modelChanged(this.modelSettingsList, this);

			var transition = this.controller.prepareTransition(Mojo.Transition.crossFade);

			transition.run();
		}
		else if(event.command == "applications") {
			this.currentView = "Applications";
			
			this.modelCommandMenu.items.clear();
			this.modelCommandMenu.items.push({'label': $L("Add App"), 'command': "applications-app"});
			this.modelCommandMenu.items.push({'label': $L("Add MS"), 'command': "applications-ms"});
			this.modelCommandMenu.items.push({'label': $L("Add Srv"), 'command': "applications-srv"});

			this.controller.modelChanged(this.modelCommandMenu, this);
			
			this.configurationView.style.display = "none";
			this.appsView.style.display = "block";
			
			this.controller.sceneScroller.mojo.revealTop(0);

			var transition = this.controller.prepareTransition(Mojo.Transition.crossFade);
	
			transition.run();
		}
		else if(event.command == 'triggers') {
			this.setModeData(true);

			this.currentView = "Triggers";

			this.modelCommandMenu.items.clear();
			if(this.groupidx == 0)
				this.modelCommandMenu.items.push({'label': "< " + $L("Group"), 'command': "triggers-prev", 'disabled': true});
			else
				this.modelCommandMenu.items.push({'label': "< " + $L("Group"), 'command': "triggers-prev", 'disabled': false});

			this.modelCommandMenu.items.push({'label': $L("Add Trigger"), 'command': "triggers-add", 'disabled': false});

			if(this.groupidx == 9)
				this.modelCommandMenu.items.push({'label': $L("Group") + " >", 'command': "triggers-next", 'disabled': true});
			else if(this.mode.triggers.required == 2)
				this.modelCommandMenu.items.push({'label': $L("Group") + " >", 'command': "triggers-next", 'disabled': false});
			else
				this.modelCommandMenu.items.push({'label': $L("Group") + " >", 'command': "triggers-next", 'disabled': true});

			this.controller.modelChanged(this.modelCommandMenu, this);

			this.configurationView.style.display = "none";
			this.triggersView.style.display = "block";
			
			this.controller.sceneScroller.mojo.revealTop(0);

			var transition = this.controller.prepareTransition(Mojo.Transition.crossFade);
	
			transition.run();
		}
		else if(event.command == "settings-add") {
			var settingItems = [];
			
			for(var i = 0; i < this.settings.length; i++) {
				if(this.appAssistant.find("extension", this.settings[i].id, this.loaded.settings) == -1)
					settingItems.push({'label': this.settings[i].config.label(), 'command': i});
			}

			settingItems.sort(this.sortAlphabeticallyFunction);

			this.controller.popupSubmenu({
				'onChoose': this.handleSettingsChoose.bind(this), 'items': settingItems});
		}
		else if(event.command == "settings-all") {
			this.modelCommandMenu.items[0].disabled = true;
			this.modelCommandMenu.items[2].disabled = false;

			this.controller.modelChanged(this.modelCommandMenu, this);

			this.mode.settingsList.clear();

			this.loaded.settings.clear();
		
			this.retrieveCurrentSettings(0, "everything");
		}	
		else if(event.command == "settings-none") {
			this.modelCommandMenu.items[0].disabled = false;
			this.modelCommandMenu.items[2].disabled = true;

			this.controller.modelChanged(this.modelCommandMenu, this);

			this.mode.settingsList.clear();

			this.loaded.settings.clear();
						
			this.setModeData(true);
		}
		else if(event.command == "applications-app") {
			this.controller.serviceRequest('palm://com.palm.applicationManager/', {
				'method': 'listLaunchPoints', 'parameters': {},
				'onSuccess': function(payload) {
					var appItems = [];

					this.launchPoints = payload.launchPoints;
				
					this.launchPoints.sort(this.sortAlphabeticallyFunction);
				
					this.launchPoints.each(function(item, index){
						if((item.id != "com.palm.org.e-lnx.wee.apps.modeswitcher") &&
							((item.id != "com.palm.app.contacts") || (!item.params)))
						{
							appItems.push({'label': item.title, 'command': index});
						}
					}.bind(this));

					this.controller.popupSubmenu({
						'onChoose':  this.handleAppChoose.bind(this), 'items': appItems});
				}.bind(this)});
		}
		else if(event.command == "applications-ms") {
			var cfgIndex = this.appAssistant.find("id", "modesw", this.applications);

			if(cfgIndex != -1) {
				var id = this.applications[cfgIndex].id;
				var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

				var launchpoint = {'title': "Mode Switcher"};

				var data = this.applications[cfgIndex].config.config(launchpoint);
		
				data.extension = this.applications[cfgIndex].id;

				this.loaded.apps.splice(0, 0, data);

				var app = {'list': "<div name='" + element + "' x-mojo-element='List'></div>"};
		
				app[id] = [data]; 

				this.mode.appsList.splice(0, 0, app);

				this.controller.setupWidget(element, {
					'itemTemplate': '../extensions/applications/' + id + '-listitem',
					'swipeToDelete': false, 'autoconfirmDelete': false,
					'reorderable': false, 'itemsProperty': id});

				this.setModeData(true);
			}
		}
		else if(event.command == "applications-srv") {
			this.controller.serviceRequest('palm://com.palm.applicationManager/', {
				'method': 'listLaunchPoints', 'parameters': {},
				'onSuccess': function(payload) {
					var appItems = [];

					this.launchPoints = payload.launchPoints;
				
					this.launchPoints.sort(this.sortAlphabeticallyFunction);
				
					this.launchPoints.each(function(item, index){
						if(item.id == "org.webosinternals.govnah")
						{
							appItems.push({'label': item.title, 'command': index});
						}
					}.bind(this));

					this.controller.popupSubmenu({
						'onChoose':  this.handleSrvChoose.bind(this), 'items': appItems});
				}.bind(this)});
		}
		else if(event.command == "triggers-add") {
			var triggerItems = [];
			
			for(var i = 0; i < this.triggers.length; i++)
				triggerItems.push({'label': this.triggers[i].config.label(), 'command': i});
	
			triggerItems.sort(this.sortAlphabeticallyFunction);
	
			this.controller.popupSubmenu({
				'onChoose':  this.handleTriggersChoose.bind(this), 'items': triggerItems});
		}
		else if(event.command == "triggers-prev") {
			if(this.groupidx == 0)
				return;
			
			this.groupidx--;

			this.controller.get("TriggersTitle").innerHTML = $L("Activation Triggers") + " (" + this.groupidx + ")";
		
			if(this.groupidx == 0) {
				this.modelCommandMenu.items[0].disabled = true;
				this.controller.modelChanged(this.modelCommandMenu, this);
			}
			else if(this.groupidx == 8) {
				this.modelCommandMenu.items[2].disabled = false;
				this.controller.modelChanged(this.modelCommandMenu, this);
			}
		
			this.mode.triggersList.clear();
		
			for(var i = 0; i < this.loaded.triggers.length; i++) {
				if(this.loaded.triggers[i].group == this.groupidx) {
					var id = this.loaded.triggers[i].extension;
					var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

					var trigger = {'list': "<div name='" + element + "' x-mojo-element='List'></div>"};

					trigger[id] = [this.loaded.triggers[i]];
					
					trigger['extension'] = this.loaded.triggers[i].extension;
					
					this.mode.triggersList.push(trigger);
				}
			}		
			
			this.controller.modelChanged(this.modelTriggersList, this);
		}
		else if(event.command == "triggers-next") {
			if(this.groupidx == 9)
				return;
			
			this.groupidx++;

			this.controller.get("TriggersTitle").innerHTML = $L("Activation Triggers") + " (" + this.groupidx + ")";

			if(this.groupidx == 9) {
				this.modelCommandMenu.items[2].disabled = true;
				this.controller.modelChanged(this.modelCommandMenu, this);
			}
			else if(this.groupidx == 1) {
				this.modelCommandMenu.items[0].disabled = false;
				this.controller.modelChanged(this.modelCommandMenu, this);
			}			
		
			this.mode.triggersList.clear();
		
			for(var i = 0; i < this.loaded.triggers.length; i++) {
				if(this.loaded.triggers[i].group == this.groupidx) {
					var id = this.loaded.triggers[i].extension;
					var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

					var trigger = {'list': "<div name='" + element + "' x-mojo-element='List'></div>"};

					trigger[id] = [this.loaded.triggers[i]];
	
					trigger['extension'] = this.loaded.triggers[i].extension;
	
					this.mode.triggersList.push(trigger);
				}
			}		
			
			this.controller.modelChanged(this.modelTriggersList, this);
		}
		else if(event.command == "launchpoint") {
			this.controller.serviceRequest('palm://com.palm.applicationManager/', {
				'method': "addLaunchPoint", 'parameters': {'id': Mojo.Controller.appInfo.id,
					'icon': "images/default_icon.png", 'title': this.mode.name,
					'params': {'launchPoint': true, 'action': "execute", 'event': "toggle", 'name': this.mode.name}}});
		}
		else if(event.command == "export") {
			var mode = this.setModeData(false);
		
			this.controller.stageController.pushScene("scene", "exportGDoc", mode, null);
		}
	}
}

//

EditmodeAssistant.prototype.handleSettingsChoose = function(index) {
	if(index != undefined) {
		if(this.loaded.settings.length == 0)
			this.modelCommandMenu.items[2].disabled = false;
		else if(this.loaded.settings.length == this.settings.length - 1)
			this.modelCommandMenu.items[0].disabled = true;

		this.controller.modelChanged(this.modelCommandMenu, this);
	
		this.retrieveCurrentSettings(index, "single");
	}
}

EditmodeAssistant.prototype.handleAppChoose = function(index) {
	var cfgIndex = 0;

	if(index != undefined) {
		for(var i = 0; i < this.applications.length; i++) {
			if(this.applications[i].id == "default")
				cfgIndex = i;
			else if(this.applications[i].appid == this.launchPoints[index].id) {
				cfgIndex = i;
				
				break;
			}
		}
		
		var id = this.applications[cfgIndex].id;
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";
		
		this.launchPoints[index].type = "app";
		
		var data = this.applications[cfgIndex].config.config(this.launchPoints[index]);
		
		data.extension = this.applications[cfgIndex].id;

		this.loaded.apps.push(data);

		var app = {'list': "<div name='" + element + "' x-mojo-element='List'></div>"};
		
		app[id] = [data]; 

		this.mode.appsList.push(app);

		this.controller.setupWidget(element, {
			'itemTemplate': '../extensions/applications/' + id + '-listitem',
			'swipeToDelete': false, 'autoconfirmDelete': false,
			'reorderable': false, 'itemsProperty': id});

		this.setModeData(true);
	}
}

EditmodeAssistant.prototype.handleSrvChoose = function(index) {
	var cfgIndex = 0;

	if(index != undefined) {
		for(var i = 0; i < this.applications.length; i++) {
			if(this.applications[i].id == "default")
				cfgIndex = i;
			else if(this.applications[i].appid == this.launchPoints[index].id) {
				cfgIndex = i;
				
				break;
			}
		}
		
		var id = this.applications[cfgIndex].id;
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

		this.launchPoints[index].type = "srv";

		var data = this.applications[cfgIndex].config.config(this.launchPoints[index]);
		
		data.extension = this.applications[cfgIndex].id;

		this.loaded.apps.push(data);

		var app = {'list': "<div name='" + element + "' x-mojo-element='List'></div>"};
		
		app[id] = [data]; 

		this.mode.appsList.push(app);

		this.controller.setupWidget(element, {
			'itemTemplate': '../extensions/applications/' + id + '-listitem',
			'swipeToDelete': false, 'autoconfirmDelete': false,
			'reorderable': false, 'itemsProperty': id});

		this.setModeData(true);
	}
}

EditmodeAssistant.prototype.handleTriggersChoose = function(index) {
	if(index != undefined) {
		var data = this.triggers[index].config.config();

		data.extension = this.triggers[index].id;

		data.group = this.groupidx;

		this.loaded.triggers.push(data);

		this.loaded.triggers.sort(this.sortAlphabeticallyFunction);

		var id = this.triggers[index].id;
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

		var trigger = {'list': "<div name='" + element + "' x-mojo-element='List'></div>"};

		trigger[id] = [data];
	
		trigger['extension'] = this.triggers[index].id;
	
		this.mode.triggersList.push(trigger);

		this.mode.triggersList.sort(this.sortAlphabeticallyFunction);
		
		this.setModeData(true);
	}
}

//

EditmodeAssistant.prototype.handleListChange = function(list, event) {
	if(event != undefined) {
		if(event.model == undefined) {
			// Sliders don't have model with them.
		
			this.setModeData(true);
		}
	}
}

EditmodeAssistant.prototype.handleListReorder = function(list, event) {
	if(list == "apps") {
		var tempApp = this.mode.appsList[event.fromIndex];
	
		this.mode.appsList.splice(event.fromIndex,1);
		this.mode.appsList.splice(event.toIndex,0,tempApp);

		var tempApp = this.loaded.apps[event.fromIndex];
	
		this.loaded.apps.splice(event.fromIndex,1);
		this.loaded.apps.splice(event.toIndex,0,tempApp);
	}
	
	this.setModeData(false);
}

EditmodeAssistant.prototype.handleListDelete = function(list, event) {
	if(list == "settings") {
		if(this.retrieving) {
			this.controller.modelChanged(this, this.modelSettingsList);
			return;
		}
			
		this.mode.settingsList.splice(event.index,1);

		this.loaded.settings.splice(event.index,1);
		
		if(this.loaded.settings.length == 0) {
			this.modelCommandMenu.items[2].disabled = true;
			this.controller.modelChanged(this.modelCommandMenu, this);
		}
	}
	else if(list == "apps") {
		this.mode.appsList.splice(event.index,1);

		this.loaded.apps.splice(event.index,1);
	}
	else if(list == "triggers") {
		for(var i = 0; i < this.loaded.triggers.length; i++) {
			if(this.loaded.triggers[i] == this.mode.triggersList[event.index][this.mode.triggersList[event.index].extension][0]) {
				this.loaded.triggers.splice(i, 1);
				
				break;
			}
		}
	
		this.mode.triggersList.splice(event.index,1);

		this.setModeData(false);
	}
}

//

EditmodeAssistant.prototype.checkModeName = function() {
	if(this.modelNameText.value.length == 0)
		this.modelNameText.value = 'New Mode';

	if((this.modelNameText.value == "Current Mode") || 
		(this.modelNameText.value == "Default Mode") || 
		(this.modelNameText.value == "Previous Mode") ||
		(this.modelNameText.value == "All Modes") ||
		(this.modelNameText.value == "All Normal Modes") ||
		(this.modelNameText.value == "All Modifier Modes"))
	{
		this.modelNameText.value = $L("Reserved Mode Name");
	}

	for(var i = 0; i < 100; i++) {
		if(i == 0)
			var name = this.modelNameText.value;
		else
			var name = this.modelNameText.value + "-" + i;
	
		var exists = false;
		
		for(var j = 0 ; j < this.config.modesConfig.length ; j++) {
			if((j != this.modeidx) && (this.config.modesConfig[j].name == name)) {
				exists = true;
				break;
			}
		}

		if(exists)
			continue;
		else {
			if(i > 0)
				this.modelNameText.value = name;
			
			break;
		}
	}

	this.controller.modelChanged(this.modelNameText, this);
}

//

EditmodeAssistant.prototype.sortAlphabeticallyFunction = function(a,b){
	if(a.type != undefined) {
		var c = a.type.toLowerCase();
		var d = b.type.toLowerCase();
	}
	else if(a.label != undefined) {
		var c = a.label.toLowerCase();
		var d = b.label.toLowerCase();
	}
	else if(a.title != undefined) {
		var c = a.title.toLowerCase();
		var d = b.title.toLowerCase();
	}
	else if(a.extension != undefined) {
		var c = a.extension.toLowerCase();
		var d = b.extension.toLowerCase();
	}

	return ((c < d) ? -1 : ((c > d) ? 1 : 0));
}

//

EditmodeAssistant.prototype.activate = function(event) {
	/* Put in event handlers here that should only be in effect when this scene is active. 
	 *	For  example, key handlers that are observing the document. 
	 */

	for(var i = 0; i < this.settings.length; i++) {
		this.settings[i].config.activate();
	}

	for(var i = 0; i < this.applications.length; i++) {
		this.applications[i].config.activate();
	}

	if(this.type != "default") {
		for(var i = 0; i < this.triggers.length; i++) {
			this.triggers[i].config.activate();
		}
	}
}
	
EditmodeAssistant.prototype.deactivate = function(event) {
	/* Remove any event handlers you added in activate and do any other cleanup that should 
	 * happen before this scene is popped or another scene is pushed on top. 
	 */
	
	this.setModeData(false);
	
	for(var i = 0; i < this.settings.length; i++) {
		this.settings[i].config.deactivate();
	}

	for(var i = 0; i < this.applications.length; i++) {
		this.applications[i].config.deactivate();
	}

	if(this.type != "default") {
		for(var i = 0; i < this.triggers.length; i++) {
			this.triggers[i].config.deactivate();
		}
	}
}

EditmodeAssistant.prototype.cleanup = function(event) {
	/* This function should do any cleanup needed before the scene is destroyed as a result
	 * of being popped off the scene stack.
	 */
}

