import React, { useState, Suspense } from 'react';
import { Compass, Briefcase, PenTool, Menu, X, Plane, MessageCircle, Loader2 } from 'lucide-react';
import UserProfile from './components/UserProfile';
import { AppMode, User, HistoryItem } from './types';

// Lazy load components for performance
const ItineraryGenerator = React.lazy(() => import('./components/ItineraryGenerator'));
const AgencyDashboard = React.lazy(() => import('./components/AgencyDashboard'));
const ContentGenerator = React.lazy(() => import('./components/ContentGenerator'));
const ChatAssistant = React.lazy(() => import('./components/ChatAssistant'));

const App: React.FC = () => {
  const [user, setUser] = useState<User>({
    name: 'Guest Traveler',
    email: 'guest@travelguide.ai',
    avatar: 'https://ui-avatars.com/api/?name=Guest+Traveler&background=0d9488&color=fff'
  });
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.INDIVIDUAL);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadedContent, setLoadedContent] = useState<any>(null);

  // History Management
  const addToHistory = (item: Omit<HistoryItem, 'id'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
    };
    setHistory(prev => [newItem, ...prev]);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleHistoryClick = (item: HistoryItem) => {
    // Determine mode based on item type
    const targetMode = item.type === 'Itinerary' ? AppMode.INDIVIDUAL : AppMode.CONTENT;
    
    // Set content and mode
    setLoadedContent(item.resultData);
    setCurrentMode(targetMode);
    
    // Close profile
    setIsProfileOpen(false);
  };

  const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-[50vh] text-teal-600">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );

  const renderContent = () => {
    switch (currentMode) {
      case AppMode.INDIVIDUAL:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ItineraryGenerator onSaveHistory={addToHistory} initialData={loadedContent} />
          </Suspense>
        );
      case AppMode.AGENCY:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AgencyDashboard />
          </Suspense>
        );
      case AppMode.CONTENT:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ContentGenerator onSaveHistory={addToHistory} initialData={loadedContent} />
          </Suspense>
        );
      case AppMode.CHAT:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ChatAssistant isEmbedded={true} />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ItineraryGenerator onSaveHistory={addToHistory} />
          </Suspense>
        );
    }
  };

  const navItems = [
    { id: AppMode.INDIVIDUAL, label: 'Trip Planner', icon: Compass },
    { id: AppMode.CHAT, label: 'AI Assistant', icon: MessageCircle },
    { id: AppMode.AGENCY, label: 'Agency Portal', icon: Briefcase },
    { id: AppMode.CONTENT, label: 'Content Creator', icon: PenTool },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="bg-teal-600 p-2 rounded-lg">
                  <Plane className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight font-serif">TravelGuideAI</h1>
                  <p className="text-xs text-slate-500 font-medium">Explore with AI</p>
                </div>
              </div>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentMode === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentMode(item.id);
                      setLoadedContent(null); // Clear loaded content when switching modes manually
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-teal-50 text-teal-700 shadow-sm ring-1 ring-teal-200' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4">
               {/* User Profile Trigger */}
               <button 
                onClick={() => setIsProfileOpen(true)}
                className="hidden md:flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-full transition border border-transparent hover:border-slate-200"
               >
                 <img src={user.avatar} alt="Profile" className="w-8 h-8 rounded-full border border-slate-200" />
               </button>

              {/* Mobile menu button */}
              <div className="flex items-center md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none"
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <div className="flex items-center gap-3 px-3 py-4 border-b border-slate-100 mb-2">
                 <img src={user.avatar} alt="Profile" className="w-10 h-10 rounded-full" />
                 <div>
                    <p className="font-semibold text-slate-900">{user.name}</p>
                    <button 
                      onClick={() => {
                        setIsProfileOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="text-xs text-teal-600 font-medium"
                    >
                      View Profile
                    </button>
                 </div>
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentMode === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentMode(item.id);
                      setLoadedContent(null);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-4 rounded-lg text-base font-medium ${
                      isActive 
                        ? 'bg-teal-50 text-teal-700' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {renderContent()}
      </main>

      {/* Footer - Only show if NOT in chat mode (to keep chat immersive) */}
      {currentMode !== AppMode.CHAT && (
        <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                   <Plane className="h-5 w-5 text-teal-400" />
                   <span className="text-white font-serif font-bold text-lg">TravelGuideAI</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Empowering travelers and agencies with intelligent, personalized itineraries powered by next-gen AI and Google Maps.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Features</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>Smart Itinerary Planning</li>
                  <li>Real-time Maps Integration</li>
                  <li>Agency Client Management</li>
                  <li>SEO Blog Generation</li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Legal</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>Privacy Policy</li>
                  <li>Terms of Service</li>
                  <li>Cookie Policy</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
              &copy; {new Date().getFullYear()} TravelGuideAI. All rights reserved.
            </div>
          </div>
        </footer>
      )}

      {/* Floating Chat Assistant (Only show if NOT in chat mode) */}
      {currentMode !== AppMode.CHAT && (
        <Suspense fallback={null}>
          <ChatAssistant />
        </Suspense>
      )}

      {/* User Profile Modal */}
      <UserProfile 
        user={user}
        history={history}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onDeleteHistory={deleteHistoryItem}
        onHistoryClick={handleHistoryClick}
      />
    </div>
  );
};

export default App;