function SceneAssistant () {
}

SceneAssistant.prototype.setup = function() {
}

SceneAssistant.prototype.close = function() {
	this.controller.window.close();
}

SceneAssistant.prototype.cleanup = function() {
}

SceneAssistant.prototype.activate = function() {

	setTimeout(this.close.bind(this), 100);
}

SceneAssistant.prototype.deactivate = function() {
}

