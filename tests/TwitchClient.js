/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var TwitchClient    = require('./../lib/TwitchClient.js');
var Channel         = require('./../lib/Channel.js');
var EventDispatcher = require('./../lib/EventDispatcher.js');

function buildTwitchClient() {
	var ircClient = {
		written:     [],
		addListener: function() { },

		connect: function(callback) {
			callback();
		},

		join: function(chan, callback) {
			callback();
		},

		part: function(chan, callback) {
			callback();
		},

		say: function(chan, text) {
			this.written.push([chan, text]);
		},

		conn: {
			write: function(raw) {
				ircClient.written.push(raw);
			}
		}
	};

	var log = {
		logged: [],
		info: function(s) { this.logged.push(s); }
	};

	return new TwitchClient(ircClient, new EventDispatcher(), log);
}

exports.testConnecting = function(test) {
	var tc = buildTwitchClient();

	test.expect(4);

	tc.dispatcher.on('connect', function(arg) {
		test.deepEqual(arg, tc);
		test.deepEqual(tc.getChannels(), []);
		test.deepEqual(tc.log.logged.length, 2);
		test.deepEqual(tc.irc.written, ["TWITCHCLIENT 3\r\n"]);
		test.done();
	});

	tc.connect();
};

exports.testJoinChannel = function(test) {
	var tc      = buildTwitchClient();
	var channel = new Channel('testchannel');

	test.expect(5);

	tc.dispatcher.on('join', function(joined, self) {
		test.deepEqual(joined, channel);
		test.deepEqual(self, tc);
		test.deepEqual(tc.getChannels(), {testchannel: joined});
		test.deepEqual(tc.log.logged.length, 1);

		// try to join it once again (use a new object to exclude the possibility
		// of the TwitchClient checking instance identity)
		test.deepEqual(tc.join(new Channel('testchannel')), false);

		test.done();
	});

	tc.join(channel);
};

exports.testPartChannel = function(test) {
	var tc      = buildTwitchClient();
	var channel = new Channel('testchannel');

	test.expect(6);

	// this should not work yet
	test.deepEqual(tc.part(channel), false);

	// leave immediately after joining
	tc.dispatcher.on('join', function(parted, self) {
		tc.part(parted);
	});

	// this is the stuff we actually want to assert
	tc.dispatcher.on('part', function(parted, self) {
		test.deepEqual(parted, channel);
		test.deepEqual(self, tc);
		test.deepEqual(tc.getChannels(), []);
		test.deepEqual(tc.log.logged.length, 2); // 1x "joined..." + 1x "parted..."

		// parting again should not be possible
		test.deepEqual(tc.part(new Channel('testchannel')), false);

		test.done();
	});

	// join first
	tc.join(channel);
};

exports.testSaySomething = function(test) {
	var tc = buildTwitchClient();

	tc.say('foo',    'bar');
	tc.say('channy', 'my message');

	test.deepEqual(tc.irc.written, [
		['foo', 'bar'],
		['channy', 'my message']
	]);

	test.done();
};
