# Measuring "started a second duel" (and a few other numbers)

The Figma checklist asks us to track "started a second dual". We do not add a tracker or an analytics service: every number below is a plain SQL query on the real tables, run by hand in the **Neon console** (SQL Editor) before or after the demo. They also run on the local SQLite file (`sqlite3 api/dev.db`).

Tables used: `users`, `duels` (`creator_id`, `opponent_id`, `status`), `checkins`. A duel is "started" once it has been accepted (`status` is not `pending`).

## 1. Players who have been in two or more duels (the "second duel" number)
```sql
SELECT COUNT(*) AS players_with_a_second_duel
FROM (
  SELECT user_id
  FROM (
    SELECT creator_id AS user_id, id FROM duels WHERE status <> 'pending'
    UNION ALL
    SELECT opponent_id AS user_id, id FROM duels WHERE status <> 'pending' AND opponent_id IS NOT NULL
  ) p
  GROUP BY user_id
  HAVING COUNT(*) >= 2
) t;
```
Compare with the number of players who have been in at least one started duel (change `>= 2` to `>= 1`). The ratio is the "second duel" rate.

## 2. Players who *created* a second duel (rematches and new challenges you sent)
```sql
SELECT COUNT(*) AS creators_of_two_or_more
FROM (SELECT creator_id FROM duels GROUP BY creator_id HAVING COUNT(*) >= 2) t;
```
This counts pending ones too, so it also shows people who tried to start another one.

## 3. Duels by status
```sql
SELECT status, COUNT(*) AS duels FROM duels GROUP BY status ORDER BY duels DESC;
```
`pending` = invite not accepted yet, `active`, `paused`, `finished`.

## 4. Invites that got accepted
```sql
SELECT
  COUNT(*) AS duels_created,
  SUM(CASE WHEN status <> 'pending' THEN 1 ELSE 0 END) AS accepted
FROM duels;
```

## 5. Check-ins per started duel
```sql
SELECT ROUND(AVG(n), 1) AS avg_check_ins_per_duel
FROM (
  SELECT d.id, COUNT(c.id) AS n
  FROM duels d LEFT JOIN checkins c ON c.duel_id = d.id
  WHERE d.status <> 'pending'
  GROUP BY d.id
) t;
```

## 6. People and activity
```sql
SELECT
  (SELECT COUNT(*) FROM users)                         AS users,
  (SELECT COUNT(DISTINCT user_id) FROM checkins)       AS users_who_checked_in,
  (SELECT COUNT(*) FROM checkins)                      AS check_ins;
```

## Notes
- These are read-only `SELECT`s. Do not run them against the database from the app or tests.
- Test accounts count too: delete your test rows (or filter by `users.email`) before reading the numbers for a demo.
- XP and tiers are not stored (they are computed from check-ins and duels), so there is no column to query for them.
