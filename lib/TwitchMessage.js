/*
 * Copyright (c) 2015, Sgt. Kabukiman, https://github.com/sgt-kabukiman
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

function TwitchMessage(channel, command, args) {
	this.channel   = channel;
	this.command   = command.toLowerCase();
	this.args      = args;
	this.processed = false;
}

TwitchMessage.prototype = {
	getChannel: function() {
		return this.channel;
	},

	getCommand: function() {
		return this.command;
	},

	getArgs: function() {
		return this.args;
	},

	getUsername: function() {
		var c = this.getCommand();

		if (c === 'usercolor' || c === 'specialuser' || c === 'clearchat' || c === 'emoteset' || c === 'subscriber') {
			return this.args.length > 0 ? this.args[0] : null;
		}

		return null;
	},

	equals: function(text) {
		return text === (this.getCommand() + ' ' + this.args.join(' ')).trim();
	},

	isOnChannel: function(channel) {
		return this.channel.equals(channel);
	},

	isFrom: function(user) {
		return false;
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

TwitchMessage.fromIrcMessage = function(channel, sender, text) {
	if (sender === 'twitchnotify') {
		var match = text.match(/^([a-z0-9_]+) just subscribed!$/i);

		if (match) {
			return new TwitchMessage(channel, 'SUBSCRIBER', [match[1]]);
		}

		return new TwitchMessage(channel, '???', []);
	}

	var
		parts   = text.split(' ', 3), // text = 'COMMAND [user] [stuff]'
		command = parts[0].toLowerCase();

	parts = parts.slice(1);

	return new TwitchMessage(channel, command, parts);
};

module.exports = TwitchMessage;
