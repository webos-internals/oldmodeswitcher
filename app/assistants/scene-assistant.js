function SceneAssistant(action, data, callback, choice, config) {
	this.action = action;

	this.data = data;

	this.callback = callback;

	this.defaultChoice = choice;

	this.configData = config;

	this.viewLevel = 0;
}

//

SceneAssistant.prototype.setup = function() {
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true},
		{visible: false, items: []});

	if(this.action == "launch");
	else if(this.action == "showHelp")
		this.controller.get('helpinfo').show();
	else if(this.action == "importGDoc")
		this.controller.get('import').show();
	else if(this.action == "exportGDoc")
		this.controller.get('export').show();
	else if(this.action == "pickLocation")
		this.controller.get('mapview').show();
	else 
		this.controller.get('configure').show();
		
	// SHOW HELP

	this.controller.get('appver').update(Mojo.Controller.appInfo.version);
	this.controller.get('appname').update(Mojo.Controller.appInfo.title);

	this.controller.listen(this.controller.get('WikiLink'), Mojo.Event.tap, 
		this.openUrl.bind(this, "wiki"));

	this.controller.listen(this.controller.get('ManualLink'), Mojo.Event.tap, 
		this.openUrl.bind(this, "manual"));

	this.controller.listen(this.controller.get('ForumLink'), Mojo.Event.tap, 
		this.openUrl.bind(this, "forum"));

	this.controller.listen(this.controller.get('EmailLink'), Mojo.Event.tap, 
		this.sendEmail.bind(this, "help"));

	// IMPORT
	
	this.modelImportGDMatch = {value: "", disabled: false};
	
	this.controller.setupWidget("ImportGDMatch", {'hintText': "Match words...", 
		'multiline': false, 'enterSubmits': false, 'focus': true},
		this.modelImportGDMatch); 

	this.modelImportGDShare = {value: false, disabled: false};

	this.controller.setupWidget("ImportGDShared", {'trueLabel': "Yes", 'falseLabel': "No"},
		this.modelImportGDShare); 

	this.modelImportGDOrdering = {'value': "title", 'disabled': false};
	
	this.defaultChoicesImportGDOrdering = [
		{'label': "Title", 'value': "title"},
		{'label': "Last Modified", 'value': "last-modified"}];  
		
	this.controller.setupWidget("ImportGDOrdering", {'label': "Order By", 
		'labelPlacement': "left", 'choices': this.defaultChoicesImportGDOrdering}, 
		this.modelImportGDOrdering);
				
	this.modelImportGDUsername = {value: "", disabled: false};
	
	this.controller.setupWidget("ImportGDUsername", {'hintText': "Google Docs email...", 
		'multiline': false, 'enterSubmits': false, 'focus': false, 'textCase': Mojo.Widget.steModeLowerCase},
		this.modelImportGDUsername); 

	this.modelImportGDPassword = {value: "", disabled: false};
	
	this.controller.setupWidget("ImportGDPassword", {'hintText': "Google Docs password...", 
		'multiline': false, 'enterSubmits': false, 'focus': false, 'textCase': Mojo.Widget.steModeLowerCase},
		this.modelImportGDPassword); 

	this.modelImportGDList = {'items': []};

	this.controller.setupWidget("ImportGDList", {
		'itemTemplate': 'scene/listitem-gdentry',
		'swipeToDelete': false, 'reorderable': false,
		'autoconfirmDelete': true},
		this.modelImportGDList);
	
	this.handlerImportModeData = this.importModeData.bindAsEventListener(this);
	
	this.controller.listen(this.controller.get("ImportGDList"), Mojo.Event.listTap, 
		this.handlerImportModeData);

	this.modelImportGDButton = {buttonClass: '', disabled: false};

	this.controller.setupWidget('ImportGDButton', {label: "List Modes"}, this.modelImportGDButton);
	
	this.controller.listen(this.controller.get('ImportGDButton'), Mojo.Event.tap, 
		this.listGoogleDocuments.bind(this));
			
	// EXPORT
	
	var docName = "";
	
	if(this.action == "exportGDoc")
		docName = this.data.name;
	
	this.modelExportGDTitle = {value: docName + " by <Your nick>", disabled: false};
		
	this.controller.setupWidget("ExportGDTitle", {'hintText': "Descriptive mode name...", 
		'multiline': false, 'enterSubmits': false, 'focus': true},
		this.modelExportGDTitle); 

	this.modelExportGDDesc = {value: "", disabled: false};
	
	this.controller.setupWidget("ExportGDDesc", {'hintText': "Short mode description...", 
		'multiline': false, 'enterSubmits': false, 'focus': false},
		this.modelExportGDDesc); 

	this.modelExportGDUsername = {value: "", disabled: false};
	
	this.controller.setupWidget("ExportGDUsername", {'hintText': "Google Docs email...", 
		'multiline': false, 'enterSubmits': false, 'focus': false, 'textCase': Mojo.Widget.steModeLowerCase},
		this.modelExportGDUsername); 

	this.modelExportGDPassword = {value: "", disabled: false};
	
	this.controller.setupWidget("ExportGDPassword", {'hintText': "Google Docs password...", 
		'multiline': false, 'enterSubmits': false, 'focus': false, 'textCase': Mojo.Widget.steModeLowerCase},
		this.modelExportGDPassword); 

	this.modelExportGDShare = {value: false, disabled: false};

	this.controller.setupWidget("ExportGDShare", {'trueLabel': "Yes", 'falseLabel': "No"},
		this.modelExportGDShare); 
						
	this.modelExportGDButton = {buttonClass: '', disabled: false};

	this.controller.setupWidget('ExportGDButton', {label: "Export Mode"}, this.modelExportGDButton);
	
	this.controller.listen(this.controller.get('ExportGDButton'), Mojo.Event.tap, 
		this.exportModeData.bind(this));

	// MAP VIEW
	
	this.modelMapViewAddress = {value: "", disabled: false};
		
	this.controller.setupWidget("MapViewAddress", {'hintText': "Enter street address...", 
		'multiline': false, 'enterSubmits': false, 'requiresEnterKey': true, 'focus': true},
		this.modelMapViewAddress); 

	this.controller.listen(this.controller.get('MapViewAddress'), Mojo.Event.propertyChange, 
		this.updateMapLocation.bind(this));

	if(this.action == "pickLocation") {
/*
		if(document.body) {	
			var script = document.createElement("script");

			script.type = "text/javascript";
			script.src = "http://maps.google.com/maps/api/js?sensor=true";

//			script.onload = function(){ this.initializeGoogleMaps(); }.bind(this);
		
			document.body.appendChild(script);

			Mojo.Event.listen(document,"onload",this.initializeGoogleMaps.bind(this));

		}
*/
		this.initializeGoogleMaps();

		this.itemsCommandMenu = [
			{'label': $L("- Zoom"), 'command': "zoom_out"},
			{'width': 5},
			{'label': $L("Done"), 'command': "done", 'width': 100},
			{'width': 5},
			{'label': $L("Zoom +"), 'command': "zoom_in"} ];
	
		this.modelCommandMenu = {'visible': true, 'items': this.itemsCommandMenu};
		
		this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'no-fade'}, this.modelCommandMenu);
	}

	// CONFIGURE
	
	if(this.action == "emailAlert") {
		this.controller.serviceRequest("palm://com.palm.mail/", {
			'method': "accountList", 'parameters': {'subscribe': false}, 
			'onComplete': this.handleEmailAccounts.bind(this)} );

		var label = "Alert";
		
		var modelProperty = "emailAlert";
		
		this.defaultChoicesConfigSelector = [
			{'label': this.defaultChoice, 'value': -1},
			{'label': "Vibrate", 'value': 2},
			{'label': "System Sound", 'value': 1},
			{'label': "Ringtone", 'value': 3},
			{'label': "Mute", 'value': 0} ];

		this.itemsViewMenu = [{'label': "Email Alert Configuration", 'command': "", 'width': 320}];

		this.modelViewMenu = {'visible': true, 'items': this.itemsViewMenu};
	
		this.controller.setupWidget(Mojo.Menu.viewMenu, undefined, this.modelViewMenu);	
	}
	else if(this.action == "emailRingtone") {
		this.controller.serviceRequest("palm://com.palm.mail/", {
			'method': "accountList", 'parameters': {'subscribe': false}, 
			'onComplete': this.handleEmailAccounts.bind(this)} );

		var label = "Ringtone";
		
		var modelProperty = "emailRingtoneName";

		this.defaultChoicesConfigSelector = [
			{'label': this.defaultChoice, 'value': ""},
			{'label': "Select", 'value': "select"} ];  

		this.itemsViewMenu = [{'label': "Email Ringtone Configuration", 'command': "", 'width': 320}];

		this.modelViewMenu = {'visible': true, 'items': this.itemsViewMenu};
	
		this.controller.setupWidget(Mojo.Menu.viewMenu, undefined, this.modelViewMenu);	
	}
	else if(this.action == "emailSync") {
		this.controller.serviceRequest("palm://com.palm.mail/", {
			'method': "accountList", 'parameters': {'subscribe': false}, 
			'onComplete': this.handleEmailAccounts.bind(this)} );

		var label = "Get Email";
		
		var modelProperty = "emailSync";
		
		this.defaultChoicesConfigSelector = [
			{'label': this.defaultChoice, 'value': -1},
			{'label': "As Items Arrive", 'value': 0}, 
			{'label': "5 Minutes", 'value': 5},
			{'label': "10 Minutes", 'value': 10},
			{'label': "15 Minutes", 'value': 15},
			{'label': "30 Minutes", 'value': 30},
			{'label': "1 Hour", 'value': 60},
			{'label': "6 Hours", 'value': 360},		
			{'label': "12 Hours", 'value': 720},
			{'label': "24 Hours", 'value': 1440},		
			{'label': "Manual", 'value': 1000000} ];

		this.itemsViewMenu = [{'label': "Email Sync Configuration", 'command': "", 'width': 320}];

		this.modelViewMenu = {'visible': true, 'items': this.itemsViewMenu};
	
		this.controller.setupWidget(Mojo.Menu.viewMenu, undefined, this.modelViewMenu);	
	}
	else if(this.action == "imStatus") {
		this.controller.serviceRequest('palm://im.libpurpleext.greg/', { 
			'method': "GetAcceptBadCertSetting", 'parameters': {}, 
			'onSuccess': this.handleIMStatusTest.bind(this),
			'onFailure': this.handleIMStatusTest.bind(this)});

		var label = "Status";
		
		var modelProperty = "messagingIMStatus";

		this.defaultChoicesConfigSelector = [
			{'label': this.defaultChoice, 'value': -1},
			{'label': "Available", 'value': 0},
			{'label': "Busy", 'value': 2},
			{'label': "Sign Off", 'value': 4} ];

		this.itemsViewMenu = [{'label': "IM Status Configuration", 'command': "", 'width': 320}];

		this.modelViewMenu = {'visible': true, 'items': this.itemsViewMenu};

		this.controller.setupWidget(Mojo.Menu.viewMenu, undefined, this.modelViewMenu);	
	}
	else {
		var label = "";

		var modelProperty = "value";

		this.defaultChoicesConfigSelector = [];
	}
	
	this.modelSettingsList = {items: []};
	
	this.controller.setupWidget("SettingsList", {
		itemTemplate: 'scene/listitem-config',
		swipeToDelete: false,
		autoconfirmDelete: false,
		reorderable: false},
		this.modelSettingsList );

	this.controller.listen(this.controller.get('SettingsList'), Mojo.Event.propertyChange, 
		this.handleRingtoneSelect.bind(this));
		
	this.controller.setupWidget("ConfigSelector", {'label': label, 
		'labelPlacement': "left", 'modelProperty': modelProperty,
		'choices': this.defaultChoicesConfigSelector});

	this.modelDoneButton = {buttonClass: '', disabled: false};
	
	this.controller.setupWidget('DoneButton', 
		{label: "Done Configuring"}, this.modelDoneButton);
			
	this.controller.listen(this.controller.get('DoneButton'), Mojo.Event.tap, 
		this.close.bind(this));
}

