import express, { Request, Response } from 'express';
import { Pool } from 'pg';

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres', // cambiar
    password: '123456', // cambiar
    port: 5432,
});

app.get('/', (req: Request, res: Response) => {
    res.send(`
    <h1>Panel Hospital - ABM</h1>
    <ul>
      <li><a href="/paciente">Pacientes</a></li>
      <li><a href="/medico">Médicos</a></li>
      <li><a href="/sector">Sectores</a></li>
      <li><a href="/habitacion">Habitaciones</a></li>
      <li><a href="/cama">Camas</a></li>
      <li><a href="/especialidad">Especialidades</a></li>
      <li><a href="/especializado_en">Médico x Especialidad</a></li>
      <li><a href="/guardia">Guardias</a></li>
      <li><a href="/asignacion_guardia">Asignación de guardias</a></li>
      <li><a href="/periodo_vacaciones">Períodos de vacaciones</a></li>
      <li><a href="/tiene">Asignar vacaciones a médicos</a></li>
      <li><a href="/internacion">Internaciones</a></li>
      <li><a href="/ronda">Rondas</a></li>
      <li><a href="/incluye">Habitaciones por ronda</a></li>
      <li><a href="/recorrido">Recorridos</a></li>
      <li><a href="/comentario_recorrido">Comentarios de recorrido</a></li>
    </ul>
  `);
});

//PACIENTE

app.get('/paciente', async (_req, res) => {
    try {
        const result = await pool.query(
            'SELECT dni, nombre, apellido, fecha_nac, sexo FROM paciente ORDER BY apellido, nombre'
        );
        const filas = result.rows.map((p:any) => `
      <tr>
        <td>${p.dni}</td>
        <td>${p.apellido}</td>
        <td>${p.nombre}</td>
        <td>${p.fecha_nac}</td>
        <td>${p.sexo}</td>
        <td>
          <a href="/paciente/editar/${p.dni}">Editar</a>
          |
          <form method="POST" action="/paciente/borrar/${p.dni}" style="display:inline">
            <button type="submit" onclick="return confirm('¿Borrar paciente?')">Borrar</button>
          </form>
        </td>
      </tr>
    `).join('');

        res.send(`
      <h1>Pacientes</h1>
      <a href="/paciente/nuevo">➕ Nuevo paciente</a> | <a href="/">Inicio</a><br><br>
      <table border="1" cellpadding="5">
        <tr>
          <th>DNI</th><th>Apellido</th><th>Nombre</th><th>Fecha nac.</th><th>Sexo</th><th>Acciones</th>
        </tr>
        ${filas || '<tr><td colspan="6">Sin pacientes.</td></tr>'}
      </table>
    `);
    } catch (err: any) {
        res.status(500).send(`<pre>${err.message}</pre>`);
    }
});

