/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

function ChannelManager(database, log) {
	this.db       = database;
	this.log      = log;
	this.channels = {};
}

ChannelManager.prototype = {
	loadChannels: function(callback) {
		var self = this;

		this.db.select('channel', '*', {}, function(err, rows) {
			var i, len;

			if (err) {
				self.log.error('Could not query channels: ' + err.message);
				return;
			}

			self.log.debug('Loaded ' + rows.length + ' channels.');

			for (i = 0, len = rows.length; i < len; ++i) {
				self.channels[rows[i].name] = {};
			}

			callback(self);
		});
	},

	getChannels: function() {
		var chans = [], chan;

		for (chan in this.channels) {
			if (this.channels.hasOwnProperty(chan)) {
				chans.push(chan);
			}
		}

		return chans;
	},

	addChannel: function(channel) {
		var name = channel.getName();

		if (name in this.channels) {
			return false;
		}

		this.channels[name] = {};
		this.db.insert('channel', { name: name });
		this.log.info('Added #' + name + ' to the channel list.');

		return true;
	},

	removeChannel: function(channel) {
		var name = channel.getName();

		if (name in this.channels) {
			delete this.channels[name];
			this.db.del('channel', { name: channel.getName() });
			this.log.info('Removed #' + name + ' from the channel list.');

			return true;
		}

		return false;
	}
};

module.exports = ChannelManager;
