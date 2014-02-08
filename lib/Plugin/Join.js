/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	Channel     = require('./../Channel.js'),
	TextMessage = require('./../TextMessage.js');

var JoinPlugin = function(database) {
	this.db = database;
};

JoinPlugin.prototype = {
	process: function(message, twitch) {
		if (!(message instanceof TextMessage)) {
			return message;
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

		var
			text    = message.getMessage(),
			channel = message.getChannel(),
			sender  = message.getUser(),
			match, name;

		//////////////////////////////////////////////////////////////////////////
		// #bot: !kabuki_join

		if (text === '!kabuki_join' && channel.isBotChannel()) {
			this.join(sender.getName(), channel, twitch);
			return null;
		}

		//////////////////////////////////////////////////////////////////////////
		// (anywhere by op): !kabuki_join #channel

		match = text.match(/^\!kabuki_join #?([a-z0-9_]+)$/i);

		if (match !== null && sender.isOperator()) {
			this.join(match[1], channel, twitch);
			return null;
		}

		//////////////////////////////////////////////////////////////////////////
		// (anywhere): !kabuki_part

		if (text === '!kabuki_part') {
			if (channel.isBotChannel()) {
				this.part(sender.getName(), channel, twitch);
			}
			else if (sender.isOperator() || sender.isBroadcaster()) {
				this.part(channel.getName(), channel, twitch);
			}

			return null;
		}

		//////////////////////////////////////////////////////////////////////////
		// (anywhere by op): !kabuki_part #channel

		match = text.match(/^\!kabuki_part #?([a-z0-9_]+)$/i);

		if (match !== null && sender.isOperator()) {
			this.part(match[1], channel, twitch);
			return null;
		}

		return message;
	},

	join: function(channel, response, twitch) {
		if (twitch.joinChannel(new Channel(channel))) {
			response.say('Joined #' + channel);
		}
		else {
			response.say('I am already on #' + channel + '.');
		}
	},

	part: function(channel, response, twitch) {
		// leaving the channel in which we recevied the command
		if (channel === response.getName()) {
			response.say('Bye bye.');
			twitch.leaveChannel(channel);
		}
		else {
			if (twitch.leaveChannel(channel)) {
				response.say('Leaving #' + channel + '.');
			}
			else {
				response.say('I am not on #' + channel + '.');
			}
		}
	}
};

module.exports = JoinPlugin;