app.get('/paciente/nuevo', (_req, res) => {
    res.send(`
    <h1>Nuevo paciente</h1>
    <form method="POST" action="/paciente/nuevo">
      DNI: <input type="number" name="dni" required><br><br>
      Nombre: <input type="text" name="nombre" required><br><br>
      Apellido: <input type="text" name="apellido" required><br><br>
      Fecha de nacimiento: <input type="date" name="fecha_nac" required><br><br>
      Sexo:
      <select name="sexo" required>
        <option value="MASCULINO">MASCULINO</option>
        <option value="FEMENINO">FEMENINO</option>
      </select><br><br>
      <button type="submit">Guardar</button>
    </form>
    <br><a href="/paciente">Volver</a>
  `);
});
//AGREGAR PACIENTE
app.post('/paciente/nuevo', async (req, res) => {
    const { dni, nombre, apellido, fecha_nac, sexo } = req.body;
    try {
        await pool.query(
            `INSERT INTO paciente(dni,nombre,apellido,fecha_nac,sexo)
       VALUES ($1,$2,$3,$4,$5)`,
            [Number(dni), nombre, apellido, fecha_nac, sexo]
        );
        res.redirect('/paciente');
    } catch (err: any) {
        res.status(400).send(`<h1>Error</h1><pre>${err.message}</pre><a href="/paciente/nuevo">Volver</a>`);
    }
});
//SELECCIONAR PACIENTE
app.get('/paciente/editar/:dni', async (req, res) => {
    const dni = Number(req.params.dni);
    try {
        const result = await pool.query(
            'SELECT dni,nombre,apellido,fecha_nac,sexo FROM paciente WHERE dni=$1',
            [dni]
        );
        if (result.rowCount === 0) return res.send('Paciente no encontrado');

        const p = result.rows[0];
        const fecha = (p.fecha_nac instanceof Date)
            ? p.fecha_nac.toISOString().slice(0, 10)
            : p.fecha_nac;

        res.send(`
      <h1>Editar paciente ${p.dni}</h1>
      <form method="POST" action="/paciente/editar/${p.dni}">
        DNI: <input type="number" value="${p.dni}" disabled><br><br>
        Nombre: <input type="text" name="nombre" value="${p.nombre}" required><br><br>
        Apellido: <input type="text" name="apellido" value="${p.apellido}" required><br><br>
        Fecha de nacimiento: <input type="date" name="fecha_nac" value="${fecha}" required><br><br>
        Sexo:
        <select name="sexo" required>
          <option value="MASCULINO" ${p.sexo === 'MASCULINO' ? 'selected' : ''}>MASCULINO</option>
          <option value="FEMENINO" ${p.sexo === 'FEMENINO' ? 'selected' : ''}>FEMENINO</option>
        </select><br><br>
        <button type="submit">Guardar cambios</button>
      </form>
      <br><a href="/paciente">Volver</a>
    `);
    } catch (err: any) {
        res.status(500).send(`<pre>${err.message}</pre>`);
    }
});
//EDITAR PACIENTE
app.post('/paciente/editar/:dni', async (req, res) => {
    const dni = Number(req.params.dni);
    const { nombre, apellido, fecha_nac, sexo } = req.body;
    try {
        await pool.query(
            `UPDATE paciente
       SET nombre=$1, apellido=$2, fecha_nac=$3, sexo=$4
       WHERE dni=$5`,
            [nombre, apellido, fecha_nac, sexo, dni]
        );
        res.redirect('/paciente');
    } catch (err: any) {
        res.status(400).send(`<h1>Error</h1><pre>${err.message}</pre><a href="/paciente">Volver</a>`);
    }
});
//BORRAR PACIENTE
app.post('/paciente/borrar/:dni', async (req, res) => {
    const dni = Number(req.params.dni);
    try {
        await pool.query('DELETE FROM paciente WHERE dni=$1', [dni]);
        res.redirect('/paciente');
    } catch (err: any) {
        res.status(400).send(`<h1>Error</h1><pre>${err.message}</pre><a href="/paciente">Volver</a>`);
    }
});

//MEDICO
app.get('/medico', async (_req, res) => {
    try {
        const result = await pool.query(
            'SELECT matricula,dni,nombre,apellido,cuil_cuit,fecha_ingreso FROM medico ORDER BY apellido,nombre'
        );
        const filas = result.rows.map((m:any) => `
      <tr>
        <td>${m.matricula}</td>
        <td>${m.dni}</td>
        <td>${m.apellido}</td>
        <td>${m.nombre}</td>
        <td>${m.cuil_cuit}</td>
        <td>${m.fecha_ingreso}</td>
        <td>
          <a href="/medico/editar/${m.matricula}">Editar</a>
          |
          <form method="POST" action="/medico/borrar/${m.matricula}" style="display:inline">
            <button type="submit" onclick="return confirm('¿Borrar médico?')">Borrar</button>
          </form>
        </td>
      </tr>
    `).join('');

        res.send(`
      <h1>Médicos</h1>
      <a href="/medico/nuevo">➕ Nuevo médico</a> | <a href="/">Inicio</a><br><br>
      <table border="1" cellpadding="5">
        <tr>
          <th>Matrícula</th><th>DNI</th><th>Apellido</th><th>Nombre</th><th>CUIL/CUIT</th><th>Ingreso</th><th>Acciones</th>
        </tr>
        ${filas || '<tr><td colspan="7">Sin médicos.</td></tr>'}
      </table>
    `);
    } catch (err: any) {
        res.status(500).send(`<pre>${err.message}</pre>`);
    }
});