//

SceneAssistant.prototype.handleEmailAccounts = function(response) {
	if(response.list) {
		for(var i = 0; i < response.list.length; i++) {
			this.controller.serviceRequest("palm://com.palm.mail/", {'method': "accountPreferences",
				'parameters': {'subscribe': false, 'account': response.list[i].id}, 
				'onComplete': this.handleEmailAccount.bind(this)} );
		}
	}
}

SceneAssistant.prototype.handleEmailAccount = function(response) {
	var emailAlert = -1;
	var emailRingtoneName = "";
	var emailRingtonePath = "";
	var emailSync = -1;

	for(var i = 0; i < this.configData.length; i++) {
		if(response.id == this.configData[i].accountId) {
			if(this.action == "emailAlert") {
				emailAlert = this.configData[i].emailAlert;
			}
			else if(this.action == "emailRingtone") {
				emailRingtoneName = this.configData[i].emailRingtone.name;
				emailRingtonePath = this.configData[i].emailRingtone.path;
			}
			else if(this.action == "emailSync") {
				emailSync = this.configData[i].emailSync;
			}
		
			break;
		}
	}
	
	if(this.action == "emailAlert") {
		this.modelSettingsList.items.push({
			'configTitle': response.name + " - " + response.originalLogin, 
			'accountId': response.id,
			'emailAlert': emailAlert});
	}
	else if(this.action == "emailRingtone") {
		this.modelSettingsList.items.push({
			'configTitle': response.name + " - " + response.originalLogin, 
			'accountId': response.id,
			'emailRingtoneName': emailRingtoneName,
			'emailRingtonePath': emailRingtonePath});
	}
	else if(this.action == "emailSync") {
		this.modelSettingsList.items.push({
			'configTitle': response.name + " - " + response.originalLogin, 
			'accountId': response.id,
			'emailSync': emailSync});
	}

	this.controller.modelChanged(this.modelSettingsList, this);
}

