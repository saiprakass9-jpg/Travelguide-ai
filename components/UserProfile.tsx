import React from 'react';
import { User, HistoryItem } from '../types';
import { Trash2, Clock, Map, FileText, X } from 'lucide-react';

interface UserProfileProps {
  user: User;
  history: HistoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onDeleteHistory: (id: string) => void;
  onHistoryClick: (item: HistoryItem) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ 
  user, 
  history, 
  isOpen, 
  onClose, 
  onDeleteHistory,
  onHistoryClick
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[60] bg-slate-900/20 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Profile Panel */}
      <div className="fixed right-4 top-20 z-[70] w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-top-4 fade-in duration-200 flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-16 h-16 rounded-full border-2 border-teal-500 shadow-lg"
            />
            <div>
              <h3 className="text-lg font-bold font-serif">{user.name}</h3>
              <p className="text-sm text-slate-400">{user.email}</p>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-3 h-3" /> Recent Activity
          </h4>
          
          {history.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">No history yet.</p>
              <p className="text-xs mt-1">Start generating itineraries to see them here!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => onHistoryClick(item)}
                  className="group bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-200 transition-all cursor-pointer relative"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${item.type === 'Itinerary' ? 'bg-teal-50 text-teal-600' : 'bg-pink-50 text-pink-600'}`}>
                        {item.type === 'Itinerary' ? <Map className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div>
                        <h5 className="font-semibold text-slate-800 text-sm line-clamp-1 group-hover:text-teal-700 transition-colors">{item.title}</h5>
                        <p className="text-xs text-slate-500 mt-0.5">{item.date}</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteHistory(item.id);
                      }}
                      className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100 absolute top-2 right-2"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 pl-11 border-l-2 border-slate-100 group-hover:border-teal-100">
                    {item.preview}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserProfile;