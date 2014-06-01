/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var
	ModeMessage     = require('./ModeMessage.js'),
	TextMessage     = require('./TextMessage.js'),
	TwitchMessage   = require('./TwitchMessage.js'),
	EventDispatcher = require('./EventDispatcher.js'),
	Response        = require('./Response.js'),
	User            = require('./User.js');

function TwitchClient(ircClient, dispatcher, log) {
	this.irc        = ircClient;
	this.dispatcher = dispatcher;
	this.log        = log;
	this.channels   = {};

	ircClient.addListener('message', this.onMessage.bind(this));
	ircClient.addListener('+mode',   this.onModeChange.bind(this));
	ircClient.addListener('-mode',   this.onModeChange.bind(this));
}

TwitchClient.prototype = {
	getChannels: function() {
		return this.channels;
	},

	getChannel: function(chan) {
		if (chan.charAt(0) === '#') {
			chan = chan.substring(1);
		}

		return this.channels[chan];
	},

	connect: function() {
		var self = this, irc = this.irc;

		self.log.info('Connecting to Twitch...');

		irc.connect(function() {
			// make sure Twitch knows we're not just an ordinary IRC client, but
			// understand their special user semantics (this enables the
			// SPECIALUSER messages from Twitch);
			// using .send() on the IRC object would mess with the raw command, so
			// we have to send it directly via the TCP connection (not the trailing
			// newline).

			irc.conn.write("TWITCHCLIENT 3\r\n");
			self.log.info('Connection established.');

			// notify the rest of the app
			self.dispatcher.emit('connect', self);
		});
	},

	join: function(channel) {
		var self = this, name = channel.getName();

		if (name in this.channels) {
			return false;
		}

		this.channels[name] = channel;

		this.irc.join(channel.getIrcName(), function() {
			self.log.info('Joined #' + name);
			self.dispatcher.emit('join', channel, self);
		});

		return true;
	},

	part: function(channel) {
		var self = this, name = channel.getName();

		if (!(name in this.channels)) {
			return false;
		}

		delete this.channels[name];

		this.irc.part(channel.getIrcName(), function() {
			self.log.info('Left #' + name);
			self.dispatcher.emit('part', channel, self);
		});

		return true;
	},

	onMessage: function(username, chan, text) {
		var channel, user, msg;

		if (chan.charAt(0) === '#') {
			chan = chan.substring(1);
		}

		channel = this.channels[chan];

		// special twitch command
		if (username === 'jtv') {
			msg = TwitchMessage.fromIrcMessage(channel, username, text);
		}

		// subscriber notification
		else if (username === 'twitchnotify') {
			msg = TwitchMessage.fromIrcMessage(channel, username, text);
		}

		// regular text message
		else {
			user = new User(username, channel);
			msg  = new TextMessage(channel, user, text);
		}

		this.process(msg);
	},

	onModeChange: function(chan, by, mode, username, message) {
		var args, channel, user, msg;

		if (chan.charAt(0) === '#') {
			chan = chan.substring(1);
		}

		args    = message.args;
		channel = this.channels[chan];
		user    = args.length === 3 ? new User(args[2], channel) : null;
		msg     = new ModeMessage(channel, args[1], user);

		this.process(msg);
	},

	process: function(message) {
		var chan = message.getChannel();

		this.dispatcher.fire(EventDispatcher.MESSAGE, chan, message);

		if (message instanceof TextMessage) {
			this.dispatcher.fire(EventDispatcher.TEXT, chan, message);
			this.processPossibleCommand(message);
		}
		else if (message instanceof ModeMessage) {
			this.dispatcher.fire(EventDispatcher.MODE, chan, message);
		}
		else if (message instanceof TwitchMessage) {
			this.dispatcher.fire(EventDispatcher.TWITCH, chan, message);
		}

		this.dispatcher.fire(EventDispatcher.PROCESSED, chan, message);
	},

	processPossibleCommand: function(message) {
		var
			text  = message.getMessage(),
			match = text.match(/^\!([a-zA-Z0-9_-]+)(?:\s+(.*))?$/),
			command, args;

		if (match === null) {
			return;
		}

		command = match[1].toLowerCase();
		args    = match[2] ? match[2].trim().split(/\s+/) : [];

		this.dispatcher.fire(EventDispatcher.COMMAND, message.getChannel(), command, args, message);
	},

	say: function(chan, text, responseTo) {
		var response = new Response(this.getChannel(chan), text, responseTo);

		this.dispatcher.fire(EventDispatcher.RESPONSE, chan, response);
		this.irc.say(chan, text);
	}
};

module.exports = TwitchClient;
