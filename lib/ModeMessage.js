/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

function ModeMessage(channel, mode, user) {
	this.channel = channel;
	this.mode    = mode;
	this.user    = user;
}

ModeMessage.prototype = {
	getChannel: function() {
		return this.channel;
	},

	getMode: function() {
		return this.mode;
	},

	getUser: function() {
		return this.user;
	},

	getUsername: function() {
		return this.user.getName();
	},

	getChange: function() {
		return this.mode.charAt(0);
	},

	equals: function(text) {
		return text === this.getMode();
	},

	isOnChannel: function(channel) {
		return this.channel.equals(channel);
	},

	isFrom: function(user) {
		return false;
	},

	respond: function(text) {
		return this.channel.say(text);
	}
};

module.exports = ModeMessage;
