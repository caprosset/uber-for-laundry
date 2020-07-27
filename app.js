require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const bodyParser = require('body-parser');
const favicon = require('serve-favicon');
const hbs = require('hbs');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

// Conexión a la BD
mongoose
  .connect('mongodb://localhost/uber-for-loundry', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(x => {
    console.log(
      `Connected to Mongo! Database name: "${x.connections[0].name}"`
    );
  })
  .catch(err => {
    console.error('Error connecting to mongo', err);
  });

  const indexRouter = require('./routes/index');
  const usersRouter = require('./routes/users');
  const authRouter = require('./routes/auth');
const laundryRouter = require('./routes/laundry'); 

const app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Middleware Setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// Session middleware
app.use(session({
  secret: 'never do your own laundry again',
  resave: true, 
  saveUninitialized: true, 
  cookie: { maxAge: 60000 }, // tiempo de expiracion de la cookie
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    ttl: 24 * 60 * 60 // time to live: 1 day
  })
}));

app.use((req, res, next) => {
  if (req.session.currentUser) {
    res.locals.currentUserInfo = req.session.currentUser; // la información del usuario de la sesión (solo disponible si ha iniciado sesión)
    res.locals.isUserLoggedIn = true; // indica que hay un usuario conectado
  } else {
    res.locals.isUserLoggedIn = false; // indica que NO hay un usuario conectado
  }

  next();
});

// Routes
app.use('/', indexRouter); 
app.use('/users', usersRouter);
app.use('/', authRouter);
app.use('/', laundryRouter); 



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
