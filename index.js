const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const mongoose = require('mongoose');
const url = process.env.MONGO_URI;

mongoose.set('strictQuery', false);

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado'))
  .catch((err) => console.log('No conectado'));

//CREANDO COLECCIONES 

const userShema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }
},
  {
    autoIndex: false
  });

const exerciseShema = new mongoose.Schema({
  userid: { type: String, require: true },
  description: { type: String, require: true },
  duration: { type: Number, require: true },
  date: { type: Number, require: true },
}, { autoIndex: false })

const User = mongoose.model("user", userShema);
const Exercise = mongoose.model("exercise", exerciseShema);



app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


//GET /api/users
app.get('/api/users', async (req, res) => {

  User.find()
    .then(elems => {
      res.send(elems)
    })
    .catch(err => { res.send({ msg: 'error al leer users' }) })
});

// POST  /api/users
app.post('/api/users', async (req, res) => {
  const username = req.body.username;
  User.create({ username })
    .then((elem) => {
      res.json({
        username: elem.username,
        _id: elem._id
      })
    })
    .catch((err) => {
      res.json({ msg: 'Error al crear user' })
    })
});



// POST exercises
// /api/users/:_id/exercises
app.post('/api/users/:_id/exercises', (req, res) => {
  let { date } = req.body;
  const { description, duration } = req.body;
  const _id = req.params['_id'];

  if (date) date = new Date(date); else date = new Date()

  User.findById(_id)
    .then((elem) => {

      Exercise.create({
        userid: _id,
        description,
        duration: parseInt(duration),
        date,
      })
        .then(( grab) => {
          res.send({
            username: elem.username,
            description,
            duration: grab.duration,
            date: date.toDateString(),
            _id
          });
        })
        .catch((err) => {
          res.send({ err: 'Error al crear el exercise' })
        })


    })
    .catch((err) => {
      res.send({ err: 'Usuario con ese id no existe' })
    })


})




// GET logs
app.get('/api/users/:_id/logs', async (req, res) => {
  const  _id  = req.params._id; 
  const { from, to, limit } = req.query;
  let name='';
  console.log('to', new Date(to ? to : 0));
  Exercise.find({ userid : _id, date: {  $gt: new Date(from ? from : 0) , $lt: new Date(to ? to : "2080-1-1")}})
    .limit(limit)
    .then(elems => {


      User.findById(_id).then( i => { 
        res.send( {
          username: i.username,
          count: elems.length,
          log: elems.map( e => {
            return {
              description: e.description,
              duration: e.duration,
              date: new Date(e.date).toDateString()
            }
          })

        });
        
      })
      .catch( (err) => {
        res.send({ msg: 'el id no existe' })
      });


    })
    .catch(err => { res.send({ msg: 'error al leer logs' }) })

  // res.send({
  //   _id
  // })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

