/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var BasePlugin = require('./Base.js'), util = require('util');

function LastResetPlugin() {
	BasePlugin.call(this);

	this.dict     = null;
	this.listener = null;
	this.channels = {};
}

function getDictKey(chan) {
	return 'last_reset_' + chan + '_message';
}

util.inherits(LastResetPlugin, BasePlugin);

var _ = LastResetPlugin.prototype;

_.getKey = function() {
	return 'last_reset';
};

_.getACLTokens = function() {
	return ['set_reset', 'get_reset'];
};

_.getRequiredACLToken = function(cmd) {
	if (cmd === 'setreset' || cmd === 'set_reset' || cmd === 'resetreason') {
		return 'set_reset';
	}

	return 'get_reset';
};

_.setup = function(kabukibot, eventDispatcher) {
	BasePlugin.prototype.setup.call(this, kabukibot, eventDispatcher);

	this.listener = this.onCommand.bind(this);
	this.dict     = kabukibot.getDictionary();
};

_.load = function(channel, kabukibot, eventDispatcher) {
	var chan = channel.getName();

	this.channels[chan] = this.dict.get(getDictKey(chan));

	eventDispatcher.onCommand(chan, this.listener);
};

_.unload = function(channel, kabukibot, eventDispatcher) {
	var chan = channel.getName();

	eventDispatcher.removeCommandListener(chan, this.listener);

	if (chan in this.channels) {
		delete this.channels[chan];
	}
};

_.onCommand = function(command, args, message) {
	if (message.isProcessed()) return;

	var chan     = this.getChan(message);
	var commands = ['set_reset', 'setreset', 'resetreason', 'last_reset', 'lastreset'];

	// not for us
	if (commands.indexOf(command) === -1) {
		return;
	}

	// not allowed
	if (!this.acl.isAllowed(message.getUser(), this.getRequiredACLToken(command))) {
		return;
	}

	var chan = this.getChan(message);

	switch (command) {
		case 'set_reset':
		case 'setreset':
		case 'resetreason':
			return this.setResetReason(chan, args, message);

		case 'last_reset':
		case 'lastreset':
			return this.getResetReason(chan, message);
	}
};

_.setResetReason = function(chan, args, message) {
	var msg = args.join(' ');

	if (msg.length === 0) {
		delete this.channels[chan];
		this.dict.del(getDictKey(chan), msg);

		return message.respond('the reset reason has been cleared.');
	}

	this.channels[chan] = msg;
	this.dict.set(getDictKey(chan), msg);

	return message.respond('the reset reason has been updated.');
};

_.getResetReason = function(chan, message) {
	var chan = this.getChan(message);
	var msg  = this.channels[chan];

	if (!msg) {
		return message.respond('you know, I have no idea. No one told me. Was there even a reset recently?');
	}

	return message.respond('the last reset was because: ' + msg);
};

module.exports = LastResetPlugin;
