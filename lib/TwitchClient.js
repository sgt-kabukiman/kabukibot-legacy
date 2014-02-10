/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	ACL             = require('./ACL.js'),
	ModeMessage     = require('./ModeMessage.js'),
	TextMessage     = require('./TextMessage.js'),
	TwitchMessage   = require('./TwitchMessage.js'),
	Channel         = require('./Channel.js'),
	User            = require('./User.js'),
	Log             = require('./Log.js'),
	Database        = require('./Database.js'),
	ChannelManager  = require('./ChannelManager.js'),
	EventDispatcher = require('./EventDispatcher.js'),

	irc    = require('irc'),
	events = require('events');

var TwitchClient = function(ircClient, database, chanMngr, acl, log, dispatcher, config) {
	this.irc          = ircClient;
	this.db           = database;
	this.acl          = acl;
	this.chanMngr     = chanMngr;
	this.log          = log;
	this.config       = config;
	this.dispatcher   = dispatcher;
	this.channels     = {};
	this.plugins      = [];
	this.turboUsers   = {};
	this.twitchAdmins = {};
	this.twitchStaff  = {};
	this.subsHeap     = {}; // list of users from whom we do not know where they are subscribers to

	ircClient.addListener('message', this.onMessage.bind(this));
	ircClient.addListener('+mode',   this.onModeChange.bind(this));
	ircClient.addListener('-mode',   this.onModeChange.bind(this));
};

