import "../css/About.css"
import UserTile from "../Components/UserTile";
import { useContext } from "react";
import { UserContext } from "../contexts/UserContext";

function Schedule(){
    const { users, userStates } = useContext(UserContext);
    return <div className="schedule">
        <h1>Schedule</h1>
        <div className="employee-user-section">
          <h3>Upcoming Clients</h3>
          <div className="user-tiles-container">
            {users.map((user) => (
              <UserTile key={user.id} {...user} />
            ))}
          </div>
        </div>
    </div>
}

export default Schedule;
