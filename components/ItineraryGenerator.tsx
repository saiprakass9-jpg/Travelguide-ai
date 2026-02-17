import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { MapPin, Calendar, Wallet, Heart, Users, Loader2, Navigation, Map as MapIcon, FileText, ArrowLeft, ExternalLink, Moon } from 'lucide-react';
import { TripPreferences, GeoLocation, HistoryItem } from '../types';
import { generateTravelGuide } from '../services/geminiService';

interface ItineraryGeneratorProps {
  onSaveHistory: (item: Omit<HistoryItem, 'id'>) => void;
  initialData?: any;
}

const ItineraryGenerator: React.FC<ItineraryGeneratorProps> = ({ onSaveHistory, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState<{ text: string; mapsSources: any[] } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'map'>('itinerary');
  const [location, setLocation] = useState<GeoLocation | undefined>(undefined);
  const [formData, setFormData] = useState<TripPreferences>({
    destination: '',
    duration: 3,
    nights: 2,
    budget: 'Moderate',
    interests: [],
    travelers: 'Couple',
  });

  // Restore state from history if provided
  useEffect(() => {
    if (initialData) {
      // Handle legacy string data or new object data
      if (typeof initialData === 'string') {
        setResultData({ text: initialData, mapsSources: [] });
      } else {
        setResultData(initialData);
      }
      setShowResult(true);
      
      const text = typeof initialData === 'string' ? initialData : initialData?.text || '';
      // Attempt to infer destination from the markdown content for the map view
      const destMatch = text.match(/Trip to (.+?)(\n|$|:)/i) || text.match(/#\s*(.+?)(\n|$)/);
      if (destMatch && destMatch[1]) {
        setFormData(prev => ({
          ...prev, 
          destination: destMatch[1].replace(/[\#\*]/g, '').trim()
        }));
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => console.log("Geolocation permission denied or error:", err)
      );
    }
  }, []);

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.destination.trim()) return;
    if (formData.duration <= 0 || formData.nights < 0) return;

    setLoading(true);
    
    try {
      const data = await generateTravelGuide(
        formData.destination,
        formData.duration,
        formData.nights,
        {
          budget: formData.budget,
          interests: formData.interests,
          travelers: formData.travelers
        },
        location
      );

      setResultData(data);
      setShowResult(true); // Switch to result view
      
      // Save to history
      onSaveHistory({
        type: 'Itinerary',
        title: `Trip to ${formData.destination}`,
        date: new Date().toLocaleDateString(),
        preview: `${formData.duration} days, ${formData.nights} nights for ${formData.travelers}.`,
        resultData: data
      });

    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const interestOptions = ['History', 'Food', 'Nature', 'Art', 'Nightlife', 'Relaxation', 'Adventure', 'Shopping'];

  // --- RESULT VIEW ---
  if (showResult && resultData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button 
          onClick={() => setShowResult(false)}
          className="mb-6 flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors font-medium px-4 py-2 hover:bg-white rounded-lg hover:shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Planner
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-100 min-h-[700px] flex flex-col relative overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10">
              <button
                onClick={() => setActiveTab('itinerary')}
                className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'itinerary'
                    ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/30'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4" /> Itinerary
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'map'
                    ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/30'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <MapIcon className="w-4 h-4" /> Map View
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden relative bg-white">
              {activeTab === 'itinerary' ? (
                <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-8 max-w-4xl mx-auto">
                   <ReactMarkdown 
                     components={{
                       h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-teal-800 mb-6 border-b pb-4 font-serif" {...props} />,
                       h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4 flex items-center gap-2" {...props} />,
                       p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-slate-600" {...props} />,
                       strong: ({node, ...props}) => <strong className="text-teal-700 font-bold" {...props} />,
                       a: ({node, ...props}) => <a className="text-blue-600 hover:text-blue-800 underline decoration-dotted transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                       ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 text-slate-600 mb-4" {...props} />
                     }}
                   >
                     {resultData.text}
                   </ReactMarkdown>
                </div>
              ) : (
                <div className="absolute inset-0 bg-slate-100">
                   <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(formData.destination || 'Famous Landmarks')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                      title={`Map of ${formData.destination}`}
                    ></iframe>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar for Sources */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" /> Mentioned Places
              </h3>
              {resultData.mapsSources && resultData.mapsSources.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                  {resultData.mapsSources.map((source: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 hover:border-teal-300 transition-colors">
                      <h4 className="font-semibold text-slate-900 text-sm">{source.title}</h4>
                      {source.placeId && (
                        <p className="text-xs text-slate-500 mt-1">Place ID: {source.placeId}</p>
                      )}
                      {source.uri && (
                        <a 
                          href={source.uri} 
                          target="_blank" 
                          rel="noreferrer"
                          className="mt-2 text-xs text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1 inline-flex"
                        >
                          View on Maps <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm italic">
                  No specific Google Maps locations were linked in the grounding data. 
                  Try regenerating with a clearer destination.
                </p>
              )}
            </div>
            
            <div className="bg-teal-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
               <div className="relative z-10">
                 <h3 className="font-serif font-bold text-xl mb-2">Travel Tips</h3>
                 <p className="text-teal-100 text-sm">
                   Save this itinerary to your history or share it with friends! 
                   Don't forget to check local visa requirements.
                 </p>
               </div>
               <MapIcon className="absolute -bottom-4 -right-4 w-32 h-32 text-teal-500/30 rotate-12" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- FORM VIEW ---
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold text-slate-800 font-serif">Travel Itinerary Generator</h2>
        <p className="text-slate-600 mt-4 text-lg">Travel planning can be overwhelming. Let us craft the perfect journey for you.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 space-y-8 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-teal-700">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="text-lg font-medium animate-pulse">Crafting your perfect journey...</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" /> Destination
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Kyoto, Japan or Paris, France"
            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition bg-slate-50 focus:bg-white"
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" /> Days
            </label>
            <input
              type="number"
              min={1}
              max={30}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50 focus:bg-white transition"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Moon className="w-4 h-4 text-teal-600" /> Nights
            </label>
            <input
              type="number"
              min={0}
              max={30}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50 focus:bg-white transition"
              value={formData.nights}
              onChange={(e) => setFormData({ ...formData, nights: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-teal-600" /> Budget
            </label>
            <select
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50 focus:bg-white transition"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value as any })}
            >
              <option>Budget</option>
              <option>Moderate</option>
              <option>Luxury</option>
            </select>
          </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" /> Who is traveling?
            </label>
            <select
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50 focus:bg-white transition"
              value={formData.travelers}
              onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
            >
              <option>Solo Traveler</option>
              <option>Couple</option>
              <option>Family with Kids</option>
              <option>Group of Friends</option>
            </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-teal-600" /> Interests
          </label>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map(interest => (
              <button
                key={interest}
                type="button"
                onClick={() => handleInterestToggle(interest)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  formData.interests.includes(interest)
                    ? 'bg-teal-600 text-white shadow-md transform scale-105'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
        >
          <Navigation className="w-5 h-5" />
          Generate Itinerary
        </button>
      </form>
    </div>
  );
};

export default ItineraryGenerator;