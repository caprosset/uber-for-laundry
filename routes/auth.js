const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');
const saltRound = 10;

const User = require('../models/user');


// GET /signup ==> renderiza el formulario de registro de usuario
router.get('/signup', (req, res, next) => {
  res.render('auth/signup', { errorMessage: '' });
})

/*
// POST /signup ===> recoge la informacion del usuario y lo crea en la base de datos
// con PROMISES
authRouter.post('/signup', (req, res, next) => {
  console.log('req.body', req.body);

  const { name, email, password } = req.body;

  // si el campo del email o de la contraseña están en blanco, mostrar mensaje de error
  if(email === "" || password === "") {
    res.render('auth/signup', { errorMessage: "Enter both email and password "});
    return;
  }

  // sino, comprobar en la BD si un usuario con este email no existe aún
  User.findOne({ email })
  .then( (foundUser) => {
   // si el usuario ya existe, mostrar mensaje de error
    if(foundUser) {
      res.render('auth/signup', { errorMessage: `There's already an account with the email ${email}`});
      return;
    }

    // si todo sale bien, encriptar contraseña
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Guardar el usuario en la BDD
    // const newUser = { name, email, password: hashedPassword };

    User.create({ name, email, password: hashedPassword })
    .then( () => {
      res.redirect('/login');
    })
    .catch( (err) => {
      res.render('auth/signup', { errorMessage: "Error while creating account. Please try again."})
    });
  })
  .catch( (err) => console.log(err));
})
*/

// POST /signup ==> recoge la informacion del usuario y lo crea en la base de datos
// con ASYNC/AWAIT
router.post('/signup', async (req, res, next) => {
  const { name, email, password } = req.body;
  
  // si el campo del email o de la contraseña están en blanco, mostrar mensaje de error
  if(email === '' || password === '') {
    res.render('auth/signup', { errorMessage: 'Enter both email and password to sign up.' });
    return;
  }

  try {
    // sino, comprobar en la BD si un usuario con este email no existe aún
    const existingUser = await User.findOne({ email });
    
    // si el usuario ya existe, mostrar mensaje de error
    if(existingUser !== null) {
      res.render('auth/signup', { errorMessage: `The email ${email} is already in use.`});
      return;
    }

    // si todo sale bien, encriptar contraseña
    const salt = bcrypt.genSaltSync(saltRound);
    const hashedPass = bcrypt.hashSync(password, salt);

    // crear una nueva instancia del model User, con la contraseña encriptada
    const newUser = {
      name,
      email, 
      password: hashedPass
    }
    const userToCreate = new User(newUser); 

    // ... y guardarla en la BD con el metodo save() de mongoose
    const savedUser = await userToCreate.save();

    // si todo sale según lo planeado, guardar la información del usuario en la sesión (loguearlo) y redirigir a la página de inicio
    // req.session.currentUser = savedUser; // solo funciona si esta configurado el session middleware 
    res.redirect('/');
  } 
  catch(err) {
    res.render('auth/signup', { errorMessage: 'Something went wrong. Try again later.' });
  }
});


// GET /login ==> renderiza el formulario de inicio de sesión
router.get('/login', (req, res, next) => {
  res.render('auth/login', { errorMessage: '' });
});

// POST /login ==> recibe los datos del usuario enviados desde el formulario e inicia sesión
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;

  // comprobar que los campos email y password no estan vacíos, mostrar mensaje de error
  if( email === '' || password === '' ) {
    res.render('auth/login', { errorMessage: 'Enter both email and password to log in.' });
    return;
  }

  try {
    // Comprobar en la BD que el usuario existe (buscandolo por su email)
    const foundUser = await User.findOne({email})

    // si no existe usuario con este email, mostrar mensaje de error
    if(!foundUser) {
      res.render('auth/login', { errorMessage: `There isn't an account with email ${email}.` });
      return;
    }

    // si existe, verificar la contraseña (usando el método compareSync()) y si no es correcta, mostrar mensaje de error
    if (!bcrypt.compareSync(password, foundUser.password)) {
      res.render('auth/login', { errorMessage: 'Invalid password.' });
      return;
    }

    // si todo funciona, guardar la información del usuario en la sesión (req.session), y redirigir a la Home
    req.session.currentUser = foundUser;
    res.redirect('/');
  } 
  catch (error) {
    next(error);
  }
})


// GET /logout 
router.get('/logout', (req, res, next) => {
  // si el usuario no esta logueado, redirigir a la home
  if (!req.session.currentUser) {
    res.redirect('/');
    return;
  }

  // si esta logueado, cerrar (borrar) la sesion y redireccionar a la página de inicio
  req.session.destroy((err) => {
    if (err) {
      next(err);
      return;
    }

    res.redirect('/');
  });
});


module.exports = router;

