const express = require('express');
const router = express.Router();

const User = require('../models/user');
const LaundryPickup = require('../models/laundry-pickup');

// Middleware 
router.use((req, res, next) => {
  // si hay un usuario en la sesión (logueado), continúa con las rutas llamando a next() 
  if (req.session.currentUser) {
    next();
    return;
  }

  // si no hay ningún usuario en la sesión (anónimo), redirige a la página log in.
  res.redirect('/login');
});


// GET /dashboard ==> renderiza un formulario para convertirse en launderer
router.get('/dashboard', async (req, res, next) => {  
  let query;

  // Si el usuario es un lavador de ropa, buscar recogidas pendientes
  if (req.session.currentUser.isLaunderer) {
    query = { launderer: req.session.currentUser._id };
  } 
  // De lo contrario, mostrar las recogidas de ropa que pidió
  else {
    query = { user: req.session.currentUser._id };
  }

  try {
    const pickupDocs = await LaundryPickup
      .find(query)
      .populate('user', 'name')
      .populate('launderer', 'name')
      .sort('pickupDate')
    
      // renderiza la plantilla views/laundry/dashboard.hbs y pasar los resultados de la consulta (pickupDocs) como la variable local pickups
      res.render('laundry/dashboard', { pickups: pickupDocs });
  } catch (error) {
    next(error);
  }
});


// POST /launderers ==> envia la informacion del formulario y actualiza las propiedades del usuario en la DB
router.post('/launderers', async (req, res, next) => {
  // Obtener el _id del usuario de la sesión
  const userId = req.session.currentUser._id;

  const laundererInfo = { 
    fee: req.body.fee,
    isLaunderer: true 
  };

  try {
    // Llamar al método findByIdAndUpdate() de Mongoose para realizar las actualizaciones
    // La opción { new: true } permite obtener la información actualizada del usuario 
    const updatedUser = await User.findByIdAndUpdate(userId, laundererInfo, { new: true }); 

    // si la actualización sale como planeado, guardar la información del usuario en la sesión y redireccionar al dashboard
    req.session.currentUser = updatedUser;
    res.redirect('/dashboard');
  }
  catch(error) {
    next(error);
  }
});


// GET /launderers ==> renderiza la lista de launderers
router.get('/launderers', async (req, res, next) => { 
  try {
    // consultar usuarios cuya propiedad isLaunderer es verdadera
    const launderersList = await User.find(
    { 
      $and: [
        { isLaunderer: true },
        { _id: { $ne: req.session.currentUser._id } } // para ver a todos los lavanderos excepto nosotros mismos
      ]
    });

    // renderizar la plantilla views/laundry/launderers.hbs y pasar los resultados de la consulta (launderersList) como la variable local launderers
    res.render('laundry/launderers', { launderers: launderersList });
  } 
  catch (error) {
    next(error);
  }
})

router.get('/launderers/:id', async (req, res, next) => {
  // obtener el id de los parámetros de la ruta
  const laundererId = req.params.id;

  try {
    // llamar al método findById() de Mongoose para recuperar los detalles del lavador
    const launderer = await User.findById(laundererId);

    // renderiza la plantilla views/laundry/launderer-profile.hbs y pasar la información del perfil del lavandero (launderer) como la variable local theLaunderer.
    res.render('laundry/launderer-profile', { theLaunderer: launderer });
  } 
  catch (error) {
    next(error);
  }
});


// POST /laundry-pickups ==> 
router.post('/laundry-pickups', async (req, res, next) => {

  // las propiedades pickupDate y laundererId provienen del formulario
  const { pickupDate, laundererId } = req.body;
  
  const pickupInfo = {
    pickupDate,
    launderer: laundererId,
    user: req.session.currentUser._id
  };

  try {
    // crear una instancia del modelo LaundryPickup con las propiedades correctas.
    const thePickup = new LaundryPickup(pickupInfo);

    // guardar la recogida en la BD
    await thePickup.save(); 
    
    // si todo sale según lo planeado, redirige nuevamente al dashboard
    res.redirect('/dashboard');
  } 
  catch (error) {
    next(error);
  }
});



module.exports = router;