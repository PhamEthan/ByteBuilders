import jwt from 'jsonwebtoken'
import prisma from '../prismaClient.js'

async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" })
  }

  // Expect "Bearer TOKEN"
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return res.status(401).json({ message: "User not found" })
    }

    // Attach both full user and userId
    req.user = user          
    req.userId = user.id     

    next()
  } catch (err) {
    console.error('JWT error:', err.message)
    return res.status(401).json({ message: "Invalid token" })
  }
}

export default authMiddleware
