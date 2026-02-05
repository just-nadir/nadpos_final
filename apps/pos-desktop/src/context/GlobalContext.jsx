import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // YANGI: Toast (Xabarnoma) uchun state
  const [toast, setToast] = useState(null);
  // YANGI: Smena holati
  const [shift, setShift] = useState(null); // YANGI: Smena holati

  // YANGI: Smena holatini tekshirish funksiyasi
  const checkShift = async () => {
    if (window.electron) {
      try {
        const s = await window.electron.ipcRenderer.invoke('shift-status');
        setShift(s);
      } catch (err) {
        console.error("Shift check error:", err);
      }
    }
  };

  useEffect(() => {
    const initApp = async () => {
      // Restore user from storage
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }

      if (window.electron) {
        try {
          const loadedSettings = await window.electron.ipcRenderer.invoke('get-settings');
          setSettings(loadedSettings || {});

          // App boshlanishida tekshirish
          await checkShift();

        } catch (err) {
          console.error("Global Context Init Error:", err);
        } finally {
          setLoading(false);
        }
      } else {
        // Browser Mode (Mobile) - API orqali yuklash
        try {
          const API_PORT = 3000;
          const protocol = window.location.protocol;
          const hostname = window.location.hostname;
          const apiUrl = `${protocol}//${hostname}:${API_PORT}/api/settings`;

          const res = await axios.get(apiUrl);
          setSettings(res.data || {});
        } catch (err) {
          console.error("Browser Settings Load Error:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    initApp();
  }, []);

  // YANGI: Toast ko'rsatish funksiyasi (3 soniyadan keyin o'chadi)
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const login = async (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (token) localStorage.setItem('token', token);
    await checkShift();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const value = {
    user,
    login,
    logout,
    settings,
    loading,
    toast,      // Export qilamiz
    showToast,   // Export qilamiz
    shift,        // Export
    setShift,     // Export
    checkShift
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobal must be used within a GlobalProvider");
  }
  return context;
};