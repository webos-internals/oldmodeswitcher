function BluetoothConfig() {
}

BluetoothConfig.prototype.version = function() {
	return "1.1";
}

BluetoothConfig.prototype.label = function() {
	return $L("BT Connection Trigger");
}

//

BluetoothConfig.prototype.activate = function() {
}

BluetoothConfig.prototype.deactivate = function() {
}

//

BluetoothConfig.prototype.setup = function(sceneController) {
	this.controller = sceneController;

	this.choicesProfileStateSelector = [
		{'label': $L("Connected"), 'value': 0},
		{'label': $L("Disconnected"), 'value': 1},
		{'label': $L("Connected to"), 'value': 2},
		{'label': $L("Disconnected from"), 'value': 3} ];
		
	sceneController.setupWidget("BluetoothStateSelector", {'label': $L("State"),
		'labelPlacement': "left", 'modelProperty': "bluetoothState",
		'choices': this.choicesProfileStateSelector});        

	this.choicesProfileSelector = [
		{'label': $L("Any Profile"), 'value': "any"},
		{'label': $L("Stereo Music"), 'value': "a2dp"},
		{'label': $L("AV Remote Control"), 'value': "avrcp"},
		{'label': $L("Hands-Free"), 'value': "hfg"},
		{'label': $L("Headset"), 'value': "hsp"},
		{'label': $L("Personal Area Network"), 'value': "pan"},
		{'label': $L("Phone Book Access"), 'value': "pba"} ];

	sceneController.setupWidget("BluetoothProfileSelector", {'label': $L("Profile"),
		'labelPlacement': "left", 'modelProperty': "bluetoothProfile",
		'choices': this.choicesProfileSelector});        

	sceneController.setupWidget("BluetoothDeviceText", {'hintText': $L("Bluetooth Device Name"), 
		'multiline': false, 'enterSubmits': false, 'focus': true, 
		'textCase': Mojo.Widget.steModeLowerCase, 'modelProperty': "bluetoothDevice"}); 

	// Listen for state selector change event

	sceneController.listen(sceneController.get("TriggersList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

BluetoothConfig.prototype.config = function() {
	var triggerConfig = {
		'bluetoothTitle': $L("BT Connection"),
		'bluetoothState': 0,
		'bluetoothProfile': "any",
		'bluetoothDevice': "",
		'bluetoothProfileRow': "last",
		'bluetoothDeviceDisplay': "none" };
	
	return triggerConfig;
}

//

BluetoothConfig.prototype.load = function(triggerPreferences) {
	var row = "last";
	var display = "none";

	if(triggerPreferences.bluetoothState >= 2) {
		row = "";
		display = "block";
	}

	var triggerConfig = {
		'bluetoothTitle': $L("BT Connection"),
		'bluetoothState': triggerPreferences.bluetoothState,
		'bluetoothProfile': triggerPreferences.bluetoothProfile,
		'bluetoothDevice': triggerPreferences.bluetoothDevice,
		'bluetoothProfileRow': row,
		'bluetoothDeviceDisplay': display };
	
	return triggerConfig;
}

BluetoothConfig.prototype.save = function(triggerConfig) {
	var triggerPreferences = {
		'bluetoothState': triggerConfig.bluetoothState,
		'bluetoothProfile': triggerConfig.bluetoothProfile,
		'bluetoothDevice': triggerConfig.bluetoothDevice };
	
	return triggerPreferences;
}

//

BluetoothConfig.prototype.handleListChange = function(changeEvent) {
	if(changeEvent.property == "bluetoothState") {
		if(changeEvent.value >= 2) {
			changeEvent.model.bluetoothProfileRow = "";			
			changeEvent.model.bluetoothDeviceDisplay = "block";
		}
		else {
			changeEvent.model.bluetoothProfileRow = "last";			
			changeEvent.model.bluetoothDeviceDisplay = "none";
		}
		
		var state = this.controller.get('mojo-scene-editmode-scene-scroller').mojo.getState();

		this.controller.get("TriggersList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-editmode-scene-scroller').mojo.setState(state);
	}
}

