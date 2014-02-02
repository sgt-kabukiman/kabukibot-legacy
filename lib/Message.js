var Message = function(channel, user, message) {
	this.channel = channel;
	this.user    = user;
	this.message = message;
	this.type    = channel === null ? Message.PRIVATE : Message.REGULAR;
};

Message.REGULAR = 1;
Message.PRIVATE = 2;

Message.prototype = {
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

Message.parseIrcMessage = function(ircmsg) {
	var
		channel = ircmsg.args[0],
		type    = channel.charAt(0) === '#' ? Message.REGULAR : Message.PRIVATE;

	return {
		type:     type,
		channel:  type === Message.REGULAR ? channel.substring(1) : null,
		username: ircmsg.nick,
		message:  ircmsg.args[1]
	};
};

module.exports = Message;
