const Agenda = require('agenda')
const mongoose = require('mongoose');
const Users = mongoose.model('Users');

const moment = require('moment')


const mongoConnectionString = process.env.DB_URL;
const agenda = new Agenda({ db: { address: mongoConnectionString, collection: 'agendas' } });

agenda.define('any job', (job, done) => {

});


(async function () {
    // IIFE to give access to async/await
    
    // await agenda.start();

    // await agenda.every('60 minutes', 'any job');
})();
