# Use official Node.js image
FROM node:22-bookworm

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the rest of the application files into the container
COPY . .

# Expose the port your app will be running on
EXPOSE 8000

# Command to run the app
CMD ["npm", "start"]
