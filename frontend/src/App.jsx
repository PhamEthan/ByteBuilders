import './css/App.css'
import Calendar from "./pages/Calendar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import About from "./pages/About";
import FileViewer from "./pages/FileViewer";
import {Routes, Route} from "react-router-dom"
import NavBar from "./Components/NavBar";
import Footer from "./Components/Footer";
import React, { useState } from "react";


function App() {
  const [isDark, setDark] = useState(false);

  return (
    <div className="app-container" data-theme={isDark ? "dark" : "light"}> 
      <NavBar isChecked={isDark} handleChange={() => setDark(!isDark)} />
      <main className ="main">
        <Routes>
          <Route path="/" element={<Home />}/>
          <Route path="/about" element={<About />}/>
          <Route path="/calendar" element={<Calendar />}/>
          <Route path="/login" element={<Login />}/>
          <Route path="/fileviewer" element={<FileViewer />}/>
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
