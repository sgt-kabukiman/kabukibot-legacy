/*
  Kabukibot Configuration

  !!! Copy this file to `config.json` and only change that file, never this one,
      or else you will get conflicts when updating.
 */

module.exports = {
	// this is the account for the bot
	account: {
		username: 'mybotaccount',

		// a string like 'oauth:egirg2irfwi...'
		// use http://twitchapps.com/tmi/ to create a token
		oauthToken: 'oauth:.......'
	},

	// bot operator
	// This is the user that can perform administrative tasks and has in general
	// godlike power over the bot.
	op: 'botmaster',

	// database file
	// This file contains all the permanent data, like joined channels, set
	// permissions, created commands etc.
	database: 'mybotdatabase.sqlite3',

	// command prefix
	// This is the prefix that is put in front of all global commands, like ![prefix]join
	// or ![prefix]allow. Custom commands and those provided by content packs are not affected.
	// This is because the owner of a channel actively opted-in to have those commands in their
	// channels, compared to global commands a broadcaster cannot defend against.
	commandPrefix: 'mybot_',

	// internal values
	// In general there is no reason to change these.

	// IRC host
	irc: {
		host: 'irc.twitch.tv',
		port: 6667
	},

	// SPECIALUSER time-to-live
	// Determines how many milliseconds a SPECIALUSER line may be old to consider
	// it valid when receiving a text line (i.e. time between SPECIALUSER and
	// text must be smaller than these values)
	ttl: {
		turbo: 5000,
		admin: 5000,
		staff: 5000,
		subscriber: 5000
	}
};