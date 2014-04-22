/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	FileLog    = require('./FileLog.js'),
	BasePlugin = require('./../Base.js'),
	utils      = require('./../../Utils.js'),
	util       = require('util'),
	path       = require('path'),
	fs         = require('fs');

function LogPlugin() {
	BasePlugin.call(this);

	this.config   = null;
	this.driver   = null;
	this.db       = null;
	this.dict     = null;
	this.channels = {};
}

util.inherits(LogPlugin, BasePlugin);

var _ = LogPlugin.prototype;

_.setup = function(kabukibot, eventDispatcher) {
	BasePlugin.prototype.setup.call(this, kabukibot, eventDispatcher);

	eventDispatcher.onText(null, this.onTextMessage.bind(this));
	eventDispatcher.onCommand(null, this.onCommand.bind(this));

	this.config = kabukibot.getConfig().plugins.log;
	this.driver = kabukibot.getConfig().database.driver;
	this.db     = kabukibot.getDatabase();
	this.dict   = kabukibot.getDictionary();

	// start logging in previously logged channels
	var chans = this.dict.get('log_plugin_channels'), idx;

	if (chans !== null) {
		chans = JSON.parse(chans);

		for (idx = 0; idx < chans.length; ++idx) {
			this.enableLoggingInChannel(chans[idx]);
		}
	}
};

_.writeConfig = function() {
	var keys = utils.getObjectKeys(this.channels);

	this.dict.set('log_plugin_channels', JSON.stringify(keys));
};

_.enableLoggingInChannel = function(chan) {
	if (chan in this.channels) {
		return;
	}

	if (this.config.adapter === 'file') {
		var filename = path.join(this.config.directory, '#' + chan + '.log');
		var log      = new FileLog(filename);
	}
	else {
		var log = new DatabaseLog(this.db, chan);
	}

	this.channels[chan] = log;
};

_.disableLoggingInChannel = function(chan) {
	if (!(chan in this.channels)) {
		return;
	}

	this.channels[chan].close();
	delete this.channels[chan];
};

_.onTextMessage = function(message) {
	var user = message.getUser(), chan = this.getChan(message);

	if (chan in this.channels) {
		this.channels[chan].textMessage(chan, user, message.getMessage());
	}
};

_.onCommand = function(command, args, message) {
	if (!message.getUser().isOperator()) {
		return;
	}

	if (command !== this.gcmd('log')) {
		return;
	}

	var chan = this.getChan(message), remote = false;

	if (args.length === 0) {
		return message.respond('logging in currently ' + (chan in this.channels ? 'enabled' : 'disabled') + ' in this channel.');
	}

	if (args.length >= 2) {
		chan   = args[1].replace(/[^a-z0-9_]/i, '').toLowerCase();
		remote = true;
	}

	if (args[0].toLowerCase() === 'enable') {
		this.enableLoggingInChannel(chan);
		this.writeConfig();
		return message.respond('logging is enabled' + (remote ? (' in #' + chan) : '') + ' now.');
	}

	if (args[0].toLowerCase() === 'disable') {
		this.disableLoggingInChannel(chan);
		this.writeConfig();
		return message.respond('logging is disabled' + (remote ? (' in #' + chan) : '') + ' now.');
	}
};

module.exports = LogPlugin;
