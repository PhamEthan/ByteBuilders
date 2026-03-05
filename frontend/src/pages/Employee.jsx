import "../css/Employee.css";
import {Link} from "react-router-dom";

function Employee() {
  return (
    <div className="employee-container">
      <h1>Employee Dashboard</h1>

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
      </div>
    </div>
  );
}

export default Employee;