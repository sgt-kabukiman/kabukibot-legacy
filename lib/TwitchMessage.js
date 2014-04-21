/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

function TwitchMessage(channel, command, args) {
	this.channel = channel;
	this.command = command.toLowerCase();
	this.args    = args;
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

		if (c === 'usercolor' || c === 'specialuser' || c === 'clearchat' || c === 'emoteset') {
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
	}
};

TwitchMessage.fromIrcMessage = function(channel, text) {
	var
		parts   = text.split(' ', 3), // text = 'COMMAND [user] [stuff]'
		command = parts[0].toLowerCase();

	parts = parts.slice(1);

	return new TwitchMessage(channel, command, parts);
};

module.exports = TwitchMessage;
