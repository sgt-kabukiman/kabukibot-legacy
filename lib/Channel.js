/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

function Channel(name) {
	while (name.charAt(0) === '#') {
		name = name.substring(1);
	}

	this.name   = name;
	this.mods   = [];
	this.twitch = null;
	this.bot    = null;

	this.add = function(list, username) {
		var l = this[list];

		if (l.indexOf(username) === -1) {
			l.push(username);
			return true;
		}

		return false;
	};

	this.remove = function(list, username) {
		var l = this[list], index = l.indexOf(username);

		if (index !== -1) {
			delete l[index];
			return true;
		}

		return false;
	};
}

Channel.prototype = {
	getName: function() {
		return this.name;
	},

	getIrcName: function() {
		return '#' + this.getName();
	},

	getModerators: function() {
		return this.mods;
	},

	addModerator: function(username) {
		return this.add('mods', username);
	},

	removeModerator: function(username) {
		return this.remove('mods', username);
	},

	isBroadcaster: function(username) {
		return username === this.name;
	},

	isModerator: function(username) {
		return this.mods.indexOf(username) >= 0;
	},

	setKabukibot: function(bot) {
		this.bot = bot;
	},

	equals: function(channel) {
		var chan = typeof channel === 'string' ? channel : channel.getName();

		if (chan.charAt(0) === '#') {
			chan = chan.substring(1);
		}

		return this.getName() === chan;
	},

	isBotChannel: function() {
		return this.getName() === this.bot.getBotName();
	},

	say: function(text) {
		this.bot.say(this.getIrcName(), text);
	},

	ban: function(user) {
		this.bot.say(this.getIrcName(), '.ban ' + (typeof user === 'string' ? user : user.getName()));
	},

	timeout: function(user, timeout) {
		this.bot.say(this.getIrcName(), '.timeout ' + (typeof user === 'string' ? user : user.getName()) + ' ' + timeout);
	}
};

module.exports = Channel;
