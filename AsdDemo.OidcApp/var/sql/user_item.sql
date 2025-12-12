/* user item */
SELECT id,
       username,
       email,
       password_hash,
       date_created
  FROM user
 WHERE id = :id
