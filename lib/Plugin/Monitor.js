/*
 * Copyright (c) 2015, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	BasePlugin = require('./Base.js'),
	util       = require('util'),
	fs         = require('fs');

function MonitorPlugin() {
	BasePlugin.call(this);

	this.dumper    = null;
	this.heartbeat = null;
	this.config    = null;
	this.sentPing  = null;
	this.pending   = null;
	this.delay     = null;
	this.stats     = {
		received: 0,
		sent:     0
	};
}

util.inherits(MonitorPlugin, BasePlugin);

var _ = MonitorPlugin.prototype;

_.setup = function(kabukibot, eventDispatcher) {
	BasePlugin.prototype.setup.call(this, kabukibot, eventDispatcher);

	var config = kabukibot.getConfig().plugins.monitor;

	// do nothing if no filename is configured
	if (config.filename === null) {
		return;
	}

	// We need to force the leading # because we not only use this internally, but
	// also for the IRC client, which gets confused if it's missing.
	if (config.channel.charAt(0) !== '#') {
		config.channel = '#' + config.channel;
	}

	this.config    = config;
	this.dumper    = setInterval(this.dumpData.bind(this), 60*1000);
	this.heartbeat = setInterval(this.ping.bind(this), 2*60*1000);

	eventDispatcher.onText(null, this.onText.bind(this));
	eventDispatcher.onResponse(null, this.onResponse.bind(this));

	this.dumpData();
};

_.getKey = function() {
	return null;
};

_.getACLTokens = function() {
	return [];
};

_.shutdown = function() {
	if (this.dumper) {
		clearInterval(this.dumper);
	}

	if (this.heartbeat) {
		clearInterval(this.heartbeat);
	}
};

_.onText = function(message) {
	this.stats.received++;

	// is this the pong message we've been waiting for?
	if (this.pending) {
		if (message.getUsername() === this.config.expectBy && message.getMessage().match(this.config.expectMsg) !== null) {
			this.delay   = (new Date()).getTime() - this.sentPing;
			this.pending = false;

			// do not count the pong message
			this.stats.received--;
		}
	}
};

_.onResponse = function() {
	this.stats.sent++;
};

_.dumpData = function() {
	var data = {
		uptime:    process.uptime(),
		channels:  this.bot.getChannelManager().getChannels().length,
		memory:    process.memoryUsage(),
		messages:  this.stats,
		queue:     this.bot.getTwitchClient().queue.length,
		heartbeat: this.delay
	};

	this.stats = {
		received: 0,
		sent:     0
	};

	fs.writeFile(this.config.filename, JSON.stringify(data));
};

_.ping = function() {
	var self = this;

	this.sentPing = (new Date()).getTime();
	this.pending  = true;

	// say ping
	this.bot.say(this.config.channel, this.config.message, null);
	// ... and wait for pong in the onText handler

	setTimeout(function() {
		if (self.pending) {
			self.pending = false;
			self.delay   = false;
		}
	}, this.config.timeout * 1000);

	// do not count our ping message
	this.stats.sent--;
};

module.exports = MonitorPlugin;
