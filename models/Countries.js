const mongoose = require('mongoose');
const { Schema } = mongoose;

const CountriesSchema = new Schema({
    name: String,
    code: String,
    currency_code: String,
    flag_url: String
});
mongoose.model('Countries', CountriesSchema);