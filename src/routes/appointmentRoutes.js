import express from 'express'
import prisma from '../prismaClient.js'

const router = express.Router()

// Get Appointments
router.get('/', async(req, res) => {
    const appointments = await prisma.todo.findMany({
        where: {
            userId: req.userId
        }
    })
})

// Create a New Appointment
router.post('/', async(req, res) => {

})

// Update Appointment
router.put('/:id', (req, res) => {

})

// Delete Appointment

router.delete('/:id', (req, res) => {

})

export default router