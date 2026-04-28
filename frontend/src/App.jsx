import "./css/App.css"
import Calendar from "./pages/Calendar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import About from "./pages/About";
import ResetPassword from "./pages/Reset"
import FileViewer from "./pages/FileViewer";
import Employee from "./pages/Employee";
import Main from "./layouts/Main";
import MainVerified from "./layouts/LoggedIn";
import Checkin from "./pages/Checkin";
import Schedule from "./pages/Schedule";
import Notes from "./pages/Notes";
import Verify from "./pages/Verify";
import UserManagement from "./pages/UserManagement";

import becausewecareLogo from "./assets/becausewecare_logo.jpg";
import { UserProvider } from "./contexts/UserContext";


import { Navigate } from 'react-router-dom';
import { Routes, Route } from "react-router-dom";
import React, { useState, useEffect } from "react";


const apiBase = 'http://localhost:5003/'

function App() {
  const [isDark, setDark] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadUser() {
      const data = await getUserName();

      if (!isActive) {
        return;
      }

      setUserName(data.name || "");
      setUserRole(data.role || "");
    }

    loadUser();

    return () => {
      isActive = false;
    };
  }, []);




  useEffect(() => {
    const existingIcon = document.querySelector("link[rel~='icon']");
    const icon = existingIcon || document.createElement("link");
    icon.rel = "icon";
    icon.href = becausewecareLogo;
    if (!existingIcon) document.head.appendChild(icon);
  }, []);

  return (
    <UserProvider>
      <Routes>


      {/* Logged Out Routes WITH Navbar + Footer */}
      {userName === "" &&
        <Route element={<Main isDark={isDark} setDark={setDark} />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/calendar" element={<Navigate to="/" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/fileviewer" element={<FileViewer userRole={userRole} />} />
        <Route path="/resetPassword" element={<ResetPassword />}/>
        <Route path="/verify" element={<Verify />}/>
        <Route path="/employee" element={<Navigate to="/" />} />
        <Route path="/checkin" element={<Navigate to="/" />} />
        <Route path="/schedule" element={<Navigate to="/" />} />
        <Route path="/notes" element={<Navigate to="/" />} />
        </Route>
      }

      {/* EMPLOYEE - Logged In Routes WITH Navbar + Footer */}
      { (userName !== "" && (userRole === "ADMIN" || userRole === "CAREGIVER"))&&
        <Route element={<MainVerified isDark={isDark} setDark={setDark} curUser={userName}/>}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/login" element={<Navigate to="/" />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/fileviewer" element={<FileViewer userRole={userRole} />} />
        <Route path="/resetPassword" element={<ResetPassword />}/>
        <Route path="/verify" element={<Verify />}/>
        <Route path="/employee" element={<Employee userRole={userRole}/>} />
        <Route path="/checkin" element={<Checkin />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/userManagement" element={<UserManagement />} />
        </Route>
      }

      {/* PATIENT - Logged In Routes WITH Navbar + Footer */}
      { (userName !== "" && (userRole === "PATIENT" ))&&
        <Route element={<MainVerified isDark={isDark} setDark={setDark} curUser={userName}/>}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/login" element={<Navigate to="/" />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/fileviewer" element={<FileViewer userRole={userRole} />} />
        <Route path="/resetPassword" element={<ResetPassword />}/>
        <Route path="/verify" element={<Verify />}/>
        <Route path="/employee" element={<Navigate to="/" />} />
        <Route path="/checkin" element={<Navigate to="/" />} />
        <Route path="/schedule" element={<Navigate to="/" />} />
        <Route path="/notes" element={<Navigate to="/" />} />
        </Route>
      }


        {/* Employee Route WITHOUT Navbar + Footer */}


      </Routes>
    </UserProvider>
  );
}


async function getUserName()
{
  try {
    const res = await fetch(apiBase + 'auth/getName', {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      return { name: '', role: '' };
    }

    const data = await res.json();
    return { name: data.name || '', role: data.role || '' };
  } catch (error) {
    return { name: '', role: '' };
  }

}


export default App;
