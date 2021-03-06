/*
 * Copyright (c) 2015, Sgt. Kabukiman, https://github.com/sgt-kabukiman
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	ACL             = require('./ACL.js'),
	Channel         = require('./Channel.js'),
	ChannelManager  = require('./ChannelManager.js'),
	EventDispatcher = require('./EventDispatcher.js'),
	Log             = require('./Log.js'),
	ErrorHandler    = require('./ErrorHandler.js'),
	TwitchClient    = require('./TwitchClient.js'),
	Dictionary      = require('./Dictionary.js'),
	UserManager     = require('./UserManager.js'),
	PluginManager   = require('./PluginManager.js'),
	StringTemplate  = require('./StringTemplate.js'),
	utils           = require('./Utils.js'),

	irc   = require('irc'),
	raven = require('raven');

function Kabukibot(twitchClient, database, chanMngr, userMngr, pluginMngr, acl, log, dispatcher, dict, strTemplate, errorHandler, config) {
	this.twitchClient = twitchClient;
	this.db           = database;
	this.acl          = acl;
	this.chanMngr     = chanMngr;
	this.userMngr     = userMngr;
	this.pluginMngr   = pluginMngr;
	this.log          = log;
	this.config       = config;
	this.dispatcher   = dispatcher;
	this.dict         = dict;
	this.strTemplate  = strTemplate;
	this.errorHandler = errorHandler;
}

Kabukibot.prototype = {
	getTwitchClient: function() {
		return this.twitchClient;
	},

	getDatabase: function() {
		return this.db;
	},

	getChannelManager: function() {
		return this.chanMngr;
	},

	getUserManager: function() {
		return this.userMngr;
	},

	getPluginManager: function() {
		return this.pluginMngr;
	},

	getStringTemplate: function() {
		return this.strTemplate;
	},

	getACL: function() {
		return this.acl;
	},

	getLog: function() {
		return this.log;
	},

	getConfig: function() {
		return this.config;
	},

	getEventDispatcher: function() {
		return this.dispatcher;
	},

	getDictionary: function() {
		return this.dict;
	},

	getErrorHandler: function() {
		return this.errorHandler;
	},

	getCommandPrefix: function() {
		return this.config.commandPrefix;
	},

	joinChannel: function(channel) {
		channel.setKabukibot(this);

		return this.twitchClient.join(channel);
	},

	leaveChannel: function(channel) {
		return this.twitchClient.part(channel);
	},

	setup: function() {
		this.dispatcher.on('connect', this.onConnect.bind(this));
		this.dispatcher.on('join', this.onJoin.bind(this));
		this.dispatcher.on('part', this.onPart.bind(this));

		return this;
	},

	run: function() {
		var twitch = this.twitchClient, log = this.log, self = this;

		log.debug('Opening database...');

		this.db.connect(function() {
			log.debug('Database successfully opened.');

			self.dict.load(function() {
				self.pluginMngr.setup(self, self.dispatcher);
				twitch.connect();
			});
		});
	},

	onConnect: function() {
		var self = this;

		// join ourselves
		this.joinChannel(new Channel(this.getBotName()));

		// load all previously joined channels
		this.chanMngr.loadChannels(function(chanMngr) {
			// and now join them
			for (var i = 0, chans = chanMngr.getChannels(), len = chans.length; i < len; ++i) {
				self.joinChannel(new Channel(chans[i]));
			}
		});
	},

	onJoin: function(channel) {
		this.acl.loadChannelData(channel);
		this.chanMngr.addChannel(channel);
		this.pluginMngr.setupChannel(channel);
	},

	onPart: function(channel) {
		this.pluginMngr.teardownChannel(channel);
		this.chanMngr.removeChannel(channel);
		this.acl.unloadChannelData(channel);
	},

	addPlugin: function(plugin) {
		this.pluginMngr.add(plugin);
		return this;
	},

	getBotName: function() {
		return this.config.account.username.toLowerCase();
	},

	say: function(chan, text, responseTo) {
		this.twitchClient.say(chan, text, responseTo);
	},

	getErrorResponse: function() {
		var messages = [
			'computer says no: ',
			'does not compute: ',
			'I\'m sorry, Dave. I\'m afraid I can\'t do that: ',
			'my programming may be inadequate to the task: ',
			'hm... There does appear to be a recurring motif: ',
			'Captain, there is no rational justification for this course: ',
			'I think you ought to know I\'m feeling very depressed: '
		];

		return utils.randomItem(messages);
	}
};

module.exports.Kabukibot = Kabukibot;

module.exports.getBot = function(config, logLevel) {
	// initialize the most basic objects

	var dispatcher   = new EventDispatcher();
	var log          = new Log('main', logLevel || Log.INFO);

	// create the database wrapper, but do not connect yet

	if (config.database.driver === 'sqlite') {
		var SQLite = require('./Database/SQLite.js');
		var db     = new SQLite(config.database.sqlite.filename);
	}
	else if (config.database.driver === 'mysql') {
		var MySQL = require('./Database/MySQL.js');
		var db    = new MySQL(config.database.mysql);
	}
	else {
		throw 'Unknown database driver "' + config.database.driver + '" selected.';
	}

	// setup the IRC client

	var ircClient = new irc.Client(config.irc.host, config.account.username, {
		port: config.irc.port,
		showErrors: true,
		autoConnect: false,
		floodProtection: false, // we implement our own, see TwitchClient
		password: config.account.oauthToken,
		realName: config.account.username
	});

	// initialize error handling

	var ravenClient  = config.sentry.dsn ? new raven.Client(config.sentry.dsn) : null;
	var errorHandler = new ErrorHandler(log, ravenClient);

	errorHandler.patchGlobal();
	db.onError(errorHandler.handleError.bind(errorHandler));
	ircClient.on('error', errorHandler.handleError.bind(errorHandler));

	// setup the actual bot objects

	var twitchClient = new TwitchClient(ircClient, dispatcher, log, 2000); // 1k = 1s flood protection delay
	var chanMngr     = new ChannelManager(db, log);
	var userMngr     = new UserManager(config.op);
	var pluginMngr   = new PluginManager(db, log);
	var acl          = new ACL(db, log);
	var dictionary   = new Dictionary(db, log);
	var strTemplate  = new StringTemplate();

	// make sure the log can query the queue length
	log.outgoingQueueLength = function() {
		return twitchClient.queue.length;
	};

	return new Kabukibot(twitchClient, db, chanMngr, userMngr, pluginMngr, acl, log, dispatcher, dictionary, strTemplate, errorHandler, config);
};
