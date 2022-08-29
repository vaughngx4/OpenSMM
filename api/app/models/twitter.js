const mongoose =  require('mongoose');
const Schema = mongoose.Schema;

const twitterAccountSchema = new Schema({
    accountName: {
        type: String,
        required: true
    },
    accessToken: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        required: true
    },
    expiresIn: {
        type: String,
        required: true
    }
}, { timestamps: true });

const twitterPostSchema = new Schema({
    accountName: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: false
    },
    attachment: {
        type: String,
        required: false
    }
}, { timestamps: true });

module.exports = { twitterAccountSchema, twitterPostSchema };