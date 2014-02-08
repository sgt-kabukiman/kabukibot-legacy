/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var User = function(name, channel) {
	this.name        = name.toLowerCase();
	this.channel     = channel;
	this.subscriber  = null;
	this.operator    = null;
	this.turbo       = null;
	this.twitchAdmin = null;
	this.twitchStaff = null;
};

User.prototype = {
	getName: function() {
		return this.name;
	},

	getChannel: function() {
		return this.channel;
	},

	isBroadcaster: function() {
		return this.channel.isBroadcaster(this.getName());
	},

	isModerator: function() {
		return this.channel.isModerator(this.getName());
	},

	isOperator: function() {
		return this.operator;
	},

	isSubscriber: function() {
		return this.subscriber;
	},

	isTurboUser: function() {
		return this.turbo;
	},

	isTwitchAdmin: function() {
		return this.twitchAdmin;
	},

	isTwitchStaff: function() {
		return this.twitchStaff;
	},

	getPrefix: function() {
		return [
			this.isBroadcaster() ?  '&' : '',
			this.isModerator()   ?  '@' : '',
			this.isSubscriber()  ?  '+' : '',
			this.isTurboUser()   ?  '~' : '',
			this.isTwitchAdmin() ? '!!' : '',
			this.isTwitchStaff() ?  '!' : ''
		].join('');
	},

	setOperator: function(operator) {
		this.operator = !!operator;
	},

	setSubscriber: function(subscriber) {
		this.subscriber = !!subscriber;
	},

	setTurbo: function(turbo) {
		this.turbo = !!turbo;
	},

	setTwitchAdmin: function(twitchAdmin) {
		this.twitchAdmin = !!twitchAdmin;
	},

	setTwitchStaff: function(twitchStaff) {
		this.twitchStaff = !!twitchStaff;
	},

	equals: function(user) {
		if (typeof user !== 'string') {
			user = user.getName();
		}

		return this.getName() === user;
	}
};

module.exports = User;
