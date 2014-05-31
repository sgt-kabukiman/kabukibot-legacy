/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var ACL     = require('./../lib/ACL.js');
var Channel = require('./../lib/Channel.js');
var User    = require('./../lib/User.js');

function buildACL() {
	var db = {
		select: function(table, cols, where, callback) {
			callback(null, []);
		},

		insert: function(table, values) {
			return true;
		},

		del: function(table, where) {
			return true;
		}
	};

	var log = {
		logged: [],
		debug: function(s) { this.logged.push(s); },
		info:  function(s) { this.logged.push(s); },
		error: function(s) { this.logged.push(s); }
	};

	return new ACL(db, log);
}

function primeACL(acl, chan, data) {
	var origSelect = acl.db.select;
	var rows       = [];

	for (var i = 0; i < data.length; ++i) {
		rows.push({ channel: chan, permission: data[i][0], user_ident: data[i][1] });
	}

	acl.db.select = function(t, c, w, callback) {
		callback(null, rows);
	};

	acl.loadChannelData(new Channel(chan));
	acl.db.select = origSelect;

	return acl;
}

function getUser(name, chan, states, emoteSets) {
	var user = new User(name, new Channel(chan));

	user.setBot(states.bot);
	user.setOperator(states.op);
	user.setSubscriber(states.sub);
	user.setTurbo(states.turbo);
	user.setTwitchAdmin(states.admin);
	user.setTwitchStaff(states.staff);
	user.setEmoteSets(emoteSets || []);

	user.isModerator = function() {
		return !!states.mod;
	};

	user.isBroadcaster = function() {
		return !!states.owner;
	};

	return user;
}

exports.testLoadingData = function(test) {
	var acl = primeACL(buildACL(), 'test', [
		['foo', '$mods' ],
		['foo', '$subs' ],
		['bar', 'fooman']
	]);

	// check channel
	test.ok('test' in acl.permissions);

	// check permissions
	test.ok('foo' in acl.permissions.test);
	test.ok('bar' in acl.permissions.test);

	// check user idents
	test.deepEqual(['$mods', '$subs'], acl.permissions.test.foo);
	test.deepEqual(['fooman'],         acl.permissions.test.bar);

	test.done();
};

exports.testLoadingEmptyChannelData = function(test) {
	var acl     = buildACL();
	var channel = new Channel('test');

	acl.db.select = function(t, c, w, callback) {
		callback(null, []);
	};

	acl.loadChannelData(channel);

	test.ok('test' in acl.permissions);
	test.done();
};

exports.testLoadingMultipleChannels = function(test) {
	var acl = buildACL();

	primeACL(acl, 'test',        [ ['foo', '$mods']   ]);
	primeACL(acl, 'anotherchan', [ ['foo', '$admins'] ]);

	test.deepEqual(acl.getAllowedUsers(new Channel('test'),        'foo'), ['$mods']);
	test.deepEqual(acl.getAllowedUsers(new Channel('anotherchan'), 'foo'), ['$admins']);

	test.done();
};

exports.testFailedLoadingData = function(test) {
	var acl     = buildACL();
	var channel = new Channel('test');

	acl.db.select = function(t, c, w, callback) {
		callback(new Error('something is wrong'), []);
	};

	acl.loadChannelData(channel);

	test.strictEqual(acl.log.logged.length, 1);
	test.done();
};

exports.testUnloadingChannel = function(test) {
	var acl     = buildACL();
	var channel = new Channel('test');

	test.deepEqual(acl.permissions, {});
	test.strictEqual(acl.unloadChannelData(channel), false);

	primeACL(acl, 'test', [
		['foo', '$mods'  ],
		['foo', '$subs'  ],
		['bar', 'fooman' ]
	]);

	test.ok('test' in acl.permissions);
	test.strictEqual(acl.unloadChannelData(channel), true);
	test.deepEqual(acl.permissions, {});
	test.strictEqual(acl.unloadChannelData(channel), false);
	test.done();
};

exports.testGetAllowedUsers = function(test) {
	var acl     = buildACL();
	var channel = new Channel('test');

	primeACL(acl, 'test', [
		['foo', '$mods' ],
		['foo', '$subs' ],
		['bar', 'fooman']
	]);

	test.deepEqual(acl.getAllowedUsers(channel, ''),    []);
	test.deepEqual(acl.getAllowedUsers(channel, 'foo'), ['$mods', '$subs']);
	test.deepEqual(acl.getAllowedUsers(channel, 'bar'), ['fooman']);

	channel = new Channel('test2');
	test.deepEqual(acl.getAllowedUsers(channel, ''),    []);
	test.deepEqual(acl.getAllowedUsers(channel, 'foo'), []);
	test.deepEqual(acl.getAllowedUsers(channel, 'bar'), []);

	test.done();
};

exports.testIsUsername = function(test) {
	var acl   = buildACL();
	var tests = {
		'foobar':  true,
		'$$mods':  true,
		'admin':   true,

		'$mods':   false,
		'$MODS':   false,
		'$admins': false
	};

	for (var key in tests) {
		test.strictEqual(acl.isUsername(key), tests[key]);
	}

	test.done();
};

exports.testIsAllowed = function(test) {
	var acl   = buildACL();
	var tests = [
		// op and owner are always allowed everything
		['dude', {op: true},    'can_do_foo', true],
		['dude', {owner: true}, 'can_do_foo', true],

		// this even skips checking if the permission or channel actually exists
		['dude', {op: true}, 'nonexisting_permission', true],

		// if the permission is unknown, it should not forbidden by default
		['dude', {mod: true}, 'nonexisting_permission', false],

		// test the primed permissions
		['dude', {sub: true},   'can_do_foo', true ],
		['dude', {mod: true},   'can_do_foo', true ],
		['dude', {admin: true}, 'can_do_foo', false],
		['dude', {staff: true}, 'can_do_foo', false],
		['dude', {turbo: true}, 'can_do_foo', false],

		// are non-groups respected as expected?
		['some_guy', {}, 'can_do_foo', true],

		// do not get confused by being granted multiple times
		['dude',     {sub: true, mod: true}, 'can_do_foo', true],
		['some_guy', {sub: true, mod: true}, 'can_do_foo', true],

		// does $all work?
		['dude', {},          'free_for_all', true],
		['dude', {mod: true}, 'free_for_all', true]
	];

	primeACL(acl, 'testchan', [
		['can_do_foo',   '$mods'   ],
		['can_do_foo',   '$subs'   ],
		['can_do_foo',   'some_guy'],
		['free_for_all', '$all'    ]
	]);

	for (var i = 0; i < tests.length; ++i) {
		var user = getUser(tests[i][0], 'testchan', tests[i][1]);

		test.strictEqual(acl.isAllowed(user, tests[i][2]), tests[i][3]);
	}

	test.done();
};
