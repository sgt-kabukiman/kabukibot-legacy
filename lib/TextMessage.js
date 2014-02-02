var TextMessage = function(channel, user, message) {
	this.channel = channel;
	this.user    = user;
	this.message = message;
};

TextMessage.prototype = {
	getChannel: function() {
		return this.channel;
	},

	getUser: function() {
		return this.user;
	},

	getUsername: function() {
		return this.user.getName();
	},

	getMessage: function() {
		return this.message;
	}
};

module.exports = TextMessage;
