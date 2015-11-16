/**
 * 因为这里的url地址只与iqiyi有关，所以文件名为iqiyi.js
 */
var Movie = require('../models/movie')
var Trackable = require('../models/trackable')
var _ = require('underscore')
var request = require('request')
var async = require('async')

function acquireData(data) {
    var reg = /Q.PageInfo.playPageInfo\s=\s([^;]*)\;/;
    data = data
        .match(reg)[0]
        .replace(reg, '$1');
    data = eval('(' + data + ')');
    return data;
}

exports.crawl = function(req, res) {
    var url = req.query.url
    var state = req.query.trackable == 1 ? true : false
    var trackableObj = {
        state: state
    }
    var _trackable
    
    Trackable.findByUrl(url, function(err, data) {
        if (err) {
            console.log(err);
        }

        if (data) {
            _trackable = _.extend(data, trackableObj)
            _trackable.save(function(err) {
                if (err) {
                    console.log(err);
                }
            })
        } else {
            _trackable = new Trackable({
                url: url,
                state: state
            })
            _trackable.save(function(err) {
                if (err) {
                    console.log(err);
                }
            })
        }
    })

    if (url) {
        var interval = 5000;

        (function schedule() {
            var timeout = setTimeout(
                function do_it() {
                    (function() {
                        myCrawl()
                        schedule()
                    }())
                },
                interval);

            Trackable.findByUrl(url, function(err, data) {
                // console.log(data.state);
                if (!data.state) {
                    clearTimeout(timeout)
                }
            })
        }())

        function myCrawl() {
            async.waterfall([
                function(cb) {
                    request(url, function(error, response, body) {
                        if (!error && response.statusCode === 200) {
                            var ret = acquireData(body);
                            cb(null, ret);
                        } else {
                            console.log(response.statusCode);
                        }
                    });
                },
                function(data, cb) {
                    var mixerUrl = 'http://mixer.video.iqiyi.com/jp/mixin/videos/' + data.tvId
                    var tvId = data.tvId
                    request(mixerUrl, function(error, response, body) {
                        if (!error && response.statusCode == 200) {
                            var reg = /var\s*tvInfoJs\s*=\s*()/
                            var data = body.replace(reg, '$1')
                            data = JSON.parse(data)
                            var tempObj = {
                                "commentCount": data.commentCount,
                                "duration": data.duration,
                                "playCount": data.playCount,
                                "shareCount": data.shareCount,
                                "subtitle": data.subtitle,
                                "tvId": tvId
                            }
                            cb(null, tempObj);
                        } else {
                            console.log(response.statusCode);
                        }
                    })
                },
                function(data, cb) {
                    var upUrl = 'http://up.video.iqiyi.com/ugc-updown/quud.do' + '?dataid=' + data.tvId + '&type=2'
                    var tempObj = data
                    request(upUrl, function(error, response, body) {
                        if (!error && response.statusCode == 200) {
                            var reg = /try{null\((.*)\)}catch\(e\){}/
                            var data = body.replace(reg, '$1')
                            data = JSON.parse(data)
                            var movieObj = {
                                "commentCount": tempObj.commentCount,
                                "duration": tempObj.duration,
                                "playCount": tempObj.playCount,
                                "shareCount": tempObj.shareCount,
                                "subtitle": tempObj.subtitle,
                                "score": data.data.score,
                                "upCount": data.data.up,
                                "downCount": data.data.down
                            }
                            cb(null, movieObj);
                        } else {
                            console.log(response.statusCode);
                        }
                    })
                },
                function(data, cb) {
                    var movieObj = data
                    var _movie
                    _movie = new Movie({
                        url: url,
                        subtitle: movieObj.subtitle,
                        playCount: movieObj.playCount,
                        duration: movieObj.duration,
                        upCount: movieObj.upCount,
                        downCount: movieObj.downCount,
                        commentCount: movieObj.commentCount,
                        score: movieObj.score,
                        shareCount: movieObj.shareCount
                    })
                    _movie.save(function(err, movie) {
                            if (err) {
                                console.log(err);
                            }
                        })
                        // res.write("data")
                }
            ]);
        }
    }
}