app.get('/medico/nuevo', (_req, res) => {
    res.send(`
    <h1>Nuevo médico</h1>
    <form method="POST" action="/medico/nuevo">
      Matrícula: <input type="number" name="matricula" required><br><br>
      DNI (debe existir en paciente): <input type="number" name="dni" required><br><br>
      Nombre: <input type="text" name="nombre" required><br><br>
      Apellido: <input type="text" name="apellido" required><br><br>
      CUIL/CUIT: <input type="number" name="cuil_cuit" required><br><br>
      Fecha ingreso: <input type="date" name="fecha_ingreso" required><br><br>
      <button type="submit">Guardar</button>
    </form>
    <br><a href="/medico">Volver</a>
  `);
});
//AGREGAR MEDICO
app.post('/medico/nuevo', async (req, res) => {
    const { matricula, dni, nombre, apellido, cuil_cuit, fecha_ingreso } = req.body;
    try {
        await pool.query(
            `INSERT INTO medico(matricula,dni,nombre,apellido,cuil_cuit,fecha_ingreso)
       VALUES ($1,$2,$3,$4,$5,$6)`,
            [Number(matricula), Number(dni), nombre, apellido, cuil_cuit, fecha_ingreso]
        );
        res.redirect('/medico');
    } catch (err: any) {
        res.status(400).send(`<h1>Error</h1><pre>${err.message}</pre><a href="/medico/nuevo">Volver</a>`);
    }
});

app.get('/medico/editar/:matricula', async (req, res) => {
    const matricula = Number(req.params.matricula);
    try {
        const result = await pool.query(
            'SELECT matricula,dni,nombre,apellido,cuil_cuit,fecha_ingreso FROM medico WHERE matricula=$1',
            [matricula]
        );
        if (result.rowCount === 0) return res.send('Médico no encontrado');

        const m = result.rows[0];
        const fecha = (m.fecha_ingreso instanceof Date)
            ? m.fecha_ingreso.toISOString().slice(0, 10)
            : m.fecha_ingreso;

        res.send(`
      <h1>Editar médico ${m.matricula}</h1>
      <form method="POST" action="/medico/editar/${m.matricula}">
        Matrícula: <input type="number" value="${m.matricula}" disabled><br><br>
        DNI: <input type="number" name="dni" value="${m.dni}" required><br><br>
        Nombre: <input type="text" name="nombre" value="${m.nombre}" required><br><br>
        Apellido: <input type="text" name="apellido" value="${m.apellido}" required><br><br>
        CUIL/CUIT: <input type="number" name="cuil_cuit" value="${m.cuil_cuit}" required><br><br>
        Fecha ingreso: <input type="date" name="fecha_ingreso" value="${fecha}" required><br><br>
        <button type="submit">Guardar cambios</button>
      </form>
      <br><a href="/medico">Volver</a>
    `);
    } catch (err: any) {
        res.status(500).send(`<pre>${err.message}</pre>`);
    }
});
//ACTUALIZAR MEDICO
app.post('/medico/editar/:matricula', async (req, res) => {
    const matricula = Number(req.params.matricula);
    const { dni, nombre, apellido, cuil_cuit, fecha_ingreso } = req.body;
    try {
        await pool.query(
            `UPDATE medico
       SET dni=$1, nombre=$2, apellido=$3, cuil_cuit=$4, fecha_ingreso=$5
       WHERE matricula=$6`,
            [Number(dni), nombre, apellido, cuil_cuit, fecha_ingreso, matricula]
        );
        res.redirect('/medico');
    } catch (err: any) {
        res.status(400).send(`<h1>Error</h1><pre>${err.message}</pre><a href="/medico">Volver</a>`);
    }
});
//BORRAR MEDICO
app.post('/medico/borrar/:matricula', async (req, res) => {
    const matricula = Number(req.params.matricula);
    try {
        await pool.query('DELETE FROM medico WHERE matricula=$1', [matricula]);
        res.redirect('/medico');
    } catch (err: any) {
        res.status(400).send(`<h1>Error</h1><pre>${err.message}</pre><a href="/medico">Volver</a>`);
    }
});

