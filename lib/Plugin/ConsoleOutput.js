/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var ConsoleOutputPlugin = function() {
	this.console = global.console;
	this.log     = null;
};

ConsoleOutputPlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		eventDispatcher.onText(null, this.onTextMessage.bind(this));

		this.log = kabukibot.getLog();
	},

	onTextMessage: function(message) {
		var user = message.getUser();

		this.log.ircMessage(message.getChannel().getName(), user.getPrefix() + user.getName(), message.getMessage());
	}
};

module.exports = ConsoleOutputPlugin;
