/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

function UserManager(operator, log) {
	this.operator     = operator;
	this.log          = log;
	this.subscribers  = {};
	this.turboUsers   = [];
	this.twitchStaff  = [];
	this.twitchAdmins = [];
	this.emoteSets    = {};
}

UserManager.prototype = {
	putSubscriber: function(channel, user) {
		return this.put('subscribers', this.getUsername(user), this.getChan(channel));
	},

	putTurboUser: function(user) {
		return this.put('turboUsers', this.getUsername(user));
	},

	putTwitchStaff: function(user) {
		return this.put('twitchStaff', this.getUsername(user));
	},

	putTwitchAdmin: function(user) {
		return this.put('twitchAdmins', this.getUsername(user));
	},

	putEmoteSets: function(user, set) {
		this.emoteSets[this.getUsername(user)] = set;
		return true;
	},

	isOperator: function(user) {
		return this.getUsername(user) === this.operator;
	},

	isSubscriber: function(channel, user) {
		var chan = this.getChan(channel);

		return (chan in this.subscribers) && this.subscribers[chan].indexOf(this.getUsername(user)) !== -1;
	},

	isTurboUser: function(user) {
		return this.turboUsers.indexOf(this.getUsername(user)) !== -1;
	},

	isTwitchStaff: function(user) {
		return this.twitchStaff.indexOf(this.getUsername(user)) !== -1;
	},

	isTwitchAdmin: function(user) {
		return this.twitchAdmins.indexOf(this.getUsername(user)) !== -1;
	},

	getEmoteSets: function(user) {
		return this.emoteSets[this.getUsername(user)] || [];
	},

	takeSubscriber: function(channel, user) {
		return this.take('subscribers', this.getUsername(user), this.getChan(channel));
	},

	takeTurboUser: function(user) {
		return this.take('turboUsers', this.getUsername(user));
	},

	takeTwitchStaff: function(user) {
		return this.take('twitchStaff', this.getUsername(user));
	},

	takeTwitchAdmin: function(user) {
		return this.take('twitchAdmins', this.getUsername(user));
	},

	takeEmoteSets: function(user) {
		var username = this.getUsername(user), sets = [];

		if (username in this.emoteSets) {
			sets = this.emoteSets[username];
			delete this.emoteSets[username];
		}

		return sets;
	},

	put: function(list, username, subKey) {
		var l = this[list];

		if (typeof subKey === 'string') {
			if (!(subKey in l)) {
				l[subKey] = [];
			}

			l = l[subKey];
		}

		if (l.indexOf(username) === -1) {
			l.push(username);
			return true;
		}

		return false;
	},

	take: function(list, username, subKey) {
		var l = this[list], index;

		if (typeof subKey === 'string') {
			if (!(subKey in l)) {
				return false;
			}

			l = l[subKey];
		}

		index = l.indexOf(username);

		if (index !== -1) {
			l.splice(index, 1);

			if (typeof subKey === 'string' && l.length === 0) {
				delete this[list][subKey];
			}

			return true;
		}

		return false;
	},

	getUsername: function(user) {
		return typeof user === 'string' ? user : user.getName();
	},

	getChan: function(channel) {
		return typeof channel === 'string' ? channel : channel.getName();
	}
};

module.exports = UserManager;