//SECTOR
app.get('/sector', async (_req, res) => {
    try {
        const result = await pool.query('SELECT id_sector,tipo FROM sector ORDER BY id_sector');
        const filas = result.rows.map((s:any) => `
      <tr>
        <td>${s.id_sector}</td>
        <td>${s.tipo}</td>
        <td>
          <a href="/sector/editar/${s.id_sector}">Editar</a>
          |
          <form method="POST" action="/sector/borrar/${s.id_sector}" style="display:inline">
            <button type="submit" onclick="return confirm('¿Borrar sector?')">Borrar</button>
          </form>
        </td>
      </tr>
    `).join('');
        res.send(`
      <h1>Sectores</h1>
      <a href="/sector/nuevo">➕ Nuevo sector</a> | <a href="/">Inicio</a><br><br>
      <table border="1" cellpadding="5">
        <tr><th>ID</th><th>Tipo</th><th>Acciones</th></tr>
        ${filas || '<tr><td colspan="3">Sin sectores.</td></tr>'}
      </table>
    `);
    } catch (err: any) {
        res.status(500).send(`<pre>${err.message}</pre>`);
    }
});

app.get('/sector/nuevo', (_req, res) => {
    res.send(`
    <h1>Nuevo sector</h1>
    <form method="POST" action="/sector/nuevo">
      Tipo:
      <input type="text" name="tipo" required><br><br>
      <button type="submit">Guardar</button>
    </form>
    <br><a href="/sector">Volver</a>
  `);
});
//AGREGAR SECTOR
app.post('/sector/nuevo', async (req, res) => {
    const { tipo } = req.body;
    try {
        await pool.query('INSERT INTO sector(tipo) VALUES($1)', [tipo]);
        res.redirect('/sector');
    } catch (err: any) {
        res.status(400).send(`<h1>Error</h1><pre>${err.message}</pre><a href="/sector/nuevo">Volver</a>`);
    }
});

app.get('/sector/editar/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
        const result = await pool.query('SELECT id_sector,tipo FROM sector WHERE id_sector=$1', [id]);
        if (result.rowCount === 0) return res.send('Sector no encontrado');
        const s = result.rows[0];
        res.send(`
      <h1>Editar sector ${s.id_sector}</h1>
      <form method="POST" action="/sector/editar/${s.id_sector}">
        Tipo: <input type="text" name="tipo" value="${s.tipo}" required><br><br>
        <button type="submit">Guardar cambios</button>
      </form>
      <br><a href="/sector">Volver</a>
    `);
    } catch (err: any) {
        res.status(500).send(`<pre>${err.message}</pre>`);
    }
});
//ACTUALIZAR SECTOR
app.post('/sector/editar/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { tipo } = req.body;
    try {
        await pool.query('UPDATE sector SET tipo=$1 WHERE id_sector=$2', [tipo, id]);
        res.redirect('/sector');
    } catch (err: any) {
        res.status(400).send(`<h1>Error</h1><pre>${err.message}</pre><a href="/sector">Volver</a>`);
    }
});
//BORRAR SECTOR
app.post('/sector/borrar/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
        await pool.query('DELETE FROM sector WHERE id_sector=$1', [id]);
        res.redirect('/sector');
    } catch (err: any) {
        res.status(400).send(`<h1>Error</h1><pre>${err.message}</pre><a href="/sector">Volver</a>`);
    }
});

