var TwitchMessage = function(command, args) {
	this.command = command.toLowerCase();
	this.args    = args;
};

TwitchMessage.prototype = {
	getCommand: function() {
		return this.command;
	},

	getArgs: function() {
		return this.args;
	},

	getUsername: function() {
		var c = this.getCommand();

		if (c === 'usercolor' || c === 'specialuser' || c === 'clearchat' || c === 'emoteset') {
			return this.args.length > 0 ? this.args[0] : null;
		}

		return null;
	}
};

TwitchMessage.fromIrcMessage = function(ircmsg) {
	var
		parts   = ircmsg.args[1].split(' ', 3), // ircmsg.args = ['botname', 'COMMAND [user] [stuff]']
		command = parts[0].toLowerCase();

	parts = parts.slice(1);

	return new TwitchMessage(command, parts);
};

module.exports = TwitchMessage;
