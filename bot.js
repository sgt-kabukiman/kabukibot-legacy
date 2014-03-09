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
	bot = require('./lib/Kabukibot.js'),
	log = require('./lib/Log.js'),

	// load plugins
	CorePlugin          = require('./lib/Plugin/Core.js'),
	ConsoleOutputPlugin = require('./lib/Plugin/ConsoleOutput.js'),
	PingPlugin          = require('./lib/Plugin/Ping.js'),
	JoinPlugin          = require('./lib/Plugin/Join.js'),
	ACLPlugin           = require('./lib/Plugin/ACL.js');

////////////////////////////////////////////////////////////////////////////////

var kabukibot = bot.getBot(config, 'debug' in argv ? log.DEBUG : ('warning' in argv ? log.WARNING : log.INFO));

kabukibot.addPlugin(new CorePlugin());
kabukibot.addPlugin(new ConsoleOutputPlugin());
kabukibot.addPlugin(new PingPlugin());
kabukibot.addPlugin(new JoinPlugin());
kabukibot.addPlugin(new ACLPlugin());

kabukibot.setup().run();
