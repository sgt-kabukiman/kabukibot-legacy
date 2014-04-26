/*
  Kabukibot Configuration

  !!! Copy this file to `config.js` and only change that file, never this one,
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
	op: '<your username here>',

	// database configuration
	database: {
		// use either 'sqlite' or 'mysql'
		driver: 'sqlite',

		// the SQLite database file to use if driver is 'sqlite'
		sqlite: {
			filename: 'kabukibot.sqlite3'
		},

		// connection configuration for MySQL/MariaDB (only needed when driver is 'mysql')
		// see https://github.com/felixge/node-mysql#connection-options
		mysql: {
			host:     'localhost',
			user:     'mydbuser',
			password: 'mydbpass',
			database: 'kabukibot'
		}
	},

	// plugin configuration
	plugins: {
		highlights: {
			maxPerChannel: 50,  // max number of highlights per channel
			cooldown: 60,       // min time between highlights in seconds
			maxAge: 2*7*24*3600 // max age in seconds of a highlight before it's purged automatically
		},

		log: {
			// Set the adapter to either 'file' or 'database'. Do NOT use database if you are
			// using SQLite, because logging is write-intensive and you don't want all that I/O
			// on your machine.
			adapter: 'file',

			// If the adapter is 'file', set the full path to the directory in which the logfiles
			// shall be place. Make sure this directory exists!
			directory: '/full/path/to/the/log/dir'
		},

		srr: {
			interval: 15*60,
			mapping: {
				'Grand Theft Auto': {
					'Grand Theft Auto III': {
						'Any%':         'gta_wr_iii_any',
						'All Missions': 'gta_wr_iii_mis',
						'100%':         'gta_wr_iii_100'
					},

					'Grand Theft Auto: Vice City': {
						'Any%':         'gta_wr_vc_any',
						'All Missions': 'gta_wr_vc_mis',
						'100%':         'gta_wr_vc_100'
					},

					'Grand Theft Auto: San Andreas': {
						'Any%': 'gta_wr_sa_any',
						'100%': 'gta_wr_sa_100'
					},

					'Grand Theft Auto: Liberty City Stories': {
						'Any%': 'gta_wr_lcs_any'
					},

					'Grand Theft Auto: Vice City Stories': {
						'Any%': 'gta_wr_vcs_any'
					},

					'Grand Theft Auto IV': {
						'Any%':     'gta_wr_iv_any',
						'Classic%': 'gta_wr_iv_classic'
					},

					'Grand Theft Auto V': {
						'Any%':     'gta_wr_v_any',
						'Classic%': 'gta_wr_v_classic'
					}
				}
			}
		}
	},

	// Sentry configuration
	// Kabukibot can send all unexpected failures to Sentry.
	// If you do not know what this is or how to use it, leave this field blank.
	sentry: {
		dsn: ''
	},

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
	}
};
