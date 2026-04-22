import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../prismaClient.js'
import { google } from 'googleapis'
import crypto from "crypto"
import nodemailer from 'nodemailer';

const router = express.Router()

import cookieParser from 'cookie-parser';
router.use(cookieParser())

import { createRequire } from "module";
const require = createRequire(import.meta.url);
require("dotenv").config();

let authToken;

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
                `${process.env.FRONTEND_URL}/verify?id=${user.id}&token=${registrationToken}`,
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




router.post('/login', async(req, res) => {
    // retrieve email, and search for their password
    // but pass is encrypted so we re encrypte the entered password and search for the encrypted password in our database

    const {username, password} = req.body

    try {
        console.log("attempting user login")
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
        var cookieName = 'authcookie';
        res.cookie(cookieName, token, {
            httpOnly: true,
            secure: true,
            SameSite: "None",
        });
        res.json({token: token, name: user.fullName})
    } catch (err) {
        console.log(err.message)
        res.sendStatus(503)
    }
})

router.post('/logout', async(req, res) => {

    //responds to the request with a clearCookie signal, deleting the user's auth cookie.
    res.clearCookie('authcookie', {
        httpOnly: true,
        secure: true,
        SameSite: "None",
    }).sendStatus(201);

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


    const{nameIn, emailIn, phoneIn, messageIn} = req.body //CHANGED SUBJECTIN TO PHONEIN


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

                await transporter.sendMail(mailOption);
            } catch(err) {
                console.log(err);
                throw err;
            }
        };


        //TODO: Reformat this to match the website's style and layout!
    const businessTemplate = (Name, Email, Phone, Message) => {
            return `<!DOCTYPE html>
            <html>
                <body style="
                    margin: 0;
                    padding: 24px;
                    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
                    background: linear-gradient(to bottom, #f8daa3, #e8e1e7f7);
                ">
                    <div style="
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #fafafa;
                        padding: 32px;
                        border-radius: 10px;
                    ">
                        <h1 style="
                            text-align: center;
                            font-size: 1.2rem;
                            color: #ec4899;
                            margin-top: 0;
                            margin-bottom: 24px;
                        ">
                            Contact Us Form Submission
                        </h1>

                        <p style="text-align: left; font-size: 0.9rem; color: #000; margin: 0 0 12px 0;">
                            <strong>Name:</strong> ${Name}
                        </p>

                        <p style="text-align: left; font-size: 0.9rem; color: #000; margin: 0 0 12px 0;">
                            <strong>Email:</strong> ${Email}
                        </p>

                        <p style="text-align: left; font-size: 0.9rem; color: #000; margin: 0 0 16px 0;">
                            <strong>Phone:</strong> ${Phone || "Not Provided"}
                        </p>

                        <p style="text-align: left; font-size: 0.9rem; color: #000; margin: 0 0 8px 0;">
                            <strong>Message:</strong>
                        </p>

                        <div style="
                            background-color: rgba(252, 93, 172, 0.1);
                            padding: 14px;
                            border-radius: 8px;
                        ">
                            <p style="
                                text-align: left;
                                font-size: 0.9rem;
                                color: #000;
                                margin: 0;
                                white-space: pre-wrap;
                            ">${Message}
                            </p>
                        </div>
                    </div>
                </body>
            </html>`;
        };      //CHANGED LINE 492 TI PHONE

        const userTemplate = (Name) => {
            return `<!DOCTYPE html>
            <html>
                <body style="
                    margin: 0;
                    padding: 24px;
                    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
                    background: linear-gradient(to bottom, #f8daa3, #e8e1e7f7);
                ">
                    <div style="
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #fafafa;
                        padding: 32px;
                        border-radius: 10px;
                    ">
                        <h1 style="
                            text-align: center;
                            font-size: 1.2rem;
                            color: #ec4899;
                            margin-top: 0;
                            margin-bottom: 24px;
                        ">
                            We received your message
                        </h1>

                        <p style="text-align: left; font-size: 0.9rem; color: #000; margin: 0 0 12px 0;">
                            Hello ${Name},
                        </p>

                        <p style="text-align: left; font-size: 0.9rem; color: #000; margin: 0;">
                            Thank you for contacting Because We Care. We received your message and will get back to you soon.
                        </p>
                    </div>
                </body>
            </html>`;
        };


        const businessMailOption = {
            email: process.env.EMAIL_USER,
            subject: `Contact Us Form Submission`,
            message: businessTemplate(
                `${nameIn}`,
                `${emailIn}`,
                `${phoneIn}`,
                `${messageIn}`
            ),
        };
        const userMailOption = {
            email: emailIn,
            subject: "Because We Care - We received your message",
            message: userTemplate(
                `${nameIn}`
            ),
        };
        await sendEmail(businessMailOption);
        await sendEmail(userMailOption);

        return res.sendStatus(201);



    } catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }

});



