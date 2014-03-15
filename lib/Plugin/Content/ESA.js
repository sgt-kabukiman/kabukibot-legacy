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
	this.tpl      = null;
	this.commands = {
		'esa':     'esa_info',
		'esa2014': 'esa2014_info'
	};
};

ESAContentPlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		this.acl      = kabukibot.getACL();
		this.tpl      = kabukibot.getStringTemplate();
		this.listener = this.onCommand.bind(this);
		this.dict     = kabukibot.getDictionary();

		this.dict
			.add('esa_info',     'ESA stands for European Speedster Assembly, an annual charity speedrunning marathon (like AGDQ) held in Sweden. It\'s kind of the "European AGDQ".')
			.add('esa2014_info', 'ESA 2014 is at Nyeport in Skövde (Sweden), from July 27th ({{#reldate}}27 Jul 2014{{/reldate}}) to August 3rd (main marathon); stream is open from the 25th (setup) to the 6th (clean up and bonus stream).')
		;
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
		if (!this.acl.isAllowed(message.getUser(), 'esa_commands')) {
			return;
		}

		if (command in this.commands) {
			message.respondToAll(this.tpl.render(this.dict.get(this.commands[command])));
		}
	}
};

module.exports = ESAContentPlugin;
