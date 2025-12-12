/* session list by user */
SELECT id,
       user_id,
       session_token,
       expires_at,
       date_created
  FROM session
 WHERE user_id = :userId
   AND expires_at > :now
 ORDER BY date_created DESC
