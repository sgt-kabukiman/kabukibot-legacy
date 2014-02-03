/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var TextMessage = function(channel, user, message) {
	this.channel = channel;
	this.user    = user;
	this.message = message;
};

TextMessage.prototype = {
	getChannel: function() {
		return this.channel;
	},

	getUser: function() {
		return this.user;
	},

	getUsername: function() {
		return this.user.getName();
	},

	getMessage: function() {
		return this.message;
	},

	equals: function(text) {
		return text === this.getMessage();
	},

	isOnChannel: function(channel) {
		return this.channel.equals(channel);
	},

	isFrom: function(user) {
		return this.user.equals(user);
	}
};

module.exports = TextMessage;
