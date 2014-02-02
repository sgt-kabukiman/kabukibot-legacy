var ModeMessage = function(channel, mode, user) {
	this.channel = channel;
	this.mode    = mode;
	this.user    = user;
};

ModeMessage.prototype = {
	getChannel: function() {
		return this.channel;
	},

	getMode: function() {
		return this.mode;
	},

	getUser: function() {
		return this.user;
	},

	getUsername: function() {
		return this.user.getName();
	},

	getChange: function() {
		return this.mode.charAt(0);
	}
};

module.exports = ModeMessage;
