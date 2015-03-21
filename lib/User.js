/*
 * Copyright (c) 2015, Sgt. Kabukiman, https://github.com/sgt-kabukiman
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

function User(name, channel) {
	this.name        = name.toLowerCase();
	this.channel     = channel;
	this.bot         = null;
	this.subscriber  = null;
	this.operator    = null;
	this.turbo       = null;
	this.twitchAdmin = null;
	this.twitchStaff = null;
	this.emoteSets   = [];
}

User.prototype = {
	getName: function() {
		return this.name;
	},

	getChannel: function() {
		return this.channel;
	},

	getEmoteSets: function() {
		return this.emoteSets;
	},

	isBot: function() {
		return this.bot;
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
			this.isBot()         ?  '%' : '',
			this.isBroadcaster() ?  '&' : '',
			this.isModerator()   ?  '@' : '',
			this.isSubscriber()  ?  '+' : '',
			this.isTurboUser()   ?  '~' : '',
			this.isTwitchAdmin() ? '!!' : '',
			this.isTwitchStaff() ?  '!' : ''
		].join('');
	},

	setBot: function(bot) {
		this.bot = !!bot;
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

	setEmoteSets: function(emoteSets) {
		this.emoteSets = emoteSets;
	},

	equals: function(user) {
		if (typeof user !== 'string') {
			user = user.getName();
		}

		return this.getName() === user;
	}
};

module.exports = User;
