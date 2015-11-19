var mongoose = require('mongoose')
var TrackableSchema = require('../schemas/trackable')
var Trackable = mongoose.model('Trackable', TrackableSchema)

module.exports = Trackable