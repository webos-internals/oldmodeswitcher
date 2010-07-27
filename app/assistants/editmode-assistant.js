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

	this.retrieving = false;

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
			{'label': "Get System Settings", 'command': "retrieve"}]} );
	}
	else {
		this.controller.setupWidget(Mojo.Menu.appMenu, 
			{'omitDefaultItems': true}, {'visible': true, 'items': [ 
			{'label': "Add to Launcher", 'command': "launchpoint"}]} );
	}
	
//
// View Menu
//

	this.currentView = "Configuration";

	this.configurationView = this.controller.get("ConfigurationView");
	
	this.configurationView.style.display = 'block';
		
	if(this.type == "default")
		this.itemsViewMenu = [{'label': "Default Mode Settings", 'command': "configuration", 'width': 320}];
	else
		this.itemsViewMenu = [{'label': "Mode Configuration", 'command': "configuration", 'width': 320}];

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
			{'label': "Settings", 'command': "settings", 'width': 110},
			{'width': 30},
			{'label': "Apps", 'command': "applications", 'width': 110},
			{'width': 35} ];
	}
	else {
		this.customCfg.style.display = 'block';
	
		this.itemsCommandMenu = [
			{'width': 5},
			{'label': "Settings", 'command': "settings", 'width': 100},
			{'label': "Apps", 'command': "applications", 'width': 80},
			{'label': "Triggers", 'command': "triggers", 'width': 100},
			{'width': 5} ];
	}

	this.modelCommandMenu = {'visible': true, 'items': this.itemsCommandMenu};
		
	this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.modelCommandMenu);
	
