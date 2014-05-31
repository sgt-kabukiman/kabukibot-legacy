/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

function ACL(database, log) {
	this.db          = database;
	this.log         = log;
	this.permissions = {};
}

ACL.ALL           = '$all';
ACL.MODERATORS    = '$mods';
ACL.SUBSCRIBERS   = '$subs';
ACL.TURBO_USERS   = '$turbos';
ACL.TWITCH_STAFF  = '$staff';
ACL.TWITCH_ADMINS = '$admins';
ACL.GROUPS        = [ACL.ALL, ACL.MODERATORS, ACL.SUBSCRIBERS, ACL.TURBO_USERS, ACL.TWITCH_STAFF, ACL.TWITCH_ADMINS];

ACL.prototype = {
	loadChannelData: function(channel) {
		var self = this, name = channel.getName();

		this.permissions[name] = {};

		this.db.select('acl', '*', { channel: name }, function(err, rows) {
			var perm, userIdent, i, len;

			if (err) {
				self.log.error('Could not query ACL data: ' + err.message);
				return;
			}

			self.log.debug('Loaded ' + rows.length + ' ACL entries for #' + name + '.');

			for (i = 0, len = rows.length; i < len; ++i) {
				perm      = rows[i].permission;
				userIdent = rows[i].user_ident;

				if (!(perm in self.permissions[name])) {
					self.permissions[name][perm] = [];
				}

				self.permissions[name][perm].push(userIdent);
			}
		});
	},

	unloadChannelData: function(channel) {
		var chan = channel.getName();

		if (!(chan in this.permissions)) {
			return false;
		}

		delete this.permissions[chan];

		return true;
	},

	getAllowedUsers: function(channel, permission) {
		var chan = channel.getName();

		permission = permission.toLowerCase();

		return ((chan in this.permissions) && (permission in this.permissions[chan])) ? this.permissions[chan][permission] : [];
	},

	isAllowed: function(user, permission) {
		var
			isOp    = user.isOperator(),
			isOwner = user.isBroadcaster(),
			name    = user.getName(),
			perms, i, len, allowed;

		// the op and the owner are always allowed to use the available commands
		if (isOp || isOwner) {
			return true;
		}

		perms   = this.getAllowedUsers(user.getChannel(), permission);
		allowed = false;

		for (i = 0, len = perms.length; i < len; ++i) {
			switch (perms[i]) {
				case ACL.ALL:           allowed = true;                 break;
				case ACL.MODERATORS:    allowed = user.isModerator();   break;
				case ACL.SUBSCRIBERS:   allowed = user.isSubscriber();  break;
				case ACL.TURBO_USERS:   allowed = user.isTurboUser();   break;
				case ACL.TWITCH_STAFF:  allowed = user.isTwitchStaff(); break;
				case ACL.TWITCH_ADMINS: allowed = user.isTwitchAdmin(); break;
				default:                allowed = name === perms[i];    break;
			}

			if (allowed) {
				return true;
			}
		}

		return false;
	},

	allow: function(channel, userIdentifier, permission) {
		var chan = channel.getName();

		permission     = permission.toLowerCase();
		userIdentifier = userIdentifier.toLowerCase();

		// allowing something for the owner is pointless
		if (chan === userIdentifier) {
			return false;
		}

		if (!(chan in this.permissions)) {
			this.permissions[chan] = {};
		}

		if (!(permission in this.permissions[chan])) {
			this.permissions[chan][permission] = [];
		}

		if (this.permissions[chan][permission].indexOf(userIdentifier) === -1) {
			this.permissions[chan][permission].push(userIdentifier);
			this.log.debug('Allowed ' + permission + ' for ' + userIdentifier + ' on #' + chan + '.');
			this.db.insert('acl', {
				channel: chan,
				permission: permission,
				user_ident: userIdentifier
			});

			return true;
		}

		return false;
	},

	deny: function(channel, userIdentifier, permission) {
		var chan = channel.getName(), idx;

		permission = permission.toLowerCase();

		if (!(chan in this.permissions) || !(permission in this.permissions[chan])) {
			return false;
		}

		userIdentifier = userIdentifier.toLowerCase();
		idx            = this.permissions[chan][permission].indexOf(userIdentifier);

		if (idx >= 0) {
			this.permissions[chan][permission].splice(idx, 1);
			this.log.debug('Denied ' + permission + ' for ' + userIdentifier + ' on #' + chan + '.');
			this.db.del('acl', {
				channel: chan,
				permission: permission,
				user_ident: userIdentifier
			});

			return true;
		}

		return false;
	},

	deletePermission: function(channel, permission) {
		var chan = (typeof channel === 'string') ? channel : channel.getName();

		permission = permission.toLowerCase();

		if (!(chan in this.permissions) || !(permission in this.permissions[chan])) {
			return true;
		}

		delete this.permissions[chan][permission];

		this.log.debug('Removed all "' + permission + '" permissions on #' + chan + '.');
		this.db.del('acl', { channel: chan, permission: permission });

		return true;
	},

	isUsername: function(identifier) {
		return ACL.GROUPS.indexOf(identifier.toLowerCase()) === -1;
	}
};

module.exports = ACL;
