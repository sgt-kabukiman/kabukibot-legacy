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
	this.manager  = null;
	this.bot      = null;
	this.log      = null;
	this.db       = null;
	this.acl      = null;
	this.listener = null;
	this.table    = 'emote_counter';
	this.stats    = {};
};

EmoteCounterPlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		this.manager  = new Manager(kabukibot.getLog());
		this.bot      = kabukibot;
		this.log      = kabukibot.getLog();
		this.db       = kabukibot.getDatabase();
		this.acl      = kabukibot.getACL();
		this.listener = this.onText.bind(this);

		this.manager.fetchEmotes();
		this.manager.initUpdater(3*3600*1000); // update every 3 hours

		// sync emote counter with database every 10 minutes
		setInterval(this.syncAll.bind(this), 600*1000);

		this.db.query('CREATE TABLE IF NOT EXISTS ' + this.table + ' (channel VARCHAR(200), emote VARCHAR(50), counter INTEGER UNSIGNED, PRIMARY KEY (channel, emote))');
	},

	getKey: function() {
		return 'emote_counter';
	},

	getACLTokens: function() {
		return ['emote_counter_commands'];
	},

	load: function(channel, kabukibot, eventDispatcher) {
		var chan = channel.getName(), self = this;

		this.stats[chan] = {};

		this.db.all('SELECT * FROM ' + this.table + ' WHERE channel = $channel', { $channel: chan }, function(err, rows) {
			var bantype, i, len, domain;

			if (err) {
				self.log.error('Could not query emote counter: ' + err.message);
				return;
			}

			self.log.debug('Loaded ' + rows.length + ' counted emotes for #' + chan + '.');

			for (i = 0, len = rows.length; i < len; ++i) {
				self.stats[chan][rows[i].emote] = parseInt(rows[i].counter, 10);
			}

			eventDispatcher.onText(channel.getIrcName(), self.listener);
		});
	},

	unload: function(channel, kabukibot, eventDispatcher) {
		var self = this;

		eventDispatcher.removeTextListener(channel.getIrcName(), this.listener);

		this.syncChannel(channel, function() {
			delete self.stats[channel.getName()];
		});
	},

	onText: function(message) {
		var
			chan   = message.getChannel().getName(),
			stats  = this.stats[chan],
			emotes = this.manager.getEmotesInMessage(message.getMessage()),
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

	syncAll: function() {
		var chan, key;

		for (chan in this.stats) {
			for (key in this.stats[chan]) {
				if (this.stats[chan].hasOwnProperty(key)) {
					this.syncChannel(chan);
					continue;
				}
			}
		}
	},

	syncChannel: function(channel) {
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
		});
	}
};

module.exports = EmoteCounterPlugin;
