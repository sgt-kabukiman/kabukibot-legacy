/*
 * Copyright (c) 2015, Sgt. Kabukiman, https://github.com/sgt-kabukiman
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	BaseContentPlugin = require('./Base.js'),
	util              = require('util');

function ChattyContentPlugin() {
	BaseContentPlugin.call(this);

	this.commands = {
		'chatty':      'chatty_info',
		'chatty_url':  'chatty_url',
		'chatty_link': 'chatty_url'
	};

	this.dictEntries = {
		chatty_info: 'Chatty is a Java-based, standalone chat client for Twitch. Get it for free at http://getchatty.sf.net/.',
		chatty_url:  'Chatty can be downloaded for free at http://getchatty.sf.net/.'
	};
}

util.inherits(ChattyContentPlugin, BaseContentPlugin);

ChattyContentPlugin.prototype.getKey = function() {
	return 'chatty';
};

ChattyContentPlugin.prototype.getACLTokens = function() {
	return ['chatty_commands'];
};

ChattyContentPlugin.prototype.getRequiredACLToken = function() {
	return 'chatty_commands';
};

module.exports = ChattyContentPlugin;
