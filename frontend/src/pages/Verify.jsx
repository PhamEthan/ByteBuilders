import "../css/Login.css"
import { useForm } from "react-hook-form"
import {yupResolver} from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useState } from "react"
import {
    useSearchParams
} from "react-router-dom";

// ===== GLOBAL STATE =====

const apiBase = 'https://becausewecare.onrender.com/'

function Verify(){

    const [verifyAcc, setVerifyAcc] = useState(false);

    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const token = searchParams.get("token");


    const verifySchema = yup.object().shape({
        fullName: yup.string().required("Full Name Required"),
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




        {verifyAcc && (
            <p className="error">{"Account registration completed."}</p>
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
            body: JSON.stringify({ id: id, fullName: data.fullName, token: token })
        })
        if (!res.ok) {
            throw new Error(data.message || 'Failed to authenticate.')
        }
        if(res.status === 201)
        {
            window.location.replace("/");
        }


    } catch (err) {
        console.log(err);
    }
}



export default Verify;
