const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('custom-env');
const errorHandler = require('errorhandler');
const logger = require('./config/winston');
var started = new Date();
const i18n = require("i18n");
var fs = require('fs');
var https = require('https');
var http = require('http');


dotenv.env();
// dotenv.env('production');
// dotenv.env('staging');

i18n.configure({
    locales: ['en', 'zh-Hans', 'zh-Hant', 'ko', 'ja'],
    directory: __dirname + '/locales'
});

//Configure mongoose's promise to global promise
mongoose.promise = global.Promise;

//Configure isProduction variable
const isProduction = process.env.NODE_ENV === 'production';

//Initiate our app
const app = express();

//Configure our app
// app.use(cors(corsOptions));
app.use(function (req, res, next) {
    var origin = req.headers.origin;
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', "*");

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Cache-Control, Connection, Cookie,Authorization,token,Accept-Language');

    res.setHeader('credentials', 'include')
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
})

app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

if (!isProduction) {
    app.use(errorHandler());
}

//Configure Mongoose
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true });
mongoose.set('debug', false);


app.use(i18n.init);

//Models & routes
require('./models/Users');
require('./models/Roles');

//On first Server Call
require('./config/_init')

require('./config/passport');
app.use(require('./routes'));

require('./config/agenda')

app.use(function (err, req, res, next) {
    if (err) {
        logger.error(err)
        res.status(err.status || 500);
        res.json({
            errors: {
                code: 'session_expired',
                message: err.message,
                error: {},
            },
        });
    } else {
        next();
    };
})

app.get('/', function (req, res, next) {
    res.send({
        started: res.__("Started at : ") + started,
        uptime: (Date.now() - Number(started)) / 1000,
    });
});

if (!isProduction) {
    http.createServer(app).listen(process.env.PORT);
    logger.info('Server running on http://localhost:' + process.env.PORT);
} else {
    // This line is from the Node.js HTTPS documentation.
    // var options = {
    //     cert: fs.readFileSync('/root/certs/datta.com/datta.crt'),
    //     key: fs.readFileSync('/root/certs/datta.com/datta.key')
    // };
    https.createServer(options, app).listen(process.env.PORT);
    logger.info('Server running on https://localhost:' + process.env.PORT);
}