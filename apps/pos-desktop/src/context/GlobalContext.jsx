import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // YANGI: Toast (Xabarnoma) uchun state
  const [toast, setToast] = useState(null);
  // YANGI: Smena holati
  const [shift, setShift] = useState(null); // YANGI: Smena holati
  // Litsenziya tugagan bo'lsa dastur bloklanadi
  const [licenseExpired, setLicenseExpired] = useState(false);
  // Super-admin da sozlangan texnik qo'llab-quvvatlash raqami (litsenziya blok ekranida)
  const [techSupportPhone, setTechSupportPhone] = useState(null);

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

  /** Litsenziya tekshiruvi. Qaytaradi: { success: true } yoki { success: false, error: string } */
  const checkLicense = async (loadedSettings) => {
    if (!window.electron) return { success: false, error: 'Dastur rejimi aniqlanmadi' };
    const restaurantId = loadedSettings?.restaurant_id || loadedSettings?.restaurantId;
    if (!restaurantId) {
      return { success: false, error: 'Restoran ID topilmadi. Sozlamalarni tekshiring.' };
    }
    try {
      const machineId = await window.electron.ipcRenderer.invoke('get-machine-id');
      const res = await axios.post(`${API_URL}/auth/check-license`, {
        restaurantId,
        machineId: machineId || '',
      });
      if (res.data?.techSupportPhone != null) {
        setTechSupportPhone(res.data.techSupportPhone || null);
      }
      if (res.data?.valid === false) {
        setLicenseExpired(true);
        return { success: false, error: 'Litsenziya muddati tugagan' };
      }
      setLicenseExpired(false);
      return { success: true };
    } catch (licenseErr) {
      console.warn('License check failed:', licenseErr?.message);
      const msg = licenseErr.response?.data?.message || licenseErr.message || 'Serverga ulanib bo\'lmadi';
      return { success: false, error: msg };
    }
  };

  useEffect(() => {
    const initApp = async () => {
      // Desktop (Electron): har safar PIN so‘raladi — localStorage dan user tiklanmaydi
      // Brauzer/mobil: eski session tiklanadi
      const isDesktop = typeof window !== 'undefined' && window.electron;
      if (!isDesktop) {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
        }
      }

      if (window.electron) {
        try {
          const loadedSettings = await window.electron.ipcRenderer.invoke('get-settings');
          setSettings(loadedSettings || {});

          await checkLicense(loadedSettings);
          await checkShift();

        } catch (err) {
          console.error("Global Context Init Error:", err);
        } finally {
          setLoading(false);
        }
      } else {
        // Browser Mode (Waiter PWA) - bir xil origin dan API (dist da 3001 portda serve qilinadi)
        try {
          const apiUrl = `${window.location.origin}/api/settings`;

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

  // Oyna fokuslanganda (super-admin dan qaytganda) litsenziyani qayta tekshirish
  useEffect(() => {
    if (!window.electron) return;
    const onVisible = () => {
      window.electron.ipcRenderer.invoke('get-settings').then((loadedSettings) => {
        checkLicense(loadedSettings || {});
      }).catch(() => {});
    };
    const vis = () => { if (document.visibilityState === 'visible') onVisible(); };
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
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
    checkShift,
    licenseExpired,
    checkLicense,
    techSupportPhone,
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