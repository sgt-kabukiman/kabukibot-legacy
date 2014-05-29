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
var User            = require('./../lib/User.js');
var EventDispatcher = require('./../lib/EventDispatcher.js');
var TextMessage     = require('./../lib/TextMessage.js');
var TwitchMessage   = require('./../lib/TwitchMessage.js');
var ModeMessage     = require('./../lib/ModeMessage.js');

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

exports.testMessageParsing = function(test) {
	var tc           = buildTwitchClient();
	var message      = null;
	var testChan     = new Channel('mychan');
	var testMessages = [
		['some_guy', '#mychan', 'my text!',     new TextMessage(testChan, new User('some_guy', testChan), 'my text!')    ],
		['some_guy', 'mychan',  'my text!',     new TextMessage(testChan, new User('some_guy', testChan), 'my text!')    ],
		['some_guy', 'mychan',  '  my text!  ', new TextMessage(testChan, new User('some_guy', testChan), '  my text!  ')],

		['jtv', '#mychan', 'SPECIALUSER test subscriber', new TwitchMessage(testChan, 'SPECIALUSER', ['test', 'subscriber']) ],
		['jtv', 'mychan',  'something random',            new TwitchMessage(testChan, 'SOMETHING',   ['random'])             ],
		['jtv', 'mychan',  'foo just subscribed!',        new TwitchMessage(testChan, 'FOO',         ['just', 'subscribed!'])],

		['twitchnotify', '#mychan', 'something random',     new TwitchMessage(testChan, '???',         [])     ],
		['twitchnotify', 'mychan',  'foo just subscribed!', new TwitchMessage(testChan, 'SUBSCRIBER',  ['foo'])],
	];

	tc.channels['mychan'] = new Channel('mychan');

	tc.process = function(msg) {
		message = msg;
	};

	for (var i = 0; i < testMessages.length; ++i) {
		var testCase = testMessages[i];

		tc.onMessage(testCase[0], testCase[1], testCase[2]);
		test.deepEqual(message, testCase[3]);

		message = null;
	}

	test.done();
};

exports.testModeChanges = function(test) {
	var tc           = buildTwitchClient();
	var msg          = null;
	var message      = null;
	var testChan     = new Channel('mychan');
	var testMessages = [
		['#mychan', '+o', 'new_mod', new ModeMessage(testChan, '+o', new User('new_mod', testChan))],
		['mychan',  '-o', 'new_mod', new ModeMessage(testChan, '-o', new User('new_mod', testChan))]
	];

	tc.channels['mychan'] = new Channel('mychan');

	tc.process = function(msg) {
		message = msg;
	};

	for (var i = 0; i < testMessages.length; ++i) {
		var testCase = testMessages[i];

		// the original IRC library does require this signature:
		// function(chan, by, mode, username, message)
		// 'username' however is never filled in for Twitch chats, so the
		// handler in TwitchClient takes the username from the message arguments.
		// The same goes for + or -, because we use the same event handler for
		// both events.
		// That's why we have to build a proper dummy 'message' object. To save
		// typing, we do that here instead of manually in the declaration of
		// testMessages above.

		msg = {
			args: [testCase[0], testCase[1], testCase[2]]
		};

		// The mode is only given by its character ("o"), the distinction between
		// + or - is normally done via separate event handlers.
		testCase[1] = testCase[1].substring(1);

		tc.onModeChange(testCase[0], 'jtv', testCase[1], undefined, msg);
		test.deepEqual(message, testCase[3]);

		message = null;
	}

	test.done();
};

/*
exports.testFiringEvents = function(test) {
	var tc     = buildTwitchClient();
	var events = [];

	tc.channels['mychan'] = new Channel('mychan');

	tc.process = function(type, channel) {
		var args = Array.prototype.slice.call(arguments, 2);

		events.push([type, channel, args]);
	};

	for (var i = 0; i < testMessages.length; ++i) {
		var testCase = testMessages[i];

		tc.onMessage(testCase[0], testCase[1], testCase[2]);

		test.deepEqual(events, testCase[3]);
	}

	test.done();
};
*/
