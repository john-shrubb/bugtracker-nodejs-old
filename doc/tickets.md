Tickets
=======

Tickets are the biggest component of the bug tracker.

The tickets table in the database is as follows:

| Column Name |  Data Type                 | Constraints | Default |
|-------------|----------------------------|-------------|---------|
| ticket_id   | VARCHAR(50)                | PRIMARY KEY |         |
| title       | TEXT                       | NOT NULL    |         |
| description | TEXT                       | NOT NULL    |         |
| status      | INTEGER                    | NOT NULL    | 1       |
| user_id     | VARCHAR(50)                | NOT NULL    |         |
| created_on  | TIMESTAMP WITHOUT TIMEZONE | NOT NULL    | NOW()   |

**Additional SQL:**

```sql
FOREIGN KEY (user_id) REFERENCES users(user_id) ON UPDATE CASCADE
```

## Tags

A ticket can have the `Open`, `WiP` and `Closed` tag on it.
These tags are represented in the database as 1, 2 and 3 respectively.

## Assignments

A ticket can be assigned to other users by the user who created the ticket or any manager user (Role 2+). This is held in the `userassignments` table:

| Column Name | Data Type                   | Constraints | Default |
|-------------|-----------------------------|-------------|---------|
| user_id     | VARCHAR(50)                 | NOT NULL    |         |
| ticket_id   | VARCHAR(50)                 | NOT NULL    |         |
| assigned_by | VARCHAR(50)                 | NOT NULL    |         |
| assigned_at | TIMESTAMP WITHOUT TIME ZONE | NOT NULL    | NOW()   |

## Comments

A ticket can be commented on. This is further detailed in [comments.md](./comments.md).