User API Endpoints
==================

The responses for all API endpoints for viewing and managing user details are listed below

## `/api/user/details`

Action type: `GET`

Used to get the details of the currently signed in user.

## `/api/user/get/id`

Action type: `POST`

Used to get a user using their ID.

**Request Body**

```json
{
	"userID": "773957785147172"
}
```

## `/api/user/get/email`

Action type: `POST`

A user can be got by their email using this endpoint.

**Request Body**

```json
{
	"userEmail": "john.pork@gmail.com"
}
```

### Response

**All of the above endpoints will return data in the following format:**
```json
{
	"status": 200,
	"response": {
		"username": "John Pork",
		"email": "john.pork@gmail.com",
		"userID": "773957785147172",
		"profilepic": "https://lh3.googleusercontent.com/a/AGNmyxbVATveCkSyzf9fkwdHsQ3VPOnRwTXspxyHLE-o=s96-c",
		"role": 3
	}
}
```
The meaning of role is detailed [here](./users.md#roles).
