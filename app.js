var express = require('express')
var path = require('path')
var logger = require('morgan');
var mongoose = require('mongoose')
var dbUrl = 'mongodb://localhost/imooc-mej'
var port = process.env.PORT || 3001
var app = express()

mongoose.connect(dbUrl)

if ('development' === app.get('env')) {
    app.set('showStackError', true)
    app.use(logger('dev'));
    app.locals.pretty = true
    mongoose.set('debug', true)
}

require('./config/routes')(app)

app.listen(port)

console.log('crawl started on port ' + port);
