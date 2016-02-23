"use strict";

var tz = require("../../").tz;

var getTimezoneOffset = Date.prototype.getTimezoneOffset;
var toTimeString = Date.prototype.toTimeString;
var oldIntl = global.Intl;

function mockTimezoneOffset (zone, format) {
	Date.prototype.getTimezoneOffset = function () {
		return zone.offset(+this);
	};
	Date.prototype.toTimeString = function () {
		return tz(+this, zone.name).format(format || 'HH:mm:ss [GMT]ZZ');
	};
}

function mockIntlTimeZone (name) {
	global.Intl = {
		DateTimeFormat: function () {
			return {
				resolvedOptions: function () {
					return {
						timeZone: name
					};
				}
			};
		}
	};
}

exports.guess = {
	setUp : function (done) {
		global.Intl = undefined;
		done();
	},

	tearDown : function (done) {
		Date.prototype.getTimezoneOffset = getTimezoneOffset;
		Date.prototype.toTimeString = toTimeString;
		global.Intl = oldIntl;
		done();
	},

	"different offsets should guess different timezones" : function (test) {
		mockTimezoneOffset(tz.zone('Europe/London'));
		var london = tz.guess(true);
		mockTimezoneOffset(tz.zone('America/New_York'));
		var newYork = tz.guess(true);
		mockTimezoneOffset(tz.zone('America/Los_Angeles'));
		var losAngeles = tz.guess(true);

		test.ok(london);
		test.ok(newYork);
		test.ok(losAngeles);
		test.notEqual(london, newYork);
		test.notEqual(london, losAngeles);
		test.done();
	},

	"When Intl is available, it is used" : function (test) {
		mockIntlTimeZone('Europe/London');
		test.equal(tz.guess(true), 'Europe/London');

		mockIntlTimeZone('America/New_York');
		test.equal(tz.guess(true), 'America/New_York');

		mockIntlTimeZone('America/Some_Missing_Zone');
		mockTimezoneOffset(tz.zone('America/Los_Angeles'));
		test.equal(tz.guess(true), 'America/Los_Angeles');

		test.done();
	},

	"ensure each zone is represented" : function (test) {
		var names = tz.names();
		var zone, i;

		for (i = 0; i < names.length; i++) {
			zone = tz.zone(names[i]);
			mockTimezoneOffset(zone);
			test.ok(tz.guess(true), "Should have a guess for " + zone.name + ")");
		}
		test.done();
	}
};