//

SceneAssistant.prototype.handleIMStatusTest = function(response) {
	if(response.errorCode != undefined)
		this.showIMStatusError(response);
	else {
		this.controller.serviceRequest('palm://com.palm.messaging/', { 
			'method': "getAccountList", 'parameters': {'subscribe': false}, 
			'onSuccess': this.handleIMAccounts.bind(this, 0),
			'onFailure': this.showIMStatusError.bind(this)});
	}
}

SceneAssistant.prototype.showIMStatusError = function(response) {
	this.controller.get('ErrorText').update(
		"Unable to retrieve per account configuration. " +
		"Maybe you don't have messaging plugins installed?");
}

SceneAssistant.prototype.handleIMAccounts = function(index, response) {
	if(index < response.list.length) {
		var messagingIMStatus = -1;
	
		for(var i = 0; i < this.configData.length; i++) {
			if(response.list[index].accountId == this.configData[i].accountId) {
				messagingIMStatus = this.configData[i].messagingIMStatus;
			
				break;
			}
		}

		this.modelSettingsList.items.push({
			'configTitle': response.list[index].accountDisplayName + " - " + response.list[index].username, 
			'accountId': response.list[index].accountId,
			'accountDomain': response.list[index].domain,
			'accountUsername': response.list[index].username,
			'messagingIMStatus': messagingIMStatus});

		this.controller.modelChanged(this.modelSettingsList, this);

		this.handleIMAccounts(++index, response);
	}
}

