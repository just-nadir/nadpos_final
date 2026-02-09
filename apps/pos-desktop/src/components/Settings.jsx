import React, { useState, useEffect } from 'react';
import {
  Save, Printer, Database, Store, Receipt, Percent, RefreshCw, ChefHat,
  ShoppingBag, Trash2, ArrowUpRight, ArrowDownRight, Clock,
  ChevronLeft, Search, Plus, PcCase, Edit2, Check, X, QrCode, Monitor, Send,
  ShieldCheck, UserCog, Users, Shield, Key, Coins, CheckCircle,
  MessageSquare, FileText, History, Settings as SettingsIcon, Smartphone
} from 'lucide-react';
import QRCode from "react-qr-code";
import ConfirmModal from './ConfirmModal';
import UpdateSettings from './settings/UpdateSettings';
import { formatDate } from '../utils/dateUtils';
import { cn } from '../utils/cn';
import { useGlobal } from '../context/GlobalContext'; // Restore useGlobal

const MobileAppSettings = () => {
  const [networkInfo, setNetworkInfo] = useState({ ips: [], port: 3001 });
  const [selectedIp, setSelectedIp] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (window.electron) {
      window.electron.ipcRenderer.invoke('get-network-ip')
        .then(info => {
          setNetworkInfo(info);
          if (info.ips && info.ips.length > 0) {
            setSelectedIp(info.ips[0].ip);
          }
        })
        .catch(err => {
          console.error("IP Error:", err);
          setNetworkInfo({ ips: [], port: 3001 });
        });
    }
  }, []);

  const url = `http://${selectedIp || 'localhost'}:${networkInfo.port}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleIpChange = (e) => {
    setSelectedIp(e.target.value);
  };

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card p-8 rounded-3xl shadow-sm border border-border text-center">
        <h3 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
          <Smartphone size={32} className="text-blue-500" />
          Mobil Ofitsiant Ilovasi
        </h3>
        <p className="text-muted-foreground mb-8 text-lg">Ofitsiantlar ushbu QR kodni skanerlash orqali tizimga ulanishlari mumkin.</p>

        <div className="bg-white p-4 rounded-3xl inline-block shadow-lg border border-gray-100 mb-8">
          <QRCode value={url} size={256} />
        </div>

        <div className="max-w-md mx-auto bg-secondary/20 p-6 rounded-2xl border border-border">
          <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wide">Ulanish Manzili</label>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-background h-14 rounded-xl border border-border flex items-center justify-center font-mono text-xl font-bold text-foreground shadow-inner px-4 overflow-hidden">
              {url}
            </code>
            <button
              onClick={handleCopy}
              className={cn(
                "h-14 w-14 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95",
                copied ? "bg-green-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600"
              )}
            >
              {copied ? <CheckCircle size={24} /> : <div className="font-bold">COPY</div>}
            </button>
          </div>
        </div>

        {networkInfo.ips && networkInfo.ips.length > 1 && (
          <div className="max-w-md mx-auto mt-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-100 dark:border-yellow-800 text-left">
            <label className="block text-sm font-bold text-yellow-700 dark:text-yellow-400 mb-2">Ulanish tarmog'ini tanlang (IP)</label>
            <select
              value={selectedIp}
              onChange={handleIpChange}
              className="w-full h-12 px-4 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-white dark:bg-black font-mono text-lg outline-none focus:ring-2 focus:ring-yellow-500/50"
            >
              {networkInfo.ips.map((item, idx) => (
                <option key={idx} value={item.ip}>{item.name}: {item.ip}</option>
              ))}
            </select>
            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
              Agar QR kod ishlamasa, ro'yxatdan boshqa tarmoqni (masalan WiFi) tanlab ko'ring.
            </p>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mb-2">1</div>
            <p className="text-sm font-medium">Telefonni Wi-Fi ga ulang</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mb-2">2</div>
            <p className="text-sm font-medium">Kamerani ochib QR kodni skanerlang</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mb-2">3</div>
            <p className="text-sm font-medium">PIN kodingizni terib ishni boshlang</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const { updateSettings, showToast } = useGlobal(); // Use global context
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [kitchens, setKitchens] = useState([]);
  const [systemPrinters, setSystemPrinters] = useState([]);
  const [editingKitchen, setEditingKitchen] = useState(null); // Add editing state
  const [users, setUsers] = useState([]);

  // Note: systemPrinters is likely from useGlobal, so local state might not be needed if it's already provided.
  // But if the component logic relies on local fetching, we might need to adjust.
  // Based on previous code, systemPrinters was coming from useGlobal.
  // We should remove local systemPrinters state if it conflicts, but let's stick to what was likely intended.
  // actually in previous view (line 95 in view), there was [systemPrinters, setSystemPrinters] = useState([]).
  // This conflicts with useGlobal destructuring. I will remove the local state and use the one from context if available.

  const [newKitchen, setNewKitchen] = useState({ name: '', printer_ip: '' });
  const [newUser, setNewUser] = useState({ name: '', pin: '', role: 'waiter', permissions: ['pos', 'tables'] });

  const [modal, setModal] = useState({ isOpen: false, type: null, id: null, message: '' });

  const PERMISSION_OPTIONS = [
    { id: 'pos', label: 'Kassa (POS)' },
    { id: 'tables', label: 'Zallar va Stollar' },
    { id: 'reservations', label: 'Bronlar' },
    { id: 'customers', label: 'Mijozlar' },
    { id: 'menu', label: 'Menyu' },
    { id: 'inventory', label: 'Ombor' },
    { id: 'reports', label: 'Hisobotlar' },
    { id: 'settings', label: 'Sozlamalar' },
  ];

  const [settings, setSettings] = useState({
    printerReceiptIP: "",
    eskiz_email: "", eskiz_password: "", eskiz_nickname: "4546",
    qr_link: "",
    ad_text: "",
  });

  useEffect(() => {
    loadAllData();
  }, []);





  const loadAllData = async () => {
    if (!window.electron) return;
    try {
      const { ipcRenderer } = window.electron;
      const sData = await ipcRenderer.invoke('get-settings');
      setSettings(prev => ({
        ...prev,
        ...sData,
        serviceChargeValue: Number(sData.serviceChargeValue) || 0
      }));

      const kData = await ipcRenderer.invoke('get-kitchens');
      setKitchens(kData);

      const uData = await ipcRenderer.invoke('get-users');
      // Permissionlarni parse qilish
      const parsedUsers = uData.map(u => ({
        ...u,
        permissions: (typeof u.permissions === 'string') ? JSON.parse(u.permissions) : (u.permissions || [])
      }));
      setUsers(parsedUsers);

      const printers = await ipcRenderer.invoke('get-system-printers');
      setSystemPrinters(printers || []);
    } catch (err) { console.error(err); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const settingsToSave = {
        ...settings,
        printerReceiptPort: 0,
        printerReceiptType: 'driver'
      };
      await window.electron.ipcRenderer.invoke('save-settings', settingsToSave);
      showToast('success', "Sozlamalar saqlandi!");
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSaveKitchen = async (e) => {
    e.preventDefault();
    if (!newKitchen.name) return;
    try {
      const kitchenToSave = {
        ...newKitchen,
        printer_port: 0,
        printer_type: 'driver'
      };
      await window.electron.ipcRenderer.invoke('save-kitchen', kitchenToSave);
      setNewKitchen({ name: '', printer_ip: '' });
      loadAllData();
      showToast('success', "Oshxona qo'shildi");
    } catch (err) { console.error(err); }
  };

  const handleDeleteAction = async () => {
    try {
      const { ipcRenderer } = window.electron;
      if (modal.type === 'kitchen') {
        await ipcRenderer.invoke('delete-kitchen', modal.id);
        showToast('success', "O'chirildi");
      } else if (modal.type === 'user') {
        await ipcRenderer.invoke('delete-user', modal.id);
        showToast('success', "O'chirildi");
      }
      loadAllData();
    } catch (err) {
      showToast('error', err.message);
    }
  };

  const confirmEditKitchen = async () => {
    if (!editingKitchen || !editingKitchen.name) return;
    try {
      await window.electron.ipcRenderer.invoke('save-kitchen', editingKitchen);
      showToast('success', "Oshxona yangilandi");
      setEditingKitchen(null);
      loadAllData();
    } catch (error) {
      console.error(error);
      showToast('error', "Xatolik yuz berdi");
    }
  };

  const confirmDeleteKitchen = (id) => {
    setModal({ isOpen: true, type: 'kitchen', id, message: "Oshxonani o'chirmoqchimisiz?" });
  };

  const confirmDeleteUser = (id) => {
    setModal({ isOpen: true, type: 'user', id, message: "Xodimni o'chirmoqchimisiz?" });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.pin) return;
    try {
      await window.electron.ipcRenderer.invoke('save-user', newUser);
      setNewUser({ name: '', pin: '', role: 'waiter', permissions: ['pos', 'tables'] });
      loadAllData();
      showToast('success', "Xodim saqlandi!");
    } catch (err) {
      showToast('error', err.message);
    }
  };

  const togglePermission = (permId) => {
    setNewUser(prev => {
      const current = prev.permissions || [];
      if (current.includes(permId)) {
        return { ...prev, permissions: current.filter(p => p !== permId) };
      } else {
        return { ...prev, permissions: [...current, permId] };
      }
    });
  };



  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold uppercase">Admin</span>;
      case 'cashier': return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold uppercase">Kassir</span>;
      default: return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase">Ofitsiant</span>;
    }
  };



  return (
    <div className="flex w-full h-full bg-background relative selection:bg-primary/20">


      <div className="w-80 bg-card border-r border-border flex flex-col h-full p-6 shadow-sm z-10 transition-colors">
        <h2 className="text-2xl font-black text-foreground mb-8 px-2 flex items-center gap-3">
          <SettingsIcon size={28} strokeWidth={2.5} className="text-primary" />
          Sozlamalar
        </h2>
        <div className="space-y-3">
          <button onClick={() => setActiveTab('general')} className={cn("w-full text-left px-6 h-14 rounded-2xl font-bold flex items-center gap-4 transition-all text-lg", activeTab === 'general' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')}><Store size={24} /> Umumiy</button>
          <button onClick={() => setActiveTab('users')} className={cn("w-full text-left px-6 h-14 rounded-2xl font-bold flex items-center gap-4 transition-all text-lg", activeTab === 'users' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')}><Users size={24} /> Xodimlar</button>
          <button onClick={() => setActiveTab('printer_settings')} className={cn("w-full text-left px-6 h-14 rounded-2xl font-bold flex items-center gap-4 transition-all text-lg", activeTab === 'printer_settings' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')}><Printer size={24} /> Printerlar</button>
          <button onClick={() => setActiveTab('mobile_app')} className={cn("w-full text-left px-6 h-14 rounded-2xl font-bold flex items-center gap-4 transition-all text-lg", activeTab === 'mobile_app' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')}><Smartphone size={24} /> Mobile App</button>
          <button onClick={() => setActiveTab('update')} className={cn("w-full text-left px-6 h-14 rounded-2xl font-bold flex items-center gap-4 transition-all text-lg", activeTab === 'update' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')}><RefreshCw size={24} /> Yangilash</button>
        </div>
        <div className="mt-auto">
          <button onClick={handleSaveSettings} disabled={loading} className="w-full bg-blue-600 text-white h-16 rounded-2xl font-bold shadow-xl shadow-blue-500/20 hover:bg-blue-700 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70 text-xl">
            {loading ? <RefreshCw size={24} className="animate-spin" /> : <Save size={24} />} Saqlash
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-secondary/5 scrollbar-thin">
        {/* --- GENERAL --- */}
        {activeTab === 'general' && (
          <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card p-8 rounded-3xl shadow-sm border border-border">
              <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3"><Store size={28} className="text-blue-500" /> Restoran Ma'lumotlari</h3>
              <div className="grid gap-6">
                <div><label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wide">Restoran Nomi</label><input type="text" name="restaurantName" value={settings.restaurantName || ''} onChange={handleChange} className="w-full h-14 px-4 bg-secondary/20 rounded-xl border border-border outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 font-bold text-xl text-foreground transition-all" /></div>
                <div><label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wide">Manzil</label><input type="text" name="address" value={settings.address || ''} onChange={handleChange} className="w-full h-14 px-4 bg-secondary/20 rounded-xl border border-border outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-lg font-medium text-foreground transition-all" /></div>
                <div><label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wide">Telefon</label><input type="text" name="phone" value={settings.phone || ''} onChange={handleChange} className="w-full h-14 px-4 bg-secondary/20 rounded-xl border border-border outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-lg font-medium text-foreground transition-all" /></div>
              </div>
            </div>
            <div className="bg-card p-8 rounded-3xl shadow-sm border border-border">
              <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3"><Percent size={28} className="text-green-500" /> Xizmat Haqi (%)</h3>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wide">Xizmat foizi</label>
                <div className="relative">
                  <input type="number" name="serviceChargeValue" value={settings.serviceChargeValue || 0} onChange={handleChange} className="w-full h-16 pl-6 pr-12 bg-secondary/20 rounded-xl border border-border outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 font-black text-3xl text-foreground transition-all" />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-xl">%</div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Faqat foizda hisoblanadi.</p>
              </div>
            </div>

            <div className="bg-card p-8 rounded-3xl shadow-sm border border-border">
              <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3"><Receipt size={28} className="text-orange-500" /> Chek Sozlamalari</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wide">Chekosti yozuvi</label>
                  <textarea rows="2" name="receiptFooter" value={settings.receiptFooter || ''} onChange={handleChange} className="w-full p-4 bg-secondary/20 rounded-xl border border-border outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-lg font-medium text-foreground resize-none transition-all"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wide">QR Link (Instagram/Telegram)</label>
                  <div className="relative">
                    <Send size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" name="qr_link" value={settings.qr_link || ''} onChange={handleChange} placeholder="https://instagram.com/nadpos.uz" className="w-full h-14 pl-12 pr-4 bg-secondary/20 rounded-xl border border-border outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 font-bold text-lg text-foreground transition-all" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground italic">Chekning pastki qismida chiqadigan QR kod uchun havola.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wide">Reklama Matni</label>
                  <textarea rows="2" name="ad_text" value={settings.ad_text || ''} onChange={handleChange} placeholder="Masalan: Bizda yetkazib berish xizmati mavjud" className="w-full p-4 bg-secondary/20 rounded-xl border border-border outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-lg font-medium text-foreground resize-none transition-all"></textarea>
                  <p className="mt-2 text-xs text-muted-foreground italic">Bu matn chekda "Yoqimli ishtaha" yozuvidan oldin chiqadi.</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* --- USERS --- */}
        {activeTab === 'users' && (
          <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card p-8 rounded-3xl shadow-sm border border-border">
              <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3"><Users size={28} className="text-blue-500" /> Xodim Qo'shish</h3>
              <form onSubmit={handleSaveUser} className="space-y-6">
                <div className="grid grid-cols-12 gap-6 items-end">
                  <div className="col-span-12 md:col-span-4">
                    <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Ism</label>
                    <input required type="text" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Ali" className="w-full h-14 px-4 rounded-xl border border-border bg-secondary/20 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 font-bold text-lg text-foreground" />
                  </div>
                  <div className="col-span-6 md:col-span-3">
                    <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">PIN Kod</label>
                    <div className="relative">
                      <Key size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input required type="text" maxLength="4" value={newUser.pin} onChange={e => setNewUser({ ...newUser, pin: e.target.value.replace(/\D/g, '') })} placeholder="1234" className="w-full h-14 pl-12 pr-4 rounded-xl border border-border bg-secondary/20 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 font-mono text-xl font-bold text-center tracking-widest text-foreground" />
                    </div>
                  </div>
                  <div className="col-span-6 md:col-span-3">
                    <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Rol</label>
                    <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="w-full h-14 px-4 rounded-xl border border-border bg-secondary/20 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 font-bold text-lg text-foreground appearance-none">
                      <option value="waiter">Ofitsiant</option>
                      <option value="cashier">Kassir</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="col-span-12 md:col-span-2">
                    <button type="submit" className="w-full bg-blue-600 text-white h-14 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-lg">Qo'shish</button>
                  </div>
                </div>

                {/* Permissions Checkboxes */}
                {newUser.role !== 'admin' && (
                  <div className="bg-secondary/10 p-4 rounded-xl border border-border">
                    <label className="block text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">Ruxsatlar (Nimaga kira oladi?)</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {PERMISSION_OPTIONS.map(perm => (
                        <label key={perm.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-secondary/20">
                          <input
                            type="checkbox"
                            checked={(newUser.permissions || []).includes(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm font-medium">{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="bg-card p-8 rounded-3xl shadow-sm border border-border">
              <h3 className="text-2xl font-bold text-foreground mb-6">Xodimlar Ro'yxati</h3>
              <div className="space-y-3">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-5 bg-secondary/10 hover:bg-secondary/20 rounded-2xl border border-border group transition-colors">
                    <div className="flex items-center gap-5">
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white shadow-md", u.role === 'admin' ? 'bg-purple-500' : u.role === 'cashier' ? 'bg-orange-500' : 'bg-blue-500')}>
                        {u.role === 'admin' ? <Shield size={28} /> : u.role === 'cashier' ? <Coins size={28} /> : <Users size={28} />}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-xl">{u.name}</p>
                        <p className="text-sm text-muted-foreground font-mono flex items-center gap-2 font-medium tracking-wider"><Key size={14} /> ••••</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getRoleBadge(u.role)}
                      <button onClick={() => confirmDeleteUser(u.id)} className="p-3 text-muted-foreground hover:text-white hover:bg-destructive rounded-xl transition-all active:scale-90"><Trash2 size={24} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- PRINTER SETTINGS (UNIFIED) --- */}
        {activeTab === 'printer_settings' && (
          <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Kassa Printeri Section */}
            <div className="bg-card p-8 rounded-3xl shadow-sm border border-border">
              <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3"><Printer size={28} className="text-purple-500" /> Kassa Printeri</h3>
              <p className="text-base text-muted-foreground mb-8">Mijozga beriladigan chek uchun asosiy printerni tanlang.</p>
              <div className="bg-secondary/10 p-6 rounded-2xl border border-border">
                <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wide">Tizim Printeri</label>
                <select
                  name="printerReceiptIP"
                  value={settings.printerReceiptIP || ''}
                  onChange={handleChange}
                  className="w-full h-14 px-4 rounded-xl border border-border bg-background outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-lg font-medium text-foreground transition-all"
                >
                  <option value="">Printerni tanlang...</option>
                  {(systemPrinters || []).map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Oshxonalar Section */}
            <div className="bg-card p-8 rounded-3xl shadow-sm border border-border">
              <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3"><Plus size={28} className="text-blue-500" /> Yangi Oshxona Qo'shish</h3>
              <p className="text-sm text-muted-foreground mb-6">Oshxona printerini tanlang</p>

              <form onSubmit={handleSaveKitchen} className="space-y-6">
                <div className="grid grid-cols-12 gap-6 items-end">
                  <div className="col-span-12 md:col-span-6">
                    <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Oshxona Nomi</label>
                    <input required type="text" value={newKitchen.name} onChange={e => setNewKitchen({ ...newKitchen, name: e.target.value })} placeholder="Masalan: Bar" className="w-full h-14 px-4 rounded-xl border border-border bg-secondary/20 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 font-bold text-lg text-foreground transition-all" />
                  </div>

                  <div className="col-span-12 md:col-span-4">
                    <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Printer Tanlash</label>
                    <select value={newKitchen.printer_ip} onChange={e => setNewKitchen({ ...newKitchen, printer_ip: e.target.value })} className="w-full h-14 px-4 rounded-xl border border-border bg-secondary/20 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 font-medium text-lg text-foreground transition-all">
                      <option value="">Tanlanmagan</option>
                      {(systemPrinters || []).map(p => (
                        <option key={p.name} value={p.name}>{p.name} ({p.displayName || p.name})</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-12 md:col-span-2">
                    <button type="submit" className="w-full bg-blue-600 text-white h-14 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-lg">Saqlash</button>
                  </div>
                </div>
              </form>
            </div>

            <div className="bg-card p-8 rounded-3xl shadow-sm border border-border">
              <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3"><ChefHat size={28} className="text-orange-500" /> Oshxonalar Ro'yxati</h3>
              <div className="space-y-4">
                {kitchens.map(k => (
                  <div key={k.id} className="flex items-center justify-between p-5 bg-secondary/10 hover:bg-secondary/20 rounded-2xl border border-border group transition-colors">
                    {editingKitchen?.id === k.id ? (
                      <div className="flex-1 flex items-center gap-4 animate-in fade-in zoom-in-95">
                        <input
                          type="text"
                          value={editingKitchen.name}
                          onChange={(e) => setEditingKitchen({ ...editingKitchen, name: e.target.value })}
                          className="flex-1 h-10 px-3 rounded-lg border border-border bg-background"
                          placeholder="Oshxona nomi"
                          autoFocus
                        />
                        <select
                          value={editingKitchen.printer_ip}
                          onChange={(e) => setEditingKitchen({ ...editingKitchen, printer_ip: e.target.value })}
                          className="h-10 px-3 rounded-lg border border-border bg-background w-48"
                        >
                          <option value="">Printer Tanlanmagan</option>
                          {(systemPrinters || []).map(p => (
                            <option key={p.name} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button onClick={() => confirmEditKitchen()} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"><Check size={20} /></button>
                          <button onClick={() => setEditingKitchen(null)} className="p-2 bg-secondary text-muted-foreground rounded-lg hover:bg-secondary/80 transition-colors"><X size={20} /></button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="font-bold text-foreground text-xl">{k.name}</p>
                          <div className="text-sm text-muted-foreground font-medium flex items-center gap-2 mt-1">
                            <PcCase size={16} className="text-blue-500" /> Printer: <span className="font-mono bg-background px-2 py-0.5 rounded border border-border">{k.printer_ip || 'Tanlanmagan'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingKitchen(k)} className="p-3 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all active:scale-90"><Edit2 size={24} /></button>
                          <button onClick={() => confirmDeleteKitchen(k.id)} className="p-3 text-muted-foreground hover:text-white hover:bg-destructive rounded-xl transition-all active:scale-90"><Trash2 size={24} /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {kitchens.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground opacity-60">
                    <ChefHat size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Hozircha oshxonalar yo'q</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}




        {/* --- MOBILE APP (QR CODE) --- */}
        {activeTab === 'mobile_app' && (
          <MobileAppSettings />
        )}

        {/* --- UPDATE SETTINGS --- */}
        {activeTab === 'update' && <UpdateSettings />}
      </div>

      <ConfirmModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={handleDeleteAction}
        message={modal.message}
        title="Tasdiqlang"
      />
    </div>
  );
};

export default Settings;