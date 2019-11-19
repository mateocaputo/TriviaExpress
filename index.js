const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const bcrypt = require('bcrypt');
const session  = require('express-session');
const app = express();
const port = process.env.PORT        || 3000;
const db   = process.env.MONGODB_URI || 'mongodb://localhost/trivia';

mongoose.set('useFindAndModify', false);
mongoose
  .connect(db, { useNewUrlParser: true })
  .then(() => {
    console.log(`Base de datos conectada!!! @ ${db}`);
  })
.catch(err => console.error(`Connection error ${err}`));



//schema y modelo de usuario
const UserSchema = new mongoose.Schema({
  username: String,
  password: String
});
const User = mongoose.model('User', UserSchema);

// config de passport
// passport config
const LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy((username, password, done) => {
  User.findOne({ username: username }, (err, user) => {
    if (err) return done(err);
    if (!user) return done(null, false);
    bcrypt.compare(password, user.password, (err, res) => {
      if (err) throw err;
      if (!res) return done(null, false);
      else return done(null, user);
    });
  });
}));
passport.serializeUser((user, done) => {
  done(null, user._id);
});
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    if (err) return done(err);
    done(null, user);
  });
});



// middleware
app.use(session({
  secret: 'app secret',
  resave: false,
  saveUninitialized: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(passport.initialize());
app.use(passport.session());

app.post('/register', (req, res) =>{
  const nuevoUsuario = new User({
    username: req.body.username,
    password: req.body.password
  }); 
  // hashear password
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(nuevoUsuario.password, salt, (err, hash) => {
      if (err) throw err;
      nuevoUsuario.password = hash;
      nuevoUsuario.save(err => {
        if (err) return next(err);
        res.redirect('/');
      });
    });
  });   
});

// ruta para logearse
app.post('/signin',
  passport.authenticate('local', { failureRedirect:
  '/' }),
  (req, res, next) => {
    res.render('index2', { user: req.user });
});

// voy a crear modelos para mis colecciones
app.set('view engine', 'pug');
app.set('views', './views');

app.get('/', (req, res) => {
  //res.send('HOLA BIENVENIDO A MI PAGINA WEB TOCA AQUI PARA CONTINUAR!!');
  //console.log(req.user);
  res.render('index', { user: req.user });
});
app.post('/question', (req, res, next) => {
 res.render('index');
});


app.listen(3000, function () {
  console.log('El ejemplo de la app esta escuchando en puerto 3000! Muy bien!');
});