//

SceneAssistant.prototype.handleRingtoneSelect = function(event) {
	if(this.action == "emailRingtone") {
		event.model.emailRingtoneName = "";		
		event.model.emailRingtonePath = "";		
		
		this.controller.modelChanged(event.model, this);

		if(event.value == "select") {
			this.executeRingtoneSelect(event.model);
		}
	}
}

//

SceneAssistant.prototype.executeRingtoneSelect = function(config) {
	Mojo.FilePicker.pickFile({'defaultKind': "ringtone", 'kinds': ["ringtone"], 
		'actionType': "attach", 'actionName': "Done", 'onSelect': 
			function(config, payload) {
				config.emailRingtoneName = payload.name;
				config.emailRingtonePath = payload.fullPath;
				
				this.controller.modelChanged(config, this);
			}.bind(this, config)},
		this.controller.stageController);
}

//

SceneAssistant.prototype.openUrl = function(link) {
	if(link == "wiki")
		window.open('http://www.webos-internals.org/wiki/Application:ModeSwitcher');
	else if(link == "manual")
		window.open('http://www.improvmasta.org/palm/modeswitcher-manual-current.pdf');
	else if(link == "forum")
		window.open('http://forums.precentral.net/homebrew-apps/224544-mode-switcher.html');
}

SceneAssistant.prototype.sendEmail = function(link) {
	this.controller.serviceRequest("palm://com.palm.applicationManager", {
	  method: 'open', parameters: {id: "com.palm.app.email", params: {
       summary: "Mode Switcher Question",
       text: "If you think that Mode Switcher is not working correctly then please use the 'Report Problem' action in the menu instead of sending this email. Also before contacting me you should have tried to find answer to your question from other resources such as the Wiki, Manual and Forum.",
       recipients: [{
           type:"email",
           role:1,
           value:"scorpio.iix@gmail.com",
           contactDisplay:"Mode Switcher Author"
       }]}}}); 
}

