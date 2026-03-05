import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../prismaClient.js'

const router = express.Router()

//Register new user
router.post('/register', async (req, res) => {
    const { username, password } = req.body
    // save user name and encrypted password
    // save email@gmail.com | wadawfawfawf.awfafawfa.wf

    //encrypt password
    const hashedPassword = bcrypt.hashSync(password, 8)

    // save new user and password into DB
    try{
        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword
            }
        })
        // Since User is Created Temp Create First Appointment

        

        // Token Creation
        const token = jwt.sign({id: user.id}, process.env.
        JWT_SECRET, { expiresIn: '24h'})
        return res.status(201).json({token})
    } catch (error) {
        console.log(error.message)
        return res.sendStatus(503)
    }
})

router.post('/login', async(req, res) => {
    // retrieve email, and search for their password
    // but pass is encrypted so we re encrypte the entered password and search for the encrypted password in our database

    const {username, password} = req.body

    try {
       const user = await prisma.user.findUnique({
            where: {
                username: username
            }
        })
        //User not in Database => Exit
        if (!user) { return res.sendStatus(404).send({ message: "User not Found"})}
        // Compare Hashed Passwords
        const passwordIsValid = bcrypt.compareSync(password, user.password)
        if(!passwordIsValid){ return res.status(401).send({ message: "Incorrect Password"})}

        // All Checks Passed
        const token = jwt.sign({ id: user.id}, process.env.JWT_SECRET, {expiresIn: '24h'})
        res.json({token})
    } catch (err) {
        console.log(err.message)
        res.sendStatus(503)
    }
})
export default router
