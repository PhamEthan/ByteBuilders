import { Outlet } from "react-router-dom";
import { NavBarLoggedIn }  from "../Components/NavBar";
import Footer from "../Components/Footer";

function MainVerified({ isDark, setDark, curUser }) {
  return (
    <div className="app-container" data-theme={isDark ? "dark" : "light"}>
      <NavBarLoggedIn isChecked={isDark} handleChange={() => setDark(!isDark)} curUser={curUser}/>
      
      <main className="main">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default MainVerified;
