var User = function(name, channel) {
	this.name        = name;
	this.channel     = channel;
	this.subscriber  = null;
	this.turbo       = null;
	this.twitchAdmin = null;
	this.twitchStaff = null;
};

User.prototype = {
	getName: function() {
		return this.name;
	},

	isBroadcaster: function() {
		return this.channel.isBroadcaster(this.getName());
	},

	isModerator: function() {
		return this.channel.isModerator(this.getName());
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
	}
};

module.exports = User;
