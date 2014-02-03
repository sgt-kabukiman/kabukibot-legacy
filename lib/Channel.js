/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var Channel = function(name) {
	this.name   = name;
	this.mods   = [];
	this.subs   = [];
	this.turbos = [];
	this.twitch = null;

	this.add = function(list, username) {
		var l = this[list];

		if (l.indexOf(username) === -1) {
			console.log('Added ' + username + ' to ' + list + ' list on ' + this.getIrcName());
			l.push(username);
		}
	};

	this.remove = function(list, username) {
		var l = this[list], index = l.indexOf(username);

		if (index !== -1) {
			console.log('Removed ' + username + ' from ' + list + ' list on ' + this.getIrcName());
			delete l[index];
		}
	};
};

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

	getSubscribers: function() {
		return this.subs;
	},

	getTurboUsers: function() {
		return this.turbos;
	},

	addModerator: function(username) {
		this.add('mods', username);
	},

	addSubscriber: function(username) {
		this.add('subs', username);
	},

	addTurboUser: function(username) {
		this.add('turbos', username);
	},

	removeModerator: function(username) {
		this.remove('mods', username);
	},

	removeSubscriber: function(username) {
		this.remove('subs', username);
	},

	removeTurboUser: function(username) {
		this.remove('turbos', username);
	},

	isBroadcaster: function(username) {
		return username === this.name;
	},

	isModerator: function(username) {
		return this.mods.indexOf(username) >= 0;
	},

	isSubscriber: function(username) {
		return this.subs.indexOf(username) >= 0;
	},

	isTurboUser: function(username) {
		return this.turbos.indexOf(username) >= 0;
	},

	setTwitchClient: function(client) {
		this.twitch = client;
	},

	equals: function(channel) {
		var chan = typeof channel === 'string' ? channel : channel.getName();

		if (chan.charAt(0) === '#') {
			chan = chan.substring(1);
		}

		return this.getName() === chan;
	},

	isBotChannel: function() {
		return this.getName() === this.twitch.getBotName();
	},

	say: function(text) {
		this.twitch.say(this.getIrcName(), text);
	}
};

module.exports = Channel;
