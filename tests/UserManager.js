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
	test.deepEqual(um.isSubscriber('testchan', 'someone_else'), false);
	test.deepEqual(um.takeSubscriber('testchan', 'someone_else'), false);

	// only the first access should return the subscriber
	test.deepEqual(um.isSubscriber('testchan', 'a_subscriber'), true);
	test.deepEqual(um.takeSubscriber('testchan', 'a_subscriber'), true);
	test.deepEqual(um.isSubscriber('testchan', 'a_subscriber'), false);
	test.deepEqual(um.takeSubscriber('testchan', 'a_subscriber'), false);

	// subscriptions are oly valid for one channel
	um.putSubscriber('testchan', 'a_subscriber');
	test.deepEqual(um.isSubscriber('anotherchan', 'a_subscriber'), false);
	test.deepEqual(um.takeSubscriber('anotherchan', 'a_subscriber'), false);

	test.done();
};

exports.testGlobalUserStates = function(test) {
	var um = new UserManager('someone');
	um.putTurboUser('turbo_turbo');

	// trying to get a user that has not been put should return false
	test.deepEqual(um.takeTurboUser('non_turbo_user'), false);

	// only the first access should return the subscriber
	test.deepEqual(um.takeTurboUser('turbo_turbo'), true);
	test.deepEqual(um.takeTurboUser('turbo_turbo'), false);

	test.done();
};

exports.testIsOperator = function(test) {
	var um = new UserManager('someone');

	test.deepEqual(um.isOperator('someone'), true);
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
