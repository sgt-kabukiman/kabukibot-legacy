/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var ONE_MINUTE = 60;
var ONE_HOUR   = 60 * ONE_MINUTE;
var ONE_DAY    = 24 * ONE_HOUR;
var ONE_WEEK   = 7 * ONE_DAY;

function secondsToTime(seconds) {
	var weeks, days, hours, minutes, seconds, list;

	weeks    = Math.floor(seconds / ONE_WEEK);
	seconds -= weeks * ONE_WEEK;

	days     = Math.floor(seconds / ONE_DAY);
	seconds -= days * ONE_DAY;

	hours    = Math.floor(seconds / ONE_HOUR);
	seconds -= hours * ONE_HOUR;

	minutes  = Math.floor(seconds / ONE_MINUTE);
	seconds -= minutes * ONE_MINUTE;

	list = [];

	if (weeks)   { list.push(weeks   + ' ' + (weeks   === 1 ? 'week'   : 'weeks'));   }
	if (days)    { list.push(days    + ' ' + (days    === 1 ? 'day'    : 'days'));    }
	if (hours)   { list.push(hours   + ' ' + (hours   === 1 ? 'hour'   : 'hours'));   }
	if (minutes) { list.push(minutes + ' ' + (minutes === 1 ? 'minute' : 'minutes')); }
	if (seconds) { list.push(seconds + ' ' + (seconds === 1 ? 'second' : 'seconds')); }

	return humanJoin(list);
}

function humanJoin(list, glue) {
	if (glue === undefined) {
		glue = ', ';
	}

	switch (list.length) {
		case 0:  return '';
		case 1:  return list[0];
		default: return list.slice(0, -1).join(glue) + ' and ' + list[list.length - 1];
	}
}

function isEmptyObject(obj) {
	for (var key in obj) {
		if (obj.hasOwnProperty(key)) {
			return false;
		}
	}

	return true;
}

function getObjectKeys(obj) {
	var keys = [], key;

	for (key in obj) {
		if (list.hasOwnProperty(key)) {
			keys.push(key);
		}
	}

	return keys;
}

function randomItem(list) {
	// we were given an object, so we need to use its keys
	if (Object.prototype.toString.call(list) == '[object Object]') {
		list = getObjectKeys(list);
	}

	return list[Math.floor(Math.random() * list.length)];
}

exports.secondsToTime = secondsToTime;
exports.humanJoin     = humanJoin;
exports.isEmptyObject = isEmptyObject;
exports.getObjectKeys = getObjectKeys;
exports.randomItem    = randomItem;
