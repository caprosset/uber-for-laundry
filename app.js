require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
// const cookieParser = require('cookie-parser');
const logger = require('morgan');

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
const authRouter = require('./routes/auth');
const laundryRouter = require('./routes/laundry'); 

const app = express();


// Configuración del view engine (handlebas)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Otros middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));


// Middleware de configuración de la sesión
app.use(session({
  secret: 'never do your own laundry again',
  resave: true, 
  saveUninitialized: true, 
  cookie: { maxAge: 60000 }, // tiempo de expiración de la cookie
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    ttl: 24 * 60 * 60 // "time to live": 1 day
  })
}));


// Locals con la información de la sesión
app.use((req, res, next) => {
  if (req.session.currentUser) {
    res.locals.currentUserInfo = req.session.currentUser; // contiene la información del usuario de la sesión (solo disponible si ha iniciado sesión)
    res.locals.isUserLoggedIn = true; // indica  que hay un usuario conectado
  } else {
    res.locals.isUserLoggedIn = false; // indica que no hay ningún usuario conectado
  }

  next();
});


// Rutas
app.use('/', indexRouter); 
app.use('/', authRouter);
app.use('/', laundryRouter); 


// atrapa el error 404 y lo transfiere al middleware de manejo de errores
app.use(function(req, res, next) {
  next(createError(404));
});

// manejo de errores
app.use(function(err, req, res, next) {
  // setea las locales, provee error solo en entorno de desarrollo
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // renderiza la página de error
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
