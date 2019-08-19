const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { Schema } = mongoose;

const UsersSchema = new Schema({
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    email: { type: String, unique: true, required: true },
    role: { type: Schema.Types.ObjectId, ref: 'Roles', required: true },
    hash: { type: String },
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    salt: { type: String },
    createdDate: { type: Date, default: new Date() },
    expiryDate: { type: Date, default: new Date() },
    lastUpdatedDate: { type: Date, default: new Date() },
});

UsersSchema.methods.setPassword = function (password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UsersSchema.methods.validatePassword = function (password) {
    const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.hash === hash;
};

UsersSchema.methods.generateJWT = function () {
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 60);

    return jwt.sign({
        email: this.email,
        role: this.role,
        id: this._id,
        exp: parseInt(expirationDate.getTime() / 1000, 10),
    }, 'secret');
}

UsersSchema.methods.toAuthJSON = function () {
    let obj = {
        _id: this._id,
        email: this.email,
        firstName: this.firstName,
        lastName: this.lastName,
        emailVerified: this.emailVerified,
        token: this.token
    }
    return obj
};

mongoose.model('Users', UsersSchema);