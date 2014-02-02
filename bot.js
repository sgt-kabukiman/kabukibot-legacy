/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	TwitchClient = require('./lib/TwitchClient.js'),
	Channel      = require('./lib/Channel.js'),
	Core         = require('./lib/Plugin/Core.js'),
	Dummy        = require('./lib/Plugin/ConsoleOutput.js'),
	irc          = require('irc'),
	sqlite3      = require('sqlite3');

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
	}
});

twitchClient.addPlugin(new Core(db));
twitchClient.addPlugin(new Dummy(console));

twitchClient.connect([
	new Channel('...')
]);
