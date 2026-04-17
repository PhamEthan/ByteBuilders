# REQUIREMENTS


## Building & running the frontend
To Build, run the following, inside the frontend directory:
<pre>
npm install
</pre>

To Run the frontned
<pre>
npm start
</pre>

## Building & running the backend database and docker
On first build, run the following:
<pre>
npm install
npm install dotenv
docker compose build
docker compose run app npx prisma migrate dev --name init
</pre>

If you add/remove any entries to the database, run the following:
<pre>
npx prisma generate
docker compose build
docker compose run app npx prisma migrate dev --name init
</pre>

To run or stop the docker container:
<pre>
docker compose up           //Starts
docker compose down         //Stops
</pre>

To view the database, while running the docker container:
<pre>
docker exec -it postgres-db psql -U postgres -d caregiverapp
</pre>

You can use the following commands to view the database tables and make changes:
(After the previous command)
<pre>
\dt                         //Displays the data of the current table
SELECT * FROM "User";       //Displays the User Table
DELETE FROM "User";         //Empties the database
</pre>


