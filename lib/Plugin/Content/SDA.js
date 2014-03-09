/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var SDAContentPlugin = function() {
	this.acl      = null;
	this.listener = null;
};

SDAContentPlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		this.acl      = kabukibot.getACL();
		this.listener = this.onCommand.bind(this);
	},

	getKey: function() {
		return 'sda';
	},

	getACLTokens: function() {
		return ['sda'];
	},

	load: function(channel, kabukibot, eventDispatcher) {
		eventDispatcher.onCommand(channel.getIrcName(), this.listener);
	},

	unload: function(channel, kabukibot, eventDispatcher) {
		eventDispatcher.removeCommandListener(channel.getIrcName(), this.listener);
	},

	onCommand: function(command, args, message) {
		if (!this.acl.isAllowed(message.getUser(), 'sda')) {
			return;
		}

		switch (command) {
			case 'agdq':
				message.respond('AGDQ stands for Awesome Games Done Quick, an annual charity speedrunning marathon held in the US. It traditionally collects money for the Prevent Cancer Foundation.');
				return;

			case 'sgdq':
				message.respond('SGDQ stands for Summer Games Done Quick, the summer version of AGDQ. It\'s an annual charity speedrunning marathon.');
				return;
		}
	}
};

module.exports = SDAContentPlugin;
