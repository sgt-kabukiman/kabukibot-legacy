/*
 * Copyright (c) 2015, Sgt. Kabukiman, https://github.com/sgt-kabukiman
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	Channel       = require('./../Channel.js'),
	User          = require('./../User.js'),
	Response      = require('./../Response.js'),
	TextMessage   = require('./../TextMessage.js'),
	ModeMessage   = require('./../ModeMessage.js'),
	TwitchMessage = require('./../TwitchMessage.js');

function BasePlugin() {
	this.bot    = null;
	this.log    = null;
	this.acl    = null;
	this.prefix = null;
	this.db     = null;
}

BasePlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		this.bot    = kabukibot;
		this.log    = kabukibot.getLog();
		this.acl    = kabukibot.getACL();
		this.prefix = kabukibot.getCommandPrefix();
		this.db     = kabukibot.getDatabase();
	},

	getKey: function() {
		return null;
	},

	getACLTokens: function() {
		return [];
	},

	gcmd: function(cmd) {
		return this.prefix + cmd;
	},

	debug: function(msg) {
		this.log.debug(msg);
	},

	selectFromDatabase: function(table, columns, where, callback) {
		var self = this;

		this.db.select(table, columns, where, function(err, rows) {
			if (err) {
				self.log.error('Could not query database table ' + table + ': ' + err.message);
			}
			else {
				callback(rows);
			}
		});
	},

	getUsername: function(mixed) {
		if (typeof mixed === 'string') return mixed;
		if (mixed instanceof User) return mixed.getName();
		if (mixed instanceof TextMessage) return mixed.getUser().getName();
		if (mixed instanceof ModeMessage) return mixed.getUser().getName();
		if (mixed instanceof TwitchMessage) return null;
		if (mixed instanceof Response) return this.bot.getBotName();
	},

	getChan: function(mixed) {
		if (typeof mixed === 'string') return mixed;
		if (mixed instanceof Channel) return mixed.getName();
		if (mixed instanceof User) return mixed.getChannel().getName();
		if (mixed instanceof TextMessage) return mixed.getChannel().getName();
		if (mixed instanceof ModeMessage) return mixed.getChannel().getName();
		if (mixed instanceof TwitchMessage) return mixed.getChannel().getName();
		if (mixed instanceof Response) return mixed.getChannel().getName();
	},

	errorResponse: function(message, response) {
		return message.respond(this.bot.getErrorResponse() + response);
	}
};

module.exports = BasePlugin;
