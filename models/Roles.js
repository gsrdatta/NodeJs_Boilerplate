const mongoose = require('mongoose');
const { Schema } = mongoose;

const RolesSchema = new Schema({
    roleName: String,
    roleCode: String,
    expiryDate: { type: Date, default: null },
    createdDate: { type: Date, default: new Date() },
    lastUpdatedDate: { type: Date, default: null }
});
mongoose.model('Roles', RolesSchema);