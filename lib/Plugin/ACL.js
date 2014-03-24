/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	ACL        = require('./../ACL.js'),
	BasePlugin = require('./Base.js'),
	util       = require('util');

function ACLPlugin() {
	BasePlugin.call(this);
}

util.inherits(ACLPlugin, BasePlugin);

ACLPlugin.prototype.setup = function(kabukibot, eventDispatcher) {
	BasePlugin.prototype.setup.call(this, kabukibot, eventDispatcher);

	eventDispatcher.onCommand(true, this.onCommand.bind(this));
};

ACLPlugin.prototype.onCommand = function(command, args, message) {
	var
		channel   = message.getChannel(),
		sender    = message.getUser(),
		permission, permissions;

	// not for us
	if (command !== this.gcmd('allow') && command !== this.gcmd('deny') && command !== this.gcmd('permissions') && command !== this.gcmd('allowed')) {
		return;
	}

	// not allowed
	if (!sender.isOperator() && !sender.isBroadcaster()) {
		return;
	}

	// send the list of permissions
	if (command === this.gcmd('permissions')) {
		permissions = this.getPermissions(channel);

		return message.respond('available permissions are: ' + (permissions.length === 0 ? '(none)' : permissions.join(', ')));
	}

	// no permission given
	if (args.length < 1) {
		return this.errorResponse(message, 'no permission name given.');
	}

	// check the permission
	permission  = args[0].replace(/[^a-z0-9_-]/ig, '').toLowerCase();
	permissions = this.getPermissions(channel);

	if (permission.length === 0 || permissions.indexOf(permission) === -1) {
		return this.errorResponse(message, 'invalid permission (' + args[0] + ') given.');
	}

	// send the list of usernames and groups that have been granted the X permission
	if (command === this.gcmd('allowed')) {
		permissions = this.acl.getAllowedUsers(channel, permission);

		return message.respond('"' + permission + '" is granted to: ' + (permissions.length === 0 ? '(nobody)' : permissions.join(', ')));
	}

	// no user ident(s) given
	if (args.length < 2) {
		return this.errorResponse(message, 'no groups/usernames given. Group names are ' + ACL.GROUPS.join(', ') + '.');
	}

	this.handleAllowDeny(channel, command, permission, args.slice(1), message, false);
};

ACLPlugin.prototype.handleAllowDeny = function(channel, command, permission, args, message, silent) {
	var processed = [], isAllow, ident, i, len;

	// normalize the arguments into a single array of (possibly bogus) idents
	args = args.join(',').replace(/[^a-z0-9_$,]/ig, '').toLowerCase().split(',');

	if (args.length === 0) {
		if (!silent) this.errorResponse(message, 'invalid groups/usernames. Use a comma separated list if you give multiple.');
		return false;
	}

	isAllow = command === this.gcmd('allow');

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
		if (!silent) this.errorResponse(message, 'no changes needed.');
	}
	else if (isAllow) {
		if (!silent) message.respond('granted permission for ' + permission + ' to ' + processed.join(', ') + '.');
	}
	else {
		if (!silent) message.respond('revoked permission for ' + permission + ' from ' + processed.join(', ') + '.');
	}

	return processed;
};

ACLPlugin.prototype.getPermissions = function(channel) {
	var
		plugins = this.bot.getPluginManager().getLoadedPlugins(channel),
		result  = [],
		pluginKey, pluginPermissions, idx;

	for (pluginKey in plugins) {
		pluginPermissions = plugins[pluginKey].getACLTokens(channel);

		for (idx in pluginPermissions) {
			result.push(pluginPermissions[idx]);
		}
	}

	return result;
};

module.exports = ACLPlugin;
