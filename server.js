const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const model = require('./model');
const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGOLAB_URI, {
  useNewUrlParser: true
});

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// API Endpoints
app.post('/api/exercise/new-user', (req, res, next) => {
  model.user.create(req.body.username, (err, user) => {
    if (err) {
      next(err);
    } else {
      res.json({
        "username": user.username,
        "_id": user.id
      });
    }
  });
});

app.get('/api/exercise/users', (req, res, next) => {
  model.user.list((err, users) => {
    if (err) {
      next(err);
    } else {
      res.json(users.map(u => ({
        "username": u.username,
        "_id": u.id
      })));
    }
  });
});

app.post('/api/exercise/add', (req, res, next) => {
  model.exercise.create(req.body.userId, req.body.description, req.body.duration, req.body.date, (err, exercise) => {
    if (err) {
      next(err);
    } else {
      res.json({
        "username": exercise.user.username,
        "_id": exercise.user.id,
        "description": exercise.description,
        "duration": exercise.duration,
        "date": exercise.date
      });
    }
  });
});

app.get('/api/exercise/log', (req, res, next) => {
  model.exercise.list(req.query.userId, req.query.from, req.query.to, req.query.limit, (err, user) => {
    if (err) {
      next(err);
    } else {
      res.json({
        "_id": user.id,
        "username": user.username,
        "count": user.exercises.length,
        "log": user.exercises.map(e => ({
          "description": e.description,
          "duration": e.duration,
          "date": e.date
        }))
      });
    }
  });
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'Not Found'});
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
