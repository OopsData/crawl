var Movie = require('../models/movie')
var Trackable = require('../models/trackable')
var request = require('request')
var async = require('async')
var later = require('later')
var mongoose = require('mongoose')
var dbUrl = 'mongodb://localhost/imooc-mej'

mongoose.connect(dbUrl)

/* {{{ private function _extend() */
var _extend = function(a, b) {
    a = a || {};
    for (var i in b) {
        a[i] = b[i];
    }
    return a;
};
/* }}} */

// 每5秒爬取一次
var sched = later.parse.text('every 5 seconds')

later.setInterval(function() {
    async.waterfall([
        function(cb) {
            Trackable
                .findOneAndUpdate({
                    state: true,
                    next_sync_time: {
                        // 只选取next_sync_time小于当前时间的item
                        $lt: Date.now()
                    }
                }, {
                    state: false
                }, function(err, trackable) {
                    if (err) {
                        console.log(err);
                    }
                    if (trackable) {
                        console.log(trackable);
                        myCrawl(trackable.url)
                        cb(null, trackable.url)
                    }
                })
        },
        function(url, cb) {
            var trackableObj = {
                state: true,
                // 下次爬取时间在6秒之后
                next_sync_time: Date.now() + 6 * 1000
            }
            Trackable
                .findByUrl(url, function(err, trackable) {
                    var _trackable = _extend(trackable, trackableObj)
                    _trackable.save(function(err) {
                        if (err) {
                            console.log(err);
                        }
                    })
                    cb(null)
                })
        }
    ])
}, sched)

function myCrawl(url) {
    async.waterfall([
        // 获得被爬取页面id
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
        // 爬取第一个页面
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
        // 爬取第二个页面
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
        // 存入数据库
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

function acquireData(data) {
    var reg = /Q.PageInfo.playPageInfo\s=\s([^;]*)\;/;
    data = data
        .match(reg)[0]
        .replace(reg, '$1');
    data = eval('(' + data + ')');
    return data;
}
