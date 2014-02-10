/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	// parse argv
	argv = require('minimist')(process.argv.slice(2)),

	// load config
	config = require('./config.js'),

	// load core libraries
	twitch = require('./lib/TwitchClient.js'),
	log    = require('./lib/Log.js'),

	// load plugins
	CorePlugin          = require('./lib/Plugin/Core.js'),
	ConsoleOutputPlugin = require('./lib/Plugin/ConsoleOutput.js'),
	PingPlugin          = require('./lib/Plugin/Ping.js'),
	JoinPlugin          = require('./lib/Plugin/Join.js');

////////////////////////////////////////////////////////////////////////////////

var twitchClient = twitch.getClient(config, 'debug' in argv ? log.DEBUG : ('warning' in argv ? log.WARNING : log.INFO));

twitchClient.addPlugin(new CorePlugin());
twitchClient.addPlugin(new ConsoleOutputPlugin());
twitchClient.addPlugin(new PingPlugin());
twitchClient.addPlugin(new JoinPlugin());

twitchClient.setup().connect();
