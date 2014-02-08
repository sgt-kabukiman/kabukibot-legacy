/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var ACL = function(database) {
	this.db          = database;
	this.permissions = {};
};

ACL.ALL          = '$all';
ACL.MODERATORS   = '$mod';
ACL.SUBSCRIBERS  = '$sub';
ACL.TURBO_USERS  = '$turbo';
ACL.TWITCH_STAFF = '$staff';
ACL.TWITCH_ADMIN = '$admin';
ACL.GROUPS       = [ACL.ALL, ACL.MODERATORS, ACL.SUBSCRIBERS, ACL.TURBO_USERS, ACL.TWITCH_STAFF, ACL.TWITCH_ADMIN];

ACL.prototype = {
	loadChannelData: function(channel) {
		var self = this, name = channel.getName();

		this.permissions[name] = {};

		this.db.all('SELECT * FROM acl WHERE channel = $channel', { channel: name }, function(err, rows) {
			var perm, userIdent, i, rows;

			if (err) {
				console.log('Could not query ACL data: ', err);
				return;
			}

			for (i = 0, len = rows.length; i < len; ++i) {
				perm      = rows.permission;
				userIdent = rows.user_ident;

				if (!(perm in self.permissions[name])) {
					self.permissions[name][perm] = [];
				}

				self.permissions[name][perm].push(userIdent);
			}
		});
	},

	isAllowed: function(user, permission) {
		var
			isOp    = user.isOperator(),
			isOwner = user.isBroadcaster(),
			chan    = user.getChannel().getName(),
			name    = user.getName(),
			perms, i, len, allowed;

		// the op and the owner are always allowed to use the available commands
		if (isOp || isOwner) {
			return true;
		}

		// channel has no permissions yet set
		if (!(chan in this.permissions) || !(permission in this.permissions[chan])) {
			return false;
		}

		perms   = this.permissions[chan][permission];
		allowed = false;

		for (i = 0, len = perms.length; i < len; ++i) {
			switch (perms[i]) {
				case ACL.ALL:          allowed = true;                 break;
				case ACL.MODERATORS:   allowed = user.isModerator();   break;
				case ACL.SUBSCRIBERS:  allowed = user.isSubscriber();  break;
				case ACL.TURBO_USERS:  allowed = user.isTurboUser();   break;
				case ACL.TWITCH_STAFF: allowed = user.isTwitchStaff(); break;
				case ACL.TWITCH_ADMIN: allowed = user.isTwitchAdmin(); break;
				default:               allowed = name === perms[i];    break;
			}

			if (allowed) {
				return true;
			}
		}

		return false;
	},

	allow: function(channel, userIdentifier, permission) {
		var chan = channel.getName();

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

		if (!(chan in this.permissions) || !(permission in this.permissions[chan])) {
			return false;
		}

		userIdentifier = userIdentifier.toLowerCase();
		idx            = this.permissions[chan][permission].indexOf(userIdentifier);

		if (idx >= 0) {
			this.permissions[chan][permission].splice(idx, 1);
			this.db.del('acl', {
				channel: chan,
				permission: permission,
				user_ident: userIdentifier
			});

			return true;
		}

		return false;
	},

	isUsername: function(identifier) {
		return ACL.GROUPS.indexOf(identifier.toLowerCase()) === -1;
	}
};

module.exports = ACL;