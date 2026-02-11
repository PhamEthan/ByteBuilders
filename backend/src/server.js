import express from 'express'
import path, {dirname, join} from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/authRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import cors from "cors";


//Allows communication between frontend client and database server,
//  without flagging CORS communication issues in the web browser
const corsOptions = {
    origin: ["http://localhost:3000"],
};


const app = express()
app.use(cors(corsOptions))
const PORT = process.env.PORT || 5003

// Get the file path from URL of currModule
const __filename = fileURLToPath(import.meta.url)
// Retrieve Dir name
const __dirname = dirname(__filename)

//MIDDLEWARE
app.use(express.json())

/*
//Hands over HTML from /public Dir
app.use(express.static(path.join(__dirname, '../public')))
// Now Display HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})
*/

//Temporary redirect back to the actual frontend
app.get('/', (req, res) => {
    res.redirect("http://localhost:3000/")
})

//ROUTES
app.use('/auth', authRoutes)
app.use('/appointments', appointmentRoutes)


app.listen(PORT, () => {
console.log(`Server has started on port: ${PORT}`)
 })

