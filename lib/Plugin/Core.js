/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	BasePlugin  = require('./Base.js'),
	Channel     = require('./../Channel.js'),
	Log         = require('./../Log.js'),
	TextMessage = require('./../TextMessage.js'),
	util        = require('util');

function CorePlugin() {
	BasePlugin.call(this);

	this.userMngr = null;
	this.botName  = null;
}

util.inherits(CorePlugin, BasePlugin);

CorePlugin.prototype.setup = function(kabukibot, eventDispatcher) {
	BasePlugin.prototype.setup.call(this, kabukibot, eventDispatcher);

	eventDispatcher.onText(null, this.onTextMessage.bind(this));
	eventDispatcher.onMode(null, this.onModeMessage.bind(this));
	eventDispatcher.onTwitch(null, this.onTwitchMessage.bind(this));
	eventDispatcher.onCommand(null, this.onCommand.bind(this));

	this.userMngr = kabukibot.getUserManager();
	this.botName  = kabukibot.getBotName();
};

CorePlugin.prototype.onCommand = function(command, args, message) {
	if (!message.getUser().isOperator() || command !== this.gcmd('shutdown')) {
		return;
	}

	setImmediate(this.shutdown.bind(this));

	// turn on debugging mode
	this.bot.getLog().level = Log.DEBUG;

	return message.respondToAll('Daisy, Daisy, give me your answer do... ');
};

CorePlugin.prototype.onTextMessage = function(message) {
	var
		user     = message.getUser(),
		channel  = message.getChannel(),
		username = user.getName(),
		mngr     = this.userMngr;

	user.setSubscriber(mngr.takeSubscriber(channel, username));
	user.setTurbo(mngr.takeTurboUser(username));
	user.setTwitchStaff(mngr.isTwitchStaff(username));
	user.setTwitchAdmin(mngr.isTwitchAdmin(username));
	user.setEmoteSets(mngr.takeEmoteSets(username));
	user.setOperator(mngr.isOperator(username));
	user.setBot(username === this.botName);
};

CorePlugin.prototype.onTwitchMessage = function(message) {
	var
		channel  = message.getChannel(),
		args     = message.getArgs(),
		username = message.getUsername();

	switch (message.getCommand()) {
		case 'specialuser':
			this.onSpecialuserCommand(channel, username, args);
			break;

		case 'emoteset':
			this.onEmotesetCommand(username, args);
			break;

		default:
			// ignore clearchat and usercolor for now
	}
};

CorePlugin.prototype.onModeMessage = function(message) {
	var
		channel  = message.getChannel(),
		username = message.getUsername();

	switch (message.getMode()) {
		case '+o':
			channel.addModerator(username);
			break;

		case '-o':
			channel.removeModerator(username);
			break;

		default:
			this.log.error('Unknown mode encountered: ' + message.getMode());
	}
};

CorePlugin.prototype.onSpecialuserCommand = function(channel, username, args) {
	switch (args[1]) {
		case 'subscriber':
			this.userMngr.putSubscriber(channel, username);
			break;

		case 'turbo':
			this.userMngr.putTurboUser(username);
			break;

		case 'staff':
			this.userMngr.putTwitchStaff(username);
			break;

		case 'admin':
			this.userMngr.putTwitchAdmin(username);
			break;

		default:
			this.log.error('Unknown specialuser rank found: ' + args[1] + ' for user ' + username);
	}
};

CorePlugin.prototype.onEmotesetCommand = function(username, args) {
	// args = ['username', '[id,id,id]']
	// We're allowing spaces in the id list, just because why not. If there are ever spaces, the
	// args look like this:
	// args = ['username', '[id,', 'id,', 'id]']

	var sets = args.slice(1).join('');

	try {
		sets = JSON.parse(sets);
	}
	catch (e) {
		this.log.error('EMOTESET is not valid JSON: "' + sets + '" yields ' + e.message);
	}

	this.userMngr.putEmoteSets(username, sets);
};

CorePlugin.prototype.shutdown = function() {
	var self = this, bot = this.bot;

	this.debug('Shutdown has begun...');

	// unload plugins and ACL data for all channels, but do not actually leave (why bother?)
	var pluginManager = bot.getPluginManager();
	var channels      = bot.getChannelManager().getChannels();

	for (var i = 0, len = channels.length; i < len; ++i) {
		pluginManager.teardownChannel(new Channel(channels[i]));
	}

	// notify all plugins to shutdown
	var plugins = pluginManager.getPlugins();

	this.debug('Shutting down all plugins...');

	for (i = 0, len = plugins.length; i < len; ++i) {
		var plugin = plugins[i];

		if (plugin !== this && 'shutdown' in plugin) {
			plugin.shutdown(bot);
		}
	}

	// wait 30 seconds for all timers, DB queries etc. to finish up
	var self = this;

	setTimeout(function() {
		self.debug('Going to quit now.');

		bot.getTwitchClient().irc.disconnect('Bye and thanks for all the fish.', function() {
			bot.getDatabase().disconnect(function() {
				self.debug('Done.');

				// The only reason we have to exit explicitly is because the IRC client will have a dangling
				// dequeue interval, which blocks our normal exit.
				process.exit(0);
			});
		});
	}, 30*1000);

	this.debug('Waiting 30 seconds for all database activity, timers etc. to finish up.');
};

module.exports = CorePlugin;
