import "../css/Login.css"
import { useForm } from "react-hook-form"
import {yupResolver} from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useState } from "react"
import {
    useSearchParams
} from "react-router-dom";

// ===== GLOBAL STATE =====

const apiBase = 'http://localhost:5003/'




function ResetPassword(){

    const [resetPassword, setResetPassword] = useState(false);

    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const token = searchParams.get("token");


    const pwResetSchema = yup.object().shape({
        password: yup.string().min(4, "New password must be at least 4 characters").max(20,"New Password must be less than 20 characters").required("Password Required"),
        confirmPassword: yup.string().oneOf([yup.ref("password"),null], "Passwords Don't Match").required("Re-enter Password")
    });

    const schema = pwResetSchema;

    const {register, handleSubmit, reset, formState: {errors}} = useForm({
        resolver: yupResolver(schema),
    });

    const onSubmit = (data) => {

        resetPW(data, id, token);
        setResetPassword(true);
        //Optionally can redirect to the login page again.
        reset()
    };

    return (
        <div className="login">
        <div className="login-container">
        <h2>{"Forgot Password"}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="reset-form">

        {!resetPassword && (
            <div className="form-group">
            <div className="password-field">
            <label htmlFor="password" className="form-label">Password</label>
            <input type="password"
            placeholder="******" {...register("password")}
            className="form-input"/>
            </div>

            <p className="error">{errors.password?.message}</p>
            </div>
        )}




        {!resetPassword && (
            <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
            <input type="password"
            placeholder="******"
            {...register("confirmPassword")}
            className="form-input"/>
            <p className="error">{errors.confirmPassword?.message}</p>
            </div>
        )}

        {resetPassword && (
            <p className="error">{"Password has been reset."}</p>
        )}


        {!resetPassword && (
        <button type="submit" className="submit-btn">
        {"Submit"}
        </button>
        )}


        </form>

        </div>
        </div>
    );
}

async function resetPW(data, id, token)
{

    try {
        let res
        res = await fetch(apiBase + 'auth/resetPassword', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: data, id: id, token: token })
        })
        if (!res.ok) {
            throw new Error(data.message || 'Failed to authenticate.')
        }



    } catch (err) {
        console.log(err);
    }
}



export default ResetPassword;
