const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true } )

const userExerciseSave = require("./model/db");

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Not found middleware
//app.use((req, res, next) => {
  //return next({status: 404, message: 'not found'})
//})

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


app.post("/api/exercise/new-user", (req, res) => {
  const username = req.body.username;
  if(username !== ""){
    userExerciseSave.createAndSaveUsers(username, (err, user) => {
      if(err) return console.log(err);
      if(!user){
        return res.send("<pre>username already taken</pre>");
      }else{
        res.json({username: user.username, _id: user._id});
      }
    })
  }else{
    res.send("<pre>Path `username` is required.</pre>")
  }
});

app.get("/api/exercise/users", (req, res) => {
  userExerciseSave.allUsers(req, res)
})

app.post("/api/exercise/add", (req, res) => {
  const elements = req.body;
  let date = null
  if(elements.date === ""){
    date = new Date().toDateString();
  }else{
    date = new Date(elements.date).toDateString();
    if(date === "Invalid Date") return res.send(`<pre>Cast to Date failed for value '${elements.date.length}' at path 'date'</pre>`);
  }
  elements.date = date;
  
  if(!elements.description){
    res.send("<pre>Path `description` is required.</pre>")
  }else if(!elements.duration){
    res.send("<pre>Path `duration` is required.</pre>")
  }else {
    userExerciseSave.createAndSaveExercise(elements, (err, data) => {
      const lastExercise= data.log[data.log.length - 1];
      if(!data) return res.send("<pre>unkown _id</pre>");
      res.json({
        username: data.username,
        description: lastExercise.description,
        duration: lastExercise.duration,
        _id: data._id,
        date: lastExercise.date
      })
    });
  }
})

app.get("/api/exercise/log?", (req, res) => {
    const query = req.query;
    userExerciseSave.findExercise(query.userId, (err, data) => {
      let fromToDate = [];
      let from, to = null;
      let dateToCheck = null;
      let log = data.log;
      
      if(!data) return res.send("<pre>unknown userId</pre>");
      
      // Select Date between two dates
      if(query.from && query.to){
        from = new Date(query.from).getTime();
        to = new Date(query.to).getTime();
        
        for(let i =0; i < log.length; i++){
          dateToCheck = new Date(log[i]["date"])
          
          if(dateToCheck.getTime() < to && dateToCheck.getTime() > from){
            fromToDate.push(log[i]);
          }else{
            fromToDate = [];
          }
        }
      }
      
      // limit to get
      if(query.limit){
        if(parseInt(query.limit, 10) === 0){
          fromToDate = fromToDate;
          log = log;
        }else{
          fromToDate = fromToDate.slice(0, parseInt(query.limit, 10));
          log = log.slice(0, parseInt(query.limit, 10));
        }
      }

      if(dateToCheck){
        res.json({
          _id: data._id,
          username: data.username,
          from: new Date(from).toDateString(),
          to: new Date(to).toDateString(),
          count:  fromToDate.length,
          log: fromToDate
        });
      }else{
          res.json({
          _id: data._id,
          username: data.username,
          count: data.count,
          log: log 
        })
      }
    
    })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
