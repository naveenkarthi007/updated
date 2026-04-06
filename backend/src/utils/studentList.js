const { pool } = require('../config/database');

function normalizeWing(w) {
  if (w == null || w === '') return null;
  const x = String(w).trim().toLowerCase();
  if (x === 'left') return 'left';
  if (x === 'right') return 'right';
  return null;
}

/**
 * @param {object} options
 * @param {'admin'|'warden'} options.mode
 * @param {Array<{block:string,floor:number,wing:string}>|null} options.wardenScopes - required when mode is warden
 * @param {object} options.query - req.query
 */
async function listStudents({ mode, wardenScopes, query }) {
  const { search, dept, year, page = 1, limit = 20, block, floor, wing } = query;
  let where = '1=1';
  const params = [];

  if (search) {
    where += ' AND (s.name LIKE ? OR s.register_no LIKE ? OR s.email LIKE ? OR r.room_number LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q, q, q);
  }
  if (dept) {
    where += ' AND s.department=?';
    params.push(dept);
  }
  if (year) {
    where += ' AND s.year=?';
    params.push(year);
  }

  if (mode === 'warden') {
    if (!wardenScopes || !wardenScopes.length) {
      return { rows: [], total: 0, page: parseInt(page, 10), limit: parseInt(limit, 10) };
    }
    let refined = [...wardenScopes];
    if (block) refined = refined.filter((s) => s.block === block);
    if (floor !== undefined && floor !== '' && floor != null) {
      refined = refined.filter((s) => Number(s.floor) === Number(floor));
    }
    const wingFilter = normalizeWing(wing);
    if (wingFilter) refined = refined.filter((s) => s.wing === wingFilter);
    if (!refined.length) {
      return { rows: [], total: 0, page: parseInt(page, 10), limit: parseInt(limit, 10) };
    }
    wardenScopes = refined;
    where += ' AND COALESCE(s.wing, r.wing) IS NOT NULL';
    const orParts = [];
    for (const sc of wardenScopes) {
      orParts.push('(r.block = ? AND COALESCE(s.floor, r.floor) = ? AND COALESCE(s.wing, r.wing) = ?)');
      params.push(sc.block, Number(sc.floor), sc.wing);
    }
    where += ` AND (${orParts.join(' OR ')})`;
  } else {
    if (block) {
      where += ' AND r.block = ?';
      params.push(block);
    }
    if (floor !== undefined && floor !== '' && floor != null) {
      where += ' AND COALESCE(s.floor, r.floor) = ?';
      params.push(Number(floor));
    }
    const nw = normalizeWing(wing);
    if (nw) {
      where += ' AND COALESCE(s.wing, r.wing) = ?';
      params.push(nw);
    }
  }

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitN = parseInt(limit, 10);

  const baseFrom = `FROM students s
       LEFT JOIN rooms r ON s.room_id=r.id
       LEFT JOIN users u ON s.user_id=u.id
       WHERE ${where} AND (u.role='student' OR s.user_id IS NULL)`;

  const selectSql = `SELECT s.*, r.room_number, r.block, r.floor AS room_floor, r.wing AS room_wing,
       COALESCE(s.floor, r.floor) AS effective_floor,
       COALESCE(s.wing, r.wing) AS effective_wing
       ${baseFrom}
       ORDER BY s.created_at DESC LIMIT ? OFFSET ?`;

  const [rows] = await pool.query(selectSql, [...params, limitN, offset]);
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total ${baseFrom}`, params);

  return {
    rows,
    total,
    page: parseInt(page, 10),
    limit: limitN,
  };
}

module.exports = { listStudents, normalizeWing };
