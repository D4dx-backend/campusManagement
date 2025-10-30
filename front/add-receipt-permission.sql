-- SQL Script to Add Receipt Configuration Permission to Branch Admins
-- Run this in your database to add the required permission

-- Option 1: Add permission to all branch admin users
UPDATE users 
SET permissions = JSON_ARRAY_APPEND(
  COALESCE(permissions, JSON_ARRAY()), 
  '$', 
  JSON_OBJECT(
    'module', 'receipt-config',
    'actions', JSON_ARRAY('create', 'read', 'update', 'delete')
  )
) 
WHERE role = 'branch_admin';

-- Option 2: Add permission to specific user (replace USER_ID with actual ID)
-- UPDATE users 
-- SET permissions = JSON_ARRAY_APPEND(
--   COALESCE(permissions, JSON_ARRAY()), 
--   '$', 
--   JSON_OBJECT(
--     'module', 'receipt-config',
--     'actions', JSON_ARRAY('create', 'read', 'update', 'delete')
--   )
-- ) 
-- WHERE id = 'USER_ID_HERE' AND role = 'branch_admin';

-- Verify the update
SELECT id, name, role, JSON_PRETTY(permissions) as permissions 
FROM users 
WHERE role = 'branch_admin';