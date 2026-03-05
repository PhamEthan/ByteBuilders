import express from 'express'
import path, {dirname, join} from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/authRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'


const app = express()
const PORT = process.env.PORT || 5003

// Get the file path from URL of currModule
const __filename = fileURLToPath(import.meta.url)
// Retrieve Dir name
const __dirname = dirname(__filename)

//MIDDLEWARE
app.use(express.json())
//Hands over HTML from /public Dir
app.use(express.static(path.join(__dirname, '../public')))
// Now Display HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

//ROUTES
app.use('/auth', authRoutes)
app.use('/appointments', appointmentRoutes)


app.listen(PORT, () => {
console.log(`Server has started on port: ${PORT}`)
 })

