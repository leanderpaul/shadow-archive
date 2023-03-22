# Shadow Archive

An Archive server that is the central node for all the shadow applications.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run dev

# watch mode
$ npm run dev:watch

# production mode
$ npm run start
```

## Test

```bash
# unit tests
$ npm test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Utility scripts

```bash
# code linting
$ npm run lint

# generate graphql schemas
$ npm run gen:schemas
```

# Directory Structure

All the code lives inside the `src` directory. The code is splitting into 4 directories which are as follows

- **config** - contains all the configuration files
- **graphql** - contains resolvers, services and types to run the graphql server
- **providers** - contains all the providers needs for the entire project such as database connection, context and logger
- **shared** - common code shared by all the modules, it contains decorators, guards, modules, errors and utility methods
