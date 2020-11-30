const passport = require('passport');
const Usuarios = require('../models/Usuarios');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const crypto = require('crypto');
const bcrypt = require('bcrypt-nodejs');
const enviarEmail = require('../handlers/email');

exports.autenticarUsuario = passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
    badRequestMessage: 'Ambos campos son Obligatorios'
});

// funcion para revisar si el usuario esta logeado o no
exports.usuarioAutenticado = (req, res, next) => {
    // Si el usuario esta autenticado, adelante
    if (req.isAuthenticated()) {
        return next();
    }
    // Si no está autenticado, redirigir al formulario
    return res.redirect('/iniciar-sesion');
};

// funcion para cerrar sesion
exports.cerrarSesion = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/iniciar-sesion'); // al cerrar sesión nos redirige a login
    });
};

// genera un token si el usuario es válido
exports.enviarToken = async (req, res, next) => {
    // verificar que el usuario existe
    const usuario = await Usuarios.findOne({where: {email: req.body.email}});
    
    // si no existe el usuario
    if (!usuario) {
        req.flash('error', 'No existe registro con el correo ingresado')
        res.redirect('/restablecer');
    }

    // el usuario existe
    usuario.token = crypto.randomBytes(20).toString('hex');
    usuario.expiracion = Date.now() + 3600000;
    
    // guardarlos en la base de datos
    await usuario.save();

    // url de reset
    const resetUrl = `http://${req.headers.host}/restablecer/${usuario.token}`;
    
    // enviar el correo con el token
    await enviarEmail.enviar({
        usuario,
        subject: 'Password Reset',
        resetUrl,
        archivo: 'restablecer-password'
    });

    // terminar
    req.flash('correcto', 'Se envió un mensaje a tu correo');
    res.redirect('/iniciar-sesion');
};

exports.validarToken = async (req, res, next) => {
    const usuario = await Usuarios.findOne({
        where: {
            token: req.params.token
        }
    });

    // si no encuentra el usuario
    if (!usuario) {
        req.flash('error', 'No válido');
        res.redirect('/restablecer');
    }
    
    // formulario para generar el formulario
    res.render('resetPassword', {
        nombrePagina: 'Restablecer Contraseña'
    });
};

// cambia el password por uno nuevo
exports.actualizarPassword = async (req, res) => {
    // verifica el token válido pero tambien la fecha de expiración
    const usuario = await Usuarios.findOne({
        where: {
            token: req.params.token,
            expiracion: {
                [Op.gte]: Date.now()
            }            
        }
    });

    // verificamos si el usuario existe
    if (!usuario) {
        req.flash('error', 'No válido');
        res.redirect('/restablecer');
    }

    // hashear el nuevo password
    usuario.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
    usuario.token = null;
    usuario.expiracion = null;

    // guardamos el nuevo password
    await usuario.save();
    
    req.flash('correcto', 'Tu password se ha modificado correctamente');
    res.redirect('/iniciar-sesion')
};