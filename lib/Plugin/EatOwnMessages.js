/*
 * Copyright (c) 2014, Sgt. Kabukiman, https://bitbucket.org/sgt-kabukiman/
 *
 * This file is released under the terms of the MIT license. You can find the
 * complete text in the attached LICENSE file or online at:
 *
 * http://www.opensource.org/licenses/mit-license.php
 */

var EatOwnMessagesPlugin = function() { };

EatOwnMessagesPlugin.prototype = {
	process: function(message, twitch) {
		return message.isFrom(twitch.getBotName()) ? null : message;
	}
};

module.exports = EatOwnMessagesPlugin;
