/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

function SDAContentPlugin() {
	this.acl      = null;
	this.listener = null;
	this.tpl      = null;
	this.dict     = null;
	this.commands = {
		'agdq':     'agdq_info',
		'agdq2014': 'agdq2014_info',
		'sgdq':     'sgdq_info',
		'sgdq2014': 'sgdq2014_info'
	};
}

SDAContentPlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		this.acl      = kabukibot.getACL();
		this.tpl      = kabukibot.getStringTemplate();
		this.listener = this.onCommand.bind(this);
		this.dict     = kabukibot.getDictionary();

		this.dict
			.add('agdq_info',     'AGDQ stands for Awesome Games Done Quick, an annual charity speedrunning marathon held in the US. It traditionally collects money for the Prevent Cancer Foundation.')
			.add('agdq2014_info', 'AGDQ 2014 was from January 5th to 11th.')
			.add('sgdq_info',     'SGDQ stands for Summer Games Done Quick, the summer version of AGDQ. It\'s an annual charity speedrunning marathon.')
			.add('sgdq2014_info', 'SGDQ 2014 is {{#reldate}}22 Jun 2014{{/reldate}}, from June 22nd to June 28th, in Denver.')
		;
	},

	getKey: function() {
		return 'sda';
	},

	getACLTokens: function() {
		return ['sda_commands'];
	},

	load: function(channel, kabukibot, eventDispatcher) {
		eventDispatcher.onCommand(channel.getIrcName(), this.listener);
	},

	unload: function(channel, kabukibot, eventDispatcher) {
		eventDispatcher.removeCommandListener(channel.getIrcName(), this.listener);
	},

	onCommand: function(command, args, message) {
		if (!this.acl.isAllowed(message.getUser(), 'sda_commands')) {
			return;
		}

		if (command in this.commands) {
			message.respondToAll(this.tpl.render(this.dict.get(this.commands[command])));
		}
	}
};

module.exports = SDAContentPlugin;
