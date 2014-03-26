/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	BasePlugin = require('./Base.js'),
	util       = require('util');

function ConsoleOutputPlugin() {
	BasePlugin.call(this);

	this.console = global.console;
}

util.inherits(ConsoleOutputPlugin, BasePlugin);

ConsoleOutputPlugin.prototype.setup = function(kabukibot, eventDispatcher) {
	BasePlugin.prototype.setup.call(this, kabukibot, eventDispatcher);

	eventDispatcher.onText(null, this.onTextMessage.bind(this));
};

ConsoleOutputPlugin.prototype.onTextMessage = function(message) {
	var user = message.getUser();

	this.log.ircMessage(this.getChan(message), user.getPrefix() + user.getName(), message.getMessage());
};

module.exports = ConsoleOutputPlugin;