TwitchClient.prototype = {
	getDatabase: function() {
		return this.db;
	},

	getChannelManager: function() {
		return this.chanMngr;
	},

	getACL: function() {
		return this.acl;
	},

	getLog: function() {
		return this.log;
	},

	getEventDispatcher: function() {
		return this.dispatcher;
	},

	setup: function() {
		for (var i in this.plugins) {
			this.plugins[i].setup(this, this.dispatcher);
		}

		return this;
	},

	connect: function() {
		var self = this, irc = this.irc, log = this.log;

		log.debug('Opening database...');

		this.db.connect(function() {
			log.info('Connecting to Twitch...');

			irc.connect(function() {
				// make sure Twitch knows we're not just an ordinary IRC client, but
				// understand their special user semantics (this enables the
				// SPECIALUSER messages from Twitch)
				irc.send('TWITCHCLIENT');
				log.info('Connection established.');

				// join ourselves
				self.joinChannel(new Channel(self.getBotName()));

				self.chanMngr.loadChannels(function(chanMngr) {
					for (var i = 0, chans = chanMngr.getChannels(), len = chans.length; i < len; ++i) {
						self.joinChannel(new Channel(chans[i]));
					}
				});
			});
		});
	},

	joinChannel: function(channel) {
		var self = this, name = channel.getName();

		if (name in this.channels) {
			return false;
		}

		this.channels[name] = channel;

		channel.setTwitchClient(this);

		this.irc.join(channel.getIrcName(), function() {
			self.log.info('Joined #' + name);
			self.acl.loadChannelData(channel);
		});

		return true;
	},

	leaveChannel: function(channel) {
		var self = this, name = channel.getName();

		if (!(name in this.channels)) {
			return false;
		}

		delete this.channels[name];

		this.irc.part(channel.getIrcName(), function() {
			self.log.info('Left #' + name);
			self.acl.unloadChannelData(channel);
			self.chanMngr.removeChannel(channel);
		});

		return true;
	},

	getChannel: function(chan) {
		return this.channels[chan];
	},

	addPlugin: function(plugin) {
		this.plugins.push(plugin);
	},

	getPlugins: function() {
		return this.plugins;
	},

	onMessage: function(username, chan, text) {
		var channel, user, msg;

		// regular text message
		if (chan.charAt(0) === '#') {
			channel = this.channels[chan.substring(1)],
			user    = new User(username, channel),
			msg     = new TextMessage(channel, user, text);
		}

		// special twitch command
		// ignore all (possibly never occuring) private messages that do not come from jtv
		else if (username === 'jtv') {
			msg = TwitchMessage.fromIrcMessage(text);
		}

		this.process(msg);
	},

	onModeChange: function(chan, by, mode, username, message) {
		var
			args    = message.args,
			channel = this.channels[args[0].substring(1)],
			user    = args.length === 3 ? new User(args[2], channel) : null,
			msg     = new ModeMessage(channel, args[1], user);

		this.process(msg);
	},

	process: function(message) {
		var chan = message instanceof TwitchMessage ? null : message.getChannel();

		if (message instanceof TextMessage) {
			this.dispatcher.fire(EventDispatcher.MESSAGE, chan, message);
			this.dispatcher.fire(EventDispatcher.TEXT, chan, message);

			this.processPossibleCommand(message);
		}
		else if (message instanceof ModeMessage) {
			this.dispatcher.fire(EventDispatcher.MESSAGE, chan, message);
			this.dispatcher.fire(EventDispatcher.MODE, chan, message);
		}
		else if (message instanceof TwitchMessage) {
			this.dispatcher.fire(EventDispatcher.TWITCH, null, message);
		}
	},

	processPossibleCommand: function(message) {
		var
			text  = message.getMessage(),
			match = text.match(/^\!([a-zA-Z0-9_-]+)(?:\s+(.+))?$/),
			command, args;

		if (match === null) {
			return;
		}

		command = match[1].toLowerCase();
		args    = match[2] ? match[2].trim().split(/\s+/) : [];

		this.dispatcher.fire(EventDispatcher.COMMAND, message.getChannel(), command, args, message);
	},

	addTurboUser: function(username) {
		this.log.debug('Added ' + username + ' as a turbo user.');
		this.turboUsers[username] = Date.now();
	},

	addTwitchStaff: function(username) {
		this.log.debug('Added ' + username + ' as Twitch staff.');
		this.twitchStaff[username] = Date.now();
	},

	addTwitchAdmin: function(username) {
		this.log.debug('Added ' + username + ' as a Twitch admin.');
		this.twitchAdmins[username] = Date.now();
	},

	isOperator: function(user) {
		var username = typeof user === 'string' ? user : user.getName();

		return username === this.config.op;
	},

	isTurboUser: function(username) {
		return this.getUserStatus(this.turboUsers, username, this.config.ttl.turbo);
	},

	isTwitchStaff: function(username) {
		return this.getUserStatus(this.twitchStaff, username, this.config.ttl.staff);
	},

	isTwitchAdmin: function(username) {
		return this.getUserStatus(this.twitchAdmins, username, this.config.ttl.admin);
	},

	getUserStatus: function(list, username, ttl) {
		if (!(username in list)) {
			return false;
		}

		var
			set = list[username],
			now = Date.now();

		if (set + ttl < now) {
			delete list[username];
			return false;
		}

		return true;
	},

	addHomelessSubscriber: function(username) {
		this.log.debug('Added ' + username + ' as a homeless subscriber.');
		this.subsHeap[username] = Date.now();
	},

	takeHomelessSubscriber: function(username) {
		var status = this.getUserStatus(this.subsHeap, username, this.config.ttl.subscriber);

		// the subscriber status should only be valid for exactly one access (i.e. the next message
		// of a user after the SPECIALUSER line)
		if (status === true) {
			delete this.subsHeap[username];
		}

		return status;
	},

	getBotName: function(user) {
		return this.config.account.username.toLowerCase();
	},

	say: function(chan, text) {
		this.irc.say(chan, text);
		this.log.ircMessage(chan.substring(1), this.getBotName(), text);
	}
};

module.exports.TwitchClient = TwitchClient;

module.exports.getClient = function(config, logLevel) {
	var ircClient = new irc.Client('irc.twitch.tv', config.account.username, {
		showErrors: true,
		autoConnect: false,
		floodProtection: true,
		floodProtectionDelay: 1000, // 1 sec
		password: config.account.oauthToken,
		realName: config.account.username,
		debug: false
	});

	var log        = new Log('main', logLevel || Log.INFO);
	var db         = new Database(config.database, log);
	var mngr       = new ChannelManager(db, log);
	var acl        = new ACL(db, log);
	var dispatcher = new EventDispatcher();

	return new TwitchClient(ircClient, db, mngr, acl, log, dispatcher, config);
};
