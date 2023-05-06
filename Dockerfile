# Installing the required tools
FROM node:18.16-bullseye-slim
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

# Setting up the environment variables
ENV NODE_ENV production

# Setting the working directory and user
USER node
WORKDIR /home/node/app

# Copying the files required
COPY --chown=node:node dist .

# Installing the npm packages requried
RUN npm ci --only=production


# Running the application
CMD ["dumb-init", "node", "main.js"]