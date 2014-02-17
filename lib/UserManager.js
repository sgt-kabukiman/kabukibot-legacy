/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var UserManager = function(operator, log, ttls) {
	this.operator     = operator;
	this.log          = log;
	this.ttls         = ttls;
	this.turboUsers   = {};
	this.twitchAdmins = {};
	this.twitchStaff  = {};
	this.subsHeap     = {}; // list of users from whom we do not know where they are subscribers to
};

UserManager.prototype = {
	addTurboUser: function(user) {
		var username = this.getUsername(user);

		this.log.debug('Added ' + username + ' as a turbo user.');
		this.turboUsers[username] = Date.now();
	},

	addTwitchStaff: function(user) {
		var username = this.getUsername(user);

		this.log.debug('Added ' + username + ' as Twitch staff.');
		this.twitchStaff[username] = Date.now();
	},

	addTwitchAdmin: function(user) {
		var username = this.getUsername(user);

		this.log.debug('Added ' + username + ' as a Twitch admin.');
		this.twitchAdmins[username] = Date.now();
	},

	addHomelessSubscriber: function(user) {
		var username = this.getUsername(user);

		this.log.debug('Added ' + username + ' as a homeless subscriber.');
		this.subsHeap[username] = Date.now();
	},

	isOperator: function(user) {
		return this.getUsername(user) === this.operator;
	},

	isTurboUser: function(user) {
		return this.getUserStatus(this.turboUsers, user, this.ttls.turbo);
	},

	isTwitchStaff: function(user) {
		return this.getUserStatus(this.twitchStaff, user, this.ttls.staff);
	},

	isTwitchAdmin: function(user) {
		return this.getUserStatus(this.twitchAdmins, user, this.ttls.admin);
	},

	takeHomelessSubscriber: function(user) {
		var username = this.getUsername(user);
		var status   = this.getUserStatus(this.subsHeap, username, this.ttls.subscriber);

		// the subscriber status should only be valid for exactly one access (i.e. the next message
		// of a user after the SPECIALUSER line)
		if (status === true) {
			delete this.subsHeap[username];
		}

		return status;
	},

	getUserStatus: function(list, user, ttl) {
		var username = this.getUsername(user);

		if (!(username in list)) {
			return false;
		}

		var
			set = list[username],
			now = Date.now();

		if (set + ttl < now) {
			delete list[username];
			return false;
		}

		return true;
	},

	getUsername: function(user) {
		return typeof user === 'string' ? user : user.getName();
	}
};

module.exports = UserManager;