//

SceneAssistant.prototype.listGoogleDocuments = function(event) {
	var match = "MSMODE";

	if(this.modelImportGDMatch.value.length > 0)
		match += "+" + this.modelImportGDMatch.value.replace(" ", "+");
	
	var order = "orderby=" + this.modelImportGDOrdering.value;
	
	var private = "/-/private";
	
	if(this.modelImportGDShare.value)
		private = "";
	
	this.modelImportGDButton.disabled = true;

	this.controller.modelChanged(this.modelImportGDButton, this);

	new Ajax.Request("https://www.google.com/accounts/ClientLogin?accountType=HOSTED_OR_GOOGLE&Email=" + this.modelImportGDUsername.value + "&Passwd=" + encodeURIComponent(this.modelImportGDPassword.value) + "&service=writely&source=ModeSwitcher", {
		method: "post",
		onSuccess: function(response) { 
			var auth = response.responseText.split("\n")[2].split("=")[1];

			new Ajax.Request("http://docs.google.com/feeds/documents/private/full" + private + "?alt=json&title=" + match + "&" + order, {
				method: "get",
				contentType: "application/atom+xml",
				evalJSON: true,
				encoding: null,
				requestHeaders: {
					"GData-Version": "2.0",
					"Authorization": "GoogleLogin auth=" + auth
				},
				onSuccess: function(response) {
					var data;

					try {
						data = Mojo.parseJSON(response.responseText);
					} catch (e) {
					}

					this.modelImportGDList.items.clear();

					if(data) {
						for(var i = 0; i < data.feed.entry.length; i++) {
							var info = data.feed.entry[i].title['$t'].split(" - ");

							this.modelImportGDList.items.push({'label': info[1], 'desc': info[2], 'value': data.feed.entry[i].id['$t']});

							this.viewLevel = 1;

							this.controller.get('import').hide();
							this.controller.get('import-list').show();
							
							this.controller.modelChanged(this.modelImportGDList, this);
						}
					}
					else {
						this.controller.showAlertDialog({
							title: "Unable to list documents!",
							message: "<div align='justify'>" + "Received invalid JSON response from Google Docs." + "</div>",
							choices:[{label:$L("OK"), value:"ok", type:'default'}],
							preventCancel: true,
							allowHTMLMessage: true}); 
					}

					this.modelImportGDButton.disabled = false;

					this.controller.modelChanged(this.modelImportGDButton, this);
				}.bind(this),
				onFailure: function(response) { 
					this.controller.showAlertDialog({
							title: "Unable to list documents!",
							message: "<div align='justify'>" + "Failed to receive documents list from Google Docs." + "</div>",
							choices:[{label:$L("OK"), value:"ok", type:'default'}],
							preventCancel: true,
							allowHTMLMessage: true});  

					this.modelImportGDButton.disabled = false;

					this.controller.modelChanged(this.modelImportGDButton, this);
				}.bind(this)
			});
		}.bind(this),
		onFailure: function(response) { 
			this.controller.showAlertDialog({
				title: $L("Unable to login!"),
				message: "<div align='justify'>" + $L("Login to Google Docs failed, please check your username and password.") + "</div>",
				choices:[{label:$L("OK"), value:"ok", type:'default'}],
				preventCancel: true,
				allowHTMLMessage: true}); 

			this.modelImportGDButton.disabled = false;

			this.controller.modelChanged(this.modelImportGDButton, this);
		}.bind(this)
	});  
}