router.post("/consultForm", async(req, res) => {

    const{nameIn, emailIn, phoneIn, locationIn, hoursIn, messageIn} = req.body

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

                await transporter.sendMail(mailOption);
            } catch(err) {
                console.log(err);
            }
        };


        //TODO: Reformat this to match the website's style and layout!
       const mailTemplate = (Name, Email, Phone, Location, Hours, Message) => {
            return `<!DOCTYPE html>
            <html>
                <body style="
                    margin: 0;
                    padding: 24px;
                    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
                    background: linear-gradient(to bottom, #f8daa3, #e8e1e7f7);
                ">
                    <div style="
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #fafafa;
                        padding: 32px;
                        border-radius: 10px;
                    ">
                        <h1 style="
                            text-align: center;
                            font-size: 1.2rem;
                            color: #ec4899;
                            margin-top: 0;
                            margin-bottom: 24px;
                        ">
                            Consultation Request
                        </h1>

                        <p style="text-align: left; font-size: 0.9rem; color: #000; margin: 0 0 12px 0;">
                            <strong>Name:</strong> ${Name}
                        </p>

                        <p style="text-align: left; font-size: 0.9rem; color: #000; margin: 0 0 12px 0;">
                            <strong>Email:</strong> ${Email}
                        </p>

                        <p style="text-align: left; font-size: 0.9rem; color: #000; margin: 0 0 12px 0;">
                            <strong>Phone:</strong> ${Phone || "Not Provided"}
                        </p>

                        <p style="text-align: left; font-size: 0.9rem; color: #000; margin: 0 0 12px 0;">
                            <strong>Location:</strong> ${Location || "Not Provided"}
                        </p>

                        <p style="text-align: left; font-size: 0.9rem; color: #000; margin: 0 0 16px 0;">
                            <strong>Hours per week:</strong> ${Hours || "Not Provided"}
                        </p>

                        <p style="text-align: left; font-size: 0.9rem; color: #000; margin: 0 0 8px 0;">
                            <strong>Care Required:</strong>
                        </p>

                        <div style="
                            background-color: rgba(252, 93, 172, 0.1);
                            padding: 14px;
                            border-radius: 8px;
                        ">
                            <p style="
                                text-align: left;
                                font-size: 0.9rem;
                                color: #000;
                                margin: 0;
                                white-space: pre-wrap;
                            ">${Message}
                            </p>
                        </div>
                    </div>
                </body>
            </html>`;
        };
        const userTemplate = (Name) => {
            return `<!DOCTYPE html>
            <html>
                <body style="
                    margin: 0;
                    padding: 24px;
                    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
                    background: linear-gradient(to bottom, #f8daa3, #e8e1e7f7);
                ">
                    <div style="
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #fafafa;
                        padding: 32px;
                        border-radius: 10px;
                    ">
                        <h1 style="
                            text-align: center;
                            font-size: 1.2rem;
                            color: #ec4899;
                            margin-top: 0;
                            margin-bottom: 24px;
                        ">
                            We received your consultation request
                        </h1>

                        <p style="text-align: left; font-size: 0.9rem; color: #000; margin: 0 0 12px 0;">
                            Hello ${Name},
                        </p>

                        <p style="text-align: left; font-size: 0.9rem; color: #000; margin: 0;">
                            Thank you for reaching out to Because We Care. We received your consultation request and will get back to you soon.
                        </p>
                    </div>
                </body>
            </html>`;
        };

        const businessMailOption = {
            email: process.env.EMAIL_USER,
            subject: `Request for Consultation`,
            message: mailTemplate(
                `${nameIn}`,
                `${emailIn}`,
                `${phoneIn}`,
                `${locationIn}`,
                `${hoursIn}`,
                `${messageIn}`
            ),
        };
        const userMailOption = {
            email: emailIn,
            subject: "Because We Care - We received your consultation request",
            message: userTemplate(
                `${nameIn}`
            ),
        };
        await sendEmail(businessMailOption);
        await sendEmail(userMailOption);


        return res.sendStatus(201);



    } catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }

});


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

    } catch (err) {
        console.log(err);
        res.sendStatus(503)
    }
});

