import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../prismaClient.js'
import { google } from 'googleapis'
import crypto from "crypto"
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
const router = express.Router()

import { createRequire } from "module";
const require = createRequire(import.meta.url);
require("dotenv").config();

let authToken;

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.SECRET_ID,
    process.env.REDIRECT
)

router.get('/login', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar https://mail.google.com/']
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
        authtoken = tokens
        tokensSet = true
        console.log('Google Calendar OAuth tokens set.')
        res.redirect('/')
    } catch (err) {
        console.error('Error exchanging code for token:', err)
        res.status(500).send('Failed to authorize Google Calendar.')
    }
})


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


// Employees can create a registration token for new patients to be registered.
// This token will be used in the registration page alongside a username and password for creating an account.

router.post('/createRegistrationCode', async(req, res) => {

    try{

        //Optionally, add date of birth as a requirement
        const { name } = req.body;

        const token = crypto.randomBytes(20).toString("hex");
        const registrationToken = crypto.createHash("sha256").update(token).digest("hex");

        const createUser = await prisma.user.create({
            data: {
                fullName: name,
                registerToken: registrationToken,
                //TODO: Either rework the schema to not require a username and password, and instead require a name and token, OR generate a replacable username and password when creating the registration Token
                //username:
            }
        });

    } catch(err) {
        console.log(err);
    }

});


//Reset password request
router.post('/forgotPassword', async(req, res) => {

    const {username} = req.body
    try{
        const user = await prisma.user.findUnique({
            where: {
                username: username
            }
        })

        if(!user) {return res.sendStatus(404).send({message: "User not Found"})}
        else
        {

            const sendEmail = async(option) =>
            {
                try {


                    //TODO: work with Everardo to get this all tested and working with the actual email, going forward

                    //new NodeMailer SMTP transporter, for Privateemail
                    {/*
                    const transporter = nodemailer.createTransport({
                        host: process.env.EMAIL_HOST,
                        port: 465,
                        secure: true,
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASSWORD
                        }
                    });
                */}


                    const transporter = nodemailer.createTransport({
                        service: "gmail",
                        auth: {

                            user: "jarodmmoore@gmail.com",
                            pass: process.env.GOOGLE_APP_PASSWORD, // The 16-character App Password
                        },
                    });

                    const mailOption = {
                        from: process.env.EMAIL_ID,
                        to: option.email,
                        subject: option.subject,
                        html: option.message
                    };

                    await transporter.sendMail(mailOption, (err, info) => {
                        if(err) console.log(err);
                    });
                } catch(err) {
                    console.log(err);
                }
            };


            //TODO: Reformat this to match the website's style and layout!
            const mailTemplate = (content, buttonUrl, buttonText) => {
                return `<!DOCTYPE html>
                <html>
                <body style="text-align: center; font-family: 'Verdana', serif; color: #000;">
                <div
                style="
                max-width: 400px;
                margin: 10px;
                background-color: #fafafa;
                padding: 25px;
                border-radius: 20px;
                "
                >
                <p style="text-align: left;">
                ${content}
                </p>
                <a href="${buttonUrl}" target="_blank">
                <button
                style="
                background-color: #444394;
                border: 0;
                width: 200px;
                height: 30px;
                border-radius: 6px;
                color: #fff;
                "
                >
                ${buttonText}
                </button>
                </a>
                <p style="text-align: left;">
                If you are unable to click the above button, copy paste the below URL into your address bar
                </p>
                <a href="${buttonUrl}" target="_blank">
                <p style="margin: 0px; text-align: left; font-size: 10px; text-decoration: none;">
                ${buttonUrl}
                </p>
                </a>
                </div>
                </body>
                </html>`;
            };

            //Send user an email with a recovery code, to change their password.
            const token = crypto.randomBytes(20).toString("hex");

            const resetToken = crypto.createHash("sha256").update(token).digest("hex");

            //add token to user's db entry
            const updateToken = await prisma.user.update({
                where: {username : username},
                data:  {resetToken: resetToken},
            });

            const mailOption = {
                email: username,
                subject: "Forgot Password Link",
                message: mailTemplate(
                    "We have recieved a password reset request. Please reset your password using the link below.",
                    `${process.env.FRONTEND_URL}/resetPassword?id=${user.id}&token=${resetToken}`,
                    "Reset Password"
                ),
            };
            await sendEmail(mailOption);
            res.json({
                success: true,
                message: "A password reset link has been sent to your email.",
            });

            return res.sendStatus(201);

        }

    } catch (err) {
        console.log(err)
        res.sendStatus(503)
    }
})


router.post("/resetPassword", async(req, res) => {
    //Validate that the user ID exists
    console.log(req.body)
    const {password, id, token} = req.body

    try {
        const user = await prisma.user.findUnique({
            where: {id: parseInt(id)}
        })
        if(user.resetToken === token)
        {
            const hashedPassword = bcrypt.hashSync(password.password, 8);
            console.log("Hashed Pass: ", hashedPassword)
            const updatePass = await prisma.user.update({
                where: {username : user.username},
                data:  {password: hashedPassword},
            });
        }

        res.redirect(`${process.env.FRONTEND_URL}`);
    } catch (err) {
        console.log(err);
        res.sendStatus(503)
    }

});

export default router
