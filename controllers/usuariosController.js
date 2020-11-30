const Usuarios = require('../models/Usuarios');
const enviarEmail = require('../handlers/email');

exports.formCrearCuenta = (req, res, next) => {
    res.render('crearCuenta', {
        nombrePagina: 'Crear Cuenta en UpTask'
    });
};

exports.formIniciarSesion = (req, res, next) => {
    const { error } = res.locals.mensajes;
    // console.log(error);
    res.render('iniciarSesion', {
        nombrePagina: 'IniciarSesión en UpTask',
        error
    });
};

exports.crearCuenta = async (req, res, next) => {
    // Leer los datos
    const { email, password } = req.body;
    try {
        // Crear el usuario
        await Usuarios.create({
            email,
            password
        });
        // crear una URL de confirmar
        const confirmarUrl = `http://${req.headers.host}/confirmar/${email}`;
        // crear el objeto de usuario
        const usuario = {
            email
        }
        // enviar email
        await enviarEmail.enviar({
            usuario,
            subject: 'Confirma tu cuenta UpTask',
            confirmarUrl,
            archivo: 'confirmar-cuenta'
        });
        // redirigir al usuario
        req.flash('correcto', 'Enviamos un correo, confirma tu cuenta');
        res.redirect('/iniciar-sesion');
    } catch (error) {
        // console.log(error.errors);
        req.flash('error', error.errors.map(error => error.message));
        res.render('crearCuenta', {
            mensajes: req.flash(),
            nombrePagina: 'Crear Cuenta en UpTask',
            email,
            password
        });
    }       
};

exports.formRestablecerPassword = (req, res, next) => {
    res.render('restablecer', {
        nombrePagina: 'Restablecer tu Contraseña'
    });
};

// cambia el estado de una cuenta
exports.confirmarCuenta = async (req, res) => {
    const usuario = await Usuarios.findOne({
        where: {
            email: req.params.correo
        }
    });
    // si no existe el usuario
    if (!usuario) {
        req.flash('error', 'No válido');
        res.redirect('/crear-cuenta');
    }

    usuario.activo = 1;
    await usuario.save();

    req.flash('correcto', 'Cuenta activada correctamente');
    res.redirect('/iniciar-sesion');
};