router.post("/verifyAcc", async(req, res) => {
    //Validate that the user ID exists
    const {password, id, token, fullName} = req.body

    try {
        const user = await prisma.user.findUnique({
            where: {id: parseInt(id)}
        })

        // If the user is redirected to this page it checks if the link is being used for a password reset,
        // or to complete account registration.

        if(user.registerToken === token)
        {

            const hashedPassword = bcrypt.hashSync(password, 8);
            const updatePass = await prisma.user.update({
                where: {username : user.username},
                data:  {password: hashedPassword, verified: true, registerToken: "", fullName: fullName},

            });
        }

    } catch (err) {
        console.log(err);
        res.sendStatus(503)
    }
});


router.post('/authenticateUser', async(req, res) => {
    const cookieToken = req.cookies.authcookie;
    if(!cookieToken) console.log("invalid cookie");

    let userID;
    jwt.verify(cookieToken, process.env.JWT_SECRET, (err, user) => {
        if(err) return console.log("Error or invalid cookie");
        // req.user = user;
        console.log("Authenticated with cookie as user: ", user);
        userID = user.id;
    });

    const user = await prisma.user.findFirst({
        where: {
            id: userID,
        }
    });

    let authType = user.role;

    if(user.role === 'ADMIN')
    {

        const patients = await prisma.user.findMany({
            where: {
                role: "PATIENT"
            }
        });

        const employee = await prisma.user.findMany({
            where: {
                role: "CAREGIVER"
            },
        });


        res.json({role: authType, events: user.calEvents, fullName: user.fullName, empl: employee, user: patients, id: user.id});
    }
    else
    {
        res.json({role: authType,events: user.calEvents, fullName: user.fullName})
    }
})

router.post("/reqUserEvents", async(req, res) => {

    const { userID } = req.body;

    //Retrieve the user's DB entry
    const user = await prisma.user.findFirst({
        where: {
            id: userID,
        }
    });

    //return the user's list of eventIDs
    let events = user.calEvents;
    //console.log("Authroutes Events: ------------------------\n", events);
    res.json({events: events});

});


router.post('/addEventUsers', async(req, res) => {


    //Adds the event to the "calEvents" db field on eahc of the declared users in userIDs
    const { userIDs, eventID } = req.body;

    try {

        //Adds the eventID to the users' database entry
        const updateUsers = await prisma.user.updateMany({
            where: {
                id: {in: userIDs }
            },
            data: { calEvents: {push: String(eventID)} },
        });

    } catch(err) {
        console.log(err);
    }
});

