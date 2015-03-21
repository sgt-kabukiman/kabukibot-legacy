/*
 * Copyright (c) 2015, Sgt. Kabukiman, https://github.com/sgt-kabukiman
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	BasePlugin  = require('./Base.js'),
	ModeMessage = require('./../ModeMessage.js'),
	util        = require('util');

function BlacklistPlugin() {
	this.listener    = null;
	this.cmdListener = null;
	this.dispatcher  = null;
	this.blacklist   = [];
	this.table       = 'blacklist';
}

util.inherits(BlacklistPlugin, BasePlugin);

var _ = BlacklistPlugin.prototype;

_.getKey = function() {
	return null;
};

_.getACLTokens = function() {
	return [];
};

_.setup = function(kabukibot, eventDispatcher) {
	BasePlugin.prototype.setup.call(this, kabukibot, eventDispatcher);

	this.listener    = this.onMessage.bind(this);
	this.cmdListener = this.onCommand.bind(this);
	this.dispatcher  = eventDispatcher;

	var callback = this.initBlacklist.bind(this);

	if (kabukibot.getConfig().database.driver === 'sqlite') {
		this.db.query('CREATE TABLE IF NOT EXISTS ' + this.table + ' (username VARCHAR(255) NOT NULL, PRIMARY KEY (username))', callback);
	}
	else {
		this.db.query('CREATE TABLE IF NOT EXISTS ' + this.table + ' (username VARCHAR(255) NOT NULL, PRIMARY KEY (username)) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB', callback);
	}
};

_.initBlacklist = function() {
	var self = this;

	this.selectFromDatabase(this.table, '*', {}, function(rows) {
		self.debug('Loaded ' + rows.length + ' blacklisted users.');

		for (var i = 0, len = rows.length; i < len; ++i) {
			self.blacklist.push(rows[i].username);
		}

		self.dispatcher.onMessage(null, self.listener);
		self.dispatcher.onCommand(null, self.cmdListener);
	});
};

_.onMessage = function(message) {
	if (message instanceof ModeMessage) {
		return;
	}

	if (this.isBlacklisted(message.getUsername())) {
		message.setProcessed(true);
	}
};

_.onCommand = function(command, args, message) {
	if (!message.getUser().isOperator()) {
		return;
	}

	if (command !== this.gcmd('blacklist') && command !== this.gcmd('unblacklist')) {
		return;
	}

	if (args.length === 0) {
		return this.errorResponse(message, 'you have to give a username.');
	}

	var username = this.normalizeUsername(args[0]);

	if (username.length === 0) {
		return this.errorResponse(message, 'the given username is invalid.');
	}

	switch (command) {
		case this.gcmd('blacklist'):
			return this.doBlacklist(username, message);

		case this.gcmd('unblacklist'):
			return this.doUnblacklist(username, message);
	}
};

_.doBlacklist = function(username, message) {
	if (this.isBlacklisted(username)) {
		return this.errorResponse(message, 'this user is already on the blacklist.');
	}

	this.blacklist.push(username);
	this.db.insert(this.table, { username: username });

	return message.respond('the user ' + username + ' has been blacklisted.');
};

_.doUnblacklist = function(username, message) {
	if (!this.isBlacklisted(username)) {
		return this.errorResponse(message, 'this user is not blacklisted.');
	}

	this.blacklist.splice(this.blacklist.indexOf(username), 1);
	this.db.del(this.table, { username: username });

	return message.respond('the user ' + username + ' has been un-blacklisted.');
};

_.isBlacklisted = function(username) {
	return username && this.blacklist.indexOf(username) !== -1;
};

_.normalizeUsername = function(username) {
	return username.toLowerCase().replace(/[^a-z0-9_]/g, '');
};

module.exports = BlacklistPlugin;
