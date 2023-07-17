# Setting up the build stage
FROM node:18.16-bullseye-slim AS build
WORKDIR /home/node/build

# Copying the required files to build the application
COPY src src
COPY patches patches
COPY scripts scripts
COPY package*.json tsconfig*.json nest-cli.json .

# Installing and building the application
RUN npm install
RUN npm run build

# Installing the required tools in production build
FROM node:18.16-bullseye-slim
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

# Setting up the environment variables
ENV PORT 8080
ENV NODE_ENV production
ENV DOMAIN shadow-apps.com

# Setting the working directory and user
USER node
WORKDIR /home/node/app

# Copying the files required
COPY --chown=node:node --from=build /home/node/build/dist .

# Installing the npm packages requried
RUN npm ci --omit=dev


# Running the application
EXPOSE 8080
CMD ["dumb-init", "node", "main.js"]