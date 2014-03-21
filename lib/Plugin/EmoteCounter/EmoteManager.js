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
	this.log      = log;
	this.regexes  = {};
	this.interval = null;
	this.emotes   = {
		global:       [],
		subscribers:  {},
		frankerfacez: {}
	};
};

EmoteManager.prototype = {
	initUpdater: function(interval) {
		this.interval = setInterval(this.fetchEmotes.bind(this), interval);
	},

	stopUpdater: function() {
		this.interval && clearInterval(this.interval);
		this.interval = null;
	},

	getEmotesInMessage: function(message, channel) {
		var
			msg  = typeof message === 'string' ? message : message.getMessage(),
			chan = typeof channel === 'string' ? channel : channel.getName();

		// no emotes fetched yet
		if (this.emotes.global.length === 0) return [];

		if (!(chan in this.regexes)) {
			this.regexes[chan] = this.buildRegex(chan);
		}

		return (msg.match(this.regexes[chan]) || []).map(function(e) {
			return e.replace(/^[^a-z0-9!$]/i, '').replace(/[^a-z0-9!$]$/i, '');
		});
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
					self.regexes = {};
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

		for (chan in data) {
			this.emotes.subscribers[chan] = [];

			for (key in data[chan].emotes) {
				this.emotes.subscribers[chan].push(key);
			}
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

	buildRegex: function(chan) {
		var
			globals      = this.emotes.global,
			subscribers  = this.emotes.subscribers,
			frankerfacez = this.emotes.frankerfacez,
			list         = [],
			key;

		for (key in globals) {
			list.push(globals[key].replace('$', '\\$').replace('!', '\\!'));
		}

		if (chan in subscribers) {
			for (key in subscribers[chan]) {
				list.push(subscribers[chan][key].replace('$', '\\$').replace('!', '\\!'));
			}
		}

		for (key in frankerfacez.global) {
			list.push(frankerfacez.global[key].replace('$', '\\$').replace('!', '\\!'));
		}

		if (chan in frankerfacez) {
			for (key in frankerfacez[chan]) {
				list.push(frankerfacez[chan][key].replace('$', '\\$').replace('!', '\\!'));
			}
		}

		return new RegExp("(\\b|[^a-zA-Z0-9!$])(" + list.join('|') + ")(\\b|[^a-zA-Z0-9!$])", 'g');
	}
};

module.exports = EmoteManager;
