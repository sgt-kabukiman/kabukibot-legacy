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

	// load core libraries
	bot = require('./lib/Kabukibot.js'),
	log = require('./lib/Log.js'),

	// load core plugins (required for running the bot)
	CorePlugin          = require('./lib/Plugin/Core.js'),
	JoinPlugin          = require('./lib/Plugin/Join.js'),
	ACLPlugin           = require('./lib/Plugin/ACL.js'),
	PluginControlPlugin = require('./lib/Plugin/PluginControl.js'),

	// load content-providing and other plugins (these are optional)
	ConsoleOutputPlugin     = require('./lib/Plugin/ConsoleOutput.js'),
	PingPlugin              = require('./lib/Plugin/Ping.js'),
	LogPlugin               = require('./lib/Plugin/Log/Plugin.js'),
	SRRPlugin               = require('./lib/Plugin/SRR.js'),
	EchoPlugin              = require('./lib/Plugin/Echo.js'),
	SysInfoPlugin           = require('./lib/Plugin/SysInfo.js'),
	DictionaryControlPlugin = require('./lib/Plugin/DictionaryControl.js'),
	DomainBanPlugin         = require('./lib/Plugin/DomainBan.js'),
	BanhammerBotPlugin      = require('./lib/Plugin/BanhammerBot.js'),
	CustomCommandsPlugin    = require('./lib/Plugin/CustomCommands.js'),
	EmoteCounterPlugin      = require('./lib/Plugin/EmoteCounter/Plugin.js'),
	HighlightsPlugin        = require('./lib/Plugin/Highlights.js'),
	HangManPlugin           = require('./lib/Plugin/HangMan.js'),
	SubHypePlugin           = require('./lib/Plugin/SubHype.js'),
	GTAContentPlugin        = require('./lib/Plugin/Content/GTA.js'),
	SDAContentPlugin        = require('./lib/Plugin/Content/SDA.js'),
	ESAContentPlugin        = require('./lib/Plugin/Content/ESA.js'),
	ChattyContentPlugin     = require('./lib/Plugin/Content/Chatty.js');

////////////////////////// //////////////////////////////////////////////////////
// load config

var
	fs         = require('fs'),
	path       = require('path'),
	configFile = path.resolve('config' in argv ? argv.config : 'config.js');

if (!fs.existsSync(configFile)) {
	throw 'Config file "' + configFile + '" could not be found.';
}

var config = require(configFile);

////////////////////////////////////////////////////////////////////////////////

bot
	.getBot(config, 'debug' in argv ? log.DEBUG : ('warning' in argv ? log.WARNING : log.INFO))
	.addPlugin(new CorePlugin())
	.addPlugin(new LogPlugin())
	.addPlugin(new ConsoleOutputPlugin())
	.addPlugin(new PingPlugin())
	.addPlugin(new JoinPlugin())
	.addPlugin(new ACLPlugin())
	.addPlugin(new PluginControlPlugin())
	.addPlugin(new SRRPlugin())
	.addPlugin(new EchoPlugin())
	.addPlugin(new SysInfoPlugin())
	.addPlugin(new DictionaryControlPlugin())
	.addPlugin(new DomainBanPlugin())
	.addPlugin(new BanhammerBotPlugin())
	.addPlugin(new EmoteCounterPlugin())
	.addPlugin(new HighlightsPlugin())
	.addPlugin(new HangManPlugin())
	.addPlugin(new SubHypePlugin())
	.addPlugin(new CustomCommandsPlugin()) // should preceed only simple content plugins
	.addPlugin(new GTAContentPlugin())
	.addPlugin(new SDAContentPlugin())
	.addPlugin(new ESAContentPlugin())
	.addPlugin(new ChattyContentPlugin())
	.setup()
	.run();
