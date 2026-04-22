import "../css/Logout.css"

// ===== GLOBAL STATE =====

const apiBase = 'http://localhost:5003/'

function Logout(){

    logoutUser();

    return (
        <div className="logout">
        <div className="logout-container">
        <h2>{"You have been logged out."}</h2>
        </div>
        </div>
    );
}

async function logoutUser()
{
    //Sends a request to the server to log out.
    let res = await fetch(apiBase + 'auth/logout', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });
    if(res.status === 201)
    {
        window.location.replace("/");
    }


};



export default Logout;
