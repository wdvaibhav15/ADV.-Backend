# Use the official Node.js image
FROM node

# Create app directory
WORKDIR /app

# Copy package files first so dependencies install correctly
COPY package.json package.json
COPY package-lock.json package-lock.json

# Install dependencies inside the container
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port your server runs on (optional, but good practice)
EXPOSE 8000

# Command to run your server
CMD ["npm", "run", "dev"]