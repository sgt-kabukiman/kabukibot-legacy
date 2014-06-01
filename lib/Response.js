/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

function Response(channel, message, responseTo) {
	this.channel    = channel;
	this.message    = message;
	this.responseTo = responseTo || null;
}

Response.prototype = {
	getChannel: function() {
		return this.channel;
	},

	getMessage: function() {
		return this.message;
	},

	getResponseTo: function() {
		return this.responseTo;
	},

	equals: function(text) {
		return text === this.getMessage();
	},

	isOnChannel: function(channel) {
		return this.channel.equals(channel);
	}
};

module.exports = Response;
