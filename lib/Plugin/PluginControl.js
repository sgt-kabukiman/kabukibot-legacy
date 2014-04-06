/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

function PluginControlPlugin() {
	this.bot        = null;
	this.pluginMngr = null;
	this.acl        = null;
	this.prefix     = null;
}

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

		this.bot        = kabukibot;
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
			plugin, plugins, enabled, list;

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
			plugins = this.getPluginKeys(channel, false);
			enabled = args.length > 0 && args[0].toLowerCase() === 'enabled';
			list    = [];

			for (plugin in plugins) {
				if (plugins.hasOwnProperty(plugin)) {
					if (enabled) {
						if (plugins[plugin]) {
							list.push(plugin);
						}
					}
					else {
						list.push(plugin + ' (' + (plugins[plugin] ? 'enabled' : 'disabled') + ')');
					}
				}
			}

			message.respond((enabled ? 'enabled' : 'available') + 'plugins are: ' + list.join(', '));
			return;
		}

		// no plugin key given
		if (args.length === 0) {
			message.respond(this.bot.getErrorResponse() + 'no plugin name given. See !' + this.prefix + 'plugins for a list of available plugins.');
			return;
		}

		// check the plugin
		plugin  = args[0].replace(/[^a-z0-9_]/ig, '').toLowerCase();
		plugins = this.getPluginKeys(channel, true);

		if (plugin.length === 0 || plugins.indexOf(plugin) === -1) {
			message.respond(this.bot.getErrorResponse() + 'invalid plugin (' + args[0] + ') given.');
			return;
		}

		if (command === this.prefix+'enable') {
			if (this.pluginMngr.isLoaded(channel, plugin)) {
				message.respond(this.bot.getErrorResponse() + 'the plugin "' + plugin + '" is already enabled in this channel.');
			}
			else {
				this.pluginMngr.addPluginToChannel(channel, plugin);
				message.respond('the plugin "' + plugin + '" has been enabled.');
			}
		}
		else {
			if (!this.pluginMngr.isLoaded(channel, plugin)) {
				message.respond(this.bot.getErrorResponse() + 'the plugin "' + plugin + '" is not enabled in this channel.');
			}
			else {
				this.pluginMngr.removePluginFromChannel(channel, plugin);
				message.respond('the plugin "' + plugin + '" has been disabled.');
			}
		}
	},

	getPluginKeys: function(channel, keysOnly) {
		var plugins = this.pluginMngr.getPluginKeys(), result = {}, i, plugin;

		plugins.sort();

		if (keysOnly) {
			return plugins;
		}

		for (i = 0; i < plugins.length; ++i) {
			result[plugins[i]] = this.pluginMngr.isLoaded(channel, plugins[i]);
		}

		return result;
	}
};

module.exports = PluginControlPlugin;
