var mongoose = require('mongoose')

var TrackableSchema = new mongoose.Schema({
    url: String,
    state: Boolean
})

TrackableSchema.statics = {
    findByUrl: function(url, cb) {
        return this
            .findOne({url: url})
            .exec(cb)
    }
}

module.exports = TrackableSchema
