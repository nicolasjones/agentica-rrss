import React, { createContext, useContext, useState, useEffect } from 'react';

const ActiveProjectContext = createContext();

export const ActiveProjectProvider = ({ children }) => {
  const [activeBandId, setActiveBandId] = useState(() => {
    const saved = localStorage.getItem('active_band_id');
    return (saved && saved !== 'null' && saved !== 'undefined') ? saved : null;
  });

  const selectProject = (id) => {
    localStorage.setItem('active_band_id', id);
    setActiveBandId(id);
  };

  const clearProject = () => {
    localStorage.removeItem('active_band_id');
    setActiveBandId(null);
  };

  return (
    <ActiveProjectContext.Provider value={{ activeBandId, selectProject, clearProject }}>
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
