import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { TabBar } from '@/components/layout';
import { initializeDB } from '@/services/db';
import { useSettingsStore } from '@/stores';

// Pages
import { ChatList, ChatDetail, RealityDetail } from '@/pages/Chat';
import { ContactList, ContactDetail, ContactEdit } from '@/pages/Contacts';
import { DiscoverHome, Moments, LoreBook } from '@/pages/Discover';
import { MeHome, ProfileEdit, Wallet, SettingsPage, APISettings, TokenStatsPage } from '@/pages/Me';

// Routes that show the tab bar
const TAB_ROUTES = ['/chat', '/contacts', '/discover', '/me'];

function App() {
  const location = useLocation();
  const { settings, loadSettings } = useSettingsStore();

  // Initialize database and load settings on mount
  useEffect(() => {
    initializeDB();
    loadSettings();
  }, [loadSettings]);

  // Apply dark mode
  useEffect(() => {
    if (settings?.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings?.darkMode]);

  // Check if current route should show tab bar
  const showTabBar = TAB_ROUTES.some(route => location.pathname === route);

  return (
    <div className="h-full flex flex-col bg-bg-light dark:bg-bg-dark text-gray-900 dark:text-gray-100">
      <main className="flex-1 overflow-hidden">
        <Routes>
          {/* Redirect root to chat */}
          <Route path="/" element={<Navigate to="/chat" replace />} />

          {/* Chat routes */}
          <Route path="/chat" element={<ChatList />} />
          <Route path="/chat/:id" element={<ChatDetail />} />
          <Route path="/chat/:id/reality/:rid" element={<RealityDetail />} />

          {/* Contacts routes */}
          <Route path="/contacts" element={<ContactList />} />
          <Route path="/contacts/new" element={<ContactEdit />} />
          <Route path="/contacts/:id" element={<ContactDetail />} />
          <Route path="/contacts/:id/edit" element={<ContactEdit />} />

          {/* Discover routes */}
          <Route path="/discover" element={<DiscoverHome />} />
          <Route path="/discover/moments" element={<Moments />} />
          <Route path="/discover/lorebook" element={<LoreBook />} />

          {/* Me routes */}
          <Route path="/me" element={<MeHome />} />
          <Route path="/me/profile" element={<ProfileEdit />} />
          <Route path="/me/wallet" element={<Wallet />} />
          <Route path="/me/tokens" element={<TokenStatsPage />} />
          <Route path="/me/settings" element={<SettingsPage />} />
          <Route path="/me/settings/api" element={<APISettings />} />
        </Routes>
      </main>

      {/* Tab bar - only show on main tab routes */}
      {showTabBar && <TabBar />}
    </div>
  );
}

export default App;
