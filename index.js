const express = require('express');
const routes = require('./routes');
const path = require('path');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
// extraer valores de variables.env
require('dotenv').config({path: 'variables.env'});

// helpers con algunas funciones
const helpers = require('./helpers');

// crear la conexion a la BD
const db = require('./config/db');

// importar el modelo
require('./models/Proyectos');
require('./models/Tareas');
require('./models/Usuarios');

db.sync()
    .then(() => console.log('Conectado al Servidor'))
    .catch(error => console.log(error));

// crear una app de express
const app = express();

// Donde cargar los archivos estáticos
app.use(express.static('public'));

// habilitar pug
app.set('view engine', 'pug');

// habilitar bodyParser para leer datos del formulario
app.use(express.urlencoded({extended: true}));

// Agregamos express validator a toda la aplicación
app.use(expressValidator());

// añadir la carpeta de las vistas
app.set('views', path.join(__dirname, './views'));

// agregar flash messages
app.use(flash());

// cookie parser
app.use(cookieParser());

// session nos permite navegar entre distintas páginas sin volvernos a autenticar
app.use(session({
    secret: 'supersecreto',
    resave: false,
    saveUninitialized: false // mantener la sesion activa aun en inactividad
}));

// iniciar passport
app.use(passport.initialize());
app.use(passport.session());

// pasar vardump a la aplicación
app.use((req, res, next) => {    
    res.locals.vardump = helpers.vardump;
    res.locals.mensajes = req.flash();
    res.locals.usuario = {...req.user} || null;    
    next();
});

app.use('/', routes());

// Servidor y Puerto
const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 3000;

app.listen(port, host, () => {
    console.log('El servidor está funcionando');
});