//HABITACION
app.get('/habitacion', async (_req, res) => {
    try {
        const result = await pool.query(`
      SELECT h.num_habitacion,h.piso,h.orientacion,s.tipo AS sector
      FROM habitacion h
      JOIN sector s ON s.id_sector = h.id_sector
      ORDER BY h.num_habitacion
    `);
        const filas = result.rows.map((h:any) => `
      <tr>
        <td>${h.num_habitacion}</td>
        <td>${h.piso}</td>
        <td>${h.orientacion}</td>
        <td>${h.sector}</td>
        <td>
          <a href="/habitacion/editar/${h.num_habitacion}">Editar</a>
          |
          <form method="POST" action="/habitacion/borrar/${h.num_habitacion}" style="display:inline">
            <button type="submit" onclick="return confirm('¿Borrar habitación?')">Borrar</button>
          </form>
        </td>
      </tr>
    `).join('');
        res.send(`
      <h1>Habitaciones</h1>
      <a href="/habitacion/nueva">➕ Nueva habitación</a> | <a href="/">Inicio</a><br><br>
      <table border="1" cellpadding="5">
        <tr><th>N°</th><th>Piso</th><th>Orientación</th><th>Sector</th><th>Acciones</th></tr>
        ${filas || '<tr><td colspan="5">Sin habitaciones.</td></tr>'}
      </table>
    `);
    } catch (err: any) {
        res.status(500).send(`<pre>${err.message}</pre>`);
    }
});

app.get('/habitacion/nueva', async (_req, res) => {
    try {
        const sectores = await pool.query('SELECT id_sector,tipo FROM sector ORDER BY id_sector');
        const options = sectores.rows.map((s:any) =>
            `<option value="${s.id_sector}">${s.id_sector} - ${s.tipo}</option>`
        ).join('');
        res.send(`
      <h1>Nueva habitación</h1>
      <form method="POST" action="/habitacion/nueva">
        Número de Habitación: <input type="number" name="num_habitacion" required><br><br>
        Piso: <input type="number" name="piso" required><br><br>
        Orientación:
        <select name="orientacion" required>
          <option value="NORTE">NORTE</option>
          <option value="SUR">SUR</option>
          <option value="ESTE">ESTE</option>
          <option value="OESTE">OESTE</option>
        </select><br><br>
        Sector:
        <select name="id_sector" required>
          ${options}
        </select><br><br>
        <button type="submit">Guardar</button>
      </form>
      <br><a href="/habitacion">Volver</a>
    `);
    } catch (err: any) {
        res.status(500).send(`<pre>${err.message}</pre>`);
    }
});

//AGREGAR HABITACION
app.post('/habitacion/nueva', async (req, res) => {
    const { num_habitacion, piso, orientacion, id_sector } = req.body;
    try {
        await pool.query(
            `INSERT INTO habitacion(num_habitacion, piso, orientacion, id_sector)
       VALUES($1, $2, $3, $4)`,
            [Number(num_habitacion), Number(piso), orientacion, Number(id_sector)]
        );
        res.redirect('/habitacion');
    } catch (err: any) {
        res.status(400).send(`<h1>Error</h1><pre>${err.message}</pre><a href="/habitacion/nueva">Volver</a>`);
    }
});

//BORRAR HABITACION
app.post('/habitacion/borrar/:num_habitacion', async (req, res) => {
    const num_habitacion = Number(req.params.num_habitacion);
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query('DELETE FROM corresponde WHERE num_habitacion=$1', [num_habitacion]);

        await client.query('DELETE FROM cama WHERE num_habitacion=$1', [num_habitacion]);

        await client.query('DELETE FROM incluye WHERE num_habitacion=$1', [num_habitacion]);

        await client.query('DELETE FROM habitacion WHERE num_habitacion=$1', [num_habitacion]);

        await client.query('COMMIT');
        res.redirect('/habitacion');

    } catch (err: any) {
        await client.query('ROLLBACK');
        res.status(400).send(`<h1>Error</h1><pre>${err.message}</pre><a href="/habitacion">Volver</a>`);
    } finally {
        client.release();
    }
});

