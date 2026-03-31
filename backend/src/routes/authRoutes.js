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

    //Creates a temporary password
    const tempPassword = crypto.randomBytes(5).toString("hex");
    //encrypt password
    const hashedPassword = bcrypt.hashSync(tempPassword, 8)


    const regtoken = crypto.randomBytes(20).toString("hex");
    const registrationToken = crypto.createHash("sha256").update(regtoken).digest("hex");

    // save new user's email and temp password into DB, with their registration token.
    try{
        const user = await prisma.user.create({
            data: {
                username: username,
                password: hashedPassword,
                registerToken: registrationToken,
                verified: false,
            }
        })

        if(!user) {return res.sendStatus(404).send({message: "User not Found"})}
        else
        {

            const sendEmail = async(option) =>
            {
                try {



                    //new NodeMailer SMTP transporter, for Privateemail
                    const transporter = nodemailer.createTransport({
                        host: process.env.EMAIL_HOST,
                        port: 465,
                        secure: true,
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASSWORD
                        }
                    });



                    const mailOption = {
                        from: process.env.EMAIL_USER,
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


            const mailTemplate = (header, content, buttonUrl, buttonText) => {
                return `<!DOCTYPE html>
                <html>
                    <body style="
                    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
                    min-height: 100vh;
                    width: 100%;
                    background: linear-gradient(to bottom, #f8daa3, #e8e1e7f7);
                    background-color: var(--bg-color);
                    transition: background-color .3s ease-in-out;
                    padding: 1rem;
                    gap: 2rem;
                    margin: 10px;
                    ">
                        <div
                        style="
                        display: block;
                        align: center;
                        min-Width: 400px;
                        max-width: 600px;
                        max-height: 800px;
                        margin: 10px;
                        background-color: #fafafa;
                        padding: 2rem;
                        border-radius: 10px;
                        ">
                            <h1 style="text-align: center; font-size: 1.2rem;">
                            ${header}
                            </h1>

                            <p style="text-align: left; font-size: 0.9rem;">
                            ${content}
                            </p>


                            <center>
                                <a href="${buttonUrl}" target="_blank">
                                    <button
                                    style="
                                    background-color: #ec4899;
                                    width: 300px;
                                    height: 40px;
                                    color: white;
                                    border: none;
                                    border-radius: 3px;
                                    padding: .6rem;
                                    font-size: 1rem;
                                    margin:auto;
                                    ">
                                    ${buttonText}
                                    </button>
                                </a>
                            </center>

                            <p style="text-align: left; font-size: 0.9rem;">
                            If you are unable to click the button above, copy paste the URL below into your browser's address bar:
                            </p>

                            <a href="${buttonUrl}" target="_blank">
                                <p style="margin: 0px; text-align: left; font-size: 10px; text-decoration: none;">
                                ${buttonUrl}
                                </p>
                            </a>
                        </div>
                    </body>
                </html>
                `;
            };

            //Send user an email with a recovery code, to change their password

            const mailOption = {
                email: username,
                subject: "BecauseWeCare - Verify your account",
                message: mailTemplate(
                "Complete Account Registration",
                "Please finish registering your BecauseWeCare client account using the link below.",
                `${process.env.FRONTEND_URL}/resetPassword?id=${user.id}&token=${registrationToken}`,
                "Register Account"
                ),
            };
            await sendEmail(mailOption);


            return res.sendStatus(201);

        }
        return res.status(201)

    } catch (error) {
        console.log(error.message)
        return res.sendStatus(503)
    }
})




/*  OLD Register Code (Uses username and hashed password)
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
*/


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


                    //new NodeMailer SMTP transporter, for Privateemail
                    const transporter = nodemailer.createTransport({
                        host: process.env.EMAIL_HOST,
                        port: 465,
                        secure: true,
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASSWORD
                        }
                    });

                    const mailOption = {
                        from: process.env.EMAIL_USER,
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
            const mailTemplate = (header, content, buttonUrl, buttonText) => {
                return `<!DOCTYPE html>
                <html>
                    <body style="
                    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
                    min-height: 100vh;
                    width: 100%;
                    background: linear-gradient(to bottom, #f8daa3, #e8e1e7f7);
                    background-color: var(--bg-color);
                    transition: background-color .3s ease-in-out;
                    padding: 1rem;
                    gap: 2rem;
                    margin: 10px;
                    ">
                        <div
                        style="
                        display: block;
                        align: center;
                        min-Width: 400px;
                        max-width: 600px;
                        max-height: 800px;
                        margin: 10px;
                        background-color: #fafafa;
                        padding: 2rem;
                        border-radius: 10px;
                        ">
                            <h1 style="text-align: center; font-size: 1.2rem;">
                            ${header}
                            </h1>

                            <p style="text-align: left; font-size: 0.9rem;">
                            ${content}
                            </p>


                            <center>
                                <a href="${buttonUrl}" target="_blank">
                                    <button
                                    style="
                                    background-color: #ec4899;
                                    width: 300px;
                                    height: 40px;
                                    color: white;
                                    border: none;
                                    border-radius: 3px;
                                    padding: .6rem;
                                    font-size: 1rem;
                                    margin:auto;
                                    ">
                                    ${buttonText}
                                    </button>
                                </a>
                            </center>

                            <p style="text-align: left; font-size: 0.9rem;">
                            If you are unable to click the button above, copy paste the URL below into your browser's address bar:
                            </p>

                            <a href="${buttonUrl}" target="_blank">
                                <p style="margin: 0px; text-align: left; font-size: 10px; text-decoration: none;">
                                ${buttonUrl}
                                </p>
                            </a>
                        </div>
                    </body>
                </html>
                `;
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
                subject: "BecauseWeCare - Forgot Password Link",
                message: mailTemplate(
                    "Forgot Password",
                    "We have recieved a password reset request for an account registered to this email. \n\nPlease reset your password using the link below.",
                    `${process.env.FRONTEND_URL}/resetPassword?id=${user.id}&token=${resetToken}`,
                    "Reset Password"
                ),
            };
            await sendEmail(mailOption);


            return res.sendStatus(201);

        }

    } catch (err) {
        console.log(err)
        res.sendStatus(503)
    }
})




