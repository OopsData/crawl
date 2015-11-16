var Iqiyi = require('../app/controllers/iqiyi')

module.exports = function(app) {
    app.get('/crawl', Iqiyi.crawl)
}