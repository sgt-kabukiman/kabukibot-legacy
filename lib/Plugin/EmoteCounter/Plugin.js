/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	BasePlugin = require('./../Base.js'),
	utils      = require('./../../Utils.js'),
	Manager    = require('./EmoteManager.js'),
	numeral    = require('numeral'),
	util       = require('util');

function EmoteCounterPlugin() {
	BasePlugin.call(this);

	this.manager     = null;
	this.txtListener = null;
	this.cmdListener = null;
	this.interval    = null;
	this.table       = 'emote_counter';
	this.stats       = {};
}

util.inherits(EmoteCounterPlugin, BasePlugin);

EmoteCounterPlugin.prototype.setup = function(kabukibot, eventDispatcher) {
	BasePlugin.prototype.setup.call(this, kabukibot, eventDispatcher);

	eventDispatcher.onCommand(true, this.onGlobalCommand.bind(this));

	this.manager     = new Manager(kabukibot.getLog());
	this.txtListener = this.onText.bind(this);
	this.cmdListener = this.onCommand.bind(this);

	this.manager.fetchEmotes();
	this.manager.initUpdater(3*3600*1000); // update every 3 hours

	// sync emote counter with database every 30 minutes
	this.interval = setInterval(this.syncAll.bind(this), 30*60*1000);

	if (this.bot.getConfig().database.driver === 'sqlite') {
		this.db.query('CREATE TABLE IF NOT EXISTS ' + this.table + ' (channel VARCHAR(200), emote TINYBLOB, counter INTEGER UNSIGNED, PRIMARY KEY (channel, emote(50)))');
	}
	else {
		this.db.query('CREATE TABLE IF NOT EXISTS ' + this.table + ' (channel VARCHAR(200), emote TINYBLOB, counter INTEGER UNSIGNED, PRIMARY KEY (channel, emote(50))) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB');
	}
};

EmoteCounterPlugin.prototype.shutdown = function(kabukibot) {
	if (this.interval) {
		clearInterval(this.interval);
		this.interval = null;
	}

	this.manager.stopUpdater();
};

EmoteCounterPlugin.prototype.getKey = function() {
	return 'emote_counter';
};

EmoteCounterPlugin.prototype.getACLTokens = function() {
	return ['use_emote_counter'];
};

EmoteCounterPlugin.prototype.load = function(channel, kabukibot, eventDispatcher) {
	var chan = channel.getName(), self = this;

	this.stats[chan] = {};

	this.selectFromDatabase(this.table, '*', { channel: chan }, function(rows) {
		var i, len;

		self.debug('Loaded ' + rows.length + ' counted emotes for #' + chan + '.');

		for (i = 0, len = rows.length; i < len; ++i) {
			self.stats[chan][rows[i].emote] = parseInt(rows[i].counter, 10);
		}

		eventDispatcher.onText(channel.getIrcName(), self.txtListener);
		eventDispatcher.onCommand(channel.getIrcName(), self.cmdListener);
	});
};

EmoteCounterPlugin.prototype.unload = function(channel, kabukibot, eventDispatcher) {
	var self = this;

	eventDispatcher.removeTextListener(channel.getIrcName(), this.txtListener);
	eventDispatcher.removeCommandListener(channel.getIrcName(), this.cmdListener);

	this.syncChannel(channel, function() {
		delete self.stats[channel.getName()];
	});
};

EmoteCounterPlugin.prototype.onText = function(message) {
	// 'processed' here is basically saying "this message is from a blacklisted user".
	// We don't want to count the emotes they are using, because we blacklisted them.
	if (message.isProcessed()) return;

	// do not count commands
	if (message.getMessage().match(/^!emote_count/)) return;

	// do not count responses to commands
	if (message.getUser().isBot()) return;

	var
		chan   = this.getChan(message),
		stats  = this.stats[chan],
		emotes = this.manager.getEmotesInMessage(message.getMessage(), message.getUser()),
		emote, idx;

	for (idx in emotes) {
		emote = emotes[idx];

		if (!(emote in stats)) {
			stats[emote] = 1;
		}
		else {
			stats[emote]++;
		}
	}
};

