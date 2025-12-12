/* session add */
INSERT INTO session (id, user_id, session_token, expires_at, date_created)
VALUES (:id, :userId, :sessionToken, :expiresAt, :dateCreated)
