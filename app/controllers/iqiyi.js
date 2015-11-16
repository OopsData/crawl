var Movie = require('../models/movie')
var request = require('request')
var async = require('async')
var later = require('later')

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
    // var sched = later.parse.text('every 5 secs')
    if (url) {
        // var timer = later.setInterval(myCrawl, sched);

        // function myCrawl() {
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
                    res.jsonp(data)
                }
            ]);
        // }
    }
}
