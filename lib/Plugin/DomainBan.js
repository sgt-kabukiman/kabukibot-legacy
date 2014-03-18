/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var url = require('url');

var DomainBanPlugin = function() {
	this.bot         = null;
	this.db          = null;
	this.acl         = null;
	this.log         = null;
	this.cmdListener = null;
	this.txtListener = null;
	this.data        = {};
	this.table       = 'domain_ban';
};

DomainBanPlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		this.bot         = kabukibot;
		this.db          = kabukibot.getDatabase();
		this.acl         = kabukibot.getACL();
		this.log         = kabukibot.getLog();
		this.cmdListener = this.onCommand.bind(this);
		this.txtListener = this.onText.bind(this);

		this.db.query('CREATE TABLE IF NOT EXISTS ' + this.table + ' (channel VARCHAR(200), domain VARCHAR(200), bantype VARCHAR(20), PRIMARY KEY (channel, domain))');
	},

	getKey: function() {
		return 'domain_ban';
	},

	getACLTokens: function() {
		return ['configure_domain_bans'];
	},

	load: function(channel, kabukibot, eventDispatcher) {
		var self = this, chan = channel.getName(), ircName = channel.getIrcName();

		eventDispatcher.onText(ircName, this.txtListener);
		eventDispatcher.onCommand(ircName, this.cmdListener);

		this.data[chan] = {};

		this.db.all('SELECT * FROM ' + this.table + ' WHERE channel = $channel', { $channel: chan }, function(err, rows) {
			var bantype, i, len, domain;

			if (err) {
				self.log.error('Could not query domain bans: ' + err.message);
				return;
			}

			self.log.debug('Loaded ' + rows.length + ' domain bans for ' + ircName + '.');

			for (i = 0, len = rows.length; i < len; ++i) {
				bantype = rows[i].bantype;
				domain  = rows[i].domain;

				if (bantype === 'ban') {
					self.data[chan][domain] = { type: 'ban' };
				}
				else {
					self.data[chan][domain] = {
						type:    'timeout',
						timeout: parseInt(bantype.split(':')[1], 10)
					};
				}
			}
		});
	},

	unload: function(channel, kabukibot, eventDispatcher) {
		var chan;

		eventDispatcher.removeTextListener(channel.getIrcName(), this.txtListener);
		eventDispatcher.removeCommandListener(channel.getIrcName(), this.cmdListener);

		if (chan in this.data) {
			delete this.data[chan];
		}
	},

	onCommand: function(command, args, message) {
		var chan = message.getChannel().getName();

		// not for us
		if (command !== 'ban_domain' && command !== 'unban_domain' && command !== 'banned_domains') {
			return;
		}

		// not allowed
		if (!this.acl.isAllowed(message.getUser(), 'configure_domain_bans')) {
			return;
		}

		switch (command) {
			case 'ban_domain':     return this.banDomain(chan, args, message);
			case 'unban_domain':   return this.unbanDomain(chan, args, message);
			case 'banned_domains': return this.getBannedDomains(chan, args, message);
		}
	},

	getBannedDomains: function(chan, args, message) {
		var list = [], domain, ban;

		for (domain in this.data[chan]) {
			ban = this.data[chan][domain];

			if (ban.type === 'timeout') {
				list.push(domain + ' (' + ban.timeout + 's t/o)');
			}
			else {
				list.push(domain + ' (ban)');
			}
		}

		if (list.length === 0) {
			message.respond('no domains are banned yet.');
		}
		else {
			message.respond('banned domains are: ' + list.join('; '));
		}
	},

	banDomain: function(chan, args, message) {
		var domain, timeout, exists, ban, bantype;

		if (args.length < 1) {
			message.respond(this.bot.getErrorResponse() + 'syntax is `!ban_domain example.com [timeout N]`. If no timeout is given, the sender will be *banned*.');
			return;
		}

		domain  = this.normalizeDomain(args[0]);
		timeout = null;

		if (domain === null) {
			message.respond(this.bot.getErrorResponse() + 'invalid domain given. Use something like "example.com" (without the quotes).');
			return;
		}

		exists = domain in this.data[chan];

		if (args.length >= 3 && (args[1] === 'timeout' || args[1] === 'to')) {
			timeout = parseInt(args[2], 10);

			if (isNaN(timeout) || timeout <= 0) {
				timeout = null;
			}
		}

		if (timeout === null) {
			bantype = 'ban';
			ban     = { type: 'ban' };
		}
		else {
			bantype = 'timeout:' + timeout;
			ban     = {
				type:    'timeout',
				timeout: timeout // timeout
			};
		}

		this.data[chan][domain] = ban;

		if (exists) {
			this.db.update(this.table, { bantype: bantype }, { channel: chan, domain: domain });
		}
		else {
			this.db.insert(this.table, { channel: chan, domain: domain, bantype: bantype });
		}

		message.respond('links to ' + domain + ' will be ' + (timeout === null ? '*banned*' : ('timed out for ' + timeout + ' seconds')) + '.');
	},

	unbanDomain: function(chan, args, message) {
		var domain, ban;

		if (args.length < 1) {
			message.respond(this.bot.getErrorResponse() + 'no domain given.');
			return;
		}

		domain = this.normalizeDomain(args[0]);

		if (domain === null) {
			message.respond(this.bot.getErrorResponse() + 'invalid domain given. Use something like "example.com" (without the quotes).');
			return;
		}

		if (!(domain in this.data[chan])) {
			message.respond('links to ' + domain + ' have not been banned yet. No changes done.');
			return;
		}

		ban = this.data[chan][domain];

		message.respond('links to ' + domain + ' will no longer be ' + (ban.bantype === 'ban' ? 'banned' : ('timed out for ' + ban.timeout + ' seconds')) + '.');

		this.db.del(this.table, { channel: chan, domain: domain });
		delete this.data[chan][domain];
	},

	normalizeDomain: function(domain) {
		domain = domain.toLowerCase();

		if (!domain.match(/^([a-z0-9][a-z0-9-]{1,61}[a-z0-9]\.)+[a-z]{2,}$/i)) {
			return null;
		}

		// remove leading 'www.'
		return domain.replace(/^(www\.)+/, '');
	},

	onText: function(message) {
		var
			          // thanks to BetterTTV for this one
			linkRe  = /(\b\x02?((?:https?:\/\/|[\w\-\.\+]+@)?\x02?(?:[\w\-]+\x02?\.)+\x02?(?:com|au|org|tv|net|info|jp|uk|us|cn|fr|mobi|gov|co|ly|me|vg|eu|ca|fm|am|ws)\x02?(?:\:\d+)?\x02?(?:\/[\w\.\/@\?\&\%\#\(\)\,\-\+\=\;\:\x02?]+\x02?[\w\/@\?\&\%\#\(\)\=\;\x02?]|\x02?\w\x02?|\x02?)?\x02?)\x02?\b|(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9]+-?)*[a-z0-9]+)(?:\.(?:[a-z0-9]+-?)*[a-z0-9]+)*(?:\.(?:[a-z]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?)/gi,
			channel = message.getChannel(),
			chan    = channel.getName(),
			sender  = message.getUser(),
			matches, match, i, len, offense, ban;

		if (!(chan in this.data) || sender.isOperator() || sender.isBroadcaster() || sender.isModerator() || sender.isTwitchAdmin() || sender.isTwitchStaff()) {
			return;
		}

		matches = message.getMessage().match(linkRe);

		if (matches === null) {
			return;
		}

		offense = null;

		for (i = 0, len = matches.length; i < len; ++i) {
			match = matches[i];

			if (match.indexOf('@') !== -1) {
				// This is obviously no valid mailto link. But this makes it easier to use url.parse on email addresses.
				match = url.parse('mailto://' + match);

				if (match) {
					match = match.host;
				}
			}

			if (match !== null) {
				match = this.normalizeDomain(match);

				if (match in this.data[chan]) {
					offense = match;
					break;
				}
			}
		}

		if (offense) {
			ban = this.data[chan][offense];

			if (ban.type === 'ban') {
				channel.ban(sender);
				message.respond('you have been permanently kicked for posting a link to a banned domain.');
			}
			else {
				channel.timeout(sender, ban.timeout);
				message.respond('you have been timed out for ' + ban.timeout + ' seconds for posting a link to a banned domain.');
			}
		}
	}
};

module.exports = DomainBanPlugin;
