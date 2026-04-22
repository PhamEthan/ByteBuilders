import React from "react";
import "../css/UserTile.css";

function UserTile({
  name,
  email,
  address,
  phone,
  appointmentTime,
  notes,
  isVerified = false,
  isError = false,
  onClick = null,
  compact = false,
}) {
  const tileClass = `user-tile ${isVerified ? "user-tile-verified" : ""} ${isError ? "user-tile-error" : ""} ${onClick ? "user-tile-clickable" : ""}`;

  if (compact) {
    return (
      <div className={tileClass} onClick={onClick}>
        <div className="user-tile-header">
          <div>
            <h2>{name}</h2>
            <p className="user-tile-appointment">{appointmentTime}</p>
          </div>
        </div>
        <div className="user-tile-body">
          <div className="user-tile-row">
            <span className="user-tile-label">Address</span>
            <span>{address}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={tileClass} onClick={onClick}>
      <div className="user-tile-header">
        <div>
          <h2>{name}</h2>
          <p className="user-tile-appointment">{appointmentTime}</p>
        </div>
      </div>

      <div className="user-tile-body">
        <div className="user-tile-row">
          <span className="user-tile-label">Email</span>
          <span>{email}</span>
        </div>
        <div className="user-tile-row">
          <span className="user-tile-label">Address</span>
          <span>{address}</span>
        </div>
        <div className="user-tile-row">
          <span className="user-tile-label">Phone</span>
          <span>{phone}</span>
        </div>
        <div className="user-tile-row user-tile-notes-row">
          <span className="user-tile-label">Notes</span>
          <span>{notes || "No notes"}</span>
        </div>
      </div>
    </div>
  );
}

export default UserTile;
