import express from 'express'
import { google } from 'googleapis'
import prisma from '../prismaClient.js'
import authMiddleware from '../middleware/authMiddleware.js'

const router = express.Router()

// Google Auth set up
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.SECRET_ID,
  process.env.REDIRECT
)

let tokensSet = false
const CAREGIVER_CALENDAR_ID = 'primary'

// /appointments/login how our client will update/access out calendar
router.get('/login', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar']
  })
  res.redirect(url)
})

// /appointments/redirect
router.get('/redirect', async (req, res) => {
  const code = req.query.code

  if (!code) {
    return res.status(400).send('No ?code provided from Google')
  }

  try {
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)
    tokensSet = true
    console.log('Google Calendar OAuth tokens set.')
    res.redirect('/')
  } catch (err) {
    console.error('Error exchanging code for token:', err)
    res.status(500).send('Failed to authorize Google Calendar.')
  }
})

// check if authorized for calendar
router.get('/available', authMiddleware, async (req, res) => {
  if (!tokensSet) {
    return res.status(400).send('Google calendar is not authorized yet.')
  }

  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    const now = new Date()
    const oneMonthFromNow = new Date()
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)

    const response = await calendar.events.list({
      calendarId: CAREGIVER_CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: oneMonthFromNow.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    })

    const events = response.data.items || []

    // calander only shows AVAILABLE things on google calendar
    const available = events.filter(
      (ev) => (ev.summary || '').toUpperCase().includes('AVAILABLE')
    )

    res.json(available)
  } catch (err) {
    console.error('Error fetching available slots:', err)
    res.status(500).send('Failed to fetch available slots.')
  }
})

// POST /appointments/book/:eventId
router.post('/book/:eventId', authMiddleware, async (req, res) => {
  if (!tokensSet) {
    return res.status(400).send('Google calendar is not authorized yet.')
  }

  const userId = req.userId
  const eventId = req.params.eventId

  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // Load the event from Google
    const { data: event } = await calendar.events.get({
      calendarId: CAREGIVER_CALENDAR_ID,
      eventId
    })

    if (!event) {
      return res.status(404).send('Event not found in calendar.')
    }

    const summary = (event.summary || '').toUpperCase()
    if (!summary.includes('AVAILABLE')) {
      return res.status(400).send('This slot is not available anymore.')
    }

    // Get user's username
    const userEmail = req.user?.username || 'Unknown user'

    // update booked events 
    const updatedEvent = {
      ...event,
      summary: `BOOKED - ${userEmail}`,
      description: `Booked via caregiver app by ${userEmail}`,
      attendees: [
        ...(event.attendees || []),
        { email: userEmail }
      ]
    }

    await calendar.events.update({
      calendarId: CAREGIVER_CALENDAR_ID,
      eventId,
      resource: updatedEvent
    })

    // store in prisma 
    const startIso = event.start.dateTime || event.start.date
    const endIso = event.end.dateTime || event.end.date

    const appointment = await prisma.appointment.upsert({
      where: { googleEventId: eventId }, 
      update: {
        startTime: new Date(startIso),
        endTime: new Date(endIso),
        status: 'BOOKED',
        patientId: userId
      },
      create: {
        startTime: new Date(startIso),
        endTime: new Date(endIso),
        status: 'BOOKED',
        googleEventId: eventId,
        patientId: userId
      }
    })

    res.json(appointment)
  } catch (err) {
    console.error('Error booking appointment:', err)
    if (err.code === 'P2002') {
      return res.status(400).send('This slot has already been booked.')
    }
    res.status(500).send('Failed to book appointment.')
  }
})

// CANCEL FEATURE
router.post('/cancel/:eventId', authMiddleware, async (req, res) => {
  if (!tokensSet) {
    return res.status(400).send('Google calendar is not authorized yet.')
  }

  const userId = req.userId
  const eventId = req.params.eventId

  try {
    // Search for Appointment in Users table 
    const existing = await prisma.appointment.findFirst({
      where: {
        googleEventId: eventId,
        patientId: userId,
        status: 'BOOKED'
      }
    })

    if (!existing) {
      return res
        .status(404)
        .json({ message: 'You do not have an active booking for this event.' })
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // Load from Google Calendar 
    let event = null
    try {
      const { data } = await calendar.events.get({
        calendarId: CAREGIVER_CALENDAR_ID,
        eventId
      })
      event = data
    } catch (err) {
      if (err.code === 404 || (err.response && err.response.status === 404)) {
        console.warn(`Google event ${eventId} not found; cancelling in DB only`)
      } else {
        throw err
      }
    }

    // IF its a real event then lets set it to AVAILABLE again on the google calander 
    if (event) {
      const updatedEvent = {
        ...event,
        summary: 'AVAILABLE'
      }

      await calendar.events.update({
        calendarId: CAREGIVER_CALENDAR_ID,
        eventId,
        resource: updatedEvent
      })
    }

    // now store as canelled 
    await prisma.appointment.update({
      where: { id: existing.id },
      data: { status: 'CANCELLED' }
    })

    res.json({ message: 'Appointment cancelled.' })
  } catch (err) {
    console.error('Error cancelling appointment:', err)
    res
      .status(500)
      .json({ message: 'Failed to cancel appointment.', error: err.message })
  }
})

// SHOW USERS CURR APPOINTMENTS 
router.get('/mine', authMiddleware, async (req, res) => {
  const userId = req.userId

  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: userId,
        status: 'BOOKED',
        startTime: { gte: new Date() } 
      },
      orderBy: {
        startTime: 'asc'
      }
    })
    res.json(appointments)
  } catch (err) {
    console.error('Error fetching user appointments:', err)
    res.status(500).json({ message: 'Failed to load appointments' })
  }
})

export default router
