/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var CorePlugin = function() {
	this.twitch = null;
};

CorePlugin.prototype = {
	setup: function(twitch, eventDispatcher) {
		eventDispatcher.onText(null, this.onTextMessage.bind(this));
		eventDispatcher.onMode(null, this.onModeMessage.bind(this));
		eventDispatcher.onTwitch(this.onTwitchMessage.bind(this));

		this.twitch = twitch;
	},

	onTextMessage: function(message) {
		var user = message.getUser(), username = user.getName();

		user.setOperator(this.twitch.isOperator(username));
		user.setTurbo(this.twitch.isTurboUser(username));
		user.setTwitchAdmin(this.twitch.isTwitchAdmin(username));
		user.setTwitchStaff(this.twitch.isTwitchStaff(username));
		user.setSubscriber(this.twitch.takeHomelessSubscriber(username));
	},

	onTwitchMessage: function(message) {
		var
			args     = message.getArgs(),
			username = message.getUsername();

		switch (message.getCommand()) {
			case 'specialuser':
				this.onSpecialuserCommand(username, args);
				break;

			default:
				// ignore emoteset, clearchat and usercolor for now
		}

		return message;
	},

	onModeMessage: function(message) {
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
				this.twitch.getLog().error('Unknown mode encountered: ' + message.getMode());
		}

		return message;
	},

	onSpecialuserCommand: function(username, args) {
		switch (args[1]) {
			case 'turbo':
				this.twitch.addTurboUser(username);
				break;

			case 'staff':
				this.twitch.addTwitchStaff(username);
				break;

			case 'admin':
				this.twitch.addTwitchAdmin(username);
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
				this.twitch.addHomelessSubscriber(username);
				break;

			default:
				this.twitch.getLog().error('Unknown specialuser rank found: ' + args[1] + ' for user ' + username);
		}
	}
};

module.exports = CorePlugin;
