/*
 * Copyright (c) 2015, Sgt. Kabukiman, https://github.com/sgt-kabukiman
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var BasePlugin = require('./Base.js'), util = require('util');

function SubHypePlugin() {
	BasePlugin.call(this);

	this.dict           = null;
	this.cmdListener    = null;
	this.twitchListener = null;
	this.channels       = {};
}

util.inherits(SubHypePlugin, BasePlugin);

var _ = SubHypePlugin.prototype;

_.getKey = function() {
	return 'subhype';
};

_.setup = function(kabukibot, eventDispatcher) {
	BasePlugin.prototype.setup.call(this, kabukibot, eventDispatcher);

	this.cmdListener    = this.onCommand.bind(this);
	this.twitchListener = this.onTwitch.bind(this);
	this.dict           = kabukibot.getDictionary();
};

_.load = function(channel, kabukibot, eventDispatcher) {
	var chan = channel.getName();

	this.channels[chan] = [
		this.dict.get('subhype_' + chan + '_message'),
		this.dict.get('subhype_' + chan + '_message_resub'),
	];

	eventDispatcher.onCommand(chan, this.cmdListener);
	eventDispatcher.onTwitch(chan, this.twitchListener);
};

_.unload = function(channel, kabukibot, eventDispatcher) {
	var chan = channel.getName();

	eventDispatcher.removeCommandListener(chan, this.cmdListener);
	eventDispatcher.removeTwitchListener(chan, this.twitchListener);

	if (chan in this.channels) {
		delete this.channels[chan];
	}
};

_.onCommand = function(command, args, message) {
	if (message.isProcessed()) return;

	if (!message.getUser().isOperator() && !message.getUser().isBroadcaster()) {
		return;
	}

	if (command !== 'submsg' && command !== 'resubmsg') {
		return;
	}

	var chan = this.getChan(message);

	if (args.length === 0) {
		return this.errorResponse(message, 'you forgot to add a message: `!' + command + ' PogChamp, {user} just became awesome!`. {user} will be replaced with the user who subscribed, {n} will be the number of months for re-sub notifications. To disable notifications, just disable the plugin: `!' + this.gcmd('disable') + ' subhype`.');
	}

	var msg = args.join(' ');

	if (!(chan in this.channels)) {
		this.channels[chan] = [null, null];
	}

	var re  = command === 'resubmsg';
	var idx = re ? 1 : 0;
	var key = re ? '_resub' : '';

	this.channels[chan][idx] = msg;
	this.dict.set('subhype_' + chan + '_message' + key, msg);

	return message.respond('the ' + (re ? 're-' : '') + 'subscribe notification has been updated.');
};

_.onTwitch = function(message) {
	if (message.isProcessed()) return;

	if (message.getCommand() !== 'subscriber') {
		return;
	}

	var chan   = this.getChan(message);
	var sub    = message.getUsername();
	var args   = message.getArgs();
	var months = args[1];
	var msgs   = this.channels[chan];

	if (!msgs) {
		return;
	}

	var resub = months > 0;
	var msg   = resub ? msgs[1] : msgs[0];

	if (!msg) {
		return;
	}

	// be nice and add a few aliases to the canonical 'user'
	msg = msg.replace('{user}', sub);
	msg = msg.replace('{username}', sub);
	msg = msg.replace('{subscriber}', sub);

	if (resub) {
		msg = msg.replace('{n}', months);
		msg = msg.replace('{months}', months);
	}

	// HYPE
	message.respondToAll(msg);
};

module.exports = SubHypePlugin;
