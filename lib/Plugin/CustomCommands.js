/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var url = require('url');

var CustomCommandsPlugin = function() {
	this.bot      = null;
	this.db       = null;
	this.acl      = null;
	this.log      = null;
	this.listener = null;
	this.data     = {};
	this.table    = 'custom_commands';
};

CustomCommandsPlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		this.bot      = kabukibot;
		this.db       = kabukibot.getDatabase();
		this.acl      = kabukibot.getACL();
		this.log      = kabukibot.getLog();
		this.listener = this.onCommand.bind(this);

		this.db.query('CREATE TABLE IF NOT EXISTS ' + this.table + ' (channel VARCHAR(200), command VARCHAR(200), message VARCHAR(1024), PRIMARY KEY (channel, command))');
	},

	getKey: function() {
		return 'custom_commands';
	},

	getACLTokens: function(channel) {
		var commands = this.getCommands(channel), tokens = ['configure_custom_commands'], cmd;

		for (cmd in commands) {
			tokens.push(this.getACLTokenForCommand(cmd));
		}

		return tokens;
	},

	load: function(channel, kabukibot, eventDispatcher) {
		var self = this, chan = channel.getName(), ircName = channel.getIrcName();

		eventDispatcher.onCommand(ircName, this.listener);

		this.data[chan] = {};

		this.db.all('SELECT * FROM ' + this.table + ' WHERE channel = $channel', { $channel: chan }, function(err, rows) {
			var bantype, i, len, domain;

			if (err) {
				self.log.error('Could not query custom commands: ' + err.message);
				return;
			}

			self.log.debug('Loaded ' + rows.length + ' custom commands for ' + ircName + '.');

			for (i = 0, len = rows.length; i < len; ++i) {
				self.data[chan][rows[i].command] = rows[i].message;
			}
		});
	},

	unload: function(channel, kabukibot, eventDispatcher) {
		var chan;

		eventDispatcher.removeCommandListener(channel.getIrcName(), this.listener);

		if (chan in this.data) {
			delete this.data[chan];
		}
	},

	onCommand: function(command, args, message) {
		var chan = message.getChannel().getName(), commands = this.getCommands(message.getChannel());

		// not for us
		if (!this.isPluginCommand(command) && !(command in commands)) {
			return;
		}

		// if this is a command that has already been responded to, do nothing
		if (message.isResponded()) {
			return;
		}

		// check permissions
		if (this.isPluginCommand(command)) {
			if (!this.acl.isAllowed(message.getUser(), 'configure_custom_commands')) {
				return;
			}
		}
		else {
			if (!this.acl.isAllowed(message.getUser(), this.getACLTokenForCommand(command))) {
				return;
			}
		}

		switch (command) {
			case 'cc_get': return this.respondGet(args, commands, message);
			case 'cc_set': return this.respondSet(chan, args, commands, message);
			case 'cc_del': return this.respondDel(chan, args, commands, message);
			default:       return this.sendResponse(command, commands, message);
		}
	},

	respondGet: function(args, commands, message) {
		var command;

		if (args.length < 1) {
			message.respond(this.bot.getErrorResponse() + 'no command name given');
			return;
		}

		command = this.normalizeCommand(args[0]);

		if (command.length === 0) {
			message.respond(this.bot.getErrorResponse() + 'command name may only consist of letters, numbers and underscores (_).');
			return;
		}

		if (command in commands) {
			message.respond('"!' + command + '" = ' + commands[command]);
		}
		else {
			message.respond(this.bot.getErrorResponse() + 'command !' + command + ' is undefined.');
		}
	},

	respondSet: function(chan, args, commands, message) {
		var command, text, exists, ban, bantype;

		if (args.length < 1) {
			message.respond(this.bot.getErrorResponse() + 'no command name and no response text given.');
			return;
		}

		if (args.length < 2) {
			message.respond(this.bot.getErrorResponse() + 'no response text given.');
			return;
		}

		command = this.normalizeCommand(args[0]);

		if (command.length === 0) {
			message.respond(this.bot.getErrorResponse() + 'command name may only consist of letters, numbers and underscores (_).');
			return;
		}

		if (this.isPluginCommand(command)) {
			message.respond(this.bot.getErrorResponse() + 'you cannot override plugin commands.');
			return;
		}

		text   = args.slice(1).join(' ');
		exists = command in commands;

		this.data[chan][command] = text;

		if (exists) {
			this.db.update(this.table, { message: text }, { channel: chan, command: command });
			message.respond('command !' + command + ' has been updated.');
		}
		else {
			this.db.insert(this.table, { channel: chan, command: command, message: text });
			message.respond('command !' + command + ' has been created.');
		}
	},

	respondDel: function(chan, args, commands, message) {
		var command;

		if (args.length < 1) {
			message.respond(this.bot.getErrorResponse() + 'no command name given.');
			return;
		}

		command = this.normalizeCommand(args[0]);

		if (command.length === 0) {
			message.respond(this.bot.getErrorResponse() + 'command name may only consist of letters, numbers and underscores (_).');
			return;
		}

		if (!(command in commands)) {
			message.respond(this.bot.getErrorResponse() + 'command !' + command + ' is undefined.');
			return;
		}

		this.db.del(this.table, { channel: chan, command: command });
		this.acl.deletePermission(chan, this.getACLTokenForCommand(command));
		delete this.data[chan][command];

		message.respond('command !' + command + ' has been deleted.');
	},

	sendResponse: function(command, commands, message) {
		message.respondToAll(commands[command]);
	},

	getCommands: function(channel) {
		var chan = (typeof channel === 'string') ? channel : channel.getName();

		return (chan in this.data) ? this.data[chan] : {};
	},

	isPluginCommand: function(cmd) {
		return cmd === 'cc_set' || cmd === 'cc_get' || cmd === 'cc_del';
	},

	getACLTokenForCommand: function(cmd) {
		return 'use_' + cmd + '_cmd';
	},

	normalizeCommand: function(cmd) {
		return cmd.replace(/[^a-z0-9_]/ig, '').toLowerCase();
	}
};

module.exports = CustomCommandsPlugin;
