/*
 * Copyright (c) 2015, Sgt. Kabukiman, https://github.com/sgt-kabukiman
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

function TextMessage(channel, user, message, isAction) {
	this.channel   = channel;
	this.user      = user;
	this.message   = message;
	this.processed = false;
	this.isAction  = !!isAction;
}

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
		return (this.isAction ? '/me ' : '') + this.message;
	},

	equals: function(text) {
		return text === this.getMessage();
	},

	isOnChannel: function(channel) {
		return this.channel.equals(channel);
	},

	isFrom: function(user) {
		return this.user.equals(user);
	},

	isAction: function() {
		return this.action;
	},

	getActionMessage: function() {
		return this.message;
	},

	setProcessed: function(flag) {
		this.processed = !!flag;
	},

	isProcessed: function() {
		return this.processed;
	},

	respond: function(text, recipient, forceSend) {
		if (this.processed === true && forceSend !== true) return;
		this.processed = true;

		return this.channel.say(recipient === false ? text : (this.getUsername() + ', ' + text), this);
	},

	respondToAll: function(text, forceSend) {
		return this.respond(text, false, forceSend);
	}
};

module.exports = TextMessage;
