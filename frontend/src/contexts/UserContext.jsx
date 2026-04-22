import React, { createContext, useState, useCallback } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const demoUsers = [
    {
      id: 1,
      name: "UNT Discovery",
      email: "email@example.com",
      address: "3940 N Elm St, Denton, TX 76207",
      phone: "(555) 123-4567",
      appointmentTime: "April 25, 2026 — 10:30 AM",
      notes: "no notes",
    },
    {
      id: 2,
      name: "UNT Main",
      email: "unt@example.com",
      address: "1155 Union Cir, Denton, TX 76205",
      phone: "(555) 987-6543",
      appointmentTime: "April 26, 2026 — 2:00 PM",
      notes: "no notes",
    },
  ];

  const [userStates, setUserStates] = useState(
    demoUsers.reduce((acc, user) => {
      acc[user.id] = { isVerified: false, isError: false };
      return acc;
    }, {})
  );

  const updateUserState = useCallback((userId, newState) => {
    setUserStates((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], ...newState },
    }));
  }, []);

  const getUserState = useCallback((userId) => {
    return userStates[userId] || { isVerified: false, isError: false };
  }, [userStates]);

  const value = {
    users: demoUsers,
    userStates,
    updateUserState,
    getUserState,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
