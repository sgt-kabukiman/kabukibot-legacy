var
	ModeMessage   = require('./../ModeMessage.js'),
	TextMessage   = require('./../TextMessage.js'),
	TwitchMessage = require('./../TwitchMessage.js');

var ConsoleOutputPlugin = function(console) {
	this.console = console || window.console;
};

ConsoleOutputPlugin.prototype = {
	process: function(message, twitch) {
		if (message instanceof TextMessage) {
			console.log(message.getUsername() + ': ' + message.getMessage());
		}
		else if (message instanceof ModeMessage) {
			console.log('MODE ' + message.getMode() + ' on ' + message.getUsername());
		}
		else {
			console.log(message);
		}

		return message;
	},
};

module.exports = ConsoleOutputPlugin;
