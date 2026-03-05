import { Outlet } from "react-router-dom";
import NavBar from "../Components/NavBar";
import Footer from "../Components/Footer";

function Main({ isDark, setDark }) {
  return (
    <div className="app-container" data-theme={isDark ? "dark" : "light"}>
      <NavBar isChecked={isDark} handleChange={() => setDark(!isDark)} />
      
      <main className="main">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default Main;