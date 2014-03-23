/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var HighlightsPlugin = function() {
	this.bot           = null;
	this.acl           = null;
	this.listener      = null;
	this.data          = {};
	this.maxHighlights = 200;              // per channel
	this.cooldown      = 1*60*1000;        // 1min cooldown after each highlight
	this.maxAge        = 2*7*24*3600*1000; // highlights are purged after 2 weeks
};

HighlightsPlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		this.bot      = kabukibot;
		this.acl      = kabukibot.getACL();
		this.listener = this.onCommand.bind(this);
	},

	getKey: function() {
		return 'highlights';
	},

	getACLTokens: function() {
		return ['highlights', 'reset_highlights'];
	},

	getRequiredACLToken: function(cmd) {
		if (cmd === 'reset_highlights') {
			return 'reset_highlights';
		}

		return 'highlights';
	},

	load: function(channel, kabukibot, eventDispatcher) {
		var chan = channel.getName();

		eventDispatcher.onCommand(chan, this.listener);

		this.data[chan] = [];
	},

	unload: function(channel, kabukibot, eventDispatcher) {
		var chan = channel.getName();

		eventDispatcher.removeCommandListener(chan, this.listener);

		if (chan in this.data) {
			delete this.data[chan];
		}
	},

	purgeOld: function(chan, now) {
		var result = [], key;

		if (!now) {
			now = Date.now();
		}

		for (key in this.data[chan]) {
			if (this.data[chan][key].ts + this.maxAge > now) {
				result.push(this.data[chan][key]);
			}
		}

		this.data[chan] = result;
	},

	onCommand: function(command, args, message) {
		var chan = message.getChannel().getName();

		// not for us
		if (command !== 'highlight' && command !== 'get_highlights' && command !== 'reset_highlights') {
			return;
		}

		// not allowed
		if (!this.acl.isAllowed(message.getUser(), this.getRequiredACLToken(command))) {
			return;
		}

		switch (command) {
			case 'highlight':        return this.highlight(chan, args, message);
			case 'get_highlights':   return this.getHighlights(chan, args, message);
			case 'reset_highlights': return this.resetHighlights(chan, message);
		}
	},

	highlight: function(chan, args, message) {
		var now, description, highlights, latest, cooldown;

		if (args.length < 1) {
			return message.respond('at least give me the current run time.');
		}

		now         = Date.now();
		description = args.join(' ');
		highlights  = this.data[chan];
		latest      = highlights.length === 0 ? null : highlights[highlights.length - 1];

		// cleanup

		if (highlights.length > 0) {
			this.purgeOld(chan, now);
		}

		// check if the list is already full

		if (highlights.length >= this.maxHighlights) {
			return message.respond('there are already ' + this.maxHighlights + ' highlights in the queue, I cannot take anymore.');
		}

		// check if we still cooldown after the last highlight

		if (latest) {
			cooldown = 30*1000; // 30 seconds

			if (latest.ts + cooldown > now) {
				return message.respond('The last highlight was only ' + Math.ceil((now - latest.ts) / 1000) + ' seconds ago. No need to highlight again.');
			}
		}

		// add highlight

		this.data[chan].push({
			ts:   now,
			note: description,
			by:   message.getUser().getName()
		});

		message.respond('the highlight has been noted down, thank you.');
	},

	getHighlights: function(chan, args, message) {
		var
			list    = [],
			verbose = args.length > 0 && args[0].toLowerCase() === 'verbose',
			idx     = 1,
			key, highlight;

		for (key in this.data[chan]) {
			highlight = this.data[chan][key];

			if (verbose) {
				list.push('#' + (idx++) + ': "' + highlight.note + '" (by ' + highlight.by + ', ' + (new Date(highlight.ts)).toUTCString() + ')');
			}
			else {
				list.push('#' + (idx++) + ': "' + highlight.note + '"');
			}
		}

		if (list.length === 0) {
			message.respond('no highlights have been noted down yet.');
		}
		else {
			message.respond('the highlights are: ' + list.join(' // '));
		}
	},

	resetHighlights: function(chan, message) {
		var num = this.data[chan].length;

		delete this.data[chan];
		this.data[chan] = [];

		message.respond('your ' + (num === 1 ? 'one highlight has' : (num + ' highlights have')) + ' been deleted.');
	}
};

module.exports = HighlightsPlugin;
