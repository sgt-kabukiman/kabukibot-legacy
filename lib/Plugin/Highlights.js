/*
 * Copyright (c) 2015, Sgt. Kabukiman, https://github.com/sgt-kabukiman
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	BasePlugin = require('./Base.js'),
	utils      = require('./../Utils.js'),
	util       = require('util');

function HighlightsPlugin() {
	this.listener      = null;
	this.maxHighlights = null;
	this.cooldown      = null;
	this.maxAge        = null;
	this.highlights    = {};
	this.table         = 'highlights';
}

util.inherits(HighlightsPlugin, BasePlugin);

var _ = HighlightsPlugin.prototype;

_.setup = function(kabukibot, eventDispatcher) {
	BasePlugin.prototype.setup.call(this, kabukibot, eventDispatcher);

	var config = kabukibot.getConfig().plugins.highlights;

	this.listener      = this.onCommand.bind(this);
	this.maxHighlights = config.maxPerChannel;
	this.cooldown      = config.cooldown * 1000;
	this.maxAge        = config.maxAge * 1000;

	if (kabukibot.getConfig().database.driver === 'sqlite') {
		this.db.query('CREATE TABLE IF NOT EXISTS ' + this.table + ' (channel VARCHAR(200) NOT NULL, date DATETIME NOT NULL, author VARCHAR(100) NOT NULL, note TEXT, PRIMARY KEY (channel, date))');
	}
	else {
		this.db.query('CREATE TABLE IF NOT EXISTS ' + this.table + ' (channel VARCHAR(200) NOT NULL, date DATETIME NOT NULL, author VARCHAR(100) NOT NULL, note TEXT, PRIMARY KEY (channel, date)) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB');
	}
};

_.getKey = function() {
	return 'highlights';
};

_.getACLTokens = function() {
	return ['highlights', 'reset_highlights'];
};

_.getRequiredACLToken = function(cmd) {
	if (cmd === 'reset_highlights' || cmd === 'delete_highlight' || cmd === 'remove_highlight') {
		return 'reset_highlights';
	}

	return 'highlights';
};

_.load = function(channel, kabukibot, eventDispatcher) {
	var chan = channel.getName(), self = this;

	this.highlights[chan] = [];

	this.selectFromDatabase(this.table, '*', { channel: chan }, function(rows) {
		var i, len;

		self.debug('Loaded ' + rows.length + ' highlights for #' + chan + '.');

		for (i = 0, len = rows.length; i < len; ++i) {
			self.highlights[chan].push({
				date:   new Date(rows[i].date + ' UTC'),
				author: rows[i].author,
				note:   rows[i].note
			});
		}

		// sort by date
		self.highlights[chan].sort(function(a, b) { return a.ts - b.ts; });

		// throw all old highlights away
		self.purgeOld(chan);

		// now we're ready to accept commands in this channel
		eventDispatcher.onCommand(chan, self.listener);
	});
};

_.unload = function(channel, kabukibot, eventDispatcher) {
	var chan = channel.getName();

	eventDispatcher.removeCommandListener(chan, this.listener);

	if (chan in this.highlights) {
		delete this.highlights[chan];
	}
};

_.purgeOld = function(chan) {
	var result = [], highlights = this.highlights[chan], now = new Date(), idx, date;

	for (idx in highlights) {
		date = highlights[idx].date;

		if (now - date > this.maxAge) {
			this.debug('Purging highlight "' + highlights[idx].note + '" (' + date.toUTCString() + ') in #' + chan + '.');

			this.db.del(this.table, { channel: chan, date: utils.dateToSQL(date) });
		}
		else {
			result.push(highlights[idx]);
		}
	}

	this.highlights[chan] = result;

	return result;
};

_.onCommand = function(command, args, message) {
	if (message.isProcessed()) return;

	var chan     = this.getChan(message);
	var commands = ['highlight', 'highlights', 'get_highlights', 'delete_highlight', 'remove_highlight', 'reset_highlights'];

	// not for us
	if (commands.indexOf(command) === -1) {
		return;
	}

	// not allowed
	if (!this.acl.isAllowed(message.getUser(), this.getRequiredACLToken(command))) {
		return;
	}

	switch (command) {
		case 'highlight':
			return this.highlight(chan, args, message);

		case 'highlights':
		case 'get_highlights':
			return this.getHighlights(chan, args, message);

//		case 'delete_highlight':
//		case 'remove_highlight':
//			return this.deleteHighlight(chan, args, message);

		case 'reset_highlights':
			return this.resetHighlights(chan, message);
	}
};

_.highlight = function(chan, args, message) {
	var now, note, highlights, latest, user;

	if (args.length < 1) {
		return message.respond('at least give me a short note on what happened.');
	}

	now        = new Date();
	note       = args.join(' ');
	highlights = this.highlights[chan];
	latest     = highlights.length === 0 ? null : highlights[highlights.length - 1];

	// cleanup

	if (highlights.length > 0) {
		highlights = this.purgeOld(chan);
	}

	// check if the list is already full

	if (highlights.length >= this.maxHighlights) {
		return message.respond('there are already ' + this.maxHighlights + ' highlights in the queue, I cannot take anymore BibleThump');
	}

	// check if we still cooldown after the last highlight

	if (latest && (now - latest.date < this.cooldown)) {
		return message.respond('the last highlight was only ' + Math.ceil((now - latest.date) / 1000) + ' seconds ago. No need to highlight again.');
	}

	// add highlight

	user = this.getUsername(message);

	this.db.insert(this.table, {
		channel: chan,
		date:    utils.dateToSQL(now),
		author:  user,
		note:    note
	});

	highlights.push({
		date:   now,
		author: user,
		note:   note
	});

	message.respond('the highlight has been noted down, thank you.');
};

_.getHighlights = function(chan, args, message) {
	var
		list       = [],
		verbose    = args.length > 0 && args[0].toLowerCase() === 'verbose',
		highlights = this.highlights[chan],
		i, len, highlight;

	for (i = 0, len = highlights.length; i < len; ++i) {
		highlight = highlights[i];

		if (verbose) {
			list.push('#' + (i + 1) + ': "' + highlight.note + '" (by ' + highlight.author + ', ' + highlight.date.toUTCString() + ')');
		}
		else {
			list.push('#' + (i + 1) + ': "' + highlight.note + '"');
		}
	}

	if (list.length === 0) {
		message.respond('no highlights have been noted down yet.');
	}
	else {
		message.respond('the highlights are: ' + utils.humanJoin(list, ' // '));
	}
};

_.resetHighlights = function(chan, message) {
	var num = this.highlights[chan].length;

	this.db.del(this.table, { channel: chan });

	delete this.highlights[chan];
	this.highlights[chan] = [];

	message.respond('the ' + (num === 1 ? 'one highlight has' : (num + ' highlights have')) + ' been deleted.');
};

module.exports = HighlightsPlugin;
