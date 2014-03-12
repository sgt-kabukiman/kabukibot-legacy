/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var ESAContentPlugin = function() {
	this.acl      = null;
	this.listener = null;
};

ESAContentPlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		this.acl      = kabukibot.getACL();
		this.listener = this.onCommand.bind(this);
	},

	getKey: function() {
		return 'esa';
	},

	getACLTokens: function() {
		return ['esa_commands'];
	},

	load: function(channel, kabukibot, eventDispatcher) {
		eventDispatcher.onCommand(channel.getIrcName(), this.listener);
	},

	unload: function(channel, kabukibot, eventDispatcher) {
		eventDispatcher.removeCommandListener(channel.getIrcName(), this.listener);
	},

	onCommand: function(command, args, message) {
		if (!this.acl.isAllowed(message.getUser(), 'esa')) {
			return;
		}

		switch (command) {
			case 'esa':
				message.respondToAll('ESA stands for European Speedster Assembly, an annual charity speedrunning marathon (like AGDQ) held in Sweden. It\'s kind of the "European AGDQ".');
				return;

			case 'esa2014':
				message.respondToAll('ESA 2014 is at Nyeport in Skövde (Sweden), from July 27th to August 3rd (main marathon); stream is open from the 25th (setup) to the 6th (clean up and bonus stream).');
				return;
		}
	}
};

module.exports = ESAContentPlugin;
