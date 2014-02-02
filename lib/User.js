var User = function(name, channel) {
	this.name    = name;
	this.channel = channel;
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
		return this.channel.isSubscriber(this.getName());
	},

	isTurboUser: function() {
		return this.channel.isTurboUser(this.getName());
	}
};

module.exports = User;
