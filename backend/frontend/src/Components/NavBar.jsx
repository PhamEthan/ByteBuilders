import {Link} from "react-router-dom";
import "../css/NavBar.css"

function NavBar() {
    return <nav classname="navbar">
        <div className="navbar-container">
            <div className="navbar-brand">
                <Link to ="/">Because We Care</Link>
            </div>
            <div className="navbar-links">
                <Link to ="/about" className="nav-link">About Us</Link>
                <Link to ="/calendar" className="nav-link">Calendar</Link>
                <Link to ="/login" className="nav-link">
                    <button className="button">
                        Log In
                    </button>
                </Link>
            </div>
        </div>
    </nav>
}

export default NavBar;