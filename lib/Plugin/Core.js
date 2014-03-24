/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

function CorePlugin() {
	this.log      = null;
	this.userMngr = null;
	this.botName  = null;
}

CorePlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		eventDispatcher.onText(null, this.onTextMessage.bind(this));
		eventDispatcher.onMode(null, this.onModeMessage.bind(this));
		eventDispatcher.onTwitch(this.onTwitchMessage.bind(this));

		this.log      = kabukibot.getLog();
		this.userMngr = kabukibot.getUserManager();
		this.botName  = kabukibot.getBotName();
	},

	getKey: function() {
		return null;
	},

	onTextMessage: function(message) {
		var user = message.getUser(), username = user.getName(), mngr = this.userMngr;

		user.setOperator(mngr.isOperator(username));
		user.setTurbo(mngr.isTurboUser(username));
		user.setTwitchAdmin(mngr.isTwitchAdmin(username));
		user.setTwitchStaff(mngr.isTwitchStaff(username));
		user.setSubscriber(mngr.takeHomelessSubscriber(username));
		user.setEmoteSets(mngr.getEmoteSets(username));
		user.setBot(username === this.botName);
	},

	onTwitchMessage: function(message) {
		var
			args     = message.getArgs(),
			username = message.getUsername();

		switch (message.getCommand()) {
			case 'specialuser':
				this.onSpecialuserCommand(username, args);
				break;

			case 'emoteset':
				this.onEmotesetCommand(username, args);
				break;

			default:
				// ignore clearchat and usercolor for now
		}
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
				this.log.error('Unknown mode encountered: ' + message.getMode());
		}
	},

	onSpecialuserCommand: function(username, args) {
		switch (args[1]) {
			case 'turbo':
				this.userMngr.addTurboUser(username);
				break;

			case 'staff':
				this.userMngr.addTwitchStaff(username);
				break;

			case 'admin':
				this.userMngr.addTwitchAdmin(username);
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
				this.userMngr.addHomelessSubscriber(username);
				break;

			default:
				this.log.error('Unknown specialuser rank found: ' + args[1] + ' for user ' + username);
		}
	},

	onEmotesetCommand: function(username, args) {
		// args = ['username', '[id,id,id]']
		// We're allowing spaces in the id list, just because why not. If there are ever spaces, the
		// args look like this:
		// args = ['username', '[id,', 'id,', 'id]']

		var sets = args.slice(1).join('');

		try {
			sets = JSON.parse(sets);
		}
		catch (e) {
			this.log.error('EMOTESET is not valid JSON: "' + sets + '" yields ' + e.message);
		}

		this.userMngr.setEmoteSets(username, sets);
	}
};

module.exports = CorePlugin;
