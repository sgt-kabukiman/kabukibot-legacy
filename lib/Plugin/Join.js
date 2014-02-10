/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	Channel     = require('./../Channel.js');

var JoinPlugin = function(database) {
	this.twitch = null;
};

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
	setup: function(twitch, eventDispatcher) {
		eventDispatcher.onCommand(null, this.onCommand.bind(this));

		this.twitch = twitch;
	},

	isChannel: function(name) {
		return name.match(/^#?([a-z0-9_]+)$/i);
	},

	onCommand: function(command, args, message) {
		var
			text    = message.getMessage(),
			channel = message.getChannel(),
			sender  = message.getUser(),
			name;

		//////////////////////////////////////////////////////////////////////////
		// joining channels

		if (command === 'kabuki_join') {
			// (anyone)#bot: !kabuki_join
			if (args.length === 0 && channel.isBotChannel()) {
				name = sender.getName();
			}

			// op#(anywhere): !kabuki_join #channel
			else if (args.length > 0 && this.isChannel(args[0]) && sender.isOperator()) {
				name = args[0];
			}

			if (name) {
				return this.join(name, channel);
			}
		}

		//////////////////////////////////////////////////////////////////////////
		// leaving channels

		if (command === 'kabuki_part' || command === 'kabuki_leave') {
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
				return this.part(name, channel);
			}
		}
	},

	join: function(chan, response, twitch) {
		var channel = new Channel(chan);

		if (twitch.joinChannel(channel)) {
			response.say('Joined #' + chan);
			twitch.getChannelManager().addChannel(channel);
		}
		else {
			response.say('I am already on #' + chan + '.');
		}
	},

	part: function(chan, response, twitch) {
		var channel = new Channel(chan);

		// leaving the channel in which we recevied the command
		if (chan === response.getName()) {
			response.say('Bye bye.');
			twitch.leaveChannel(channel);
			twitch.getChannelManager().removeChannel(channel);
		}
		else {
			if (twitch.leaveChannel(channel)) {
				response.say('Leaving #' + chan + '.');
				twitch.getChannelManager().removeChannel(channel);
			}
			else {
				response.say('I am not on #' + chan + '.');
			}
		}
	}
};

module.exports = JoinPlugin;