EmoteCounterPlugin.prototype.onCommand = function(command, args, message) {
	if (message.isProcessed()) return;

	var chan = this.getChan(message), user = message.getUser();

	// not for us
	if (command !== 'top_emotes' && command !== 'emote_count' && command !== 'reset_emote_counter') {
		return;
	}

	// not allowed
	if (command === 'reset_emote_counter' && (!user.isBroadcaster() && !user.isOperator())) {
		return;
	}

	if (!this.acl.isAllowed(user, 'use_emote_counter')) {
		return;
	}

	switch (command) {
		case 'top_emotes':          return this.topEmotes(chan, args, message);
		case 'emote_count':         return this.emoteCount(chan, args, message);
		case 'reset_emote_counter': return this.resetCounter(chan, args, message);
	}
};

EmoteCounterPlugin.prototype.onGlobalCommand = function(command, args, message) {
	// not for us or not from the bot operator
	if (command !== this.gcmd('sync_emote_counter') || !message.getUser().isOperator()) {
		return;
	}

	this.syncAll(true);
	message.respond('syncing emote counter now.');
};

EmoteCounterPlugin.prototype.topEmotes = function(chan, args, message) {
	var max = 5, emotes = [], top, idx;

	if (args.length > 0 && !isNaN(parseInt(args[0], 10))) {
		max = parseInt(args[0], 10);

		if (max > 20) {
			max = 20;
		}
		else if (max < 1) {
			max = 1;
		}
	}

	top = this.getTopEmotes(chan, max);

	for (idx in top) {
		emotes.push(top[idx].emote + ' (' + numeral(top[idx].count).format('0,0') + 'x)');
	}

	if (emotes.length === 0) {
		return message.respond('no emotes have been counted yet.');
	}

	message.respond('this channel\'s top ' + (max === 1 ? 'emote is' : (max + ' emotes are')) + ': ' + utils.humanJoin(emotes));
};

EmoteCounterPlugin.prototype.emoteCount = function(chan, args, message) {
	var emote, count;

	if (args.length === 0) {
		return this.errorResponse(message, 'no emote given.');
	}

	emote = args[0];
	count = this.stats[chan][emote] || 0;

	if (count === 0) {
		message.respond(emote + ' has not yet been used or does not even exist.');
	}
	else if (count === 1) {
		message.respond(emote + ' has been used once.');
	}
	else {
		message.respond(emote + ' has been used ' + numeral(count).format('0,0') + ' times.');
	}
};

EmoteCounterPlugin.prototype.resetCounter = function(chan, args, message) {
	delete this.stats[chan];
	this.stats[chan] = {};

	message.respond('the emote counter has been reset.');
};

EmoteCounterPlugin.prototype.syncAll = function(force) {
	var chan, key;

	for (chan in this.stats) {
		if (force === true) {
			this.syncChannel(chan);
			continue;
		}

		for (key in this.stats[chan]) {
			if (this.stats[chan].hasOwnProperty(key)) {
				this.syncChannel(chan);
				break;
			}
		}
	}
};

EmoteCounterPlugin.prototype.syncChannel = function(channel, callback) {
	var
		chan = this.getChan(channel),
		self = this,
		db   = this.db;

	// we purge all the channel data first, so the !reset_counter command
	// can simply set the stats array empty and when the next sync comes,
	// the database will be purged as well

	self.debug('Syncing emote counter for #' + chan + '.');

	// delete all data
	db.del(self.table, { channel: chan }, function(err) {
		// build data set for all counted emotes
		var rows = [];

		for (var emote in self.stats[chan]) {
			rows.push({
				channel: chan,
				emote:   emote,
				counter: self.stats[chan][emote]
			});
		}

		// insert all emotes
		db.insertMany(self.table, rows, function(err) {
			if (!err && callback) {
				callback();
			}
		});
	});
};

EmoteCounterPlugin.prototype.getTopEmotes = function(channel, max) {
	var
		chan   = this.getChan(channel),
		result = [],
		emote;

	if (!(chan in this.stats) || max <= 0) {
		return [];
	}

	for (emote in this.stats[chan]) {
		result.push({ emote: emote, count: this.stats[chan][emote] });
	}

	result.sort(function(a, b) {
		return a.count < b.count ? 1 : (a.count === b.count ? 0 : -1);
	});

	if (result.length > max) {
		result = result.slice(0, max);
	}

	return result;
};

module.exports = EmoteCounterPlugin;
