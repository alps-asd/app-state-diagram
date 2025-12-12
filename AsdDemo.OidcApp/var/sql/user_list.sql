/* user list */
SELECT id,
       username,
       email,
       password_hash,
       date_created
  FROM user
 ORDER BY date_created DESC