SceneAssistant.prototype.importModeData = function(event) {
	this.controller.stopListening(this.controller.get("ImportGDList"), Mojo.Event.listTap, 
		this.handlerImportModeData);

	var url = event.item.value.replace("documents/private/full/document%3A", "download/documents/Export?docID=");

	new Ajax.Request("https://www.google.com/accounts/ClientLogin?accountType=HOSTED_OR_GOOGLE&Email=" + this.modelImportGDUsername.value + "&Passwd=" + encodeURIComponent(this.modelImportGDPassword.value) + "&service=writely&source=ModeSwitcher", {
		method: "post",
		onSuccess: function(response) { 
			var auth = response.responseText.split("\n")[2].split("=")[1];
			
			new Ajax.Request(url + "&exportFormat=txt", {
				method: "get",
				contentType: "text/plain",
				evalJSON: true,
				encoding: null,
				requestHeaders: {
					"GData-Version": "2.0",
					"Authorization": "GoogleLogin auth=" + auth
				},
				onSuccess: function(response) {
					var mode;

					try {
						mode = Mojo.parseJSON(response.responseText);
					} catch (e) {
					}

					if(mode) {
						if(this.callback)
							this.callback(mode);	

						this.controller.stageController.popScene();
					}
					else {
						this.controller.showAlertDialog({
							title: $L("Invalid JSON data received!"),
							message: "<div align='justify'>" + $L("The received document data was not in proper JSON format.") + "</div>",
							choices:[{label:$L("OK"), value:"ok", type:'default'}],
							preventCancel: true,
							allowHTMLMessage: true}); 
					}
				}.bind(this),
				onFailure: function(response) { 
					this.controller.showAlertDialog({
						title: $L("Unable to download!"),
						message: "<div align='justify'>" + $L("Downloading from Google Docs failed, please try again later.") + "</div>",
						choices:[{label:$L("OK"), value:"ok", type:'default'}],
						preventCancel: true,
						allowHTMLMessage: true}); 
				}.bind(this)
			});
		}.bind(this),
		onFailure: function(response) { 
			this.controller.showAlertDialog({
				title: $L("Unable to login!"),
				message: "<div align='justify'>" + $L("Login to Google Docs failed, please check your username and password.") + "</div>",
				choices:[{label:$L("OK"), value:"ok", type:'default'}],
				preventCancel: true,
				allowHTMLMessage: true}); 
		}.bind(this)
	});  
}

