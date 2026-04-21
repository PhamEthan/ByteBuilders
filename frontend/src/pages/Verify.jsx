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

function Verify(){

    const [verifyAcc, setVerifyAcc] = useState(false);

    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const token = searchParams.get("token");


    const verifySchema = yup.object().shape({
        fullName: yup.string().required("Full Name Required"),
        password: yup.string().min(4, "New password must be at least 4 characters").max(20,"New Password must be less than 20 characters").required("Password Required"),
        confirmPassword: yup.string().oneOf([yup.ref("password"),null], "Passwords Don't Match").required("Re-enter Password")
    });


    const schema = verifySchema;

    const {register, handleSubmit, reset, formState: {errors}} = useForm({
        resolver: yupResolver(schema),
    });

    const onSubmit = (data) => {

        verifyAccout(data, id, token);
        setVerifyAcc(true);
        //Optionally can redirect to the login page again.
        reset()
    };

    return (
        <div className="login">
        <div className="login-container">
        <h2>{"Finish Registering"}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="reset-form">


        {!verifyAcc && (
            <div className="form-group">
            <label htmlFor="fullName" className="form-label">FullName</label>
            <input type="text"
            placeholder="Jane Doe" {...register("fullName")}
            className="form-input"/>

            <p className="error">{errors.fullName?.message}</p>
            </div>
        )}


        {!verifyAcc && (
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


        {!verifyAcc && (
            <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
            <input type="password"
            placeholder="******"
            {...register("confirmPassword")}
            className="form-input"/>
            <p className="error">{errors.confirmPassword?.message}</p>
            </div>
        )}

        {verifyAcc && (
            <p className="error">{"Password has been reset."}</p>
        )}


        {!verifyAcc && (
        <button type="submit" className="submit-btn">
        {"Submit"}
        </button>
        )}


        </form>

        </div>
        </div>
    );
}

async function verifyAccout(data, id, token)
{

    try {
        console.log("Testing");
        let res;
        res = await fetch(apiBase + 'auth/verifyAcc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: data.password, id: id, fullName: data.fullName, token: token })
        })
        if (!res.ok) {
            throw new Error(data.message || 'Failed to authenticate.')
        }


    } catch (err) {
        console.log(err);
    }
}



export default Verify;