//
// MODE CONFIGURATION
//

	// Mode name text field
	
	if(this.type == "default")
		this.modelNameText = {'value': this.mode.name, 'disabled': true};
	else
		this.modelNameText = {'value': this.mode.name, 'disabled': false};
		   
	this.controller.setupWidget("NameText", { 'hintText': "Unique Mode Name", 
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
			{'label': "Default", 'value': "default"}
			/*{'label': "System", 'value': "system"}*/];  
	}
	else {
		this.choicesTypeSelector = [
			{'label': "Normal", 'value': "normal"},
			{'label': "Modifier", 'value': "modifier"}];  
	}

	this.controller.setupWidget("ModeTypeSelector", {'label': "Mode Type", 
		'labelPlacement': "left", 'choices': this.choicesTypeSelector}, 
		this.modelTypeSelector);

	Mojo.Event.listen(this.controller.get("ModeTypeSelector"), Mojo.Event.propertyChange, 
		this.setModeType.bind(this));

	// Auto start and close selectors

	this.modelStartSelector = {'value': this.mode.autoStartMode, 'disabled': false};

	if(this.mode.type == "normal") {
		this.choicesStartSelector = [
			{'label': "Only Manually", 'value': 0},
			{'label': "By Selection", 'value': 1},
			{'label': "After Timer", 'value': 2},
			{'label': "Immediate", 'value': 3}];  
	}
	else {
		this.choicesStartSelector = [
			{'label': "Only Manually", 'value': 0},
			{'label': "Immediate", 'value': 3}];  
	}
				
	this.controller.setupWidget("StartSelector",	{'label': "Auto Start",
		'labelPlacement': "left", 'choices': this.choicesStartSelector},
		this.modelStartSelector);
	
	Mojo.Event.listen(this.controller.get("StartSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));
		
	this.modelCloseSelector = {'value': this.mode.autoCloseMode, 'disabled': false};

	if(this.mode.type == "normal") {
		this.choicesCloseSelector = [
			{'label': "Only Manually", 'value': 0},
			{'label': "By Selection", 'value': 1},
			{'label': "After Timer", 'value': 2},
			{'label': "Immediate", 'value': 3}];  
	}
	else {
		this.choicesCloseSelector = [
			{'label': "Only Manually", 'value': 0},
			{'label': "Immediate", 'value': 3}];  
	}

	this.controller.setupWidget("CloseSelector",	{'label': "Auto Close", 
		'labelPlacement': "left", 'choices': this.choicesCloseSelector},
		this.modelCloseSelector);
	
	Mojo.Event.listen(this.controller.get("CloseSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	// Mode startup selector

	this.modelStartupSelector = {'value': this.mode.miscOnStartup, 'disabled': false};

	this.choicesStartupSelector = [
		{'label': "Active Mode", 'value': 0},
		{'label': "Default Mode", 'value': 1}];  
	
	this.controller.setupWidget("StartupSelector", {'label': "On Startup", 
		'labelPlacement': "left", 'choices': this.choicesStartupSelector}, 
		this.modelStartupSelector);

	Mojo.Event.listen(this.controller.get("StartupSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));
	
	// Apps startup selector
	
	this.modelAppsSelector = {'value': this.mode.miscAppsMode, 'disabled': false};

	this.choicesAppsSelector = [
		{'label': "Everytime", 'value': 0},
		{'label': "On Startup", 'value': 1} ];  

	this.controller.setupWidget("AppsSelector", {'label': "Applications", 
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
			{'label': "Default", 'value': 0},
			{'label': "Disabled", 'value': 1},
			{'label': "Use Banner", 'value': 2}/*,
			{'label': "System Alert", 'value': 3},
			{'label': "Short Vibrate", 'value': 4}*/];  
	}
	else {
		this.choicesNotifySelector = [
			{'label': "Do Not Set", 'value': 0},
			{'label': "Disabled", 'value': 1},
			{'label': "Use Banner", 'value': 2}/*,
			{'label': "System Alert", 'value': 3},
			{'label': "Short Vibrate", 'value': 4}*/];  
	}
		
	this.controller.setupWidget("NotifySelector", {'label': "Notify", 
		'labelPlacement': "left", 'choices': this.choicesNotifySelector}, 
		this.modelNotifySelector);

	Mojo.Event.listen(this.controller.get("NotifySelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));
		
	// On charger selector

	this.modelChargingSelector = {'value': this.mode.settings.charging, 'disabled': false};

	if(this.mode.type == "normal") {
		this.choicesChargingSelector = [
			{'label': "Default", 'value': 0},
			{'label': "Lock Screen", 'value': 1},
			{'label': "Always On", 'value': 2},
			{'label': "Turn Off", 'value': 3}];  
	}
	else {
		this.choicesChargingSelector = [
			{'label': "Do Not Set", 'value': 0},
			{'label': "Lock Screen", 'value': 1},
			{'label': "Always On", 'value': 2},
			{'label': "Turn Off", 'value': 3}];  
	}
		
	this.controller.setupWidget("ChargingSelector",	{'label': "On Charger", 
		'labelPlacement': "left", 'choices': this.choicesChargingSelector}, 
		this.modelChargingSelector);

	Mojo.Event.listen(this.controller.get("ChargingSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	// Settings list

	this.modelSettingsList = {'items': this.mode.settingsList};
	
	this.controller.setupWidget("SettingsList", {
		'itemTemplate': 'templates/listitem-lists',
		'swipeToDelete': false, 'reorderable': false},
		this.modelSettingsList);

	for(var i=0; i < this.settings.length; i++) {
		var id = this.settings[i].id;
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";
		
		this.controller.setupWidget(element, {
			'itemTemplate': '../extensions/settings/' + id + '-listitem',
			'swipeToDelete': true, 'autoconfirmDelete': true,
			'reorderable': false, 'itemsProperty': id});
	}

	Mojo.Event.listen(this.controller.get("SettingsList"), Mojo.Event.listDelete, 
		this.handleListDelete.bind(this, "settings"));

	Mojo.Event.listen(this.controller.get("SettingsList"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, true));

//
// SETTINGS LIST ITEM
//

	if(this.mode.type == "normal")
		this.controller.defaultChoiseLabel = "Default";
	else
		this.controller.defaultChoiseLabel = "Do Not Set";

	for(var i = 0; i < this.settings.length; i++)
		this.settings[i].config.setup(this.controller);
	
//
// APPLICATIONS
//

	// Application start selector
	
	this.choicesAppsStartSelector = [
		{'label': "Do Nothing", 'value': 0},
		{'label': "Close All Apps", 'value': 2}];  
		
	this.modelAppsStartSelector = {'value': this.mode.apps.start, 'disabled': false};
		
	this.controller.setupWidget("AppsStartSelector", {'label': "On Start", 
		'labelPlacement': "left", 'choices': this.choicesAppsStartSelector},
		this.modelAppsStartSelector);

	Mojo.Event.listen(this.controller.get("AppsStartSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	// Application close selector

	this.choicesAppsCloseSelector = [
		{'label': "Do Nothing", 'value': 0},
		{'label': "Close Started", 'value': 1},
		{'label': "Close All Apps", 'value': 2}];  
		
	this.modelAppsCloseSelector = {'value': this.mode.apps.close, 'disabled': false};
		
	this.controller.setupWidget("AppsCloseSelector", {'label': "On Close", 
		'labelPlacement': "left", 'choices': this.choicesAppsCloseSelector},
		this.modelAppsCloseSelector);

	Mojo.Event.listen(this.controller.get("AppsCloseSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	// Applications list

	this.modelAppsList = {'items': this.mode.appsList};
	
	this.controller.setupWidget("AppsList", {
		'itemTemplate': 'templates/listitem-lists',
		'swipeToDelete': true, 'reorderable': true,
		'autoconfirmDelete': true},
		this.modelAppsList);

	for(var i=0; i < this.applications.length; i++) {
		var id = this.applications[i].id;
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";
		
		this.controller.setupWidget(element, {
			'itemTemplate': '../extensions/applications/' + id + '-listitem',
			'swipeToDelete': false, 'autoconfirmDelete': false,
			'reorderable': false, 'itemsProperty': id});
	}

	Mojo.Event.listen(this.controller.get("AppsList"), Mojo.Event.listDelete, 
		this.handleListDelete.bind(this, "apps"));

	Mojo.Event.listen(this.controller.get("AppsList"), Mojo.Event.listReorder, 
		this.handleListReorder.bind(this, "apps"));

	Mojo.Event.listen(this.controller.get("AppsList"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, true.c));

//
// APPS LIST ITEM
//

	for(var i = 0; i < this.applications.length; i++)
		this.applications[i].config.setup(this.controller);

//
// TRIGGERS
//

	// Trigger selector

	if(this.type != "default") {
		this.modelRequiredSelector = {'value': this.mode.triggers.required, 'disabled': false};

		this.choicesTriggerSelector = [
			{'label': "All Unique", 'value': 0},
			{'label': "One Trigger", 'value': 1}];  

		this.controller.setupWidget("RequiredSelector",	{'label': "Required", 
			'labelPlacement': "left", 'choices': this.choicesTriggerSelector},
			this.modelRequiredSelector);	
	
		Mojo.Event.listen(this.controller.get("RequiredSelector"), Mojo.Event.propertyChange, 
			this.setModeData.bind(this, false));

		// Block selector

		this.modelBlockSelector = {'value': this.mode.triggers.block, 'disabled': false};

		this.choicesBlockSelector = [
			{'label': "No Blocking", 'value': 0},
			{'label': "Other Modes", 'value': 1},
			{'label': "Normal Modes", 'value': 2},
			{'label': "Modifier Modes", 'value': 3}];  

		this.controller.setupWidget("BlockSelector",	{ 'label': "Block Mode", 
			'labelPlacement': 'left', 'choices': this.choicesBlockSelector},
			this.modelBlockSelector);	
	
		Mojo.Event.listen(this.controller.get("BlockSelector"), Mojo.Event.propertyChange, 
			this.setModeData.bind(this, false));

		// Triggers list

		this.modelTriggersList = {'items': this.mode.triggersList};
	
		this.controller.setupWidget("TriggersList", {
			'itemTemplate': "templates/listitem-lists",
			'swipeToDelete': false, 'reorderable': false},
			this.modelTriggersList);

		for(var i=0; i < this.triggers.length; i++) {
			var id = this.triggers[i].id;
			var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

			this.controller.setupWidget(element, {
				'itemTemplate': "../extensions/triggers/" + id + "-listitem",
				'swipeToDelete': true, 'autoconfirmDelete': true,
				'reorderable': false, 'itemsProperty': id});
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

			'settings': {'notify': 2, 'charging': 3}, 'settingsList': [],
		
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
	
	for(var i = 0; i < this.settings.length; i++) {
		var id = this.settings[i].id;
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

		var setting = {};
		
		setting[id] = []; 
		setting['list'] = "<div name='" + element + "' x-mojo-element='List'></div>";

		mode.settingsList.push(setting);
	}

	if(this.type != "default") {
		for(var i = 0; i < this.triggers.length; i++) {
			var id = this.triggers[i].id;
			var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";
	
			var trigger = {};
		
			trigger[id] = [];
			trigger['list'] = "<div name='" + element + "' x-mojo-element='List'></div>";

			mode.triggersList.push(trigger);
		}
	}

	if(this.type != "default") {
		if(this.modeidx == undefined)
			return mode;
	
		var config = this.config.modesConfig[this.modeidx];
	}
	else
		var config = this.config.defaultMode;

	for(var i = 0; i < config.appsList.length; i++) {
		for(var j = 0; j < this.applications.length; j++) {
			if(this.applications[j].id == "default")
				cfgIndex = j;
			else if(this.applications[j].appid == config.appsList[i].appid) {
				cfgIndex = j;
				
				break;
			}
		}

		var id = this.applications[cfgIndex].id;
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

		var setting = {};
		
		setting[id] = []; 
		setting['list'] = "<div name='" + element + "' x-mojo-element='List'></div>";
		
		mode.appsList.push(setting);
	}

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
						
	for(var i = 0; i < this.settings.length; i++) {
		for(var j = 0; j < config.settingsList.length; j++) {
			if(this.settings[i].id == config.settingsList[j].extension) {
				var source = config.settingsList[j];
				eval('var target = mode.settingsList[i].' + this.settings[i].id);
				
				var data = this.settings[i].config.load(source);
				
				data.extension = this.settings[i].id;
				
				target.push(data);
				
				break;
			}
		}
	}

	mode.apps.start = config.apps.start;
	mode.apps.close = config.apps.close;

	for(var i = 0; i < config.appsList.length; i++) {
		for(var j = 0; j < this.applications.length; j++) {
			if(this.applications[j].id == "default")
				cfgIndex = j;
			else if(this.applications[j].appid == config.appsList[i].appid) {
				cfgIndex = j;
			
				break;
			}
		}
		
		var source = config.appsList[i];
		eval("var target = mode.appsList[i]['" + this.applications[cfgIndex].id + "']");

		var data = this.applications[cfgIndex].config.load(source);
	
		data.extension = this.applications[cfgIndex].id;
	
		target.push(data);
	}
	
	if(this.type != "default") {
		mode.triggers.block = config.triggers.block;
		mode.triggers.required = config.triggers.required;
	
		for(var i = 0; i < this.triggers.length; i++) {
			for(var j = 0; j < config.triggersList.length; j++) {
				if(this.triggers[i].id == config.triggersList[j].extension) {
					var source = config.triggersList[j];
					eval('var target = mode.triggersList[i].' + this.triggers[i].id);
			
					var data = this.triggers[i].config.load(source);
				
					data.extension = this.triggers[i].id;
				
					target.push(data);
				}
			}
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
		
			'settings': {'notify': 2, 'charging': 3}, 'settingsList': [],
		
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
		
	for(var i = 0; i < this.settings.length; i++) {
		eval('var source = this.mode.settingsList[i].' + this.settings[i].id + '[0]');
	
		if(source != undefined) {
			var target = mode.settingsList;
			
			var data = this.settings[i].config.save(source);
			
			data.extension = this.settings[i].id;
			
			target.push(data);
		}
	}

	mode.apps.start = this.modelAppsStartSelector.value;
	mode.apps.close = this.modelAppsCloseSelector.value;								

	for(var i = 0; i < this.mode.appsList.length; i++) {
		for(var j = 0; j < this.applications.length; j++) {
			if(eval("this.mode.appsList[i]['" + this.applications[j].id + "']") != undefined) {
				cfgIndex = j;
			
				break;
			}
		}
	
		eval("var source = this.mode.appsList[i]['" + this.applications[cfgIndex].id + "'][0]");

		if(source != undefined) {
			var target = mode.appsList;
		
			var data = this.applications[cfgIndex].config.save(source);
		
			target.extension = this.applications[cfgIndex].id;
		
			target.push(data);
		}
	}
		
	if(this.type != "default") {
		mode.triggers.block = this.modelBlockSelector.value;
		mode.triggers.required = this.modelRequiredSelector.value;

		for(var i = 0; i < this.triggers.length; i++) {
			eval('var list = this.mode.triggersList[i].' + this.triggers[i].id);
			
			for(var j = 0; j < list.length; j++) {
				eval('var source = this.mode.triggersList[i].' + this.triggers[i].id + '[j]');
		
				if(source != undefined) {
					var target = mode.triggersList;

					var data = this.triggers[i].config.save(source);
			
					data.extension = this.triggers[i].id;
			
					target.push(data);
				}
			}
		}

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
}

//

EditmodeAssistant.prototype.setModeType = function(event) {
	if(event.value == "normal") {
		this.type = "normal";
	
		this.modelStartSelector.value = 1;
		this.modelCloseSelector.value = 1;
		
		this.modelStartSelector.choices = [
			{'label': "Only Manually", 'value': 0},
			{'label': "By Selection", 'value': 1},
			{'label': "After Timer", 'value': 2},
			{'label': "Immediate", 'value': 3} ];  

		this.modelCloseSelector.choices = [
			{'label': "Only Manually", 'value': 0},
			{'label': "By Selection", 'value': 1},
			{'label': "After Timer", 'value': 2},
			{'label': "Immediate", 'value': 3} ];  

		this.choicesNotifySelector[0].label = "Default";
		this.choicesChargingSelector[0].label = "Default";

		this.controller.defaultChoiseLabel = "Default";

		for(var i = 0; i < this.settings.length; i++)
			this.settings[i].config.setup(this.controller);
	}
	else {
		this.type = "modifier";
		
		this.modelStartSelector.value = 3;
		this.modelCloseSelector.value = 3;

		this.modelStartSelector.choices = [
			{'label': "Only Manually", 'value': 0},
			{'label': "Immediate", 'value': 3} ];  

		this.modelCloseSelector.choices = [
			{'label': "Only Manually", 'value': 0},
			{'label': "Immediate", 'value': 3} ];  

		this.choicesNotifySelector[0].label = "Do Not Set";
		this.choicesChargingSelector[0].label = "Do Not Set";

		this.controller.defaultChoiseLabel = "Do Not Set";

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

//

EditmodeAssistant.prototype.retrieveCurrentSettings = function(index, target, settings) {
	// Store settings from last round if returned by the extension.

	if(settings != undefined) {
		eval("this.mode.settingsList[index - 1]." + this.settings[index - 1].id + ".clear()");
		
		var config = this.settings[index - 1].config.load(settings);

		config.extension = this.settings[index - 1].id;

		eval("this.mode.settingsList[index - 1]." + this.settings[index - 1].id + ".push(config)");

		this.setModeData(true);
	}

	if((index < this.settings.length) && ((settings == undefined) || (target == "everything"))) {
		Mojo.Log.info("Retrieving " + this.settings[index].id + " settings");

		eval("this.mode.settingsList[index]." + this.settings[index].id + ".clear()");

		eval("var list = this.mode.settingsList[index]." + this.settings[index].id);
		
		var data = this.settings[index].config.config();

		data.extension = this.settings[index].id;

		list.push(data);
		
		this.setModeData(true);
		
		var callback = this.retrieveCurrentSettings.bind(this, ++index, target);

		this.settings[index - 1].setting.get(callback);
	}
	else {
		Mojo.Log.info("Retrieving system settings finished");

		this.appControl.showBanner("Retrieving system settings finished", {});

		this.retrieving = false;
	}
}

//

EditmodeAssistant.prototype.handleCommand = function(event) {
	if(event.type == Mojo.Event.back) {
		event.stop();

		if(this.retrieving) {
			this.appControl.showBanner("Retrieving process still in progress", {});
									 
			return;
		}

		if(this.currentView == "Configuration") {
			this.setModeData(false);
		
			this.controller.stageController.popScene();
			return;
		}
	}
	else
		this.setModeData(true);
	
	if((event.type == Mojo.Event.command) || (event.type == Mojo.Event.back)) {
		if((event.command == "configuration") || (event.type == Mojo.Event.back)) {
			this.currentView = "Configuration";

			this.modelCommandMenu.items.clear();

			if(this.type == "default") {			
				this.modelCommandMenu.items.push({'width': 35});
				this.modelCommandMenu.items.push({'label': "Settings", 'command': "settings", 'width': 110});
				this.modelCommandMenu.items.push({'width': 30});
				this.modelCommandMenu.items.push({'label': "Apps", 'command': "applications", 'width': 110});
				this.modelCommandMenu.items.push({'width': 35});
			}
			else {
				this.modelCommandMenu.items.push({'width': 5});
				this.modelCommandMenu.items.push({'label': "Settings", 'command': "settings", 'width': 100});
				this.modelCommandMenu.items.push({'label': "Apps", 'command': "applications", 'width': 80});
				this.modelCommandMenu.items.push({'label': 'Triggers', 'command': "triggers", 'width': 100});
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
			this.currentView = "Settings";
			
			this.modelCommandMenu.items.clear();
			this.modelCommandMenu.items.push({});
			this.modelCommandMenu.items.push({'label': "Add System Setting", 'command': "settings-add"});
			this.modelCommandMenu.items.push({});

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
			this.modelCommandMenu.items.push({});
			this.modelCommandMenu.items.push({'label': "Add Application", 'command': "applications-add"});
			this.modelCommandMenu.items.push({});

			this.controller.modelChanged(this.modelCommandMenu, this);
			
			this.configurationView.style.display = "none";
			this.appsView.style.display = "block";
			
			this.controller.sceneScroller.mojo.revealTop(0);

			var transition = this.controller.prepareTransition(Mojo.Transition.crossFade);
	
			transition.run();
		}
		else if(event.command == 'triggers') {
			this.currentView = "Triggers";

			this.modelCommandMenu.items.clear();
			this.modelCommandMenu.items.push({});
			this.modelCommandMenu.items.push({'label': "Add Activation Trigger", 'command': "triggers-add"});
			this.modelCommandMenu.items.push({});

			this.controller.modelChanged(this.modelCommandMenu, this);

			this.configurationView.style.display = "none";
			this.triggersView.style.display = "block";
			
			this.controller.sceneScroller.mojo.revealTop(0);

			var transition = this.controller.prepareTransition(Mojo.Transition.crossFade);
	
			transition.run();
		}
		else if(event.command == "settings-add") {
				var settingItems = [];
				
				settingItems.push({'label': "Append All Settings", 'command': "everything"});
				settingItems.push({'label': "Remove All Settings", 'command': "nosettings"});
							
				for(var i = 0; i < this.settings.length; i++) {
					if(eval("this.mode.settingsList[i]." + this.settings[i].id + ".length") == 0)
						settingItems.push({'label': this.settings[i].config.label(), 'command': i});
				}
	
				this.controller.popupSubmenu({
					'onChoose': this.handleSettingsChoose.bind(this), 'items': settingItems});
		}
		else if(event.command == "applications-add") {
			this.controller.serviceRequest('palm://com.palm.applicationManager/', {
				'method': 'listLaunchPoints', 'parameters': {},
				'onSuccess': function(payload) {
					var appItems = [];

					this.launchPoints = payload.launchPoints;
				
					this.launchPoints.sort(this.sortAlphabeticallyFunction);
				
					this.launchPoints.each(function(item, index){
						appItems.push({'label': item.title, 'command': index});
					}.bind(this));

					this.controller.popupSubmenu({
						'onChoose':  this.handleAppsChoose.bind(this), 'items': appItems});
				}.bind(this)});
		}
		else if(event.command == "triggers-add") {
			var triggerItems = [];
			
			for(var i = 0; i < this.triggers.length; i++)
				triggerItems.push({'label': this.triggers[i].config.label(), 'command': i});
	
			this.controller.popupSubmenu({
				'onChoose':  this.handleTriggersChoose.bind(this), 'items': triggerItems});
		}	
		else if(event.command == "launchpoint") {
			this.controller.serviceRequest('palm://com.palm.applicationManager/', {
				'method': "addLaunchPoint", 'parameters': {'id': Mojo.Controller.appInfo.id,
					'icon': "images/default_icon.png", 'title': this.mode.name,
					'params': {'action': "execute", 'event': "toggle", 'name': this.mode.name}}});
		}
		else if(event.command == 'retrieve') {
			for(var i = 0; i < this.settings.length; i++)
				eval('this.mode.settingsList[i].' + this.settings[i].id + '.clear()');
		
			this.handleSettingsChoose("everything");
		}
	}
}

//

EditmodeAssistant.prototype.handleSettingsChoose = function(target) {
	if(target != undefined) {
		if(target == "nosettings") {
			for(var i = 0; i < this.settings.length; i++)
				eval("this.mode.settingsList[i]." + this.settings[i].id +".clear()");
			
			this.setModeData(true);
		}
		else {
			Mojo.Log.info("Retrieving current system settings");

			this.appControl.showBanner("Retrieving current system settings", {});

			this.retrieving = true;

			if(target == "everything")
				this.retrieveCurrentSettings(0, target);			
			else
				this.retrieveCurrentSettings(target, "single");				
		}
	}
}

EditmodeAssistant.prototype.handleAppsChoose = function(index) {
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

		var setting = {};
		
		setting[id] = []; 
		setting['list'] = "<div name='" + element + "' x-mojo-element='List'></div>";

		this.mode.appsList.push(setting);
		
		this.controller.setupWidget(element, {
			'itemTemplate': '../extensions/applications/' + id + '-listitem',
			'swipeToDelete': false, 'autoconfirmDelete': false,
			'reorderable': false, 'itemsProperty': id});

		eval("var list = this.mode.appsList[this.mode.appsList.length - 1]['" + this.applications[cfgIndex].id + "']");
		
		var data = this.applications[cfgIndex].config.config(this.launchPoints[index]);
		
		data.extension = this.applications[cfgIndex].id;
		
		list.push(data);
		
		this.setModeData(true);
	}
}

EditmodeAssistant.prototype.handleTriggersChoose = function(index) {
	if(index != undefined) {
		eval("var list = this.mode.triggersList[index]." + this.triggers[index].id);
		
		var data = this.triggers[index].config.config();

		data.extension = this.triggers[index].id;

		list.push(data);
		
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
	}
	
	this.setModeData(false);
}

EditmodeAssistant.prototype.handleListDelete = function(list, event) {
	if(list == "settings") {
		for(var i = 0; i < this.settings.length; i++) {
			if(eval("event.model." + this.settings[i].id) != undefined) {
				eval("var list = this.mode.settingsList[i]." + this.settings[i].id);
				
				list.splice(event.index, 1);
				
				this.setModeData(true);
		
				break;
			}
		}
	}
	else if(list == "apps") {
		for(var i = 0; i < this.applications.length; i++) {
			if(eval("event.model.items[event.index]['" + this.applications[i].id + "']") != undefined) {
				this.mode.appsList.splice(event.index,1);
		
				this.setModeData(true);
		
				break;
			}
		}
	}
	else if(list == "triggers") {
		for(var i = 0; i < this.triggers.length; i++) {
			if(eval("event.model." + this.triggers[i].id) != undefined) {
				eval("var list = this.mode.triggersList[i]." + this.triggers[i].id);
				
				list.splice(event.index, 1);

				this.setModeData(true);

				break;
			}
		}
	}
}

//

EditmodeAssistant.prototype.checkModeName = function() {
	if(this.modelNameText.value.length == 0)
		this.modelNameText.value = 'New Mode';

	if((this.modelNameText.value == "Current Mode") || 
		(this.modelNameText.value == "Default Mode") || 
		(this.modelNameText.value == "Previous Mode"))
	{
		this.modelNameText.value = 'Reserved Mode Name';
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
	else {
		var c = a.title.toLowerCase();
		var d = b.title.toLowerCase();
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

	for(var i = 0; i < this.triggers.length; i++) {
		this.triggers[i].config.activate();
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

	for(var i = 0; i < this.triggers.length; i++) {
		this.triggers[i].config.deactivate();
	}
}

EditmodeAssistant.prototype.cleanup = function(event) {
	/* This function should do any cleanup needed before the scene is destroyed as a result
	 * of being popped off the scene stack.
	 */
}

