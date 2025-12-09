const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    title: { type: String, required: true},
    caption: { type: String, required: true},
    image: { type: String, required: false },
    creatorId: { type: String, required: true },
    tripId: { type: String, required: false },
    skipImage: { type: Boolean, required: false},
    value: { type: String, required: true},
    date: { type: String, required: false},
});


module.exports = mongoose.model('Post',postSchema);