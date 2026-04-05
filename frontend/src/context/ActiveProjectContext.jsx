import React, { createContext, useContext, useState, useEffect } from 'react';

const ActiveProjectContext = createContext();

export const ActiveProjectProvider = ({ children }) => {
  const [activeBandId, setActiveBandId] = useState(() => {
    const saved = localStorage.getItem('active_band_id');
    return (saved && saved !== 'null' && saved !== 'undefined') ? saved : null;
  });

  // selectProject now returns the ID so we can use it immediately if needed
  const selectProject = (id) => {
    const stringId = String(id);
    localStorage.setItem('active_band_id', stringId);
    setActiveBandId(stringId);
  };

  const clearProject = () => {
    localStorage.removeItem('active_band_id');
    setActiveBandId(null);
  };

  // We expose a derived ID that is more robust than just the state
  const currentId = activeBandId || localStorage.getItem('active_band_id');

  return (
    <ActiveProjectContext.Provider value={{ activeBandId: currentId, selectProject, clearProject }}>
      {children}
    </ActiveProjectContext.Provider>
  );
};

export const useActiveProject = () => {
  const context = useContext(ActiveProjectContext);
  if (!context) {
    throw new Error('useActiveProject must be used within an ActiveProjectProvider');
  }
  return context;
};
