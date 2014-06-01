/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

function BanhammerBotPlugin() {
	this.listener = null;
}

var _ = BanhammerBotPlugin.prototype;

_.getKey = function() {
	return 'banhammer_bot';
};

_.getACLTokens = function() {
	return [];
};

_.setup = function(kabukibot, eventDispatcher) {
	this.listener = this.onTwitch.bind(this);
};

_.load = function(channel, kabukibot, eventDispatcher) {
	eventDispatcher.onTwitch(channel.getName(), this.listener);
};

_.unload = function(channel, kabukibot, eventDispatcher) {
	eventDispatcher.removeTwitchListener(channel.getName(), this.listener);
};

_.onTwitch = function(message) {
	if (message.getCommand() !== 'clearchat') {
		return;
	}

	message.respondToAll('Notification: ' + (message.getUsername() || 'chat has been cleared'));
};

module.exports = BanhammerBotPlugin;
