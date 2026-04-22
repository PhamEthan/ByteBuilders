import "./css/App.css"
import Calendar from "./pages/Calendar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import About from "./pages/About";
import ResetPassword from "./pages/Reset"
import FileViewer from "./pages/FileViewer";
import Employee from "./pages/Employee";
import Main from "./layouts/Main";
import Checkin from "./pages/Checkin";
import Schedule from "./pages/Schedule";
import Notes from "./pages/Notes";
import becausewecareLogo from "./assets/becausewecare_logo.jpg";
import { UserProvider } from "./contexts/UserContext";

import { Routes, Route } from "react-router-dom";
import React, { useState, useEffect } from "react";

function App() {
  const [isDark, setDark] = useState(false);

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

        {/* Routes WITH Navbar + Footer */}
        <Route element={<Main isDark={isDark} setDark={setDark} />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/login" element={<Login />} />
        <Route path="/fileviewer" element={<FileViewer />} />
        <Route path="/resetPassword" element={<ResetPassword />}/>
        </Route>

        {/* Employee Route WITHOUT Navbar + Footer */}
        <Route path="/employee" element={<Employee />} />
        <Route path="/checkin" element={<Checkin />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/notes" element={<Notes />} />

      </Routes>
    </UserProvider>
  );
}

export default App;