SceneAssistant.prototype.exportModeData = function(event) {
	this.modelExportGDButton.disabled = true;
	
	this.controller.modelChanged(this.modelExportGDButton, this);

	var modeData = Object.toJSON(this.data);

	if(this.modelExportGDTitle.value.length > 0)
		var modeName = encodeURIComponent(this.modelExportGDTitle.value.replace("/", "_").replace("-", "_"));
	else
		var modeName = this.data.name + " by Unknown";

	if(this.modelExportGDDesc.value.length > 0)
		var modeDesc = encodeURIComponent(this.modelExportGDDesc.value.replace("/", "_").replace("-", "_"));
	else
		var modeDesc = "No description";

	new Ajax.Request("https://www.google.com/accounts/ClientLogin?accountType=HOSTED_OR_GOOGLE&Email=" + this.modelExportGDUsername.value + "&Passwd=" + encodeURIComponent(this.modelExportGDPassword.value) + "&service=writely&source=ModeSwitcher", {
		method: "post",
		onSuccess: function(response) { 
			var auth = response.responseText.split("\n")[2].split("=")[1];

			new Ajax.Request("http://docs.google.com/feeds/documents/private/full?alt=json", {
				method: "post",
				contentType: "text/plain",
				postBody: modeData,
				evalJSON: true,
				encoding: null,
				requestHeaders: {
					"GData-Version": "2.0",
					"Content-Type": "text/plain",
					"Authorization": "GoogleLogin auth=" + auth,
					"Slug": "MSMODE - " + modeName + " - " + modeDesc
				},
				onSuccess: function(response) {
					if(this.modelExportGDShare.value) {
						var aclData = "<entry xmlns='http://www.w3.org/2005/Atom' xmlns:gAcl='http://schemas.google.com/acl/2007'><category scheme='http://schemas.google.com/g/2005#kind' term='http://schemas.google.com/acl/2007#accessRule'/><gAcl:role value='reader'/><gAcl:scope type='user' value='mode-switcher@googlegroups.com'/></entry>";

						var url = response.responseJSON.entry.id['$t'].replace("/documents", "/acl");

						new Ajax.Request(url, {
							method: "post",
							contentType: "application/atom+xml",
							postBody: aclData,
							encoding: null,
							requestHeaders: {
								"GData-Version": "2.0",
								"Content-Type": "application/atom+xml",
								"Authorization": "GoogleLogin auth=" + auth
							},
							onSuccess: function(response) {
								this.controller.stageController.popScene();
							}.bind(this),
							onFailure: function(response) {
								this.controller.showAlertDialog({
									title: $L("Unable to share!"),
									message: "<div align='justify'>" + $L("Sharing of Google Docs document failed, please try again later.") + "</div>",
									choices:[{label:$L("OK"), value:"ok", type:'default'}],
									preventCancel: true,
									allowHTMLMessage: true}); 

								this.modelExportGDButton.disabled = false;
	
								this.controller.modelChanged(this.modelExportGDButton, this);
							}.bind(this)
						});
					}
					else
						this.controller.stageController.popScene();				
				}.bind(this),
				onFailure: function(response) { 
					this.controller.showAlertDialog({
						title: $L("Unable to upload!"),
						message: "<div align='justify'>" + $L("Uploading to Google Docs failed, please try again later.") + "</div>",
						choices:[{label:$L("OK"), value:"ok", type:'default'}],
						preventCancel: true,
						allowHTMLMessage: true}); 

					this.modelExportGDButton.disabled = false;
	
					this.controller.modelChanged(this.modelExportGDButton, this);
				}.bind(this)
			});  
		}.bind(this),
		onFailure: function(response) { 
			Mojo.Log.error("Login to Google Docs failed: " + response.responseText);
		
			this.controller.showAlertDialog({
				title: $L("Unable to login!"),
				message: "<div align='justify'>" + $L("Login to Google Docs failed, please check your username and password.") + "</div>",
				choices:[{label:$L("OK"), value:"ok", type:'default'}],
				preventCancel: true,
				allowHTMLMessage: true}); 

			this.modelExportGDButton.disabled = false;
	
			this.controller.modelChanged(this.modelExportGDButton, this);
		}.bind(this)
	});  
}

