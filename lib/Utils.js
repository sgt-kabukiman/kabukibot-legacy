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

function twodigit(n) {
	return (n < 10) ? ('0' + n) : n;
}

function plural(n, word) {
	return n   + ' ' + (n === 1 ? word : (word + 's'));
}

function dateToSQL(date) {
	var
		year  = date.getUTCFullYear(),
		month = twodigit(date.getUTCMonth() + 1),
		day   = twodigit(date.getUTCDate()),
		hour  = twodigit(date.getUTCHours()),
		min   = twodigit(date.getUTCMinutes()),
		sec   = twodigit(date.getUTCSeconds());

	return year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + sec;
}

function secondsToTime(seconds, compact) {
	var weeks, days, hours, minutes, list;

	seconds = Math.floor(seconds);

	weeks    = Math.floor(seconds / ONE_WEEK);
	seconds -= weeks * ONE_WEEK;

	days     = Math.floor(seconds / ONE_DAY);
	seconds -= days * ONE_DAY;

	hours    = Math.floor(seconds / ONE_HOUR);
	seconds -= hours * ONE_HOUR;

	minutes  = Math.floor(seconds / ONE_MINUTE);
	seconds -= minutes * ONE_MINUTE;

	list = [];

	if (compact) {
		if (weeks)                                        list.push(twodigit(weeks)   + 'w');
		if (weeks || days)                                list.push(twodigit(days)    + 'd');
		if (weeks || days || hours)                       list.push(twodigit(hours)   + 'h');
		if (weeks || days || hours || minutes)            list.push(twodigit(minutes) + 'm');
		if (weeks || days || hours || minutes || seconds) list.push(twodigit(seconds) + 's');

		return list.join(':');
	}

	if (weeks)   list.push(plural(weeks,   'week'));
	if (days)    list.push(plural(days,    'day'));
	if (hours)   list.push(plural(hours,   'hour'));
	if (minutes) list.push(plural(minutes, 'minute'));
	if (seconds) list.push(plural(seconds, 'second'));

	return humanJoin(list);
}

function secondsToRunTime(seconds) {
	var hours, minutes, list;

	seconds = Math.floor(seconds);

	hours    = Math.floor(seconds / ONE_HOUR);
	seconds -= hours * ONE_HOUR;

	minutes  = Math.floor(seconds / ONE_MINUTE);
	seconds -= minutes * ONE_MINUTE;

	list = [];

	if (hours)                       list.push(twodigit(hours));
	if (hours || minutes)            list.push(twodigit(minutes));
	if (hours || minutes || seconds) list.push(twodigit(seconds));

	return list.join(':').replace(/^0/, '');
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
		if (obj.hasOwnProperty(key)) {
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

	if (list.length === 0) {
		return null;
	}

	return list[Math.floor(Math.random() * list.length)];
}

exports.dateToSQL        = dateToSQL;
exports.secondsToTime    = secondsToTime;
exports.secondsToRunTime = secondsToRunTime;
exports.humanJoin        = humanJoin;
exports.isEmptyObject    = isEmptyObject;
exports.getObjectKeys    = getObjectKeys;
exports.randomItem       = randomItem;
