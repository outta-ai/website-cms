![OUTTA Logo](./docs/images/OUTTA%20Logo.png)

# OUTTA Website CMS

This is a CMS System based on [Payload CMS](https://payloadcms.com/).

## Development

### Using Local MongoDB Server

1. Create `.env` file according to `.env.example` file.
2. Run `yarn dev` to start the development server.
3. Go to [http://localhost:3000/admin](http://localhost:3000/admin) to access admin portal

### Using Docker and docker compose

1. Install docker and docker compose on your system
2. Copy `docker-compose.dev.yml` to `docker-compose.yml`
3. Run `docker compose up -d`
4. Go to [http://localhost:3000/admin](http://localhost:3000/admin) to access admin portal

## Production

1. Install docker and docker compose on the server
2. Copy `docker-compose.prod.yml` to `docker-compose.yml`
3. Modify port settings of the payload service
4. Run `docker compose up -d` to start the server
