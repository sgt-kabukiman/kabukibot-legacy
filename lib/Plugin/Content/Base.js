/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	BasePlugin = require('./../Base.js'),
	util       = require('util');

function BaseContentPlugin() {
	BasePlugin.call(this);

	this.listener    = null;
	this.dict        = null;
	this.tpl         = null;
	this.commands    = {};
	this.dictEntries = {};
}

util.inherits(BaseContentPlugin, BasePlugin);

BaseContentPlugin.prototype.setup = function(kabukibot, eventDispatcher) {
	BasePlugin.prototype.setup.call(this, kabukibot, eventDispatcher);

	this.listener = this.onCommand.bind(this);
	this.dict     = kabukibot.getDictionary();
	this.tpl      = kabukibot.getStringTemplate();

	for (var key in this.dictEntries) {
		this.dict.add(key, this.dictEntries[key]);
	}
};

BaseContentPlugin.prototype.load = function(channel, kabukibot, eventDispatcher) {
	eventDispatcher.onCommand(channel.getIrcName(), this.listener);
};

BaseContentPlugin.prototype.unload = function(channel, kabukibot, eventDispatcher) {
	eventDispatcher.removeCommandListener(channel.getIrcName(), this.listener);
};

BaseContentPlugin.prototype.onCommand = function(command, args, message) {
	if (message.isProcessed() || !(command in this.commands)) return;

	if (!this.acl.isAllowed(message.getUser(), this.getRequiredACLToken(command))) {
		return;
	}

	message.respondToAll(this.tpl.render(this.dict.get(this.commands[command])));
};

module.exports = BaseContentPlugin;
