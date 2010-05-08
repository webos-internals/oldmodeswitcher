function ServiceRequest() {
	this.requestId = 0;
	this.requests = {};
}

//

ServiceRequest.prototype.request = function(url, optionsIn, resubscribe) {
	var options = Object.clone(optionsIn),

	requestId = this.requestId++;

	options.onComplete = this.completeHandler.bind(this, url, optionsIn, requestId);

	this.requests[requestId] = new Mojo.Service.Request(url, options, resubscribe);

	return this.requests[requestId];
}

ServiceRequest.prototype.completeHandler = function(url, optionsIn, requestId, response) {
	delete this.requests[requestId];

	optionsIn.onComplete && optionsIn.onComplete(response);
}

