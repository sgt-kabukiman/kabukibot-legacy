/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var PingPlugin = function() {
};

PingPlugin.prototype = {
	setup: function(twitch, eventDispatcher) {
		eventDispatcher.onCommand(null, this.onCommand.bind(this));
	},

	onCommand: function(command, args, message) {
		if (command === 'kabukiping' && message.getUser().isOperator()) {
			message.respond(args.length === 0 ? 'Pong!' : 'Pong: ' + args.join(' '));
		}

		return message;
	}
};

module.exports = PingPlugin;
