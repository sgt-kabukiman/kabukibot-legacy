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

// There are multiple command possibilities:
//
// ![prefix]tokens
// ![prefix]allow token userIdent[,userIdent][,userIdent]...
// ![prefix]deny  token userIdent[,userIdent][,userIdent]...
//
// Some examples:
//
// !mybot_allow songrequest $mods,$subs,specialuserx
// !mybot_deny songrequest $subs specialuserx
//
// Changing the ACL is only allowed for the broadcaster and the operator.
//
// !tokens responds with a list of possible tokens for the current channel.
// These tokens are collected from the active plugins for the channel.

ACLPlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		eventDispatcher.onCommand(true, this.onCommand.bind(this));

		this.bot    = kabukibot;
		this.acl    = kabukibot.getACL();
		this.prefix = kabukibot.getCommandPrefix();
	},

	onCommand: function(command, args, message) {
		var
			text      = message.getMessage(),
			channel   = message.getChannel(),
			sender    = message.getUser(),
			processed = [],
			token, tokens, i, len, ident, isAllow;

		// not for us
		if (command !== this.prefix+'allow' && command !== this.prefix+'deny' && command !== this.prefix+'tokens') {
			return;
		}

		// not allowed
		if (!sender.isOperator() && !sender.isBroadcaster()) {
			return;
		}

		// send the list of tokens
		if (command === this.prefix+'tokens') {
			message.respond('Available ACL tokens are: ' + this.getTokens(channel).join(', '));
			return;
		}

		// no token or no user ident given
		if (args.length < 2) {
			message.respond('Syntax is `!' + this.prefix + 'allow token ident[,ident...]` -- ident can be ' + ACL.GROUPS.join(', ') + ' or any username; !' + this.prefix + 'deny works the same way. See !' + this.prefix + 'tokens for a list of available tokens.');
			return;
		}

		// check the token
		token  = args[0].replace(/[^a-z0-9_-]/ig, '').toLowerCase();
		tokens = this.getTokens(channel);

		if (token.length === 0 || tokens.indexOf(token) === -1) {
			message.respond('Invalid token (' + args[0] + ') given.');
			return;
		}

		// normalize the arguments into a single array of (possibly bogus) idents
		args = args.slice(1).join(',').replace(/[^a-z0-9_$,]/ig, '').toLowerCase().split(',');

		if (args.length === 0) {
			message.respond('Could not understand your user identifiers. Use a comma separated list, consisting of usernames or ' + ACL.GROUPS.join(', ') + '.');
			return;
		}

		isAllow = command === this.prefix+'allow';

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
				if (this.acl.allow(channel, ident, token)) {
					processed.push(ident);
				}
			}
			else {
				if (this.acl.deny(channel, ident, token)) {
					processed.push(ident);
				}
			}
		}

		if (processed.length === 0) {
			message.respond('No permissions have been changed.');
		}
		else if (isAllow) {
			message.respond('Granted permission for ' + token + ' to ' + processed.join(', ') + '.');
		}
		else {
			message.respond('Revoked permission for ' + token + ' from ' + processed.join(', ') + '.');
		}
	},

	getTokens: function(channel) {
		return ['wr_sa', 'wr_vc', 'wr_3', 'sgdq', 'agdq'];
	}
};

module.exports = ACLPlugin;
