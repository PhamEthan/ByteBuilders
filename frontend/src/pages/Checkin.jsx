import "../css/About.css"
import React, { useState } from "react";

function Checkin() {
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

  const handleCheckin = async () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const userLat = position.coords.latitude;
      const userLon = position.coords.longitude;

      try {
        // Convert address to coordinates using OpenStreetMap
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${address}`
        );
        const data = await response.json();

        if (data.length === 0) {
          setMessage("Address not found.");
          return;
        }

        const targetLat = parseFloat(data[0].lat);
        const targetLon = parseFloat(data[0].lon);

        const distance = getDistance(userLat, userLon, targetLat, targetLon);

        if (distance <= 100) {
          setMessage("✅ Check-in successful! You are at the location.");
        } else {
          setMessage(
            `❌ You are not at the location. You are ${Math.round(
              distance
            )} meters away.`
          );
        }
      } catch (error) {
        setMessage("Error verifying location.");
      }
    });
  };

  return (
    <div className="employee-page">
      <h1>Employee Checkin</h1>

      <input
        type="text"
        placeholder="Enter work address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        style={{ padding: "10px", width: "300px" }}
      />

      <br /><br />

      <button onClick={handleCheckin} className="checkin-button">
        Verify Location & Check In
      </button>

      <p>{message}</p>
    </div>
  );
}

export default Checkin;