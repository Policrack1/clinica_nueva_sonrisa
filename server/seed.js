// server/seed.js — Generar usuarios con contraseñas hasheadas
// Ejecutar: node seed.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db     = require('./config/db');

const users = [
  { nombre: 'Carlos Mendoza',      email: 'admin@sonrisa.com',    pass: 'admin123',    id_rol: 1 },
  { nombre: 'Dra. María López',    email: 'maria@sonrisa.com',    pass: 'doctor123',   id_rol: 2 },
  { nombre: 'Dr. Roberto Sánchez', email: 'roberto@sonrisa.com',  pass: 'doctor123',   id_rol: 2 },
  { nombre: 'Juan Pérez',          email: 'juan@gmail.com',       pass: 'paciente123', id_rol: 3 },
  { nombre: 'Ana García',          email: 'ana@gmail.com',        pass: 'paciente123', id_rol: 3 },
  { nombre: 'Luis Torres',         email: 'luis@gmail.com',       pass: 'paciente123', id_rol: 3 },
  { nombre: 'Carmen Ruiz',         email: 'carmen@gmail.com',     pass: 'paciente123', id_rol: 3 },
  { nombre: 'Pedro Díaz',          email: 'pedro@gmail.com',      pass: 'paciente123', id_rol: 3 },
];

async function seed() {
  console.log('🌱 Iniciando seed de usuarios...\n');
  try {
    // Limpiar tabla usuarios (cuidado con FK)
    await db.execute('SET FOREIGN_KEY_CHECKS = 0');
    await db.execute('TRUNCATE TABLE notificaciones');
    await db.execute('TRUNCATE TABLE asistencia');
    await db.execute('TRUNCATE TABLE historial_clinico');
    await db.execute('TRUNCATE TABLE citas');
    await db.execute('TRUNCATE TABLE pacientes');
    await db.execute('TRUNCATE TABLE odontologos');
    await db.execute('TRUNCATE TABLE usuarios');
    await db.execute('SET FOREIGN_KEY_CHECKS = 1');

    for (const u of users) {
      const hash = await bcrypt.hash(u.pass, 10);
      const [res] = await db.execute(
        'INSERT INTO usuarios (id_rol, nombre, email, password_hash) VALUES (?,?,?,?)',
        [u.id_rol, u.nombre, u.email, hash]
      );
      console.log(`✅ ${u.nombre} (${u.email}) — ID: ${res.insertId}`);
    }

    // Insertar datos relacionados
    console.log('\n📋 Insertando odontólogos...');
    await db.execute('INSERT INTO odontologos (id_usuario, id_especialidad, num_colegiatura, anios_experiencia, telefono) VALUES (2,1,"COP-12345",8,"987-111-222")');
    await db.execute('INSERT INTO odontologos (id_usuario, id_especialidad, num_colegiatura, anios_experiencia, telefono) VALUES (3,2,"COP-67890",12,"987-333-444")');

    console.log('👥 Insertando pacientes...');
    const pacs = [
      [4, '45612378', '987-654-321', '1990-03-15', 'M', 'O+',  'Ninguna',    'Av. Los Álamos 234, Lima'],
      [5, '71234567', '976-543-210', '1985-07-22', 'F', 'A+',  'Penicilina', 'Jr. Pachacútec 56, Lima'],
      [6, '60987654', '965-432-109', '1978-11-08', 'M', 'B-',  'Ninguna',    'Av. Brasil 890, Callao'],
      [7, '52345678', '954-321-098', '1995-04-30', 'F', 'AB+', 'Ibuprofeno', 'Calle Los Pinos 12, Lima'],
      [8, '48765432', '943-210-987', '1988-09-12', 'M', 'O-',  'Ninguna',    'Av. Universitaria 450, Lima'],
    ];
    for (const p of pacs) {
      await db.execute(
        'INSERT INTO pacientes (id_usuario,dni,telefono,fecha_nacimiento,genero,grupo_sanguineo,alergias,direccion) VALUES (?,?,?,?,?,?,?,?)',
        p
      );
    }

    console.log('📅 Insertando citas de ejemplo...');
    const citas = [
      [1,1,1,'2026-04-18','09:00','confirmada',''],
      [2,2,2,'2026-04-18','10:00','programada','Traer radiografías previas'],
      [3,1,3,'2026-04-18','11:30','en_curso',''],
      [4,2,4,'2026-04-18','14:00','programada','Primera visita'],
      [5,1,5,'2026-04-19','09:30','programada',''],
      [2,1,1,'2026-04-17','10:00','completada',''],
      [3,2,6,'2026-04-17','15:00','completada',''],
      [1,1,8,'2026-04-16','11:00','cancelada','Canceló por enfermedad'],
      [1,1,2,'2026-04-22','10:00','programada',''],
      [1,1,1,'2026-04-14','09:00','completada',''],
    ];
    for (const c of citas) {
      await db.execute(
        'INSERT INTO citas (id_paciente,id_odontologo,id_tratamiento,fecha_cita,hora_cita,estado,notas) VALUES (?,?,?,?,?,?,?)',
        c
      );
    }

    console.log('🏥 Insertando historial clínico...');
    await db.execute(`INSERT INTO historial_clinico (id_cita,id_paciente,diagnostico,trat_realizado,medicamentos,proxima_revision) VALUES
      (1,1,'Limpieza profunda. Sin caries. Buena higiene.','Profilaxis completa','Ninguno','2026-10-18'),
      (6,2,'Ajuste de brackets. Buena adherencia.','Control ortodoncia','Ninguno','2026-05-17'),
      (7,3,'Corona pieza 16. Sin complicaciones.','Corona dental pieza 16','Ibuprofeno 400mg c/8h 3 días','2026-07-17'),
      (10,1,'Caries incipiente molar inferior. Se recomienda sellante.','Evaluación','Ninguno','2026-07-14')`
    );

    console.log('✅ Insertando asistencia...');
    await db.execute(`INSERT INTO asistencia (id_cita,estado) VALUES (1,'asistio'),(6,'asistio'),(7,'asistio'),(8,'cancelado'),(10,'asistio')`);

    console.log('🔔 Insertando notificaciones...');
    await db.execute(`INSERT INTO notificaciones (id_usuario,titulo,mensaje,tipo,leida) VALUES
      (4,'Cita confirmada','Su cita del 18 Abr a las 09:00 fue confirmada.','cita',false),
      (5,'Recordatorio','Tiene cita mañana a las 10:00 con Dr. Sánchez.','recordatorio',false),
      (1,'Cita cancelada','Juan Pérez canceló su cita del 16 Abr.','cancelacion',true),
      (1,'Nuevo paciente','Carmen Ruiz registrada como nueva paciente.','sistema',true),
      (2,'Cita confirmada','Juan Pérez confirmó cita para el 18 Abr 09:00.','cita',false),
      (3,'Cita programada','Nueva cita: Ana García el 20 Abr a las 08:00.','cita',false)`
    );

    console.log('\n🎉 Seed completado exitosamente!');
    console.log('\n📋 Usuarios creados:');
    console.log('  admin@sonrisa.com    → admin123    (Administrador)');
    console.log('  maria@sonrisa.com    → doctor123   (Odontólogo)');
    console.log('  roberto@sonrisa.com  → doctor123   (Odontólogo)');
    console.log('  juan@gmail.com       → paciente123 (Paciente)');
    console.log('  ana@gmail.com        → paciente123 (Paciente)');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error en seed:', err.message);
    process.exit(1);
  }
}

seed();