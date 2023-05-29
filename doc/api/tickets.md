Ticket API Endpoints
====================

This file lists all the API endpoints that relate to the management of tickets:

## `/api/tickets/list`

Action type: `GET`

This endpoint spits out details of all tickets the user has access to.
A body in the request is not required because the server automatically pulls the ID from the requests headers.

In the example response, a user with roles `2` or `3` will have everything look as if it has been assigned to them.

Example response:
```json
{
	"status": 200,
	"response": [
		{
			"ticket_id": "439925699294352",
			"title": "Help me now!!!",
			"description": "I broke my mug",
			"status": 1,
			"user_id": "773957784197172",
			"created_on": "2023-04-05T09:56:02.589Z",
		},
		{
			"ticket_id": "734963667244355",
			"title": "Web server refuses to start",
			"description": "Returns ... error when i try to start it",
			"status": 1,
			"user_id": "775957734197272",
			"created_on": "2023-04-03T14:54:06.589Z",
		}
	]
}
```

## `/api/tickets/create`

Action type: `POST`

Allows the user to create a new ticket. The body of the request should be in JSON and should look as follows:
```json
{
	"title": "Ate my hamster",
	"description": "Colleague ate my hamster, tried everything but unable to get hamster back."
}
```

The server will return 200 if the ticket was sucefully created.
Another status will be returned if there was an issue. The endpoint validates that the title and description fields are not empty

## `/api/tickets/delete`

Action type: `POST`

Endpoint which enables deletion of a ticket. Body should look like:
```json
{
	"ticketID": "6736485736481048"
}
```

Will return a `200` status code if successful or return an error if the ticket doesn't exist or the user has insufficient permissions to delete it (They are nor the owner of the ticket nor role 2 or above).

## `/api/tickets/assign`

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

## `/api/tickets/get/[TICKETID]`

Action type: `GET`

This endpoint is essentially a more optimised version of `/api/tickets/list`. Should be used if you very specifically know what ticket you want for a faster serve time.
You must be either assigned to the ticket or be the owner of it to access it otherwise a 403 response will be returned, unless you are a manager in which you are allowed to access all tickets.
Get a ticket. In the URL, `[TICKETID]` should be the ID of the ticket you are trying to pull details about.

**Response Body:**

```json
{
	"status": 200,
	"response": {
		"ticket_id": "734963667244355",
		"title": "Web server refuses to start",
		"description": "Returns ... error when i try to start it",
		"status": 1,
		"user_id": "775957734197272",
		"created_on": "2023-04-03T14:54:06.589Z",
	}
}
```

## `/api/tickets/[TICKETID]/edit`

Action type: `POST`

`[TICKETID]` should be replaced by the ID of the ticket you are trying to edit.

Allows the user to edit a ticket. You must be the owner of a ticket to edit it.

**Request Body:**

```json
{
	"title": "abc",
	"description": "def"
}
```

It is possible to omit one of these fields, if you do not want to edit both parts of the ticket. One field must be present otherwise the endpoint will return an error.

**Response Body:**

```json
{
	"status": 200,
	"response": "Successfully modified ticket."
}
```
