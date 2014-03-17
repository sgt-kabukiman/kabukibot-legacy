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

	// load content-providing and other plugins (these are optional)
	DictionaryControlPlugin = require('./lib/Plugin/DictionaryControl.js'),
	DomainBanPlugin         = require('./lib/Plugin/DomainBan.js'),
	CustomCommandsPlugin    = require('./lib/Plugin/CustomCommands.js'),
	GTAContentPlugin        = require('./lib/Plugin/Content/GTA.js'),
	SDAContentPlugin        = require('./lib/Plugin/Content/SDA.js'),
	ESAContentPlugin        = require('./lib/Plugin/Content/ESA.js');

////////////////////////////////////////////////////////////////////////////////

bot
	.getBot(config, 'debug' in argv ? log.DEBUG : ('warning' in argv ? log.WARNING : log.INFO))
	.addPlugin(new CorePlugin())
	.addPlugin(new ConsoleOutputPlugin())
	.addPlugin(new PingPlugin())
	.addPlugin(new JoinPlugin())
	.addPlugin(new ACLPlugin())
	.addPlugin(new PluginControlPlugin())
	.addPlugin(new DictionaryControlPlugin())
	.addPlugin(new DomainBanPlugin())
	.addPlugin(new GTAContentPlugin())
	.addPlugin(new SDAContentPlugin())
	.addPlugin(new ESAContentPlugin())
	.addPlugin(new CustomCommandsPlugin()) // should always be last
	.setup()
	.run();
