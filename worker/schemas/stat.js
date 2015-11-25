var mongoose = require('mongoose')
var Schema = mongoose.Schema
var ObjectId = Schema.Types.ObjectId

var StatSchema = new Schema({
    movie: {type: ObjectId, ref: 'Movie'},
    playCount: Number,
    upCount: Number,
    downCount: Number,
    commentCount: Number,
    shareCount: Number,
    score: Number,
    meta: {
        createAt: {
            type: Date,
            default: Date.now()
        }
    }
})

StatSchema.pre('save', function(next) {    
    this.meta.createAt = Date.now()
    next()
})

StatSchema.statics = {
    
}

module.exports = StatSchema
