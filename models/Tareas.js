const Sequelize = require('sequelize');
const db = require('../config/db');
const Proyectos = require('./Proyectos');

const Tareas = db.define('tareas', {
    id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true
    },
    tarea: Sequelize.STRING(100),
    estado: Sequelize.INTEGER(1)
});

Tareas.belongsTo(Proyectos); // Cada proyecto pertenece a una tarea (1-1)
// Proyectos.hasMany(Tareas); // Un proyecto puede tener una o más tareas (1-N)

module.exports = Tareas;