# REQUIREMENTS


# HOW TO BUILD PROGRAM 
1. npm init -y
2. npm install express
3. npm install --save-dev nodemon
4. npm install express bcryptjs googleapis jsonwebtoken pg 
5. npm install prisma @prisma/client 
6. npx prisma init
7. npx prisma generate 
8. docker compose build 
9. docker compose run app npx prisma migrate dev --name init

# HOW TO RUN DOCKER/THE PROGRAM 
1. docker compose up - to turn off docker server
2. docker compose down - to turn off docker server

# HOW TO VIEW
1. http://localhost:5003 - open user log in portal 
2. http://localhost:5003/appointments/login - google auth setup for calendar link 
# Comunicate to Database with SQL
1. docker exec -it postgres-db psql -U postgres -d caregiverapp - enter postgres UI
2. /dt - to view database
3. use typical sql commands like - SELECT * FROM "User";

