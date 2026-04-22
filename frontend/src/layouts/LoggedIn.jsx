import { Outlet } from "react-router-dom";
import { NavBarLoggedIn }  from "../Components/NavBar";
import Footer from "../Components/Footer";

function MainVerified({ isDark, setDark, userName }) {
  return (
    <div className="app-container" data-theme={isDark ? "dark" : "light"}>
      <NavBarLoggedIn isChecked={isDark} handleChange={() => setDark(!isDark)} curUser={userName}/>
      
      <main className="main">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default MainVerified;
