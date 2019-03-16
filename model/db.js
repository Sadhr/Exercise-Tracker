const mongoose = require("mongoose");
const shortid = require("shortid");

const Schema = mongoose.Schema;

const userSchema = Schema({
  username: {
    type: String,
    required: true
  },
  _id:{
    type: String,
    default: shortid.generate
  }
});

const User = mongoose.model("User", userSchema);

const exerciseSchema = Schema({
  _id:{
    type: String,
    required: true
  },
  username: String,
  count:{
    type: Number,
    default: 0
  },
  log: []
})

const Exercise = mongoose.model("Exercise", exerciseSchema)

exports.createAndSaveUsers = (username, done) => {
  findUserByName(username, (err, data) => {
    if(err) return done(err);
    if(data){
      return done(null, false);
    }else{
      const user = new User({username: username, _id: shortid.generate()});
      user.save((err, user) => {
        if(err) return done(err);
        done(null, user)
      })
    }
  })
}

exports.createAndSaveExercise = (exercises, done) => {
  
  const informations = {
    description: exercises.description,
    duration: exercises.duration,
    date: exercises.date
  };

  findUserId(exercises.userId, (err, data) => {
    if(err) return done(err, null);
    if(data){
      Exercise.findOneAndUpdate({_id: data._id}, 
      {
        username: data.username,
        $push: {log: informations},
        $inc: {count: 1}
      },                          
      { upsert: true, new: true },
      (err, data) => {
        if(err) return done(err);
        done(null, data);
      }
      )
    }else{
      return done(null, null)
    }
  
  })
}

const findUserByName = (user, done) => {
  User.findOne({username: user}, (err, data) => {
    if(err) return done(err, null);
    if(data){
      return done(null, data)
    }else{
      return done(null, null)
    }
  })
}

exports.findExercise = (userId, done) => {
  Exercise.findOne({_id: userId}, (err, data) => {
            if(err) return done(err, null);
            done(null, data);
          });
    }

const findUserId = (userId, done) => {
  User.findOne({_id: userId}, (err, data) => {
    if(err) return done(err);
    done(null, data)
  })
}

exports.allUsers = (req, res) => {
  User.find((err, data) => {
    if(err) return console.log(err);
    res.json(data)
  })
}

