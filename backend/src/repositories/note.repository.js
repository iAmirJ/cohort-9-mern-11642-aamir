const pool = require('../config/db');

async function create({ userId, title, content, contentText }) {
  const { rows } = await pool.query(
    `INSERT INTO notes (user_id, title, content, content_text)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, title, content, created_at, updated_at`,
    [userId, title, content, contentText]
  );
  return rows[0];
}

async function findByIdForUser(id, userId) {
  const { rows } = await pool.query(
    `SELECT id, user_id, title, content, created_at, updated_at
     FROM notes
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
    [id, userId]
  );
  return rows[0] || null;
}

async function findAllForUser({ userId, limit, offset, search }) {
  const values = [userId];
  let where = `user_id = $1 AND deleted_at IS NULL`;

  if (search) {
    values.push(search);
    where += ` AND search_vector @@ websearch_to_tsquery('english', $${values.length})`;
  }

  values.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT id, user_id, title, content, created_at, updated_at,
            COUNT(*) OVER() AS total_count
     FROM notes
     WHERE ${where}
     ORDER BY created_at DESC, id
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  const total = rows[0] ? parseInt(rows[0].total_count, 10) : 0;
  const notes = rows.map(({ total_count, ...note }) => note);

  return { notes, total };
}

async function update(id, userId, fields) {
  const setClauses = [];
  const values = [];

  if (fields.title !== undefined) {
    values.push(fields.title);
    setClauses.push(`title = $${values.length}`);
  }
  if (fields.content !== undefined) {
    values.push(fields.content);
    setClauses.push(`content = $${values.length}`);
  }
  if (fields.contentText !== undefined) {
    values.push(fields.contentText);
    setClauses.push(`content_text = $${values.length}`);
  }

  if (setClauses.length === 0) {
    return findByIdForUser(id, userId);
  }

  values.push(id, userId);

  const { rows } = await pool.query(
    `UPDATE notes
     SET ${setClauses.join(', ')}
     WHERE id = $${values.length - 1} AND user_id = $${values.length} AND deleted_at IS NULL
     RETURNING id, user_id, title, content, created_at, updated_at`,
    values
  );
  return rows[0] || null;
}

async function softDelete(id, userId) {
  const { rows } = await pool.query(
    `UPDATE notes
     SET deleted_at = now()
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [id, userId]
  );
  return rows[0] || null;
}

module.exports = { create, findByIdForUser, findAllForUser, update, softDelete };