Users and Roles
=====

Users in the bug trackers are assumed to have been authenticated by Auth0.

The system detects when a user which has been authenticated with Auth0 but not registered with the users table attempts to access the page and registers them automatically.

## Users Table in DB

| Column Name | Data Type    | Constraints | Defaults |
|-------------|--------------|-------------|----------|
| user_id     | VARCHAR(50)  | PRIMARY KEY |          |
| username    | VARCHAR(255) | NOT NULL    |          |
| role        | integer      | NOT NULL    | 1        |
| auth0id     | VARCHAR(50)  | NOT NULL    |          |
| email       | VARCHAR(255) | NOT NULL    |          |

**Note** - The auth0id column holds the ID auth0 uses. The user_id holds the ID the bug tracker uses internally.

## Roles

The role system has 3 tiers. New users have been defaulted to 1.
- 1 - User
    - Can see, delete, mark, comment on and assign users to their own tickets.
    - Can see, mark and comment on tickets assigned to them.
    - Cannot see any tickets they have not created or been assigned.
- 2 - Manager
    - Can see, delete, mark, comment on and assign users to **all** tickets.
    - Cannot promote other users to manager.
- 3 - Owner
    - Can see, delete, mark, comment on and assign users to all tickets.
    - Can promote other users to managers.