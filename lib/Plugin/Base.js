/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

function BasePlugin() {
	this.bot    = null;
	this.log    = null;
	this.acl    = null;
	this.prefix = null;
}

BasePlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		this.bot    = kabukibot;
		this.log    = kabukibot.getLog();
		this.acl    = kabukibot.getACL();
		this.prefix = kabukibot.getCommandPrefix();
	},

	gcmd: function(cmd) {
		return this.prefix + cmd;
	}
};

module.exports = BasePlugin;
