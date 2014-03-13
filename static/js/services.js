'use strict';

app.factory('Utils', function() {
    return {
        bucketMessages: function(messages, filters) {
            var data = {
                totalMessages: 0,
                drips: 0,
                uniqueEmails: 0,
                emails: {},
                subjects: {},
                numEmails: {
                    theirResponses: 0,
                    ourResponses: 0,
                    internal: 0,
                    other: 0
                },
                numAddresses: {
                    theirResponses: 0,
                    ourResponses: 0,
                    internal: 0,
                    other: 0
                },
                responseTimes: {
                    zeroToFive: { flagged: [], total: 0, ourResponses: [], theirResponses: [] },
                    fiveToFifteen: { flagged: [], total: 0, ourResponses: [], theirResponses: [] },
                    fifteenToOneHr: { flagged: [], total: 0, ourResponses: [], theirResponses: [] },
                    oneToFourHrs: { flagged: [], total: 0, ourResponses: [], theirResponses: [] },
                    fourToEightHrs: { flagged: [], total: 0, ourResponses: [], theirResponses: [] },
                    eightToTwelveHrs: { flagged: [], total: 0, ourResponses: [], theirResponses: [] },
                    twelveHrsToOneDay: { flagged: [], total: 0, ourResponses: [], theirResponses: [] },
                    moreThanOneDay: { flagged: [], total: 0, ourResponses: [], theirResponses: [] }
                }
            };

            messages.forEach(function(message) {
                console.log(message.dateSent)
                var hour = new Date(message.dateSent).getHours()
                if(filters.businessHours && (hour < 9 || hour >= 17)) { return; }

                data.totalMessages++;

                if(message.emailClass == 'our-response') {
                    data.numEmails.ourResponses++;
                    if(message.sender in data.emails) {
                        data.emails[message.sender].ourResponses.push(message);
                        data.emails[message.sender].totalMessages++;
                    }
                    else {
                        data.emails[message.sender] = {
                            flagged: message.flagged,
                            ourResponses: [message],
                            theirResponses: [],
                            totalMessages: 1
                        }
                    }
                }
                else if(message.emailClass == 'their-response') {
                    data.numEmails.theirResponses++;
                    if(message.responder in data.emails) {
                        data.emails[message.responder].theirResponses.push(message);
                        data.emails[message.responder].totalMessages++;
                    }
                    else {
                        data.emails[message.responder] = {
                            flagged: message.flagged,
                            ourResponses: [],
                            theirResponses: [message],
                            totalMessages: 1
                        }
                    }
                }
                else if(message.emailClass == 'internal') {
                     data.numEmails.internal++;
                }
                else if(message.emailClass == 'other') {
                     data.numEmails.other++;
                }

                if(message.subject in data.subjects) {
                    data.subjects[message.subject]++;
                }
                else {
                    data.subjects[message.subject] = 1;
                }

                if(message.drip) { data.drips++ }

            })

            var sortableSubjects = [];
            for(var s in data.subjects) { sortableSubjects.push([s, data.subjects[s]]) }
            sortableSubjects.sort(function(a, b) { return b[1] - a[1] })
            data.subjects = sortableSubjects;

            data.drips = data.drips/data.totalMessages * 100;
            for(var e in data.emails) {
                if(data.emails[e].ourResponses.length > 0) {
                    data.emails[e].email = e;
                    data.numAddresses.ourResponses++;
                    data.uniqueEmails++;
                    var ourFirstResponseTime = (function() {
                        var times = data.emails[e].ourResponses.sort(function(a, b) {
                            return a.dateResponded - b.dateResponded;
                        })
                        return times[0].responseTime;
                    })();
                    if(ourFirstResponseTime < 5) {
                        data.responseTimes.zeroToFive.ourResponses.push(data.emails[e]);
                        if(data.emails[e].flagged) { data.responseTimes.zeroToFive.flagged.push(data.emails[e]); }
                    }
                    else if(ourFirstResponseTime < 15) {
                        data.responseTimes.fiveToFifteen.ourResponses.push(data.emails[e]);
                        if(data.emails[e].flagged) { data.responseTimes.fiveToFifteen.flagged.push(data.emails[e]); }
                    }
                    else if(ourFirstResponseTime < 60) {
                        data.responseTimes.fifteenToOneHr.ourResponses.push(data.emails[e]);
                        if(data.emails[e].flagged) { data.responseTimes.fifteenToOneHr.flagged.push(data.emails[e]); }
                    }
                    else if(ourFirstResponseTime < (4 * 60)) {
                        data.responseTimes.oneToFourHrs.ourResponses.push(data.emails[e]);
                        if(data.emails[e].flagged) { data.responseTimes.oneToFourHrs.flagged.push(data.emails[e]); }
                    }
                    else if(ourFirstResponseTime < (8 * 60)) {
                        data.responseTimes.fourToEightHrs.ourResponses.push(data.emails[e]);
                        if(data.emails[e].flagged) { data.responseTimes.fourToEightHrs.flagged.push(data.emails[e]); }
                    }
                    else if(ourFirstResponseTime < (12 * 60)) {
                        data.responseTimes.eightToTwelveHrs.ourResponses.push(data.emails[e]);
                        if(data.emails[e].flagged) { data.responseTimes.eightToTwelveHrs.flagged.push(data.emails[e]); }
                    }
                    else if(ourFirstResponseTime < (24 * 60)) {
                        data.responseTimes.twelveHrsToOneDay.ourResponses.push(data.emails[e]);
                        if(data.emails[e].flagged) { data.responseTimes.twelveHrsToOneDay.flagged.push(data.emails[e]); }
                    }
                    else {
                        data.responseTimes.moreThanOneDay.ourResponses.push(data.emails[e]);
                        if(data.emails[e].flagged) { data.responseTimes.moreThanOneDay.flagged.push(data.emails[e]); }
                    }
                }
                if(data.emails[e].theirResponses.length > 0) {
                    data.emails[e].email = e;
                    data.numAddresses.theirResponses++;
                    var theirFirstResponseTime = (function() {
                        var times = data.emails[e].theirResponses.sort(function(a, b) {
                            return a.dateResponded - b.dateResponded;
                        })
                        return times[0].responseTime;
                    })();
                    if(theirFirstResponseTime < 5) {
                        data.responseTimes.zeroToFive.theirResponses.push(data.emails[e]);
                    }
                    else if(theirFirstResponseTime < 15) {
                        data.responseTimes.fiveToFifteen.theirResponses.push(data.emails[e]);
                    }
                    else if(theirFirstResponseTime < 60) {
                        data.responseTimes.fifteenToOneHr.theirResponses.push(data.emails[e]);
                    }
                    else if(theirFirstResponseTime < (4 * 60)) {
                        data.responseTimes.oneToFourHrs.theirResponses.push(data.emails[e]);
                    }
                    else if(theirFirstResponseTime < (8 * 60)) {
                        data.responseTimes.fourToEightHrs.theirResponses.push(data.emails[e]);
                    }
                    else if(theirFirstResponseTime < (12 * 60)) {
                        data.responseTimes.eightToTwelveHrs.theirResponses.push(data.emails[e]);
                    }
                    else if(theirFirstResponseTime < (24 * 60)) {
                        data.responseTimes.twelveHrsToOneDay.theirResponses.push(data.emails[e]);
                    }
                    else {
                        data.responseTimes.moreThanOneDay.theirResponses.push(data.emails[e]);
                    }
                }
            }

            return data;
        }
    }
}); // end Utils