//CAMAS
app.get('/cama', async (_req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.num_habitacion, c.num_cama, c.estado
            FROM cama c
            ORDER BY c.num_habitacion, c.num_cama
        `);

        const filas = result.rows.map((c: any) => `
            <tr>
                <td>${c.num_habitacion}</td>
                <td>${c.num_cama}</td>
                <td>${c.estado}</td>
                <td>
                    <form method="POST" action="/cama/borrar/${c.num_cama}/${c.num_habitacion}" style="display:inline">
                        <button type="submit" onclick="return confirm('¿Borrar cama ${c.num_cama} de la habitación ${c.num_habitacion}?')">Borrar</button>
                    </form>
                </td>
            </tr>
        `).join('');

        res.send(`
            <h1>Gestión de Camas</h1>
            <a href="/cama/nueva">➕ Nueva Cama</a> | <a href="/">Inicio</a><br><br>
            <table border="1" cellpadding="5">
                <tr>
                    <th>Habitación</th>
                    <th>N° Cama</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
                ${filas || '<tr><td colspan="4">No hay camas registradas.</td></tr>'}
            </table>
        `);
    } catch (err: any) {
        res.status(500).send(`<pre>${err.message}</pre>`);
    }
});

//NUEVA CAMA
app.get('/cama/nueva', async (_req, res) => {
    try {
        const habitacionResult = await pool.query('SELECT num_habitacion, piso, id_sector FROM habitacion ORDER BY num_habitacion');

        const opcionesHabitacion = habitacionResult.rows.map((h: any) =>
            `<option value="${h.num_habitacion}">Hab: ${h.num_habitacion} (Piso ${h.piso})</option>`
        ).join('');

        res.send(`
            <h1>Nueva Cama</h1>
            <form method="POST" action="/cama/nueva">
                
                <label>Seleccionar Habitación:</label><br>
                <select name="num_habitacion" required>
                    ${opcionesHabitacion}
                </select><br><br>

                <label>Número de Cama (dentro de la habitación):</label><br>
                <input type="number" name="num_cama" required min="1" placeholder="Ej: 1, 2, 3"><br><br>

                <label>Estado Inicial:</label><br>
                <select name="estado">
                    <option value="LIBRE">LIBRE</option>
                    <option value="OCUPADA">OCUPADA</option>
                </select><br><br>

                <button type="submit">Guardar Cama</button>
            </form>
            <br><a href="/cama">Volver</a>
        `);
    } catch (err: any) {
        res.status(500).send(`<pre>${err.message}</pre>`);
    }
});

//AGREGAR NUEVA CAMA
app.post('/cama/nueva', async (req, res) => {
    const { num_cama, num_habitacion, estado } = req.body;
    try {
        await pool.query(
            `INSERT INTO cama (num_cama, num_habitacion, estado) VALUES ($1, $2, $3)`,
            [Number(num_cama), Number(num_habitacion), estado]
        );
        res.redirect('/cama');
    } catch (err: any) {
        res.status(400).send(`
            <h1>Error al guardar</h1>
            <p>Es probable que ese número de cama ya exista en esa habitación.</p>
            <pre>${err.message}</pre>
            <a href="/cama/nueva">Volver</a>
        `);
    }
});

//BORRAR CAMA
app.post('/cama/borrar/:num_cama/:num_habitacion', async (req, res) => {
    const num_cama = Number(req.params.num_cama);
    const num_habitacion = Number(req.params.num_habitacion);

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query(
            'DELETE FROM corresponde WHERE num_cama=$1 AND num_habitacion=$2',
            [num_cama, num_habitacion]
        );

        await client.query(
            'DELETE FROM cama WHERE num_cama=$1 AND num_habitacion=$2',
            [num_cama, num_habitacion]
        );

        await client.query('COMMIT');
        res.redirect('/cama');

    } catch (err: any) {
        await client.query('ROLLBACK');
        res.status(400).send(`<h1>Error</h1><pre>${err.message}</pre><a href="/cama">Volver</a>`);
    } finally {
        client.release();
    }
});

//ESPECIALIDAD
app.get('/especialidad', async (_req, res) => {
    try {
        const result = await pool.query(`
            SELECT e.id_especialidad, e.nombre
            FROM especialidad e
            ORDER BY e.id_especialidad
        `);

        const filas = result.rows.map((e: any) => `
            <tr>
                <td>${e.id_especialidad}</td>
                <td>${e.nombre}</td>
                <td>
                    <form method="POST" action="/especialidad/borrar/${e.id_especialidad}" style="display:inline">
                        <button type="submit" onclick="return confirm('¿Borrar especialidad id:${e.id_especialidad}  nombre:${e.nombre}?')">Borrar</button>
                    </form>
                </td>
            </tr>
        `).join('');

        res.send(`
            <h1>Gestión de Especialidades</h1>
            <a href="/especialidad/nueva">➕ Nueva Especialidad</a> | <a href="/">Inicio</a><br><br>
            <table border="1" cellpadding="5">
                <tr>
                    <th>ID Especialidad</th>
                    <th>Nombre</th>
                </tr>
                ${filas || '<tr><td colspan="2">No hay camas especialidades registradas.</td></tr>'}
            </table>
        `);
    } catch (err: any) {
        res.status(500).send(`<pre>${err.message}</pre>`);
    }
});

//NUEVA ESPECIALIDAD
app.get('/especialidad/nueva', async (_req, res) => {
    try {
        res.send(`
            <h1>Nueva Especialidad</h1>
            <form method="POST" action="/especialidad/nueva">
            Nombre:
            <input type="text" name="nombre" required><br><br>
            <button type="submit">Guardar Especialidad</button>
            </form>
            <br><a href="/cama">Volver</a>
        `);
    } catch (err: any) {
        res.status(500).send(`<pre>${err.message}</pre>`);
    }
});

//AGREGAR NUEVA ESPECIALIDAD
app.post('/especialidad/nueva', async (req, res) => {
    const { nombre } = req.body;
    try {
        await pool.query(
            `INSERT INTO especialidad (nombre) VALUES ($1)`,
            [nombre]
        );
        res.redirect('/especialidad');
    } catch (err: any) {
        res.status(400).send(`
            <h1>Error al guardar</h1>
            <p>Es probable que esa especialidad ya exista.</p>
            <pre>${err.message}</pre>
            <a href="/especialidad/nueva">Volver</a>
        `);
    }
});

/**
 * Se podria usar un ON DELETE CASCADE en las claves foraneas de la BD?
 * No se si es recomendado hacerlo pero vi que se puede hacer asi tambien
 * en vez de escribir siempre tanto codigo manual
 * (Aunque en general se utiliza un flag de activo/inactivo)
 */
//BORRAR ESPECIALIDAD
app.post('/especialidad/borrar/:id_especialidad', async (req, res) => {
    const id_especialidad = Number(req.params.id_especialidad);

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query(
            'DELETE FROM asignacion_guardia WHERE id_especialidad=$1',
            [id_especialidad]
        );

        await client.query(
            'DELETE FROM especializado_en WHERE id_especialidad=$1',
            [id_especialidad]
        );

        await client.query(
            'DELETE FROM especialidad WHERE id_especialidad=$1',
            [id_especialidad]
        );

        await client.query('COMMIT');
        res.redirect('/especialidad');

    } catch (err: any) {
        await client.query('ROLLBACK');
        res.status(400).send(`<h1>Error</h1><pre>${err.message}</pre><a href="/especialidad">Volver</a>`);
    } finally {
        client.release();
    }
});

/*
    HECHO (del faltan):
   - cama: clave compuesta (num_cama,num_habitacion) → forms con select de habitación + número de cama.
   - especialidad

	FALTAN:
   - especializado_en
   - guardia / asignacion_guardia
   - periodo_vacaciones / tiene
   - internacion
   - ronda / incluye
   - recorrido / comentario_recorrido
*/

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
