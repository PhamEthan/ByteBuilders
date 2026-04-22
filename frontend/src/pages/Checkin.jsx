import "../css/About.css"
import React, { useState, useContext } from "react";
import UserTile from "../Components/UserTile";
import { UserContext } from "../contexts/UserContext";

function Checkin() {
  const { users, userStates, updateUserState } = useContext(UserContext);
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");

  // Function to calculate distance between two coordinates (Haversine formula)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // meters
    const toRad = (value) => (value * Math.PI) / 180;

    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) *
        Math.cos(φ2) *
        Math.sin(Δλ / 2) *
        Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // distance in meters
  };

  const handleCheckin = async (addressToCheck, userId) => {
    if (!navigator.geolocation) {
      setMessage("Geolocation not supported.");
      updateUserState(userId, { isVerified: false, isError: false });
      triggerErrorFlash(userId);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const userLat = position.coords.latitude;
      const userLon = position.coords.longitude;

      try {
        // Convert address to coordinates using OpenStreetMap
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${addressToCheck}`
        );
        const data = await response.json();

        if (data.length === 0) {
          setMessage("Address not found.");
          updateUserState(userId, { isVerified: false, isError: false });
          triggerErrorFlash(userId);
          return;
        }

        const targetLat = parseFloat(data[0].lat);
        const targetLon = parseFloat(data[0].lon);

        const distance = getDistance(userLat, userLon, targetLat, targetLon);

        if (distance <= 100) {
          setMessage("✅ Check-in successful! You are at the location.");
          updateUserState(userId, { isVerified: true, isError: false });
        } else {
          setMessage(
            `❌ You are not at the location. You are ${Math.round(
              distance
            )} meters away.`
          );
          updateUserState(userId, { isVerified: false, isError: false });
          triggerErrorFlash(userId);
        }
      } catch (error) {
        setMessage("Error verifying location.");
        updateUserState(userId, { isVerified: false, isError: false });
        triggerErrorFlash(userId);
      }
    });
  };

  const triggerErrorFlash = (userId) => {
    updateUserState(userId, { isError: true });
    setTimeout(() => {
      updateUserState(userId, { isError: false });
    }, 600);
  };

  return (
    <div className="employee-page">
      <h1>Employee Checkin</h1>

      <div className="employee-user-section">
        <h3>Upcoming Clients</h3>
        <div className="user-tiles-container">
          {users.map((user) => (
            <UserTile
              key={user.id}
              {...user}
              isVerified={userStates[user.id]?.isVerified || false}
              isError={userStates[user.id]?.isError || false}
              onClick={() => handleCheckin(user.address, user.id)}
            />
          ))}
        </div>
      </div>
      <p>{message}</p>
    </div>
  );
}

export default Checkin;
