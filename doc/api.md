Bug Tracker API
===============

The bug tracker API allows web pages to interact with the back end to peform actions and receive data.

## Users

These endpoints involve managing or viewing details about users.

### `/api/v1/user/details`

Action type: `GET`

Outputs user details. A body request is not required.
This endpoint returns data in the following format:
```json
{
	"status": 200,
	"response": {
		"username": "John Shrubb",
		"email": "shrubbjohn@gmail.com",
		"userID": "773957784197172",
		"profilepic": "https://lh3.googleusercontent.com/a/AGNmyxbVATveCkSyzf9fkwdHsQ3VPOnRwTXspxyHLE-o=s96-c",
		"role": 3
	}
}
```
The meaning of role is detailed [here](./users.md#roles).

## Ticketing

The endpoints below are used to manage and view tickets.

### `/api/v1/tickets/list`

Action type: `GET`

This endpoint spits out details of all tickets the user has access to.
A body in the request is not required because the server automatically pulls the ID from the requests headers.

In the example response, a user with roles `2` or `3` will have everything look as if it has been assigned to them.

Example response:
```json
[
	{
		"ticket_id": "439925699294352",
		"title": "Help me now!!!",
		"description": "I broke my mug",
		"status": 1,
		"user_id": "773957784197172",
		"created_on": "2023-04-05T09:56:02.589Z",
		"assigned": false
	},
	{
		"ticket_id": "734963667244355",
		"title": "Web server refuses to start",
		"description": "Returns ... error when i try to start it",
		"status": 1,
		"user_id": "775957734197272",
		"created_on": "2023-04-03T14:54:06.589Z",
		"assigned": true
	}
]
```

### `/api/v1/tickets/create`

Action type: `POST`

Allows the user to create a new ticket. The body of the request should be in JSON and should look as follows:
```json
{
	"title": "Ate my hamster",
	"description": "Colleague ate my hamster, tried everything but unable to get hamster back."
}
```

The server will return 200 if the ticket was sucefully created.

### `/api/v1/tickets/delete`

Action type: `POST`

Endpoint which enables deletion of a ticket. Body should look like:
```json
{
	"ticketID": "6736485736481048"
}
```

Will return a `200` status code if succesfull or return an error if the ticket doesn't exist or the user has insufficient permissions to delete it (They are nor the owner nor role 2 or above).

### `/api/v1/tickets/assign`

Action type: `POST`

Assign a ticket to another user.
Requires that the user assigning the ticket has a higher role level than 2 or is the owner of the ticket.

The request body should look like this:
```json
{
	"ticketID": "573859274610392",
	"userID": "573105827359103"
}
```

Returns a 200 OK status if the ticket was succesfully assigned. Returns an error message explaining reason for failure if ticket assignment failed.