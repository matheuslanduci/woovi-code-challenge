# Woovi Code Challenge

### Built With

[![Node][node.js]][node-url]
[![GraphQL][graphql]][graphql-url]
[![MongoDB][mongodb]][mongodb-url]
[![Koa][koa]][koa-url]

<!-- GETTING STARTED -->

# Woovi Code Challenge

This is a code challenge for Woovi, a company that provides payment solutions. The challenge consists of creating a GraphQL API that allows users to create and manage transactions. The project is hosted on Railway, uses MongoDB as the database,
Redis as event queue, and Jest for testing.

The API should support the following features:

- Create an account
- Transfer money between accounts
- Refresh the (readonly) balance of an account
- Withdraw money from an account
  
You can import the `postman.json` to your Postman to test the API. The base URL
is [https://woovi-code-challenge-production.up.railway.app/graphql](https://woovi-code-challenge-production.up.railway.app/graphql).

## Getting Started

To get a local copy up and running follow these simple example steps.

### Prerequisites

- Node.js

  ```sh
  https://nodejs.org/en/download/
  ```

- PNPM

  ```sh
  npm install pnpm -g
  ```

- Docker

  ```sh
  https://www.docker.com/get-started/
  ```

## Installation

Clone the repo

```sh
git clone https://github.com/matheuslanduci/woovi-code-challenge.git
```

1. Install packages

```sh
pnpm install
```

2. Run the container(or stop it, if necessary):

```sh
pnpm compose:up
```

3. Setup Configuration

```sh
pnpm config:local
```

4. Run the Project

```sh
pnpm dev
```

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[node.js]: https://img.shields.io/badge/NodeJS-339933?style=for-the-badge&logo=nodedotjs&logoColor=white
[node-url]: https://nodejs.org/
[graphql]: https://img.shields.io/badge/Graphql-E10098?style=for-the-badge&logo=graphql&logoColor=white
[graphql-url]: https://graphql.org/
[mongodb]: https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white
[mongodb-url]: https://mongodb.com
[koa]: https://img.shields.io/badge/Koa-F9F9F9?style=for-the-badge&logo=koa&logoColor=33333D
[koa-url]: https://koajs.com
