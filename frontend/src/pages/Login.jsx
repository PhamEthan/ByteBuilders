import "../css/Login.css"
import { useForm } from "react-hook-form"
import {yupResolver} from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useState } from "react"

const MAX_PASS_LEN = 20
const MIN_PASS_LEN = 6
const PASS_REQUIREMENTS = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/

//TODO: Clean up and reformat Forgot Password and user registration email HTML formatting
//      Fix the button on the emails

//TODO: Create 2FA email and logic

// ===== GLOBAL STATE =====
let token = localStorage.getItem('token') || null
let isAuthenticating = false

const apiBase = 'http://localhost:5003/'

function Login(){


    const [resetPassword, setResetPassword] = useState(false);

    const [isLogin, setIsLogin] = useState(true);

    const loginSchema = yup.object().shape({
        email: yup.string().email("Invalid format").required("Email is required"),
        password: yup.string().min(MIN_PASS_LEN, "Incorrect password").max(MAX_PASS_LEN).required("Password is required")
    });

    const registerSchema = yup.object().shape({
        email: yup.string().email("Invalid format").required("Email required"),
        password: yup.string().min(MIN_PASS_LEN, "Must be at least 6 characters").max(MAX_PASS_LEN,"Must be 20 characters or less")
            .required("Password Required").matches(PASS_REQUIREMENTS, "Password must include uppercase, lowercase, a number, and a special character"),
        
        confirmPassword: yup.string().oneOf([yup.ref("password"),null], "Passwords Don't Match").required("Re-enter Password")
        });

    const resetSchema = yup.object().shape({
        email: yup.string().email("Invalid format").required("Email required")
    });

    const schema = resetPassword ? resetSchema : (isLogin ? loginSchema : registerSchema);

    const {register, handleSubmit, reset, formState: {errors}} = useForm({
        resolver: yupResolver(schema),
    });



    //When submitting login or registration data, we (currently) output it to the console log for debugging, and then run an authentication call with the database server
    const onSubmit = (data) => {
        //TODO: Remove this before deployment


        //calls to authenticate, to speak to the authentication middleware, to check against current entries in the database.
        if(!resetPassword)
        {
            authenticate(data.email, data.password, isLogin)
        }
        else
        {
            forgotPassword(data.email)
        }

        //TODO: Add redirect functionality, after authenticated login or registration.

        reset()
    };

    return (
        <div className="login">
            <h1>{isLogin ? "Welcome Back!" : "Welcome!"}</h1>
            <div className="login-container">
                <h2>{resetPassword ? "Reset Password" : (isLogin ? "Login" : "Register")}</h2>
                
                <form onSubmit={handleSubmit(onSubmit)} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input type="text" placeholder="ex@email.com" {...register("email")}
                            className="form-input"/>
                        <p className="error">{errors.email?.message}</p>
                    </div>

                    {/* Hide both password input forms when resetting password, since we only need the email */}
                    {!resetPassword && (
                        <div className="form-group">
                            <div className="password-field">
                            <label htmlFor="password" className="form-label">Password</label>
                            <input type="password"
                                placeholder="******" {...register("password")} maxLength={MAX_PASS_LEN}
                                className="form-input"/>
                            </div>

                            <p className="error">{errors.password?.message}</p>
                        </div>
                    )}

                    

                    {!isLogin && !resetPassword && (
                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
                            <input type="password" 
                                placeholder="******"
                                {...register("confirmPassword")}
                                maxLength={MAX_PASS_LEN}
                                className="form-input"/>
                            <p className="error">{errors.confirmPassword?.message}</p>
                        </div>
                    )}
                     
                    <button type="submit" className="submit-btn">
                        {resetPassword ? "Reset" : (isLogin ? "Login":"Register")}
                    </button>

                    
                </form>

                {/* Only displays the forgot password button while on the "login" page */}
                {!resetPassword && isLogin && (
                    <p className="switch-txt">
                        {"Forgot your password?"}
                        <button onClick={()=> {
                            //TODO: Make this prettier, and fit into the UI better :)
                            setIsLogin(true);
                            setResetPassword(true);
                        }}
                        type="Forgot Password" className="switch-btn">
                        {"Forgot Password"}
                        </button>
                    </p>
                )}


                <p className="switch-txt">
                    {isLogin ? "Don't have an account?": "Already have an account?"}
                    <button onClick={()=> {

                        //disables the "reset password" formatting when switching to login or register
                        setResetPassword(false);
                        setIsLogin(!isLogin);
                        reset();
                    }} className="switch-btn">
                        {isLogin ? "Register": "Login"}

                    </button>
                </p>

            </div>
        </div>
    );
}

async function forgotPassword(emailVal)
{

    //Onsubmit, verify that the user email exists.
    console.log("Authenticating user email with database");
    let res
    try {

        res = await fetch(apiBase + 'auth/forgotPassword', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: emailVal})
        })

        if(res.ok)
        {
            //If Yes, send user a password reset link, or code.
            console.log("Authenticated user email");
            //TOOD: Add Password reset email code here
        }
        else
        {
            //If No, do nothing.
            console.log("User does not exist")
        }
    } catch(err) {
        console.log(err.message)
        res.sendStatus(503)
    }

    //Display a message either way stating something like "If a user account with this email exists, a password reset link has been sent."

}

async function authenticate(emailVal, passVal, isLogin) {

    //TODO: Make sure that passVal.length is consistent with the password length for the input box on the frontend
    if (
        isAuthenticating ||
        !emailVal ||
        !passVal ||
        passVal.length < MIN_PASS_LEN ||
        passVal.length > MAX_PASS_LEN
    )

    isAuthenticating = true

    try {
        let res
        if (!isLogin) {
            // register
            res = await fetch(apiBase + 'auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: emailVal, password: passVal })
            })
        } else {
            // login
            res = await fetch(apiBase + 'auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: emailVal, password: passVal })
            })
        }

        const data = await res.json().catch(() => ({}))

        if (!res.ok || !data.token) {
            throw new Error(data.message || 'Failed to authenticate.')
        }

        token = data.token
        localStorage.setItem('token', token)


        //TODO: Add things here to output errors to the frontend, for users to see, instead of only showing it in the browser's console
    } catch (err) {

    } finally {

    }
}



export default Login;
