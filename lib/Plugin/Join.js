/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var Channel = require('./../Channel.js');

function JoinPlugin() {
	this.bot      = null;
	this.chanMngr = null;
	this.prefix   = null;
}

// There are multiple command possibilities:
//
//   [in #bot]     !kabuki_join             will let the bot join the sender's channel ("self-join")
//                                          only in #bot to prevent accidental flooding ("must...copy...command...and...try...it!!")
//                                          allowed for anyone
//
//   [anywhere]    !kabuki_join #channel    will join a specific channel
//                                          only allowed for op
//
//   [anywhere]    !kabuki_part             will make the bot leave the channel
//                                          in #bot:       will leave the sender's channel, allowed for anyone
//                                          in #somewhere: will leave #somewhere, allowed for op and broadcaster
//
//   [anywhere]    !kabuki_part #channel    will make the bot leave a specific channel (#bot is not allowed)
//                                          only allowed for op

JoinPlugin.prototype = {
	setup: function(kabukibot, eventDispatcher) {
		eventDispatcher.onCommand(null, this.onCommand.bind(this));

		this.bot      = kabukibot;
		this.chanMngr = kabukibot.getChannelManager();
		this.prefix   = kabukibot.getCommandPrefix();
	},

	getKey: function() {
		return null;
	},

	isChannel: function(name) {
		return name.match(/^#?([a-z0-9_]+)$/i);
	},

	onCommand: function(command, args, message) {
		var
			channel = message.getChannel(),
			sender  = message.getUser(),
			name;

		//////////////////////////////////////////////////////////////////////////
		// joining channels

		if (command === this.prefix+'join') {
			// (anyone)#bot: !kabuki_join
			if (args.length === 0 && channel.isBotChannel()) {
				name = sender.getName();
			}

			// op#(anywhere): !kabuki_join #channel
			else if (args.length > 0 && this.isChannel(args[0]) && sender.isOperator()) {
				name = args[0];
			}

			if (name) {
				return this.join(name, message);
			}
		}

		//////////////////////////////////////////////////////////////////////////
		// leaving channels

		if (command === this.prefix+'part' || command === this.prefix+'leave') {
			if (args.length === 0) {
				// (anyone)#bot: !kabuki_part
				if (channel.isBotChannel()) {
					name = sender.getName();
				}

				// [op|owner]#(anywhere): !kabuki_part
				else if (sender.isOperator() || sender.isBroadcaster()) {
					name = channel.getName();
				}
			}

			// op#(anywhere): !kabuki_part
			else if (this.isChannel(args[0]) && sender.isOperator()) {
				name = args[0];
			}

			if (name) {
				return this.part(name, message);
			}
		}
	},

	join: function(chan, message) {
		var channel = new Channel(chan);

		chan = message.getUser().getName() === chan ? 'your channel' : channel.getIrcName();

		if (this.bot.joinChannel(channel)) {
			message.respond('I\'ve joined ' + chan + '.');
		}
		else {
			message.respond('I am already in ' + chan + '.');
		}
	},

	part: function(chan, message) {
		var channel = new Channel(chan);

		chan = message.getUser().getName() === chan ? 'your channel' : channel.getIrcName();

		// leaving the channel in which we recevied the command
		if (chan === message.getChannel().getName()) {
			message.respond('bye bye :)');
			this.bot.leaveChannel(channel);
		}
		else {
			if (this.bot.leaveChannel(channel)) {
				message.respond('I am leaving ' + chan + ' now. Bye bye :)');
			}
			else {
				message.respond('I am not in ' + chan + '.');
			}
		}
	}
};

module.exports = JoinPlugin;
