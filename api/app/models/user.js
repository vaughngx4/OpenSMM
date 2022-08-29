const mongoose =  require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    tokens: {
        type: Array,
        required: false
    },
    privelages: {
        type: Array,
        required: false
    }
}, { timestamps: true });


module.exports = { userSchema };