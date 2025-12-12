/* session delete by token */
DELETE FROM session
 WHERE session_token = :sessionToken
