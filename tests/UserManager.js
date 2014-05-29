/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var UserManager = require('./../lib/UserManager.js');

exports.testSubscribers = function(test) {
	var um = new UserManager('someone');
	um.putSubscriber('testchan', 'a_subscriber');

	// trying to get a user that has not been put should return false
	test.strictEqual(um.isSubscriber('testchan', 'someone_else'), false);
	test.strictEqual(um.takeSubscriber('testchan', 'someone_else'), false);

	// only the first access should return the subscriber
	test.strictEqual(um.isSubscriber('testchan', 'a_subscriber'), true);
	test.strictEqual(um.takeSubscriber('testchan', 'a_subscriber'), true);
	test.strictEqual(um.isSubscriber('testchan', 'a_subscriber'), false);
	test.strictEqual(um.takeSubscriber('testchan', 'a_subscriber'), false);

	// subscriptions are oly valid for one channel
	um.putSubscriber('testchan', 'a_subscriber');
	test.strictEqual(um.isSubscriber('anotherchan', 'a_subscriber'), false);
	test.strictEqual(um.takeSubscriber('anotherchan', 'a_subscriber'), false);

	test.done();
};

exports.testGlobalUserStates = function(test) {
	var um = new UserManager('someone');
	um.putTurboUser('turbo_turbo');

	// trying to get a user that has not been put should return false
	test.strictEqual(um.takeTurboUser('non_turbo_user'), false);

	// only the first access should return the subscriber
	test.strictEqual(um.takeTurboUser('turbo_turbo'), true);
	test.strictEqual(um.takeTurboUser('turbo_turbo'), false);

	test.done();
};

exports.testIsOperator = function(test) {
	var um = new UserManager('someone');

	test.strictEqual(um.isOperator('someone'), true);
	test.done();
};

exports.testEmoteSets = function(test) {
	var um = new UserManager('someone');
	um.putEmoteSets('a_guy', [1, 2, 3]);

	test.deepEqual(um.getEmoteSets('a_guy'), [1, 2, 3]);
	test.deepEqual(um.takeEmoteSets('a_guy'), [1, 2, 3]);

	test.deepEqual(um.getEmoteSets('a_guy'), []);
	test.deepEqual(um.takeEmoteSets('a_guy'), []);

	test.done();
};
