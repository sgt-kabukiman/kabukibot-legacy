/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var PluginManager = function(database, log) {
	this.db         = database;
	this.log        = log;
	this.plugins    = [];
	this.map        = {};
	this.loaded     = {};
	this.dispatcher = null;
};

PluginManager.prototype = {
	add: function(plugin) {
		this.plugins.push(plugin);

		if (plugin.getKey() !== null) {
			this.map[plugin.getKey()] = plugin;
		}
	},

	getPluginByKey: function(key) {
		return (key in this.map) ? this.map[key] : null;
	},

	getPlugins: function() {
		return this.plugins;
	},

	getPluginMap: function(key) {
		return this.map;
	},

	getPluginKeys: function(key) {
		var keys = [], keys;

		for (key in this.map) {
			keys.push(key);
		}

		return keys;
	},

	getLoadedPlugins: function(channel) {
		var result = {}, chan = channel.getName(), pluginKey, idx;

		for (idx in this.loaded[chan]) {
			pluginKey         = this.loaded[chan][idx];
			result[pluginKey] = this.map[pluginKey];
		}

		return result;
	},

	setup: function(kabukibot, eventDispatcher) {
		for (var i in this.plugins) {
			this.plugins[i].setup(kabukibot, eventDispatcher);
		}

		this.kabukibot  = kabukibot;
		this.dispatcher = eventDispatcher;
	},

	setupChannel: function(channel) {
		var self = this, name = channel.getName();

		if (name in this.loaded) {
			this.log.warning('Channel #' + name + ' has already been setup!');
			return false;
		}

		this.loaded[name] = [];

		this.db.all('SELECT * FROM plugin WHERE channel = $channel', { $channel: name }, function(err, rows) {
			var plugin, i;

			if (err) {
				self.log.error('Could not query plugin data: ' + err.message);
				return;
			}

			self.log.debug('Loaded ' + rows.length + ' plugins #' + name + '.');

			for (i = 0, len = rows.length; i < len; ++i) {
				self.loadPlugin(channel, rows[i].plugin);
			}

			self.log.debug('Plugins for #' + name + ' have been setup.');
		});
	},

	teardownChannel: function(channel) {
		var chan = channel.getName(), idx;

		if (!(chan in this.loaded)) {
			this.log.warning('Attempted to unload channel #' + chan + ', which has not been loaded!');
			return false;
		}

		for (idx in this.loaded[chan]) {
			this.unloadPlugin(channel, this.loaded[chan][idx]);
		}

		delete this.plugins[chan];

		self.log.debug('Plugins for #' + name + ' have been torn down.');
	},

	loadPlugin: function(channel, pluginKey) {
		var chan = channel.getName();

		if (!(pluginKey in this.map)) {
			this.log.warning('Attempted to load unknown plugin "' + pluginKey + '"!');
			return false;
		}

		if (this.isLoaded(channel, pluginKey)) {
			this.log.debug('Plugin "' + pluginKey + '" has already been loaded on #' + chan + '!');
			return false;
		}

		this.getPluginByKey(pluginKey).load(channel, this.kabukibot, this.dispatcher);
		this.loaded[chan].push(pluginKey);
		this.log.debug('Loaded plugin "' + pluginKey + '" on #' + chan + '.');
	},

	unloadPlugin: function(channel, pluginKey) {
		var chan = channel.getName();

		if (!(pluginKey in this.map)) {
			this.log.warning('Attempted to un-load unknown plugin "' + pluginKey + '"!');
			return false;
		}

		if (!this.isLoaded(channel, pluginKey)) {
			this.log.debug('Plugin "' + pluginKey + '" is not loaded on #' + chan + '!');
			return false;
		}

		this.getPluginByKey(pluginKey).unload(channel, this.kabukibot, this.dispatcher);
		this.loaded[chan].splice(this.loaded[chan].indexOf(pluginKey), 1);
		this.log.debug('Un-loaded plugin "' + pluginKey + '" on #' + chan + '.');
	},

	isLoaded: function(channel, pluginKey) {
		var chan = channel.getName();

		return (chan in this.loaded) && (this.loaded[chan].indexOf(pluginKey) >= 0);
	},

	addPluginToChannel: function(channel, pluginKey) {
		var chan = channel.getName();

		if (!(pluginKey in this.map)) {
			this.log.warning('Attempted to add unknown plugin "' + pluginKey + '"!');
			return false;
		}

		if (!(chan in this.loaded)) {
			this.loaded[chan] = {};
		}

		if (this.isLoaded(channel, pluginKey)) {
			return false;
		}

		this.db.insert('plugin', { channel: chan, plugin: pluginKey });
		this.loadPlugin(channel, pluginKey);
		this.log.debug('Added ' + pluginKey + ' plugin to #' + chan + '.');

		return true;
	},

	removePluginFromChannel: function(channel, pluginKey) {
		var chan = channel.getName(), idx;

		if (!(pluginKey in this.map)) {
			this.log.warning('Attempted to remove unknown plugin "' + pluginKey + '"!');
			return false;
		}

		if (!this.isLoaded(channel, pluginKey)) {
			return false;
		}

		this.db.del('plugin', { channel: chan, plugin: pluginKey });
		this.unloadPlugin(channel, pluginKey);
		this.log.debug('Revmoed ' + pluginKey + ' plugin from #' + chan + '.');

		return true;
	}
};

module.exports = PluginManager;
