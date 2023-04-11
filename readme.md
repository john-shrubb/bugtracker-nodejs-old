Bug Tracker node.js
===================

This is my attempt at creating a fully functional bug tracker in node.js, it utilises Auth0 for authentication, PostgreSQL for the ticketting and storing users, and Express for the web server, including the API.

This project is intended to go on my portfolio and is not intended for commercial use.

## Documentation

See all documentation in `./doc`. It is still being expanded upon however so there may be bits missing.

## Setup

See instructions to set up the bug tracker:

### Dependencies

Run `npm install` in the home directory to install the required packages.
Outside of npm packages, I used PostgreSQL 15 and my node.js version was `v19.8.1` as of the time of writing.

### Database

Right now the software is unable to set up a database on its own. However I plan to implement this at the end of development so please set the owner of the database to the user that will be used to access the database, for now is it assumed to be `bgbtrack`.
Use the following statement to set everything up where the user `bgtrack` is the username of the user you are using to connect to the DB. It is also used in line 1 as the database name.

```sql
ALTER DATABASE bgtrack OWNER TO bgtrack;

CREATE TABLE IF NOT EXISTS public.users (
	user_id varchar(50) PRIMARY KEY NOT NULL,
	username varchar(50) NOT NULL,
	role integer NOT NULL DEFAULT 1,
	auth0id varchar(50) NOT NULL,
	email varchar(255) NOT NULL,
	picture text NOT NULL DEFAULT 'http://flash.za.com/wp-content/uploads/2015/08/Generic-Profile-1600x1600.png'::text -- idrk where this came from tbh but it prevents the alt text always being used.
);

ALTER TABLE public.users OWNER TO bgtrack;

CREATE TABLE IF NOT EXISTS public.tickets (
	ticket_id varchar(50) PRIMARY KEY NOT NULL,
	title text NOT NULL,
	description text NOT NULL,
	status integer NOT NULL DEFAULT 1,
	user_id varchar(50) NOT NULL,
	created_on timestamp without time zone NOT NULL DEFAULT NOW(),

	FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE cascade
);

ALTER TABLE public.tickets OWNER TO bgtrack;

CREATE TABLE IF NOT EXISTS public.comments (
	comment_id varchar(50) PRIMARY KEY NOT NULL,
	ticket_id varchar(50) NOT NULL,
	user_id varchar(50) NOT NULL,
	content text NOT NULL,
	created_on timestamp without time zone DEFAULT NOW(),

	FOREIGN KEY (ticket_id) REFERENCES public.tickets(ticket_id) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE cascade
);

ALTER TABLE public.comments OWNER TO bgtrack;

CREATE TABLE IF NOT EXISTS public.userassignments (
	user_id varchar(50) NOT NULL,
	ticket_id varchar(50) NOT NULL,
	assigned_by varchar(50) NOT NULL,
	assigned_at timestamp without time zone NOT NULL DEFAULT NOW(),

	FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (ticket_id) REFERENCES public.tickets(ticket_id) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (assigned_by) REFERENCES public.users(user_id) ON UPDATE cascade
);

ALTER TABLE public.userassignments OWNER TO bgtrack;
```

### `.env` File

A `.env` file should be present in the root of the project folder. It should contain the following variables in it.

#### Auth0 Variables
- `AUTH0SECRET` - Your secret for Auth0, use of OpenSSL to generate this value is recommended
- `AUTH0ISSUERURL` - The issuer URL for your Auth0 application
- `AUTH0CLIENTID` - The client ID for your Auth0 application

#### PostgreSQL Variables

- `PG_DATABASE` - The name of the database you are using for this application.
- `PG_USER` - The username for the user you are using to access the database.
- `PG_PASSWORD` - The password for the user.
- `PG_PORT` - The port for your PostgreSQL instance.
- `PG_HOST` - The IP address your PostgreSQL is on.

## Running the project

Use the command `npm run-script run` to start the web server. By default it listens on port `80` and if all goes well, there will be a message to console which reads `Server online on port 80`.