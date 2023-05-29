Bug Tracker API
===============

The documentation for user APIs can all be found and viewed below

- [Ticket Endpoints](./api/tickets.md)
- [User Endpoints](./api/users.md)
- [Comment Endpoints](./api/comments.md)

With all endpoints, if a status other than `200` is returned, then the `response` string in the JSON response should be outputted to the user.

Authentication is required with ALL endpoints. A `403` error will be returned if the user is not signed in.