router.post('/updateEventUsers', async(req, res) => {

    //Removes the eventID from each current user's "calEvents" field.
    //Then adds it to each of the "newEventUsers" "calEvents" field.

    //Not the most elegant solution, but it works!


    var findEventID = req.body.eventID;
    var curEventUsers = [ req.body.caregiver, req.body.patient];
    var newEventUsers = [ req.body.newCaregiver, req.body.newPatient];

    console.log("Cur Users Debug:", curEventUsers);
    console.log("New Users Debug:", newEventUsers);

    try {
        //find users with the event currently, and remove them.
        const foundUsers = await prisma.user.findMany({
            where: {
                fullName: {in: curEventUsers }
            },
        });


        //console.log(findEventID);

        function matchValue(testVal) {
            return testVal != findEventID;
        }

        console.log(foundUsers);
        for(var i = 0; i < foundUsers.length; i++)
        {
            var userEventList = foundUsers[i].calEvents;
            var newEventsList = userEventList.filter(matchValue);

            const updatedUsers = await prisma.user.updateMany({
                where: {
                    fullName: {in: curEventUsers }
                },
                data: { calEvents: newEventsList },
            });

            console.log(updatedUsers);
        }

        //Then next, add the event to the selected users.
        const updateEventUsers = await prisma.user.updateMany({
            where: {
                fullName: {in: newEventUsers }
            },
            data: { calEvents: {push: String(findEventID)} },
        });

        console.log("Updated Users: ", updateEventUsers);


    } catch(err) {
        console.log(err);
    }

})

router.post('/removeEventUser', async(req, res) => {

    var findEventID = req.body.eventID;
    var eventUsers = [ req.body.caregiver, req.body.patient];
    var adminID = req.body.admin;
    try {
        //find users with the event currently.
        var eventUsers = [ req.body.caregiver, req.body.patient];
        const foundUsers = await prisma.user.findMany({
            where: {
                fullName: {in: eventUsers }
            },
        });

        //Finds the admin entry, using the ID of the admin associated with deleting the event.
        const foundAdmin = await prisma.user.findUnique({
            where: {
                id: adminID
            },
        });
        //Adds them to the full list of event users found. (Caregiver, Patient, Admin)
        //eventUsers.push(foundAdmin.fullName);
        var fullArray = foundUsers.concat(foundAdmin);


        //Debugging log
        //console.log(findEventID);


        //Function that matches anything that is NOT a match to the passed value (findEventID);
        function matchValue(testVal) {
            return testVal != findEventID;
        }




        //console.log(fullArray);
        //Iterates through the list of associated users, filtering the eventsList to contain all events EXCEPT the one we're deleting, before passing the new array as an argument to replace the original array of events on each user DB entry.
        for(var i = 0; i < fullArray.length; i++)
        {
            var userEventList = fullArray[i].calEvents;
            var newEventsList = userEventList.filter(matchValue);

            const updatedUsers = await prisma.user.updateMany({
                where: {
                    fullName: {in: eventUsers }
                },
                data: { calEvents: newEventsList },
            });

            console.log(updatedUsers[0].calEvents);
        }
    } catch(err) {
        console.log(err);
    }


});

router.post('/getName', async (req, res)=> {

    const cookieToken = req.cookies.authcookie;
    if(!cookieToken)
    {
        console.log("invalid cookie");
        var name = "";
        res.json({name: name}).send();
    }
    if(cookieToken)
    {
        let userID;
        jwt.verify(cookieToken, process.env.JWT_SECRET, (err, user) => {
            if(err) return console.log("Error or invalid cookie");
            // req.user = user;
            console.log("Authenticated with cookie as user: ", user);
            userID = user.id;
        });

        const user = await prisma.user.findUnique({
            where: {
                id: userID
            },
        });

        var name = user.fullName;
        res.json({name: name}).send();
    }


});

router.post('/updateUserRole', async (req, res) => {
    //userToUpdate = userID, newRole = "ADMIN/CAREGIVER/PATIENT"
    const { userIDToUpdate, newRole } = req.body;

    //Verify user's cookie token before doing anything
    const cookieToken = req.cookies.authcookie;
    if(!cookieToken) console.log("invalid cookie");

    let userID;
    jwt.verify(cookieToken, process.env.JWT_SECRET, (err, user) => {
        if(err) return console.log("Error or invalid cookie");
        // req.user = user;
        console.log("Authenticated with cookie as user: ", user);
        userID = user.id;
    });
    //Check the role of the user associated with the cookie token
    const user = await prisma.user.findUnique({
        where: {
            id: userID
        },
    });
    if(user.role === "ADMIN")
    {
        const user = await prisma.user.update({
            where: {
                id: userIDToUpdate
            },
            data: { role: newRole}
        });

    }
    res.sendStatus(201);

});



export default router;
