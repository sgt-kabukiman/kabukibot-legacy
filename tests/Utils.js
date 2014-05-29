/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var Utils = require('./../lib/Utils.js');

exports.testDateToSQL = function(test) {
	test.strictEqual(Utils.dateToSQL(new Date('2014-01-01 UTC')),          '2014-01-01 00:00:00');
	test.strictEqual(Utils.dateToSQL(new Date('2014-01-01 01:20:07 UTC')), '2014-01-01 01:20:07');
	test.done();
};

exports.testHumanJoin = function(test) {
	var tests = [
		[             [],           ''],
		[          ['a'],          'a'],
		[     ['a', 'b'],    'a and b'],
		[['a', 'b', 'c'], 'a, b and c']
	];

	for (var i = 0; i < tests.length; ++i) {
		test.strictEqual(Utils.humanJoin(tests[i][0]), tests[i][1]);
	}

	test.done();
};

exports.testIsEmptyObject = function(test) {
	var tests = [
		[         {},       true],
		[   {foo: 1},      false],
		[{foo: null},      false],
		[{foo: undefined}, false]
	];

	for (var i = 0; i < tests.length; ++i) {
		test.strictEqual(Utils.isEmptyObject(tests[i][0]), tests[i][1]);
	}

	test.done();
};

exports.testGetObjectKeys = function(test) {
	var tests = [
		[              {},             []],
		[        {foo: 1},        ['foo']],
		[{foo: 1, bar: 2}, ['foo', 'bar']]
	];

	for (var i = 0; i < tests.length; ++i) {
		test.deepEqual(Utils.getObjectKeys(tests[i][0]), tests[i][1]);
	}

	test.done();
};

exports.testRandomItem = function(test) {
	var tests = [
		[      {},  null],
		[      [],  null],
		[{foo: 1}, 'foo'],
		[   ['a'],   'a']
	];

	for (var i = 0; i < tests.length; ++i) {
		test.strictEqual(Utils.randomItem(tests[i][0]), tests[i][1]);
	}

	test.done();
};

exports.testSecondsToTime = function(test) {
	var tests = [
		[       0,                     '',                                           ''],
		[       1,                  '01s',                                   '1 second'],
		[       2,                  '02s',                                  '2 seconds'],
		[      59,                  '59s',                                 '59 seconds'],
		[    59.5,                  '59s',                                 '59 seconds'], // properly truncate floats?
		[      60,              '01m:00s',                                   '1 minute'],
		[     122,              '02m:02s',                    '2 minutes and 2 seconds'],
		[  521100,      '06d:00h:45m:00s',                      '6 days and 45 minutes'],
		[  528300,      '06d:02h:45m:00s',             '6 days, 2 hours and 45 minutes'],
		[61613100, '101w:06d:02h:45m:00s',  '101 weeks, 6 days, 2 hours and 45 minutes']  // do not go into months and years, because months have different number of days
	];

	for (var i = 0; i < tests.length; ++i) {
		test.strictEqual(Utils.secondsToTime(tests[i][0], true), tests[i][1]);
		test.strictEqual(Utils.secondsToTime(tests[i][0], false), tests[i][2]);
	}

	test.done();
};

exports.testSecondsToRunTime = function(test) {
	var tests = [
		[    1,       '1'],
		[  122,    '2:02'],
		[21900, '6:05:00']
	];

	for (var i = 0; i < tests.length; ++i) {
		test.strictEqual(Utils.secondsToRunTime(tests[i][0]), tests[i][1]);
	}

	test.done();
};
