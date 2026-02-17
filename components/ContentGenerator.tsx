import React, { useState, useEffect } from 'react';
import { PenTool, Search, Globe, Copy, ExternalLink, Sparkles } from 'lucide-react';
import { generateTravelArticle } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { HistoryItem } from '../types';

interface ContentGeneratorProps {
  onSaveHistory: (item: Omit<HistoryItem, 'id'>) => void;
  initialData?: any;
}

const ContentGenerator: React.FC<ContentGeneratorProps> = ({ onSaveHistory, initialData }) => {
  const [topic, setTopic] = useState('');
  const [article, setArticle] = useState<{ text: string; sources: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setArticle(initialData);
    }
  }, [initialData]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;
    setLoading(true);
    try {
      const result = await generateTravelArticle(topic);
      setArticle(result);
      
      // Save to history
      onSaveHistory({
        type: 'Content',
        title: topic,
        date: new Date().toLocaleDateString(),
        preview: result.text.substring(0, 80) + '...',
        resultData: result
      });
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-800 mb-4 flex items-center justify-center gap-2">
          <PenTool className="w-8 h-8 text-pink-500" /> Travel Content Creator
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Generate engaging, SEO-optimized travel articles grounded in real-time search data. 
          Perfect for travel blogs and agency newsletters.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-1">
        <form onSubmit={handleGenerate} className="p-2 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Enter a topic (e.g., 'Hidden gems in Lisbon for foodies', 'Sustainable travel tips 2024')"
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-pink-500 outline-none text-slate-800 placeholder-slate-400"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="bg-pink-600 hover:bg-pink-700 text-white px-8 rounded-xl font-semibold transition flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? <Sparkles className="w-5 h-5 animate-spin" /> : 'Write'}
          </button>
        </form>
      </div>

      {article && (
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-8">
             <div className="prose prose-slate prose-headings:font-serif prose-headings:text-slate-900 prose-p:text-slate-700 max-w-none">
               <ReactMarkdown>{article.text}</ReactMarkdown>
             </div>
             <div className="mt-8 border-t pt-4 flex justify-end">
                <button className="text-slate-500 hover:text-pink-600 flex items-center gap-2 text-sm">
                  <Copy className="w-4 h-4" /> Copy Markdown
                </button>
             </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" /> Sources
              </h3>
              {article.sources.length > 0 ? (
                <ul className="space-y-3">
                  {article.sources.map((source, idx) => (
                    <li key={idx} className="text-sm">
                      <a 
                        href={source.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-start gap-2"
                      >
                        <ExternalLink className="w-3 h-3 mt-1 flex-shrink-0" />
                        <span className="line-clamp-2">{source.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No specific web sources cited.</p>
              )}
            </div>
            
            <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-xl p-6 border border-pink-100">
              <h3 className="font-semibold text-pink-900 mb-2">Content Stats</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                   <p className="text-pink-600/70 text-xs uppercase tracking-wider">Word Count</p>
                   <p className="font-bold text-pink-900">{article.text.split(' ').length}</p>
                </div>
                <div>
                   <p className="text-pink-600/70 text-xs uppercase tracking-wider">Reading Time</p>
                   <p className="font-bold text-pink-900">{Math.ceil(article.text.split(' ').length / 200)} min</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentGenerator;
