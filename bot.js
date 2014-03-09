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

	// load core plugins (required for running the bot)
	CorePlugin          = require('./lib/Plugin/Core.js'),
	ConsoleOutputPlugin = require('./lib/Plugin/ConsoleOutput.js'),
	PingPlugin          = require('./lib/Plugin/Ping.js'),
	JoinPlugin          = require('./lib/Plugin/Join.js'),
	ACLPlugin           = require('./lib/Plugin/ACL.js'),
	PluginControlPlugin = require('./lib/Plugin/PluginControl.js'),

	// load content-providing plugins (these are optional)
	SDAContentPlugin = require('./lib/Plugin/Content/SDA.js')
	ESAContentPlugin = require('./lib/Plugin/Content/ESA.js');

////////////////////////////////////////////////////////////////////////////////

bot
	.getBot(config, 'debug' in argv ? log.DEBUG : ('warning' in argv ? log.WARNING : log.INFO))
	.addPlugin(new CorePlugin())
	.addPlugin(new ConsoleOutputPlugin())
	.addPlugin(new PingPlugin())
	.addPlugin(new JoinPlugin())
	.addPlugin(new ACLPlugin())
	.addPlugin(new PluginControlPlugin())
	.addPlugin(new SDAContentPlugin())
	.addPlugin(new ESAContentPlugin())
	.setup()
	.run();
