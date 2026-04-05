import { createContext, useContext, useState } from 'react';

const HeaderContext = createContext({ title: '', subtitle: '', updateHeader: () => {} });

export const HeaderProvider = ({ children }) => {
  const [header, setHeader] = useState({ title: '', subtitle: '' });
  const updateHeader = (title, subtitle = '') => setHeader({ title, subtitle });
  return (
    <HeaderContext.Provider value={{ ...header, updateHeader }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = () => useContext(HeaderContext);
