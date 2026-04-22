import "../css/About.css"
import UserTile from "../Components/UserTile";
import { useContext } from "react";
import { UserContext } from "../contexts/UserContext";

function Notes(){
    const { users, userStates } = useContext(UserContext);
    return <div className="notes">
        <h1>Notes</h1>
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

export default Notes;
