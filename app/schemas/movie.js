var mongoose = require('mongoose')

var MovieSchema = new mongoose.Schema({
    url: String,
    subtitle: String,
    playCount: Number,
    duration: Number,
    upCount: Number,
    downCount: Number,
    commentCount: Number,
    shareCount: Number,
    score: Number,
    meta: {
        createAt: {
            type: Date,
            default: Date.now()
        },
        updateAt: {
            type: Date,
            default: Date.now()
        }
    }
})

MovieSchema.pre('save', function(next) {
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = Date.now()
    } else {
        this.meta.updateAt = Date.now()
    }

    next()
})

MovieSchema.statics = {
    fetch: function(cb) {
        return this
            .find({})
            .sort('meta.updateAt')
            .exec(cb)
    },
    findById: function(id, cb) {
        return this
            .findOne({_id: id})
            .exec(cb)
    },
    findByUrl: function(url, cb) {
        return this
            .find({url: url})
            // .sort('meta.updateAt')
            .exec(cb)
    }
}

module.exports = MovieSchema
