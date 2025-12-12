/* session delete expired */
DELETE FROM session
 WHERE expires_at <= NOW()
