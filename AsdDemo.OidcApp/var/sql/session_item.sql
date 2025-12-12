/* session item */
SELECT id,
       user_id,
       session_token,
       expires_at,
       date_created
  FROM session
 WHERE id = :id
