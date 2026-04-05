const { pool } = require('../config/database');
const { Parser } = require('json2csv');

const getAll = async (req, res) => {
  try {
    const { search, dept, year, page = 1, limit = 20 } = req.query;
    let where = '1=1';
    const params = [];
    if (search) { where += ' AND (s.name LIKE ? OR s.register_no LIKE ? OR s.email LIKE ?)'; const q = `%${search}%`; params.push(q,q,q); }
    if (dept)   { where += ' AND s.department=?'; params.push(dept); }
    if (year)   { where += ' AND s.year=?'; params.push(year); }

    const offset = (parseInt(page)-1) * parseInt(limit);
    const [rows] = await pool.query(
      `SELECT s.*, r.room_number, r.block FROM students s
       LEFT JOIN rooms r ON s.room_id=r.id
       WHERE ${where} ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM students s WHERE ${where}`, params);
    res.json({ success: true, data: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getOne = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT s.*, r.room_number, r.block FROM students s LEFT JOIN rooms r ON s.room_id=r.id WHERE s.id=?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

const create = async (req, res) => {
  const { name, register_no, department, year, phone, email, address, joined_date } = req.body;
  if (!name || !register_no || !department || !year)
    return res.status(400).json({ success: false, message: 'Name, register_no, department and year are required.' });
  try {
    const [result] = await pool.query(
      'INSERT INTO students (name,register_no,department,year,phone,email,address,joined_date) VALUES (?,?,?,?,?,?,?,?)',
      [name,register_no,department,year,phone,email,address,joined_date||new Date()]
    );
    res.status(201).json({ success: true, message: 'Student created.', id: result.insertId });
  } catch (err) {
    if (err.code==='ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Register number already exists.' });
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const update = async (req, res) => {
  const { name, department, year, phone, email, address } = req.body;
  try {
    await pool.query(
      'UPDATE students SET name=?,department=?,year=?,phone=?,email=?,address=? WHERE id=?',
      [name,department,year,phone,email,address,req.params.id]
    );
    res.json({ success: true, message: 'Student updated.' });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

const remove = async (req, res) => {
  try {
    const [s] = await pool.query('SELECT room_id FROM students WHERE id=?', [req.params.id]);
    if (s.length && s[0].room_id) {
      await pool.query('UPDATE rooms SET occupied=occupied-1 WHERE id=? AND occupied>0', [s[0].room_id]);
      await pool.query('UPDATE rooms SET status=IF(occupied>=capacity,"occupied","available") WHERE id=?', [s[0].room_id]);
    }
    await pool.query('DELETE FROM students WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Student deleted.' });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

const exportCSV = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT s.name,s.register_no,s.department,s.year,s.phone,s.email,r.room_number,r.block FROM students s LEFT JOIN rooms r ON s.room_id=r.id ORDER BY s.name'
    );
    const parser = new Parser({ fields: ['name','register_no','department','year','phone','email','room_number','block'] });
    const csv = parser.parse(rows);
    res.header('Content-Type','text/csv');
    res.attachment('students.csv');
    res.send(csv);
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Export failed.' }); }
};

module.exports = { getAll, getOne, create, update, remove, exportCSV };
