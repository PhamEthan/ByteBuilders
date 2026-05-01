import "../css/UserManagement.css"
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useState } from "react";

// ===== GLOBAL STATE =====
const apiBase = 'http://localhost:5003/'


function UserManagement(){



    const [curRole, setCurRole] = useState(true);

    const [userList, setUserList] = useState([]);

    const [isAuth, setIsAuth] = useState(false);

    const [selectedUser, setSelectedUser] = useState("");
    const [selectedRole, setSelectedRole] = useState("");

    var roles = ["PATIENT", "CAREGIVER", "ADMIN"];

    const [requestSuccess, setRequestSuccess] = useState(false);
    const [message, setMessage] = useState("ASDF");

    function handleUserSelect(e)
    {

        //Recieves the value as a string with a comma. The values are then split.
        //console.log("Selected Employee: ", e.target.value);
        const userSel = e.target.value;
        //the first value is the userID, the second value is their name.
        setSelectedUser(userSel);

        var currentUserRole = userSel.split(",");
        setCurRole(currentUserRole[1]);
    }

    function handleRoleSelect(e)
    {

        //console.log("Selected User: ", e.target.value);
        const roleSel = e.target.value;

        setSelectedRole(roleSel);

    }


    //Authenticates the user from their cookie once
    if(!isAuth)
    {
        (async () => {
            //TODO: Add authentication code here, like with calendar.jsx
            var data = await authenticate();

            setUserList(data);
            setIsAuth(true);
        })()
    }

    const deleteUser = () => {

        var user = selectedUser;
        requestDeleteUser(selectedUser);

        setRequestSuccess(true);
        setMessage("User has been deleted.");



    };

    const updateUser = () => {

        var user = selectedUser;
        var role = selectedRole;

        updateUserRole(user, role);
        setRequestSuccess(true);
        setMessage("User's role has been updated.");

    };

    const cancelAction = () => {
        window.location.replace("/employee");
    }


    return (
        <div className="login">
        <h1>User Management</h1>
        <div className="login-container">





        <p className="error">{}</p>

        <h2> Update/Delete </h2>
        { !requestSuccess &&
            <form className="login-form">
            <div className="form-group">


            {/* User selection box */}
            <div className = "form-dropdown">
            <label htmlFor="event-employee">User</label>
            <select
            name="Caregivers"
            onChange={e => handleUserSelect(e)}
            //value={eventEmployee}
            required
            >
            <option value="">Select a User</option>
            {userList.map((user, key) =>  (
                <option key={key} value={user}>
                {user[0]}
                </option>
            ))}
            </select>
            </div>

            {/* User's current Role*/}
            <label htmlFor="event-patient">Current Role</label>
            <div className = "display-box" value={curRole}>
            {curRole}
            </div>

            {/* User New Role selection box */}
            <div className = "form-dropdown">
            <label htmlFor="event-patient">New Role</label>
            <select
            name="Patients"
            onChange={e => handleRoleSelect(e)}
            //value={eventUser}
            required
            >
            <option value="">Select a Role</option>
            {roles.map((roles, key) =>  (
                <option key={key} value={roles}>
                {roles}
                </option>
            ))}
            </select>
            </div>

            <div className="button-div">
            <button
            type="button"
            className="submit-btn"
            onClick={updateUser}
            >Update
            </button>
            <button
            type="button"
            className="submit-btn"
            onClick={deleteUser}
            >Delete
            </button>
            <button
            type="button"
            className="submit-btn"
            onClick={cancelAction}
            >Cancel
            </button>

            </div>

            </div>

            </form>
        }

        { requestSuccess &&

            <div  className = "return-div">
            <div className = "message-box" value={message}>
            {message}
            </div>
            <button
            type="button"
            className="return-btn"
            onClick={cancelAction}
            >Return
            </button>
            </div>

        }

        </div>
        </div>

    );
}



async function authenticate()
{

    //TODO: Make the API call for this!!
    let res = await fetch(apiBase + 'auth/getUsersList', {
        credentials: 'include',
        method: 'POST',
        header: { 'Content-Type' : 'application/json'},
    });

    const data = await res.json();
    var users = data.userList;
    return users;
}

async function requestDeleteUser(selectedUser)
{
    var split = selectedUser.split(",");
    var userID = parseInt(split[2]);
    console.log(userID);
    try {
        //send request
        let res = await fetch(apiBase + 'auth/deleteUser', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userID: userID }),
        });
        if(res.status === 201)
        {
            console.log("User Deleted");
        }
    } catch(err)
    {

    }



}



async function updateUserRole(selectedUser, selectedRole)
{
     try {
        var split = selectedUser.split(",");
        var userID = parseInt(split[2]);
        var newRole = selectedRole.toString();
        //send request
        let res = await fetch(apiBase + 'auth/updateUserRole', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userID: userID, newRole: newRole }),
        });

        if(res.status === 201)
        {
            console.log("User Role Updated");
        }
     }catch(err) {
         console.log(err);
    }



}



export default UserManagement;
