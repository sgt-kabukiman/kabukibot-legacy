/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var ACL = require('./../ACL.js');

var ACLPlugin = function() {
	this.bot    = null;
	this.acl    = null;
	this.prefix = null;
};

ACLPlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		eventDispatcher.onCommand(true, this.onCommand.bind(this));

		this.bot    = kabukibot;
		this.acl    = kabukibot.getACL();
		this.prefix = kabukibot.getCommandPrefix();
	},

	getKey: function() {
		return null;
	},

	onCommand: function(command, args, message) {
		var
			text      = message.getMessage(),
			channel   = message.getChannel(),
			sender    = message.getUser(),
			processed = [],
			permission, permissions, i, len, ident, isAllow;

		// not for us
		if (command !== this.prefix+'allow' && command !== this.prefix+'deny' && command !== this.prefix+'permissions' && command !== this.prefix+'allowed') {
			return;
		}

		// not allowed
		if (!sender.isOperator() && !sender.isBroadcaster()) {
			return;
		}

		// send the list of permissions
		if (command === this.prefix+'permissions') {
			permissions = this.getPermissions(channel);
			message.respond('available permissions are: ' + (permissions.length === 0 ? '(none)' : permissions.join(', ')));
			return;
		}

		// no permission given
		if (args.length < 1) {
			message.respond(this.bot.getErrorResponse() + 'no permission name given.');
			return;
		}

		// check the permission
		permission  = args[0].replace(/[^a-z0-9_-]/ig, '').toLowerCase();
		permissions = this.getPermissions(channel);

		if (permission.length === 0 || permissions.indexOf(permission) === -1) {
			message.respond(this.bot.getErrorResponse() + 'invalid permission (' + args[0] + ') given.');
			return;
		}

		// send the list of usernames and groups that have been granted the X permission
		if (command === this.prefix+'allowed') {
			permissions = this.acl.getAllowedUsers(channel, permission);
			message.respond('"' + permission + '" is granted to: ' + (permissions.length === 0 ? '(nobody)' : permissions.join(', ')));
			return;
		}

		// no user ident(s) given
		if (args.length < 2) {
			message.respond(this.bot.getErrorResponse() + 'no groups/usernames given. Group names are ' + ACL.GROUPS.join(', ') + '.');
			return;
		}

		// normalize the arguments into a single array of (possibly bogus) idents
		args = args.slice(1).join(',').replace(/[^a-z0-9_$,]/ig, '').toLowerCase().split(',');

		if (args.length === 0) {
			message.respond(this.bot.getErrorResponse() + 'invalid groups/usernames. Use a comma separated list if you give multiple.');
			return;
		}

		isAllow   = command === this.prefix+'allow';

		for (i = 0, len = args.length; i < len; ++i) {
			ident = args[i];

			if (this.acl.isUsername(ident)) {
				ident = ident.replace(/[^a-z0-9_]/g, '');

				// if we removed bogus characters, discard the user ident to not accidentally grant or revoke permissions
				if (ident !== args[i]) {
					continue;
				}
			}

			if (isAllow) {
				if (this.acl.allow(channel, ident, permission)) {
					processed.push(ident);
				}
			}
			else {
				if (this.acl.deny(channel, ident, permission)) {
					processed.push(ident);
				}
			}
		}

		if (processed.length === 0) {
			message.respond(this.bot.getErrorResponse() + 'no changes needed.');
		}
		else if (isAllow) {
			message.respond('granted permission for ' + permission + ' to ' + processed.join(', ') + '.');
		}
		else {
			message.respond('revoked permission for ' + permission + ' from ' + processed.join(', ') + '.');
		}
	},

	getPermissions: function(channel) {
		var
			plugins = this.bot.getPluginManager().getLoadedPlugins(channel),
			result  = [],
			pluginKey, pluginPermissions, idx;

		for (pluginKey in plugins) {
			pluginPermissions = plugins[pluginKey].getACLTokens();

			for (idx in pluginPermissions) {
				result.push(pluginPermissions[idx]);
			}
		}

		return result;
	}
};

module.exports = ACLPlugin;
