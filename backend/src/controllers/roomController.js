const { pool } = require('../config/database');
const { Parser } = require('json2csv');

const getAll = async (req, res) => {
  try {
    const { block, status } = req.query;
    let where = '1=1'; const params = [];
    if (block)  { where += ' AND block=?'; params.push(block); }
    if (status) { where += ' AND status=?'; params.push(status); }
    const [rows] = await pool.query(`SELECT * FROM rooms WHERE ${where} ORDER BY block,floor,room_number`, params);
    res.json({ success: true, data: rows });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getOne = async (req, res) => {
  try {
    const [room] = await pool.query('SELECT * FROM rooms WHERE id=?', [req.params.id]);
    if (!room.length) return res.status(404).json({ success: false, message: 'Room not found.' });
    const [students] = await pool.query('SELECT id,name,register_no,department,year FROM students WHERE room_id=?', [req.params.id]);
    res.json({ success: true, data: { ...room[0], students } });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

const create = async (req, res) => {
  const { room_number, block, floor, capacity, room_type } = req.body;
  if (!room_number || !block || !floor || !capacity)
    return res.status(400).json({ success: false, message: 'room_number, block, floor, capacity required.' });
  try {
    const [result] = await pool.query(
      'INSERT INTO rooms (room_number,block,floor,capacity,room_type) VALUES (?,?,?,?,?)',
      [room_number,block,floor,capacity,room_type||'triple']
    );
    res.status(201).json({ success: true, message: 'Room created.', id: result.insertId });
  } catch (err) {
    if (err.code==='ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Room number already exists.' });
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const update = async (req, res) => {
  const { capacity, room_type, status } = req.body;
  try {
    await pool.query('UPDATE rooms SET capacity=?,room_type=?,status=? WHERE id=?',
      [capacity,room_type,status,req.params.id]);
    res.json({ success: true, message: 'Room updated.' });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

const remove = async (req, res) => {
  try {
    const [s] = await pool.query('SELECT id FROM students WHERE room_id=?', [req.params.id]);
    if (s.length) return res.status(400).json({ success: false, message: 'Cannot delete room with active residents.' });
    await pool.query('DELETE FROM rooms WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Room deleted.' });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

const exportCSV = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT room_number, block, floor, capacity, occupied, room_type, status FROM rooms ORDER BY block, floor, room_number'
    );
    const parser = new Parser({ fields: ['room_number','block','floor','capacity','occupied','room_type','status'] });
    const csv = parser.parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('rooms.csv');
    res.send(csv);
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Export failed.' }); }
};

module.exports = { getAll, getOne, create, update, remove, exportCSV };

