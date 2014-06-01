/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var events = require('events'), Channel = require('./Channel.js');

function EventDispatcher() {
	this.emitter = new events.EventEmitter();
}

EventDispatcher.MESSAGE   = 'message';
EventDispatcher.TEXT      = 'text';
EventDispatcher.MODE      = 'mode';
EventDispatcher.TWITCH    = 'twitch';
EventDispatcher.COMMAND   = 'command';
EventDispatcher.RESPONSE  = 'response';
EventDispatcher.PROCESSED = 'processed';

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
		return this.addListener(EventDispatcher.MESSAGE, channel, callback);
	},

	onText: function(channel, callback) {
		return this.addListener(EventDispatcher.TEXT, channel, callback);
	},

	onMode: function(channel, callback) {
		return this.addListener(EventDispatcher.MODE, channel, callback);
	},

	onTwitch: function(channel, callback) {
		return this.addListener(EventDispatcher.TWITCH, channel, callback);
	},

	onCommand: function(channel, callback) {
		return this.addListener(EventDispatcher.COMMAND, channel, callback);
	},

	onProcessed: function(channel, callback) {
		return this.addListener(EventDispatcher.PROCESSED, channel, callback);
	},

	onResponse: function(channel, callback) {
		return this.addListener(EventDispatcher.RESPONSE, channel, callback);
	},

	addListener: function(type, channel, callback) {
		return this.emitter.on(this.getEventName(type, channel), callback);
	},

	removeMessageListener: function(channel, callback) {
		return this.removeListener(EventDispatcher.MESSAGE, channel, callback);
	},

	removeTextListener: function(channel, callback) {
		return this.removeListener(EventDispatcher.TEXT, channel, callback);
	},

	removeModeListener: function(channel, callback) {
		return this.removeListener(EventDispatcher.MODE, channel, callback);
	},

	removeTwitchListener: function(channel, callback) {
		return this.removeListener(EventDispatcher.TWITCH, channel, callback);
	},

	removeCommandListener: function(channel, callback) {
		return this.removeListener(EventDispatcher.COMMAND, channel, callback);
	},

	removeProcessedListener: function(channel, callback) {
		return this.removeListener(EventDispatcher.PROCESSED, channel, callback);
	},

	removeResponseListener: function(channel, callback) {
		return this.removeListener(EventDispatcher.RESPONSE, channel, callback);
	},

	removeListener: function(type, channel, callback) {
		return this.emitter.removeListener(this.getEventName(type, channel), callback);
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
