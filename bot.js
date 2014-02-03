/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	// load core libraries
	TwitchClient = require('./lib/TwitchClient.js'),
	Channel      = require('./lib/Channel.js'),

	// load plugins
	CorePlugin           = require('./lib/Plugin/Core.js'),
	ConsoleOutputPlugin  = require('./lib/Plugin/ConsoleOutput.js'),
	EatOwnMessagesPlugin = require('./lib/Plugin/EatOwnMessages.js'),
	PingPlugin           = require('./lib/Plugin/Ping.js'),
	JoinPlugin           = require('./lib/Plugin/Join.js'),

	// load vendor libraries
	irc     = require('irc'),
	sqlite3 = require('sqlite3');

////////////////////////////////////////////////////////////////////////////////

var ircClient = new irc.Client('irc.twitch.tv', '...', {
	showErrors: true,
	autoConnect: false,
	floodProtection: true,
	floodProtectionDelay: 1000, // 1 sec
	password: '...',
	realName: '...',
	debug: false
});

var db = new sqlite3.Database('test.sqlite3', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function() {
	// db.run('CREATE TABLE IF NOT EXISTS channels (name VARCHAR(200), ')
});

var twitchClient = new TwitchClient(ircClient, {
	ttl: {
		turbo: 5000,
		admin: 5000,
		staff: 5000,
		subscriber: 5000
	},
	op: '...',
	account: {
		username: '...',
		oauthToken: '...'
	}
});

twitchClient.addPlugin(new CorePlugin(db));
twitchClient.addPlugin(new ConsoleOutputPlugin(console));
twitchClient.addPlugin(new EatOwnMessagesPlugin());
twitchClient.addPlugin(new PingPlugin(console));
twitchClient.addPlugin(new JoinPlugin(db));

twitchClient.connect([
	new Channel('...')
]);
