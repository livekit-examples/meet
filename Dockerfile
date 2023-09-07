# Use the alpine image as a base image
FROM alpine:3.17

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

# Download and install yarn
RUN apk update && apk add yarn

# Set the working directory to /app
WORKDIR /app

# Copy all files from the current directory to the /app directory in the container
COPY . /app

# Run yarn install to install dependencies
RUN yarn install

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

# Run yarn build to build the app
RUN yarn build

# Set production environment
ENV NODE_ENV production

# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

# Create a group and a user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Change the ownership of .next & .next/static
RUN chown nextjs:nodejs .next
RUN chown nextjs:nodejs .next/static

# Execute with nextjs user
USER nextjs

# Set env vars for hostname & port
ENV HOSTNAME "0.0.0.0"
ENV PORT 3000

# Expose the port
EXPOSE ${PORT}

# Run yarn start to start the nextjs server as the main command
CMD ["yarn", "start"]
