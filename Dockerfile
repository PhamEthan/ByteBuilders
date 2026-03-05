FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma schema + migrations
COPY prisma ./prisma

# Install dependencies
RUN npm install

# Copy rest of app
COPY . .

EXPOSE 5003

# Run migrations, then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node ./src/server.js"]