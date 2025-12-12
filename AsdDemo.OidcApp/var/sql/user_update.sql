/* user update */
UPDATE user
   SET username = :username,
       email = :email
 WHERE id = :id
