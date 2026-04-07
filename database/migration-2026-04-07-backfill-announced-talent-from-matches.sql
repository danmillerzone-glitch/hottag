-- One-time backfill: ensure every wrestler in any match has a corresponding
-- event_announced_talent row for that match's event. After running this,
-- the wrestler-profile "Upcoming Events" bug (where match-only wrestlers
-- were silently invisible on their own page) is retroactively fixed for
-- all historical data.
--
-- Idempotent: the NOT EXISTS filter makes re-runs no-ops.
-- Safe: uses sort_order = (max for that event) + N so backfilled rows
-- append to the end of any existing announced list rather than colliding.

INSERT INTO event_announced_talent (event_id, wrestler_id, sort_order, self_announced)
SELECT DISTINCT
  em.event_id,
  mp.wrestler_id,
  COALESCE((
    SELECT MAX(sort_order) + 1
    FROM event_announced_talent
    WHERE event_id = em.event_id
  ), 0) AS sort_order,
  false AS self_announced
FROM match_participants mp
JOIN event_matches em ON em.id = mp.match_id
WHERE NOT EXISTS (
  SELECT 1 FROM event_announced_talent eat
  WHERE eat.event_id = em.event_id
    AND eat.wrestler_id = mp.wrestler_id
);
