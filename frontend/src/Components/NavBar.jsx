import {Link} from "react-router-dom";
import "../css/NavBar.css"


function NavBar({handleChange, isChecked}) {
    return (
        <nav classname="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <Link to ="/">Because We Care</Link>
                </div>
                <div className="navbar-links">
                    <Link to ="/about" className="nav-link">About Us</Link>

                    <Link to ="/login" className="nav-link">
                        <button className="button">
                            Log In
                        </button>
                    </Link>
                    <div className="toggle-container">
                        <input
                            type="checkbox"
                            id="check"
                            className="toggle"
                            onChange={handleChange}
                            checked={isChecked}
                        />
                        <label htmlFor="check"></label>
                    </div>
                </div>

            </div>

        </nav>
    );
}

function NavBarLoggedIn({handleChange, isChecked, curUser}) {
    console.log(isChecked);
    return (
        <nav classname="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <Link to ="/">Because We Care</Link>
                </div>
                <div className="navbar-links">
                    <Link to ="/about" className="nav-link">About Us</Link>
                    <Link to ="/calendar" className="nav-link">Calendar</Link>
                    <Link to ="/fileviewer" className="nav-link">Files</Link>
                    <Link to="/employee" className="nav-link">Employee Portal</Link>
                    <div className="logoutBox">
                    <p className="text-formatted" value={curUser}> {curUser} </p>
                    <Link to ="/logout" className="nav-link">
                        <button className="button">
                            Log Out
                        </button>
                    </Link>
                    </div>
                    <div className="toggle-container">
                            <input 
                                type="checkbox" 
                                id="check" 
                                className="toggle" 
                                onChange={handleChange} 
                                checked={isChecked}
                            />
                            <label htmlFor="check"></label>
                    </div>
                </div>
                
            </div>

        </nav>
    );
}

export { NavBar as default, NavBarLoggedIn} ;
