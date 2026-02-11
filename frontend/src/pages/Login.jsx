import "../css/Login.css"
import { useForm } from "react-hook-form"
import {yupResolver} from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useState } from "react"

// ===== GLOBAL STATE =====
let token = localStorage.getItem('token') || null
let isAuthenticating = false
let isLogin

const apiBase = 'http://localhost:5003/'


function Login(){


    const [isLogin, setIsLogin] = useState(true);

    const loginSchema = yup.object().shape({
        email: yup.string().email("Invalid format").required("Email is required"),
        password: yup.string().min(4, "Incorrect password").max(20).required()
    });

    const registerSchema = yup.object().shape({
        email: yup.string().email("Invalid format").required("Email required"),
        password: yup.string().min(4, "Must be at least 4 characters").max(20,"Must be less than 20 characters")
            .required("Password Required"),
        confirmPassword: yup.string().oneOf([yup.ref("password"),null], "Passwords Don't Match").required("Re-enter Password")
        });

    const schema = isLogin ? loginSchema : registerSchema;

    const {register, handleSubmit, reset, formState: {errors}} = useForm({
        resolver: yupResolver(schema),
    });

    //When submitting login or registration data, we (currently) output it to the console log for debugging, and then run an authentication call with the database server
    const onSubmit = (data) => {
        console.log(isLogin? "Logging in: " : "Registering: ", data)

        //calls to authenticate, to speak to the authentication middleware, to check against current entries in the database.
        authenticate(data.email, data.password)

        //TODO: Add redirect functionality, after authenticated login or registration.

        reset()
    };

    return (
        <div className="login">
            <h1>{isLogin ? "Welcome Back!" : "Welcome!"}</h1>
            <div className="login-container">
                <h2>{isLogin ? "Login" : "Register"}</h2>
                
                <form onSubmit={handleSubmit(onSubmit)} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input type="text" placeholder="ex@hotmail.com" {...register("email")}
                            className="form-input"/>
                        <p className="error">{errors.email?.message}</p>

                    </div>

                    <div className="form-group">
                        <div className="password-field">
                            <label htmlFor="password" className="form-label">Password</label>
                            <input type="password" 
                                placeholder="******" {...register("password")}
                                className="form-input"
                            />
                        </div>
                        <p className="error">{errors.password?.message}</p>
                        
                    </div>
                    

                    {!isLogin && (
                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
                            <input type="password" 
                                placeholder="******"
                                {...register("confirmPassword")}
                                className="form-input"/>
                            <p className="error">{errors.confirmPassword?.message}</p>
                        </div>
                    )}
                     
                    <button type="submit" className="submit-btn">
                        {isLogin ? "Login":"Register"}
                    </button>
                    
                </form>

                <p className="switch-txt">
                    {isLogin ? "Don't have an account?": "Already have an account?"}
                    <button onClick={()=> {
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


async function authenticate(emailVal, passVal) {
    console.log(emailVal, passVal)

    //TODO: Make sure that passVal.length is consistent with the password length for the input box on the frontend
    if (
        isAuthenticating ||
        !emailVal ||
        !passVal ||
        passVal.length < 6
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
