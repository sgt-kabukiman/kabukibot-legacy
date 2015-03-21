/*
 * Copyright (c) 2015, Sgt. Kabukiman, https://github.com/sgt-kabukiman
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	FileLog       = require('./FileLog.js'),
	DatabaseLog   = require('./DatabaseLog.js'),
	BasePlugin    = require('./../Base.js'),
	TextMessage   = require('./../../TextMessage.js'),
	TwitchMessage = require('./../../TwitchMessage.js'),
	utils         = require('./../../Utils.js'),
	util          = require('util'),
	path          = require('path'),
	fs            = require('fs');

function LogPlugin() {
	BasePlugin.call(this);

	this.config       = null;
	this.driver       = null;
	this.db           = null;
	this.dict         = null;
	this.channels     = {};
}

LogPlugin.RESPONSES = '$responses';

util.inherits(LogPlugin, BasePlugin);

var _ = LogPlugin.prototype;

_.setup = function(kabukibot, eventDispatcher) {
	BasePlugin.prototype.setup.call(this, kabukibot, eventDispatcher);

	eventDispatcher.onText(null, this.onTextMessage.bind(this));
	eventDispatcher.onTwitch(null, this.onTwitch.bind(this));
	eventDispatcher.onCommand(null, this.onCommand.bind(this));
	eventDispatcher.onResponse(null, this.onResponse.bind(this));

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

	if (this.dict.get('log_plugin_responses')) {
		this.enableLoggingInChannel(LogPlugin.RESPONSES);
	}
};

_.shutdown = function(kabukibot) {
	for (var chan in this.channels) {
		this.disableLoggingInChannel(chan);
	}
};

_.writeConfig = function() {
	var keys = utils.getObjectKeys(this.channels);

	this.dict.set('log_plugin_channels', JSON.stringify(keys));
	this.dict.set('log_plugin_responses', LogPlugin.RESPONSES in this.channels ? 1 : 0);
};

_.enableLoggingInChannel = function(chan) {
	if (chan in this.channels) {
		return;
	}

	var specialResponseLog = chan === LogPlugin.RESPONSES;

	if (this.config.adapter === 'file') {
		var filename = path.join(this.config.directory, (specialResponseLog ? 'responses' : ('#' + chan)) + '.log');
		var log      = new FileLog(filename, specialResponseLog);
	}
	else {
		var log = new DatabaseLog(this.db, specialResponseLog ? null : chan);
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
	var chan = this.getChan(message);

	if (chan in this.channels) {
		this.channels[chan].textMessage(message);
	}
};

_.onTwitch = function(message) {
	var chan = this.getChan(message);

	if (chan in this.channels) {
		this.channels[chan].twitchMessage(message);
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

	if (args.length >= 2 && args[1].toLowerCase() === LogPlugin.RESPONSES) {
		chan = args[1].toLowerCase();

		if (args[0].toLowerCase() === 'enable') {
			this.enableLoggingInChannel(chan);
			this.writeConfig();
			return message.respond('response logging is enabled now.');
		}

		if (args[0].toLowerCase() === 'disable') {
			this.disableLoggingInChannel(chan);
			this.writeConfig();
			return message.respond('response logging is disabled now.');
		}
	}
	else {
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
	}
};

_.onResponse = function(response) {
	var
		responseTo = response.getResponseTo(),
		user       = this.getUsername(response),
		chan       = this.getChan(response);

	if (!(LogPlugin.RESPONSES in this.channels)) {
		return;
	}

	var logger = this.channels[LogPlugin.RESPONSES];

	// log the message that we responded to, if we have not yet logged it
	if (responseTo && !responseTo.logged) {
		if (responseTo instanceof TextMessage) {
			logger.textMessage(responseTo);
		}
		else if (responseTo instanceof TwitchMessage) {
			logger.twitchMessage(responseTo);
		}

		responseTo.logged = true;
	}

	// log the actual response
	logger.response(chan, user, response.getMessage());
};

module.exports = LogPlugin;