//

SceneAssistant.prototype.initializeGoogleMaps = function() {
	if(this.data)
		var latlng = new google.maps.LatLng(this.data.lat, this.data.lng);
	else
		var latlng = new google.maps.LatLng(64.000, 26.000);
		
	var mapOptions = {
		'zoom': 5,
		'center': latlng,
		'mapTypeId': google.maps.MapTypeId.ROADMAP,
		'draggable': true,
		'mapTypeControl': false,
		'scaleControl': false,
		'navigationControl': false };

	this.map = new google.maps.Map(this.controller.get("MapViewCanvas"), mapOptions);

	this.marker = new google.maps.Marker({
		'position': latlng, 
		'map': this.map, 
		'title': "Location" });
  
	google.maps.event.addListener(this.map, 'click', function(event) {
		this.marker.setPosition(event.latLng);
	}.bind(this));
	
	this.geocoder = new google.maps.Geocoder();
}

SceneAssistant.prototype.updateMapLocation = function(event) {
	this.geocoder.geocode({'address': this.modelMapViewAddress.value}, function(results, status) {
		if(status == google.maps.GeocoderStatus.OK) {
			if(results.length > 0) {
				var latlng = new google.maps.LatLng(results[0].geometry.location.lat, results[0].geometry.location.lng);

				this.map.setCenter(latlng);
				this.map.setZoom(12);
				this.marker.setPosition(latlng);
			}
		}
	}.bind(this));
}

//

SceneAssistant.prototype.handleCommand = function(event) {
	if(event.type == Mojo.Event.back) {
		event.stop();

		if(this.viewLevel > 0) {
			this.viewLevel--;
	
			this.controller.listen(this.controller.get("ImportGDList"), Mojo.Event.listTap, 
				this.handlerImportModeData);

			this.controller.get('import-list').hide();
			this.controller.get('import').show();
		}
		else
			this.controller.stageController.popScene();			
	}
	else if(event.command == "zoom_out") {
		var zoom = this.map.getZoom();
		if(zoom > 0)
			zoom--;
			
		this.map.setZoom(zoom);
	}
	else if(event.command == "zoom_in") {
		var zoom = this.map.getZoom();
		if(zoom < 20)
			zoom++;
			
		this.map.setZoom(zoom);
	}
	else if(event.command == "done") {
		if(this.callback) {
			var latlng = this.marker.getPosition();
			
			this.callback(latlng.b, latlng.c, true);
			
			this.controller.stageController.popScene();			
		}
	}
}

//

SceneAssistant.prototype.close = function() {
	if(this.action == "launch")
		this.controller.window.close();
	else {
		for(var i = 0; i < this.modelSettingsList.items.length; i++) {
			delete this.modelSettingsList.items[i]['configTitle'];
			
			if(this.action == "emailRingtone") {
				var ringtone = {
					'name': this.modelSettingsList.items[i].emailRingtoneName,
					'path': this.modelSettingsList.items[i].emailRingtonePath };
								
				this.modelSettingsList.items[i].emailRingtone = ringtone;

				delete this.modelSettingsList.items[i]['emailRingtoneName'];
				delete this.modelSettingsList.items[i]['emailRingtonePath'];
			}
		}
		
		if(this.callback)
			this.callback(this.modelSettingsList.items, true);
	
		this.controller.stageController.popScene();
	}
}

//

SceneAssistant.prototype.cleanup = function() {
}

SceneAssistant.prototype.activate = function() {
	if(this.action == "launch")
		setTimeout(this.close.bind(this), 100);
}

SceneAssistant.prototype.deactivate = function() {
}

