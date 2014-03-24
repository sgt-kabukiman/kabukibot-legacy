/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

function ChattyContentPlugin() {
	this.acl      = null;
	this.listener = null;
	this.dict     = null;
	this.commands = {
		'chatty':      'chatty_info',
		'chatty_url':  'chatty_url',
		'chatty_link': 'chatty_url'
	};
}

ChattyContentPlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		this.acl      = kabukibot.getACL();
		this.listener = this.onCommand.bind(this);
		this.dict     = kabukibot.getDictionary();

		this.dict
			.add('chatty_info', 'Chatty is a Java-based, standalone chat client for Twitch. Get it for free at http://getchatty.sourceforge.net/.')
			.add('chatty_url',  'Chatty can be downloaded for free at http://getchatty.sourceforge.net/.')
		;
	},

	getKey: function() {
		return 'chatty';
	},

	getACLTokens: function() {
		return ['chatty_commands'];
	},

	load: function(channel, kabukibot, eventDispatcher) {
		eventDispatcher.onCommand(channel.getIrcName(), this.listener);
	},

	unload: function(channel, kabukibot, eventDispatcher) {
		eventDispatcher.removeCommandListener(channel.getIrcName(), this.listener);
	},

	onCommand: function(command, args, message) {
		if (!this.acl.isAllowed(message.getUser(), 'chatty_commands')) {
			return;
		}

		if (command in this.commands) {
			message.respondToAll(this.dict.get(this.commands[command]));
		}
	}
};

module.exports = ChattyContentPlugin;
