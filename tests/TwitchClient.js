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
		test.strictEqual(arg, tc);
		test.strictEqual(tc.log.logged.length, 2);
		test.deepEqual(tc.getChannels(), []);
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
		test.strictEqual(joined, channel);
		test.strictEqual(self, tc);
		test.strictEqual(tc.log.logged.length, 1);
		test.deepEqual(tc.getChannels(), {testchannel: joined});

		// try to join it once again (use a new object to exclude the possibility
		// of the TwitchClient checking instance identity)
		test.strictEqual(tc.join(new Channel('testchannel')), false);

		test.done();
	});

	tc.join(channel);
};

exports.testPartChannel = function(test) {
	var tc      = buildTwitchClient();
	var channel = new Channel('testchannel');

	test.expect(6);

	// this should not work yet
	test.strictEqual(tc.part(channel), false);

	// leave immediately after joining
	tc.dispatcher.on('join', function(parted, self) {
		tc.part(parted);
	});

	// this is the stuff we actually want to assert
	tc.dispatcher.on('part', function(parted, self) {
		test.strictEqual(parted, channel);
		test.strictEqual(self, tc);
		test.strictEqual(tc.log.logged.length, 2); // 1x "joined..." + 1x "parted..."
		test.deepEqual(tc.getChannels(), []);

		// parting again should not be possible
		test.strictEqual(tc.part(new Channel('testchannel')), false);

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

exports.testProcessMessage = function(test) {
	var tc          = buildTwitchClient();
	var events      = [];
	var testChannel = new Channel('mychan');
	var testUser    = new User('testee', testChannel);
	var tests       = [
		[new TextMessage(testChannel, testUser, 'my message'), ['message', 'text',   'command', 'processed']],
		[new TwitchMessage(testChannel, 'subscriber', []),     ['message', 'twitch',            'processed']],
		[new ModeMessage(testChannel, '+o', testUser),         ['message', 'mode',              'processed']],
	];

	// we do not want to test this method in this test case, so mock it away
	tc.processPossibleCommand = function(msg) {
		events.push([msg.getChannel().getName() + ' command', msg]);
	};

	tc.dispatcher.fire = function(type, channel, msg) {
		events.push([channel.getName() + ' ' + type, msg]);
	};

	for (var i = 0; i < tests.length; ++i) {
		var testCase = tests[i];
		var expected = testCase[1];

		tc.process(testCase[0]);

		test.strictEqual(events.length, expected.length);

		for (var j = 0; j < expected.length; ++j) {
			var type = testChannel.getName() + ' ' + expected[j];

			test.strictEqual(events[j][0], type);
			test.strictEqual(events[j][1], testCase[0]);
		}

		events = [];
	}

	test.done();
};

exports.testParseCommand = function(test) {
	var tc          = buildTwitchClient();
	var result      = null;
	var testChannel = new Channel('mychan');
	var testUser    = new User('testee', testChannel);
	var tests       = [
		// non command texts
		['',                                 null],
		[' ',                                null],
		['!',                                null],
		['nothing here',                     null],
		['a !command in a sentence',         null],
		[' !command prefixed with a space',  null],
		['! space is not allowed',           null],
		['!#as are special characters',      null],
		['!!this is illegal as well',        null],
		['!äöü nope, keep it english place', null],
		['!invalid%command',                 null],

		// legal commands
		['!test',          ['test', []]                ],
		['!TEST ',         ['test', []]                ],
		['!cmd- foo',      ['cmd-', ['foo']]           ],
		['!cmd foo  ',     ['cmd',  ['foo']]           ],
		['!cmd foo  "',    ['cmd',  ['foo', '"']]      ],
		['!cmd foo  " xy', ['cmd',  ['foo', '"', 'xy']]],
		['!cmd foo%bar$x', ['cmd',  ['foo%bar$x']]     ]
	];

	tc.dispatcher.fire = function(type, channel, command, args, message) {
		result = [type, channel, command, args, message];
	};

	for (var i = 0; i < tests.length; ++i) {
		var testCase = new TextMessage(testChannel, testUser, tests[i][0]);
		var expected = tests[i][1];

		tc.processPossibleCommand(testCase);

		if (expected === null) {
			test.strictEqual(result, null);
		}
		else {
			test.strictEqual(result[0], EventDispatcher.COMMAND);
			test.strictEqual(result[1], testCase.getChannel());
			test.strictEqual(result[2], expected[0]);
			test.deepEqual  (result[3], expected[1]);
			test.strictEqual(result[4], testCase);
		}

		result = null;
	}

	test.done();
};
