/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var PluginControlPlugin = function() {
	this.pluginMngr = null;
	this.prefix     = null;
};

// There are multiple command possibilities:
//
// ![prefix]plugins
// ![prefix]enable pluginKey
// ![prefix]disable pluginKey
//
// Changing the loaded plugins is only allowed for the broadcaster and the operator.
//
// !plugins responds with a list of possible plugins for the current channel.

PluginControlPlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		eventDispatcher.onCommand(true, this.onCommand.bind(this));

		this.pluginMngr = kabukibot.getPluginManager();
		this.acl        = kabukibot.getACL();
		this.prefix     = kabukibot.getCommandPrefix();
	},

	getKey: function() {
		return null;
	},

	onCommand: function(command, args, message) {
		var
			channel = message.getChannel(),
			sender  = message.getUser(),
			plugin;

		// not for us
		if (command !== this.prefix+'enable' && command !== this.prefix+'disable' && command !== this.prefix+'plugins') {
			return;
		}

		// not allowed
		if (!sender.isOperator() && !sender.isBroadcaster()) {
			return;
		}

		// send the list of plugins
		if (command === this.prefix+'plugins') {
			message.respond('Available plugins are: ' + this.getPluginKeys(channel).join(', '));
			return;
		}

		// no plugin key given
		if (args.length === 0) {
			message.respond('Syntax is `!' + this.prefix + 'enable plugin`; Use !' + this.prefix + 'disable to disable a plugin again. See !' + this.prefix + 'plugins for a list of available plugins.');
			return;
		}

		// check the plugin
		plugin  = args[0].replace(/[^a-z0-9_]/ig, '').toLowerCase();
		plugins = this.getPluginKeys(channel);

		if (plugin.length === 0 || plugins.indexOf(plugin) === -1) {
			message.respond('Invalid plugin (' + args[0] + ') given.');
			return;
		}

		if (command === this.prefix+'enable') {
			if (this.pluginMngr.isLoaded(channel, plugin)) {
				message.respond('Plugin "' + plugin + '" is already enabled in this channel.');
			}
			else {
				this.pluginMngr.addPluginToChannel(channel, plugin);
				message.respond('Plugin "' + plugin + '" has been enabled.');
			}
		}
		else {
			if (!this.pluginMngr.isLoaded(channel, plugin)) {
				message.respond('Plugin "' + plugin + '" is not enabled in this channel.');
			}
			else {
				this.pluginMngr.removePluginFromChannel(channel, plugin);
				message.respond('Plugin "' + plugin + '" has been disabled.');
			}
		}
	},

	getPluginKeys: function(channel) {
		return this.pluginMngr.getPluginKeys();
	}
};

module.exports = PluginControlPlugin;
