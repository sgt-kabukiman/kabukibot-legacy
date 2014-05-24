/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
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

	this.channels[chan] = this.dict.get('subhype_' + chan + '_message');

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
	if (!message.getUser().isOperator() && !message.getUser().isBroadcaster()) {
		return;
	}

	if (command !== 'submsg') {
		return;
	}

	var chan = this.getChan(message);

	if (args.length === 0) {
		return this.errorResponse(message, 'you forgot to add a message: `!submsg PogChamp, {user} just became awesome!`. {user} will be replaced with the user who subscribed. To disable notifications, just disable the plugin: `!' + this.gcmd('disable') + ' subhype`.');
	}

	var msg = args.join(' ');

	this.channels[chan] = msg;
	this.dict.set('subhype_' + chan + '_message', msg);

	return message.respond('the subscriber notification has been updated.');
};

_.onTwitch = function(message) {
	if (message.getCommand() !== 'subscriber') {
		return;
	}

	var chan = this.getChan(message);
	var sub  = message.getUsername();
	var msg  = this.channels[chan];

	if (!msg) {
		return;
	}

	// be nice and add a few aliases to the canonical 'user'
	msg = msg.replace('{user}', sub);
	msg = msg.replace('{username}', sub);
	msg = msg.replace('{subscriber}', sub);

	// HYPE
	message.getChannel().say(msg);
};

module.exports = SubHypePlugin;
