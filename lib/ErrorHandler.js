/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

function ErrorHandler(log, ravenClient) {
	this.log   = log;
	this.raven = ravenClient;
}

ErrorHandler.prototype = {
	handleError: function(e) {
		this.log.error(e);

		if (this.raven) {
			this.raven.captureError(e);
		}
	},

	patchGlobal: function() {
		process.on('uncaughtException', this.handleError.bind(this));
	}
};

module.exports = ErrorHandler;
