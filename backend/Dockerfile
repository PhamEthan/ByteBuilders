FROM node:22-alpine

WORKDIR /app

# Copy all files (including prisma)
COPY . .

RUN rm -rf node_modules package-lock.json && npm install && npm install -g prisma
RUN npx prisma --version
RUN cat /app/prisma/schema.prisma || echo 'schema.prisma not found'
RUN npx prisma generate

# Copy rest of app

EXPOSE 5003

# Run migrations, then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node ./src/server.js"]
