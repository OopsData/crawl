var mongoose = require('mongoose')

var TrackableSchema = new mongoose.Schema({
    url: {
        unique: true,
        type: String
    },
    state: Boolean,
    next_sync_time: {
        default: 0,
        type: Number
    }
})

TrackableSchema.statics = {
    findByUrl: function(url, cb) {
        return this
            .findOne({url: url})
            .exec(cb)
    }
}

module.exports = TrackableSchema
