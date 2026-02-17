import React, { useState } from 'react';
import { Users, FileText, CheckCircle, Briefcase, Plus, Loader2 } from 'lucide-react';
import { generateItinerary } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface ClientRequest {
  id: string;
  name: string;
  destination: string;
  status: 'Pending' | 'Completed';
  requestDetails: string;
  result?: string;
}

const AgencyDashboard: React.FC = () => {
  const [activeClient, setActiveClient] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<ClientRequest[]>([
    { id: '1', name: 'Smith Family', destination: 'Orlando, FL', status: 'Pending', requestDetails: '5 days, Disney focus, young kids, moderate budget.' },
    { id: '2', name: 'John Doe', destination: 'Tokyo, Japan', status: 'Completed', requestDetails: '7 days, anime and tech focus.', result: 'Itinerary generated successfully.' },
    { id: '3', name: 'Sarah Connor', destination: 'Iceland', status: 'Pending', requestDetails: '4 days, northern lights, photography tour.' },
  ]);

  const handleGenerate = async (client: ClientRequest) => {
    setLoading(true);
    setActiveClient(client.id);
    
    try {
      const prompt = `Act as a professional travel agent. Create a polished itinerary for client: ${client.name}.
      Destination: ${client.destination}.
      Details: ${client.requestDetails}.
      Use formal, professional tone. Include Google Maps links for all hotels and key attractions.`;
      
      const { text } = await generateItinerary(prompt);
      
      setClients(prev => prev.map(c => 
        c.id === client.id ? { ...c, status: 'Completed', result: text } : c
      ));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-teal-600" /> Agency Portal
          </h2>
          <p className="text-slate-500">Manage client requests and generate professional itineraries.</p>
        </div>
        <button className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700 transition">
          <Plus className="w-4 h-4" /> New Client
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Client List */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-medium text-slate-700 flex items-center justify-between">
            <span>Client Queue</span>
            <span className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full">{clients.filter(c => c.status === 'Pending').length} Pending</span>
          </div>
          <div className="divide-y divide-slate-100">
            {clients.map(client => (
              <div 
                key={client.id}
                onClick={() => setActiveClient(client.id)}
                className={`p-4 cursor-pointer hover:bg-slate-50 transition ${activeClient === client.id ? 'bg-teal-50 border-l-4 border-teal-500' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-slate-800">{client.name}</h4>
                  {client.status === 'Completed' ? 
                    <CheckCircle className="w-4 h-4 text-green-500" /> : 
                    <div className="w-2 h-2 rounded-full bg-orange-400 mt-2"></div>
                  }
                </div>
                <p className="text-sm text-slate-500">{client.destination}</p>
                <p className="text-xs text-slate-400 mt-2 line-clamp-1">{client.requestDetails}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Workspace */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
          {activeClient ? (
            (() => {
              const client = clients.find(c => c.id === activeClient);
              if (!client) return null;
              return (
                <div className="h-full flex flex-col">
                  <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{client.name} - Itinerary Draft</h3>
                      <p className="text-slate-500 text-sm mt-1">{client.requestDetails}</p>
                    </div>
                    {client.status === 'Pending' && (
                      <button 
                        onClick={() => handleGenerate(client)}
                        disabled={loading}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
                      >
                         {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                         Generate Plan
                      </button>
                    )}
                  </div>

                  <div className="flex-1 bg-slate-50 rounded-lg p-6 overflow-y-auto border border-slate-200">
                    {loading && client.id === activeClient ? (
                       <div className="flex items-center justify-center h-full text-slate-400">
                         <Loader2 className="w-8 h-8 animate-spin mb-2" />
                       </div>
                    ) : client.result ? (
                       <div className="prose prose-sm prose-slate max-w-none">
                          <ReactMarkdown>{client.result}</ReactMarkdown>
                       </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400 italic">
                        No itinerary generated yet. Click generate to start.
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
             <div className="flex items-center justify-center h-full text-slate-400">
               <Users className="w-12 h-12 mb-4 opacity-20" />
               <p>Select a client to view details</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgencyDashboard;