/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	ModeMessage   = require('./../ModeMessage.js'),
	TextMessage   = require('./../TextMessage.js'),
	TwitchMessage = require('./../TwitchMessage.js');

var CorePlugin = function(database) {
	this.db = database;
};

CorePlugin.prototype = {
	process: function(message, twitch) {
		if (message instanceof TwitchMessage) {
			message = this.processTwitchMessage(message, twitch);
		}
		else if (message instanceof ModeMessage) {
			message = this.processModeMessage(message, twitch);
		}
		else {
			message = this.processTextMessage(message, twitch);
		}

		return message;
	},

	processTwitchMessage: function(message, twitch) {
		var
			args     = message.getArgs(),
			username = message.getUsername();

		switch (message.getCommand()) {
			case 'specialuser':
				this.onSpecialuserCommand(username, args, twitch);
				break;

			default:
				// ignore emoteset, clearchat and usercolor for now
		}

		return message;
	},

	processModeMessage: function(message, twitch) {
		var
			channel  = message.getChannel(),
			username = message.getUsername();

		switch (message.getMode()) {
			case '+o':
				channel.addModerator(username);
				break;

			case '-o':
				channel.removeModerator(username);
				break;

			default:
				console.log('Unknown mode encountered: ' + message.getMode());
		}

		return message;
	},

	processTextMessage: function(message, twitch) {
		var user = message.getUser(), username = user.getName();

		user.setOperator(twitch.isOperator(username));
		user.setTurbo(twitch.isTurboUser(username));
		user.setTwitchAdmin(twitch.isTwitchAdmin(username));
		user.setTwitchStaff(twitch.isTwitchStaff(username));
		user.setSubscriber(twitch.takeHomelessSubscriber(username));

		return message;
	},

	onSpecialuserCommand: function(username, args, twitch) {
		switch (args[1]) {
			case 'turbo':
				twitch.addTurboUser(username);
				break;

			case 'staff':
				twitch.addTwitchStaff(username);
				break;

			case 'admin':
				twitch.addTwitchAdmin(username);
				break;

			// Subscribers are a special case, as they are not global (like turbo), but transmitted
			// without the information to which channel the subscriber status is granted. As we can
			// be connected to a number of channels with one IRC connection, we need to take an
			// educated guess to what channel the status belongs.
			// Because the SPECIALUSER line is sent (ideally) directly before a user's message, we
			// can remember the information now and see in what channel the user's message appears.
			// This works as long as there is no huge Twitch delay and the user does not post in the
			// same channels at the same time, causing mixed-up lines on the IRC connection.
			// To mitigate the risk of detecting someone wrong, we only use the subscriber status
			// once to handle the next message (the same one that actually determined the channel).
			case 'subscriber':
				twitch.addHomelessSubscriber(username);
				break;

			default:
				console.log('Unknown specialuser rank found: ' + args[1] + ' for user ' + username);
		}
	}
};

module.exports = CorePlugin;
