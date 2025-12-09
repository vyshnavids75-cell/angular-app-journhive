const mongoose = require('mongoose');

const tripSchema = mongoose.Schema({
    destination: { type: String, required: true},
    startDate: { type: String, required: true},
    endDate: { type: String, required: true},
    coverPhoto: { type: String, required: false},
    skipImage: { type: Boolean, required: false},
    creatorId: { type: String, required: true}
});

module.exports = mongoose.model('Trip',tripSchema);

