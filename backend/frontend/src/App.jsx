import './css/App.css'
import Calendar from "./pages/Calendar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import About from "./pages/About";
import {Routes, Route} from "react-router-dom"
import NavBar from "./Components/NavBar";
import Footer from "./Components/Footer";


function App() {
  return (
    <div>
      <NavBar />
      <main className ="main">
        <Routes>
          <Route path="/" element={<Home />}/>
          <Route path="/about" element={<About />}/>
          <Route path="/calendar" element={<Calendar />}/>
          <Route path="/login" element={<Login />}/>
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
