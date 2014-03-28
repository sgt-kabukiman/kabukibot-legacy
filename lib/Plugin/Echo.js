/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

function EchoPlugin() {
	this.prefix = '';
}

EchoPlugin.prototype.getKey = function() {
	return null;
};

EchoPlugin.prototype.setup = function(kabukibot, eventDispatcher) {
	eventDispatcher.onCommand(null, this.onCommand.bind(this));

	this.prefix = kabukibot.getCommandPrefix();
};

EchoPlugin.prototype.onCommand = function(command, args, message) {
	if ((command !== this.prefix + 'say' && command !== this.prefix + 'echo') || !message.getUser().isOperator()) {
		return;
	}

	message.getChannel().say(args.join(' '));
};

module.exports = EchoPlugin;
