var
	ModeMessage   = require('./../ModeMessage.js'),
	TextMessage   = require('./../TextMessage.js'),
	TwitchMessage = require('./../TwitchMessage.js');

var CorePlugin = function(database) {
	this.db = database;
};

CorePlugin.prototype = {
	process: function(message, twitch) {
		if (message instanceof TextMessage) {
			message = this.processTextMessage(message, twitch);
		}
		else if (message instanceof ModeMessage) {
			message = this.processModeMessage(message, twitch);
		}
		else {
			message = this.processTwitchMessage(message, twitch);
		}

		return message;
	},

	processTextMessage: function(message, twitch) {
		return message;
	},

	processModeMessage: function(message, twitch) {
		var
			channel  = message.getChannel(),
			username = message.getUsername();

		switch (message.getMode()) {
			case '+o':
				channel.addModerator(username);
				break;

			case '-o':
				channel.removeModerator(username);
				break;

			default:
				console.log('Unknown mode encountered: ' + message.getMode());
		}

		return message;
	},

	processTwitchMessage: function(message, twitch) {
		return message;
	}
};

module.exports = CorePlugin;
