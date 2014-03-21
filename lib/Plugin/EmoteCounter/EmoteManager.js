/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var http = require('client-http');

var EmoteManager = function(log) {
	this.log       = log;
	this.interval  = null;
	this.emoteSets = {};
	this.regexes   = {
		channels: {},
		users:    {}
	};
	this.emotes    = {
		global:       [],
		subscribers:  {},
		frankerfacez: {}
	};
};

var getEmotesFromRegex = function(message, regex) {
	if (regex === null) return [];

	return (message.match(regex) || []).map(function(e) {
		return e.replace(/^[^a-z0-9!$]/i, '').replace(/[^a-z0-9!$]$/i, '');
	});
};

var quoteRegex = function(s) {
	return s.replace('$', '\\$').replace('!', '\\!');
};

EmoteManager.prototype = {
	initUpdater: function(interval) {
		this.interval = setInterval(this.fetchEmotes.bind(this), interval);
	},

	stopUpdater: function() {
		this.interval && clearInterval(this.interval);
		this.interval = null;
	},

	getEmotesInMessage: function(message, user) {
		var
			msg      = typeof message === 'string' ? message : message.getMessage(),
			chan     = user.getChannel().getName(),
			username = user.getName(),
			sets     = user.getEmoteSets(),
			key, emotes, temp, idx;

		// no emotes fetched yet
		if (this.emotes.global.length === 0) return [];

		// Search for any channel-global emotes
		if (!(chan in this.regexes.channels)) {
			this.regexes.channels[chan] = this.buildChannelRegex(chan);
		}

		emotes = getEmotesFromRegex(msg, this.regexes.channels[chan]);

		// If the user is a subscriber to any channel, as also search for this
		// subscriber emotes. In order to minimize the memory footprint, we are
		// storing the regexes per emotesets (JSON-encoded) value, so if two or
		// more users are subscribed to the same channels, they will both use
		// the same regex object.

		if (sets.length > 0) {
			sets.sort();
			key = JSON.stringify(sets);

			if (!(key in this.regexes.users)) {
				this.regexes.users[key] = this.buildEmoteSetsRegex(sets);
			}

			temp = getEmotesFromRegex(msg, this.regexes.users[key]);

			for (idx in temp) {
				emotes.push(temp[idx]);
			}
		}

		return emotes;
	},

	hasEmote: function(emote, channel) {
		var chan = typeof channel === 'string' ? channel : channel.getName();

		if (                                    this.emotes.global.indexOf(emote)             !== -1) return true;
		if (chan in this.emotes.subscribers  && this.emotes.subscribers[chan].indexOf(emote)  !== -1) return true;
		if (chan in this.emotes.frankerfacez && this.emotes.frankerfacez[chan].indexOf(emote) !== -1) return true;

		return false;
	},

	fetchEmotes: function() {
		var log = this.log, self = this;

		log.debug('EmoteManager: Fetching global Twitch emotes...');
		http.get('http://twitchemotes.com/global.json', function(data) {
			if (!data) {
				log.error('EmoteManager: Error fetching emotes.');
			}
			else {
				log.debug('EmoteManager: Success.');
				self.parseGlobalTwitchEmotes(JSON.parse(data));
			}

			log.debug('EmoteManager: Fetching subscriber Twitch emotes...');
			http.get('http://twitchemotes.com/subscriber.json', function(data) {
				if (!data) {
					log.error('EmoteManager: Error fetching emotes.');
				}
				else {
					log.debug('EmoteManager: Success.');
					self.parseSubscriberTwitchEmotes(JSON.parse(data));
				}

				log.debug('EmoteManager: Fetching FrankerFaceZ emotes...');
				http.get('http://frankerfacez.com/users.txt', function(data) {
					if (!data) {
						log.error('EmoteManager: Error fetching emotes.');
					}
					else {
						log.debug('EmoteManager: Success.');
						self.parseFrankerFaceZEmotes(data);
					}

					// reset all previously created regexes
					self.regexes = { channels: {}, users: {} };
				});
			});
		});
	},

	parseGlobalTwitchEmotes: function(data) {
		this.emotes.global = [];

		for (var key in data) {
			this.emotes.global.push(key);
		}
	},

	parseSubscriberTwitchEmotes: function(data) {
		var chan, key;

		this.emotes.subscribers = {};
		this.emoteSets          = {};

		for (chan in data) {
			this.emotes.subscribers[chan] = [];

			for (key in data[chan].emotes) {
				this.emotes.subscribers[chan].push(key);
			}

			this.emoteSets[data[chan]._set] = chan;
		}
	},

	parseFrankerFaceZEmotes: function(data) {
		var lines = data.trim().split("\n"), line, idx, chan;

		this.emotes.frankerfacez = {};

		for (idx in lines) {
			line = lines[idx];

			if (line[0] !== '.') {
				chan = line;
				this.emotes.frankerfacez[chan] = [];
				continue;
			}
			else {
				this.emotes.frankerfacez[chan].push(line.substring(1));
			}
		}
	},

	buildChannelRegex: function(chan) {
		var
			globals      = this.emotes.global,
			frankerfacez = this.emotes.frankerfacez,
			list         = [],
			key;

		for (key in globals) {
			list.push(quoteRegex(globals[key]));
		}

		for (key in frankerfacez.global) {
			list.push(quoteRegex(frankerfacez.global[key]));
		}

		if (chan in frankerfacez) {
			for (key in frankerfacez[chan]) {
				list.push(quoteRegex(frankerfacez[chan][key]));
			}
		}

		return new RegExp("(\\b|[^a-zA-Z0-9!$])(" + list.join('|') + ")(\\b|[^a-zA-Z0-9!$])", 'g');
	},

	buildEmoteSetsRegex: function(sets) {
		var
			subs = this.emotes.subscribers,
			list = [],
			key, idx, setID, chan;

		for (key in sets) {
			setID = sets[key];
			chan  = this.emoteSets[setID] || null;

			if (!chan) {
				this.log.warning('Unknown emoteset ID ' + setID + ' encountered.');
				continue;
			}

			if (chan in subs) {
				for (idx in subs[chan]) {
					list.push(quoteRegex(subs[chan][idx]));
				}
			}
		}

		return list.length === 0 ? null : new RegExp("(\\b|[^a-zA-Z0-9!$])(" + list.join('|') + ")(\\b|[^a-zA-Z0-9!$])", 'g');
	}
};

module.exports = EmoteManager;
