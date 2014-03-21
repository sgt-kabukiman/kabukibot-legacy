/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var Manager = require('./EmoteManager.js');

var EmoteCounterPlugin = function() {
	this.manager     = null;
	this.bot         = null;
	this.log         = null;
	this.db          = null;
	this.acl         = null;
	this.txtListener = null;
	this.cmdListener = null;
	this.prefix      = null;
	this.table       = 'emote_counter';
	this.stats       = {};
};

EmoteCounterPlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		eventDispatcher.onCommand(true, this.onGlobalCommand.bind(this));

		this.manager     = new Manager(kabukibot.getLog());
		this.bot         = kabukibot;
		this.log         = kabukibot.getLog();
		this.db          = kabukibot.getDatabase();
		this.acl         = kabukibot.getACL();
		this.prefix      = kabukibot.getCommandPrefix();
		this.txtListener = this.onText.bind(this);
		this.cmdListener = this.onCommand.bind(this);

		this.manager.fetchEmotes();
		this.manager.initUpdater(3*3600*1000); // update every 3 hours

		// sync emote counter with database every 30 minutes
		setInterval(this.syncAll.bind(this), 30*60*1000);

		this.db.query('CREATE TABLE IF NOT EXISTS ' + this.table + ' (channel VARCHAR(200), emote VARCHAR(50), counter INTEGER UNSIGNED, PRIMARY KEY (channel, emote))');
	},

	getKey: function() {
		return 'emote_counter';
	},

	getACLTokens: function() {
		return ['use_emote_counter'];
	},

	load: function(channel, kabukibot, eventDispatcher) {
		var chan = channel.getName(), self = this;

		this.stats[chan] = {};

		this.db.all('SELECT * FROM ' + this.table + ' WHERE channel = $channel', { $channel: chan }, function(err, rows) {
			var i, len;

			if (err) {
				self.log.error('Could not query emote counter: ' + err.message);
				return;
			}

			self.log.debug('Loaded ' + rows.length + ' counted emotes for #' + chan + '.');

			for (i = 0, len = rows.length; i < len; ++i) {
				self.stats[chan][rows[i].emote] = parseInt(rows[i].counter, 10);
			}

			eventDispatcher.onText(channel.getIrcName(), self.txtListener);
			eventDispatcher.onCommand(channel.getIrcName(), self.cmdListener);
		});
	},

	unload: function(channel, kabukibot, eventDispatcher) {
		var self = this;

		eventDispatcher.removeTextListener(channel.getIrcName(), this.txtListener);
		eventDispatcher.removeCommandListener(channel.getIrcName(), this.cmdListener);

		this.syncChannel(channel, function() {
			delete self.stats[channel.getName()];
		});
	},

	onText: function(message) {
		// do not count commands
		if (message.getMessage().match(/^!emote_count/)) return;

		// do not count responses to commands
		if (message.getUser().isBot()) return;

		var
			chan   = message.getChannel().getName(),
			stats  = this.stats[chan],
			emotes = this.manager.getEmotesInMessage(message.getMessage(), chan),
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
	},

	onCommand: function(command, args, message) {
		var chan = message.getChannel().getName(), user = message.getUser();

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
	},

	onGlobalCommand: function(command, args, message) {
		// not for us or not from the bot operator
		if (command !== this.prefix + 'sync_emote_counter' || !message.getUser().isOperator()) {
			return;
		}

		this.syncAll(true);
		message.respond('syncing emote counter now.');
	},

	topEmotes: function(chan, args, message) {
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
			emotes.push(top[idx].emote + ' (' + top[idx].count + ')');
		}

		if (emotes.length === 0) {
			return message.respond('no emotes have been counted yet.');
		}

		return message.respond('this channel\'s top ' + (max === 1 ? 'emote is' : (max + ' emotes are')) + ': ' + emotes.join(', '));
	},

	emoteCount: function(chan, args, message) {
		var emote, count;

		if (args.length === 0) {
			return message.respond(this.bot.getErrorResponse() + 'no emote given.');
		}

		emote = args[0];

		if (!this.manager.hasEmote(emote, chan)) {
			return message.respond(this.bot.getErrorResponse() + 'the emote ' + emote + ' is unknown to me.');
		}

		count = emote in this.stats[chan] ? this.stats[chan][emote] : 0;

		if (count === 0) {
			return message.respond(emote + ' has not yet been used.');
		}
		else if (count === 1) {
			return message.respond(emote + ' has been used once.');
		}
		else {
			return message.respond(emote + ' has been used ' + count + ' times.');
		}
	},

	resetCounter: function(chan, args, message) {
		delete this.stats[chan];
		this.stats[chan] = {};

		return message.respond('the emote counter has been reset.');
	},

	syncAll: function(force) {
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
	},

	syncChannel: function(channel, callback) {
		var
			chan = typeof channel === 'string' ? channel : channel.getName(),
			self = this;

		// we purge all the channel data first, so the !reset_counter command
		// can simply set the stats array empty and when the next sync comes,
		// the database will be purged as well

		self.log.debug('Syncing emote counter for #' + chan + '.');

		this.db.serialize(function() {
			// delete all data
			self.db.del(self.table, { channel: chan });

			// insert all emotes
			for (var emote in self.stats[chan]) {
				self.db.insert(self.table, {
					channel: chan,
					emote: emote,
					counter: self.stats[chan][emote]
				});
			}

			if (callback) {
				callback();
			}
		});
	},

	getTopEmotes: function(channel, max) {
		var
			chan   = typeof channel === 'string' ? channel : channel.getName(),
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
	}
};

module.exports = EmoteCounterPlugin;
