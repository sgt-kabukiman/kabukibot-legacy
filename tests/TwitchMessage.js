/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var TM = require('./../lib/TwitchMessage.js');

function assertMessage(test, msg, chan, cmd, args, username) {
	test.deepEqual(msg.getChannel(), chan);
	test.deepEqual(msg.getArgs(),    args);

	test.strictEqual(msg.getCommand(),  cmd);
	test.strictEqual(msg.getUsername(), username);
}

exports.testParseClearchat = function(test) {
	var msg = TM.fromIrcMessage(null, 'jtv', 'CLEARCHAT');
	assertMessage(test, msg, null, 'clearchat', [], null);

	test.done();
};

exports.testParseTimeout = function(test) {
	var msg = TM.fromIrcMessage(null, 'jtv', 'CLEARCHAT a_username');
	assertMessage(test, msg, null, 'clearchat', ['a_username'], 'a_username');

	test.done();
};

exports.testParseSpecialuser = function(test) {
	var msg = TM.fromIrcMessage(null, 'jtv', 'SPECIALUSER a_username subscriber');
	assertMessage(test, msg, null, 'specialuser', ['a_username', 'subscriber'], 'a_username');

	test.done();
};

exports.testParseUsercolor = function(test) {
	var msg = TM.fromIrcMessage(null, 'jtv', 'USERCOLOR a_username #123456');
	assertMessage(test, msg, null, 'usercolor', ['a_username', '#123456'], 'a_username');

	test.done();
};

exports.testParseEmoteset = function(test) {
	var msg = TM.fromIrcMessage(null, 'jtv', 'EMOTESET a_username [12,34,56]');
	assertMessage(test, msg, null, 'emoteset', ['a_username', '[12,34,56]'], 'a_username');

	test.done();
};

exports.testParseUnknown = function(test) {
	// only the first 2 arguments are relevant and being parsed
	var msg = TM.fromIrcMessage(null, 'jtv', 'FUNKY a_username #123456 something_else foo,bar');
	assertMessage(test, msg, null, 'funky', ['a_username', '#123456'], null);

	test.done();
};

exports.testParseSubscription = function(test) {
	var msg = TM.fromIrcMessage(null, 'twitchnotify', 'a_cool_testuser just subscribed!');
	assertMessage(test, msg, null, 'subscriber', ['a_cool_testuser'], 'a_cool_testuser');

	test.done();
};

exports.testParseOtherTwitchNotifyMessage = function(test) {
	var msg = TM.fromIrcMessage(null, 'twitchnotify', 'This room is now in subscribers-only mode.');
	assertMessage(test, msg, null, '???', [], null);

	test.done();
};
