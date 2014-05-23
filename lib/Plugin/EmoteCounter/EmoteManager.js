/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var http = require('client-http');

function EmoteManager(log) {
	this.log       = log;
	this.interval  = null;
	this.blacklist = [':)', ';)', ':(', ':/', 'B)', ':D', ':P', ';P', ':o', ':s', ':|', ':Z', 'R)', 'o_O', '<3', '>(', ':>', ':L', ':7', '#/', '<]'];
	this.regexes   = {
		channels: {},
		users:    {}
	};
	this.emotes    = {
		global:       [],
		subscribers:  {},
		frankerfacez: {}
	};
}

function getEmotesFromRegex(message, regex) {
	if (regex === null) return [];

	return (message.match(regex) || []).map(function(e) {
		return e.replace(/^[^a-z0-9!$]/i, '').replace(/[^a-z0-9!$]$/i, '');
	});
}

function quoteRegex(s) {
	return s.replace('$', '\\$');
}

/**
 * This method builds a usable regex from the Twitch-API regex data. It's a
 * 1:1 copy of what Twitch is doing in their Webchat, except for the un-HTMLing.
 */
function buildFinalRegex(r) {
	r = r.trim()

	// turn P, O and S into non-capturing groups
	if (r.indexOf('(') !== -1) {
		r = r.replace('(p|P)',   '(?:p|P)');
		r = r.replace('(o|O)',   '(?:o|O)');
		r = r.replace('(S|s)',   '(?:S|s)');
		r = r.replace("(_|\\.)", "(?:_|\\.)");
	}

	// only add boundaries to word-only emotes
	if (r.match(/^\w+$/)) {
		r = "\\b" + r + "\\b";
	}
	// un-HTML encode the regex
	else {
		r = r.replace('\\&lt\\;', '<');
		r = r.replace('\\&gt\\;', '>');
	}

	return new RegExp(r, 'g');
}

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

		// If the user is a subscriber to any channel, as also search for his
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

	fetchEmotes: function() {
		var log = this.log, self = this;

		log.debug('EmoteManager: Fetching Twitch emotes...');
		http.get('https://api.twitch.tv/kraken/chat/emoticons', function(data) {
			if (!data) {
				log.error('EmoteManager: Error fetching emotes.');
			}
			else {
				log.debug('EmoteManager: Success.');
				self.parseTwitchEmotes(JSON.parse(data));
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
	},

	parseTwitchEmotes: function(data) {
		var emotes  = data.emoticons;
		var total   = emotes.length;
		var bl      = this.blacklist;
		var blTotal = bl.length;
		var i, j, emote, image, fullRegex, skip, subs, setID;

		this.emotes.global      = [];
		this.emotes.subscribers = {};

		subs = this.emotes.subscribers;

		for (i = 0; i < total; ++i) {
			emote = emotes[i];

			// Skip the emote if it matches any of the blacklisted emotes.
			// Note that we are not blacklisting via the regex itself, but instead
			// by giving "examples" of emotes we don't want. This prevents problems
			// when Twitch is adjusting the regexes.
			// This at the same time removes all emotes with regex syntax in them,
			// so we can after that just assume that emote.regex is "clean" and
			// contains no regex foo.

			fullRegex = buildFinalRegex(emote.regex);
			skip      = false;

			for (j = 0; j < blTotal; ++j) {
				if (fullRegex.test(bl[j])) {
					skip = true;
					break;
				}
			}

			if (skip) {
				continue;
			}

			// The blacklisting should remove all emotes which have special Turbo
			// images, leaving us with emotes that have only one image. But just in
			// case: We are ignoring all further images.

			image = emote.images[0];
			setID = image.emoticon_set;

			if (setID === null) {
				this.emotes.global.push(emote.regex);
			}
			else {
				if (!(setID in subs)) {
					subs[setID] = [];
				}

				subs[setID].push(emote.regex);
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
			subEmotes = this.emotes.subscribers,
			result    = [],
			i, j, setID;

		for (i = 0; i < sets.length; ++i) {
			setID = sets[i];

			if (!(setID in subEmotes)) {
				this.log.warning('Unknown emoteset ID ' + setID + ' encountered.');
				continue;
			}

			for (j = 0; j < subEmotes[setID].length; ++j) {
				result.push(quoteRegex(subEmotes[setID][j]));
			}
		}

		return result.length === 0 ? null : new RegExp("(\\b|[^a-zA-Z0-9!$])(" + result.join('|') + ")(\\b|[^a-zA-Z0-9!$])", 'g');
	}
};

module.exports = EmoteManager;