//Placeholder for the "Contact us" and "Book an Appointment" functionality.

router.post("/contactForm", async(req, res) => {


    const{nameIn, emailIn, subjectIn, messageIn} = req.body


    /*
    //Testing data*
    const emailIn = "testEmail@gmail.com";
    const nameIn = "John Smith";
    const subjectIn = "This is a subject Line!";
    const messageIn = "Lorem ipsum dolor sit amet";
    */

    try {

        const sendEmail = async(option) =>
        {
            try {


                //new NodeMailer SMTP transporter, for Privateemail
                const transporter = nodemailer.createTransport({
                    host: process.env.EMAIL_HOST,
                    port: 465,
                    secure: true,
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASSWORD
                    }
                });

                const mailOption = {
                    from: process.env.EMAIL_USER,
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
        const mailTemplate = (Name, Email, Subject, Message) => {
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
            <h3 style="text-align: left;">
            Recieved a 'Contact Us' request:
            </h3>

            <p style="text-align: left;">
            Name: ${Name}
            </p>
            <p style="text-align: left;">
            Email: ${Email}
            </p>
            <p style="text-align: left;">
            Subject: ${Subject}
            </p>
            <p style="text-align: left;">
            Message: ${Message}
            </p>
            </div>
            </body>
            </html>`;

        };

        const mailOption = {
            email: username,
            subject: `Contact Us - ${subjectIn}`,
            message: mailTemplate(
                `${nameIn}`,
                `${emailIn}`,
                `${subjectIn}`,
                `${messageIn}`
            ),
        };
        await sendEmail(mailOption);


        return res.sendStatus(201);



    } catch(err) {
        console.log(err);
    }

})



//TODO:

router.post("/consultForm", async(req, res) => {

    const{nameIn, emailIn, locationIn, hoursIn, messageIn} = req.body

    /*
    //Testing data
    const emailIn = "testEmail@gmail.com";
    const nameIn = "John Smith";
    const locationIn = "1234 Apple St, Denton, TX, 76201";
    const hoursIn = "16 hours a week";
    const messageIn = "Lorem ipsum dolor sit amet";
    */


    try {

        const sendEmail = async(option) =>
        {
            try {


                //new NodeMailer SMTP transporter, for Privateemail
                const transporter = nodemailer.createTransport({
                    host: process.env.EMAIL_HOST,
                    port: 465,
                    secure: true,
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASSWORD
                    }
                });

                const mailOption = {
                    from: process.env.EMAIL_USER,
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
        const mailTemplate = (Name, Email, location, hours, Message) => {
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
            <h3 style="text-align: left;">
            Recieved a Consultation request:
            </h3>

            <p style="text-align: left;">
            Name: ${Name}
            </p>
            <p style="text-align: left;">
            Email: ${Email}
            </p>
            <p style="text-align: left;">
            Location: ${location}
            </p>
            <p style="text-align: left;">
            Hours per week: ${hours}
            </p>
            <p style="text-align: left;">
            Additional Notes: ${Message}
            </p>
            </div>
            </body>
            </html>`;

        };

        const mailOption = {
            email: username,
            subject: `Request for Consultation`,
            message: mailTemplate(
                `${nameIn}`,
                `${emailIn}`,
                `${locationIn}`,
                `${hoursIn}`,
                `${messageIn}`
            ),
        };
        await sendEmail(mailOption);


        return res.sendStatus(201);



    } catch(err) {
        console.log(err);
    }

})


router.post("/resetPassword", async(req, res) => {
    //Validate that the user ID exists
    const {password, id, token} = req.body

    try {
        const user = await prisma.user.findUnique({
            where: {id: parseInt(id)}
        })

        // If the user is redirected to this page it checks if the link is being used for a password reset,
        // or to complete account registration.
        if(user.resetToken === token)
        {
            const hashedPassword = bcrypt.hashSync(password.password, 8);
            const updatePass = await prisma.user.update({
                where: {username : user.username},
                data:  {password: hashedPassword, resetToken:""},

            });
        }
        else if(user.registerToken === token)
        {
            const hashedPassword = bcrypt.hashSync(password.password, 8);
            const updatePass = await prisma.user.update({
                where: {username : user.username},
                data:  {password: hashedPassword, verified: true, registerToken: ""},

            });
        }

    } catch (err) {
        console.log(err);
        res.sendStatus(503)
    }
});



export default router
