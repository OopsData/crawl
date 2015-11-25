var mongoose = require('mongoose')
var StatSchema = require('../schemas/stat')
var Stat = mongoose.model('Stat', StatSchema)

module.exports = Stat
