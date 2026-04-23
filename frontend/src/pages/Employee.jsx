import "../css/Employee.css";
import UserTile from "../Components/UserTile";
import { useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import {Link} from "react-router-dom";

function Employee( {userRole} ) {
  const { users, userStates } = useContext(UserContext);

  return (
    <div className="employee-container">
      <h1>Employee Dashboard</h1>

      <div className="employee-user-section">
        <h3>Upcoming Clients</h3>
        <div className="user-tiles-container">
          {users.map((user) => (
            <UserTile 
              key={user.id} 
              {...user} 
              compact={true}
              isVerified={userStates[user.id]?.isVerified}
              isError={userStates[user.id]?.isError}
            />
          ))}
        </div>
      </div>

      <div className="tile-container">
        

        <Link to ="/checkin" className="tile-link">
          <button className="tile">
            Checkin
          </button>
        </Link>

        <Link to ="/schedule" className="tile-link">
          <button className="tile">
            Schedule
          </button>
        </Link>

       <Link to ="/notes" className="tile-link">
          <button className="tile">
            Notes
          </button>
        </Link>

        <Link to ="/userManagement" className="tile-link">
          <button className="tile">
            User Management
          </button>
        </Link>
      </div>
    </div>
  );
}

export default Employee;
