/*
 * Copyright (c) 2015, Sgt. Kabukiman, https://github.com/sgt-kabukiman
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

var _ = ConsoleOutputPlugin.prototype;

_.setup = function(kabukibot, eventDispatcher) {
	BasePlugin.prototype.setup.call(this, kabukibot, eventDispatcher);

	eventDispatcher.onText(null, this.onTextMessage.bind(this));
	eventDispatcher.onTwitch(null, this.onTwitch.bind(this));
	eventDispatcher.onResponse(null, this.onResponse.bind(this));
};

_.onTextMessage = function(message) {
	var user = message.getUser();

	this.log.ircMessage(this.getChan(message), user.getPrefix() + user.getName(), message.getMessage());
};

_.onTwitch = function(message) {
	var user = message.getUsername(), chan = this.getChan(message);

	switch (message.getCommand()) {
		case 'clearchat':
			if (user) {
				this.log.ircInfo(chan, '<' + user + ' has been timed out>');
			}
			else {
				this.log.ircInfo(chan, '<channel has been cleared>');
			}
			break;

		case 'subscriber':
			this.log.ircInfo(chan, '<' + user + ' just subscribed!>');
			break;
	}
};

_.onResponse = function(response) {
	this.log.ircMessage(this.getChan(response), this.bot.getBotName(), response.getMessage());
};

module.exports = ConsoleOutputPlugin;
