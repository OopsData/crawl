var Movie = require('../models/movie')
var Stat = require('../models/stat')
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
var _myCrawl = function(url, id) {
    async.waterfall([
        // 获得被爬取页面id
        function(cb) {
            request(url, function(error, response, body) {
                if (!error && response.statusCode === 200) {
                    var ret = _acquireData(body);
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
                    var vdata = body.replace(reg, '$1')
                    vdata = JSON.parse(vdata)
                    var tempObj = {
                        "commentCount": vdata.commentCount,
                        "playCount": vdata.playCount,
                        "shareCount": vdata.shareCount,
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
            console.log(upUrl);
            var tempObj = data
            request(upUrl, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    var reg = /try{null\((.*)\)}catch\(e\){}/
                    var data = body.replace(reg, '$1')
                    data = JSON.parse(data)
                    var statObj = {
                        "commentCount": tempObj.commentCount,
                        "playCount": tempObj.playCount,
                        "shareCount": tempObj.shareCount,
                        "score": data.data.score,
                        "upCount": data.data.up,
                        "downCount": data.data.down
                    }
                    cb(null, statObj);
                } else {
                    console.log(response.statusCode);
                }
            })
        },
        // 存入数据库
        function(statObj, cb) {
            var _stat = new Stat(statObj)
            _stat['movie'] = id
            Movie
                .findOne({_id: id})
                .exec(function(err, movie) {
                    movie.stats.push(_stat._id)
                    movie.save(function(err, movie) {
                        if (err) {
                            console.log(err);
                        }
                    })
                })
            _stat.save(function(err) {
                if (err) {
                    console.log(err);
                }
            })
        }
    ]);
}
var _acquireData = function(data) {
    var reg = /Q.PageInfo.playPageInfo\s=\s([^;]*)\;/;
    data = data
        .match(reg)[0]
        .replace(reg, '$1');
    data = eval('(' + data + ')');
    return data;
}
// 每5秒爬取一次
var sched = later.parse.text('every 5 seconds')

later.setInterval(function() {
    async.waterfall([
        function(cb) {
            Movie
                .findOneAndUpdate({
                    state: true,
                    next_sync_time: {
                        // 只选取next_sync_time小于当前时间的item
                        $lt: Date.now()
                    }
                }, {
                    state: false
                }, function(err, movie) {
                    if (err) {
                        console.log(err);
                    }
                    if (movie) {
                        _myCrawl(movie.url, movie._id)
                        cb(null, movie.url)
                    } else {
                        cb('cannot set state true')
                    }
                })
        },
        function(url, cb) {
            var movieObj = {
                state: true,
                // 下次爬取时间在6秒之后
                next_sync_time: Date.now() + 6 * 1000
            }
            Movie
                .findByUrl(url, function(err, movie) {
                    var _movie = _extend(movie, movieObj)
                    _movie.save(function(err) {
                        if (err) {
                            console.log(err);
                        }
                    })
                })
        }
    ], function(err, results) {
        console.log(results);
    })
}, sched)

