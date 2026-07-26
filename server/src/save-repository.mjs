export function createSaveRepository(pool) {
  return Object.freeze({
    async read(userId) {
      const result = await pool.query(
        `SELECT revision, payload, updated_at FROM game_saves
          WHERE user_id = $1 AND slot_id = 'primary'`,
        [userId],
      );
      if (result.rowCount === 0) return null;
      const row = result.rows[0];
      return Object.freeze({
        ...row.payload,
        revision: Number(row.revision),
        updatedAt: new Date(row.updated_at).toISOString(),
      });
    },
    async write(userId, record, expectedRevision) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const current = await client.query(
          `SELECT revision, payload, updated_at FROM game_saves
            WHERE user_id = $1 AND slot_id = $2 FOR UPDATE`,
          [userId, record.slotId],
        );
        const revision = current.rowCount
          ? Number(current.rows[0].revision)
          : 0;
        if (revision !== expectedRevision) {
          await client.query("ROLLBACK");
          const row = current.rows[0];
          return Object.freeze({
            status: "conflict",
            current: row ? {
              ...row.payload,
              revision: Number(row.revision),
              updatedAt: new Date(row.updated_at).toISOString(),
            } : null,
          });
        }
        const payload = {
          ...record,
          revision: revision + 1,
          updatedAt: new Date().toISOString(),
        };
        await client.query(
          `INSERT INTO game_saves
             (user_id, slot_id, revision, payload, updated_at)
           VALUES ($1, $2, $3, $4::jsonb, NOW())
           ON CONFLICT (user_id, slot_id) DO UPDATE SET
             revision = EXCLUDED.revision,
             payload = EXCLUDED.payload,
             updated_at = NOW()`,
          [userId, record.slotId, payload.revision, JSON.stringify(payload)],
        );
        await client.query("COMMIT");
        return Object.freeze({ status: "saved", record: payload });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
  });
}
