/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

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
			console.log(message.getUser().getPrefix() + message.getUsername() + ': ' + message.getMessage());
		}
				/*
		else if (message instanceof ModeMessage) {
			console.log('MODE ' + message.getMode() + ' on ' + message.getUsername());
		}
		else {
			console.log(message);
		}
	*/

		return message;
	}
};

module.exports = ConsoleOutputPlugin;
