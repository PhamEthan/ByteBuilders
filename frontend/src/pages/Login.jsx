import "../css/Login.css"
import { useForm } from "react-hook-form"
import {yupResolver} from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useState } from "react"


function Login(){

    const [showPassword, setShowPassword] = useState(false);

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

    const onSubmit = (data) => {
        console.log(isLogin? "Logging in: " : "Registering: ", data)
        reset()
    };

    return (
        <div className="login">
            <h2>{isLogin ? "Login" : "Register"}</h2>
            
            <form onSubmit={handleSubmit(onSubmit)}> 
                <input type="text" placeholder="Email..." {...register("email")}/>
                <p>{errors.email?.message}</p>
                <input type={showPassword ? "text" : "password"} 
                    placeholder="Password.." {...register("password")}/>
                <button onClick={() => {
                        setShowPassword(!showPassword)
                    }} className="toggle-button"> {showPassword ? "Hide" : "Show"} 
                    </button>
                <p>{errors.password?.message}</p>
                

                {!isLogin && (
                    <div>
                        <input type={showPassword ? "text" : "password"} placeholder="Confirm password"
                            {...register("confirmPassword")}/>
                        <p>{errors.confirmPassword?.message}</p>
                    </div>
                )}

                <input type="submit" />
            </form>

            <p>
                {isLogin ? "Don't have an account?": "Already registered?"}
                <button onClick={()=> {
                    setIsLogin(!isLogin);
                    reset();
                }}>
                    {isLogin ? "Register": "Login"}

                </button>
            </p>


        </div>
    );
}

export default Login;