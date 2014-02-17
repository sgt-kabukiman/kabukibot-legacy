/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var events = require('events'), Channel = require('./Channel.js');

var EventDispatcher = function(databaseFile) {
	this.emitter = new events.EventEmitter();
};

EventDispatcher.MESSAGE = 'message';
EventDispatcher.TEXT    = 'text';
EventDispatcher.MODE    = 'mode';
EventDispatcher.TWITCH  = 'twitch';
EventDispatcher.COMMAND = 'command';

EventDispatcher.prototype = {
	getEmitter: function() {
		return this.emitter;
	},

	emit: function(event) {
		var args = Array.prototype.slice.call(arguments);

		this.emitter.emit.apply(this.emitter, args);
	},

	fire: function(type, channel) {
		var
			eventName = this.getEventName(type, null),
			args      = [eventName],
			i, len;

		for (i = 2, len = arguments.length; i < len; ++i) {
			args.push(arguments[i]);
		}

		// always fire the channel-less event type (the 'null' above)
		this.emitter.emit.apply(this.emitter, args);

		if (channel) {
			// fire type# to indicate a type on any channel
			args[0] = this.getEventName(type, true);
			this.emitter.emit.apply(this.emitter, args);

			// fire type#[channel] to indicate a type on a specific channel
			args[0] = this.getEventName(type, channel);
			this.emitter.emit.apply(this.emitter, args);
		}
	},

	onMessage: function(channel, callback) {
		return this.addListener('message', channel, callback);
	},

	onText: function(channel, callback) {
		return this.addListener('text', channel, callback);
	},

	onMode: function(channel, callback) {
		return this.addListener('mode', channel, callback);
	},

	onTwitch: function(callback) {
		return this.addListener('twitch', null, callback);
	},

	onCommand: function(channel, callback) {
		return this.addListener('command', channel, callback);
	},

	addListener: function(type, channel, callback) {
		return this.emitter.on(this.getEventName(type, channel), callback);
	},

	on: function(event) {
		var args = Array.prototype.slice.call(arguments);

		this.emitter.on.apply(this.emitter, args);
	},

	getEventName: function(type, channel) {
		var eventName = type;

		if (channel) {
			if (channel === true) {
				channel = '#';
			}
			else if (channel instanceof Channel) {
				channel = channel.getIrcName();
			}
			else if (channel.charAt(0) !== '#') {
				channel = '#' + channel;
			}

			eventName += channel;
		}

		return eventName;
	}
};

module.exports = EventDispatcher;
