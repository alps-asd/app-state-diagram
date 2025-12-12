/* session item by token */
SELECT id,
       user_id,
       session_token,
       expires_at,
       date_created
  FROM session
 WHERE session_token = :sessionToken
   AND expires_at > datetime('now')
