import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, MessageCircle, Minimize2, Maximize2, Loader2, User, Image as ImageIcon, Trash2, Camera } from 'lucide-react';
import { createTravelChat } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';

interface ChatAssistantProps {
  isEmbedded?: boolean;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ isEmbedded = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'model', text: "Hi! I'm your AI travel buddy. I can help plan trips, give advice, or identify landmarks from your photos! Upload a picture of a place, and I'll tell you all about it." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize chat session on mount
    chatSessionRef.current = createTravelChat();
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isMaximized, isEmbedded]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !selectedImage) || !chatSessionRef.current || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      image: selectedImage || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    const imageToSend = selectedImage; // Store ref to current image
    setSelectedImage(null); // Clear preview immediately
    setIsTyping(true);

    try {
      let messagePayload: string | any[] = input;
      
      // If there's an image, construct a multipart message
      if (imageToSend) {
        const base64Data = imageToSend.split(',')[1];
        const mimeType = imageToSend.split(';')[0].split(':')[1];
        
        messagePayload = [
            { text: input || "Identify this image and tell me about this place." },
            { inlineData: { mimeType, data: base64Data } }
        ];
      }

      const result = await chatSessionRef.current.sendMessageStream({ message: messagePayload });
      
      const modelMessageId = (Date.now() + 1).toString();
      let fullText = "";
      
      // Add placeholder for model message
      setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '' }]);

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const text = c.text;
        if (text) {
          fullText += text;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === modelMessageId ? { ...msg, text: fullText } : msg
            )
          );
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: "Sorry, I'm having trouble connecting right now. Please try again." 
      }]);
    } finally {
      setIsTyping(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Logic for container classes
  let containerClasses = "hidden";
  if (isEmbedded) {
    containerClasses = "w-full h-[calc(100vh-5rem)] flex flex-col bg-white";
  } else if (isOpen) {
    containerClasses = isMaximized
      ? "fixed inset-0 z-[100] bg-white flex flex-col animate-in zoom-in-95 duration-200"
      : "fixed bottom-6 right-6 z-50 mb-4 w-[350px] sm:w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200";
  }

  // If not embedded and not open, don't render content (just the toggle button)
  if (!isEmbedded && !isOpen) {
     return (
        <div className="fixed bottom-6 right-6 z-50">
           <button
            onClick={() => {
              setIsOpen(true);
              setIsMaximized(true);
            }}
            className="group flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 bg-teal-600 hover:bg-teal-700 border-2 border-white ring-2 ring-teal-200 ring-offset-2"
            aria-label="Chat with AI"
          >
            <div className="relative">
               <MessageCircle className="w-8 h-8 text-white" />
               <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-50"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-400 border-2 border-teal-600"></span>
               </span>
            </div>
          </button>
        </div>
     );
  }

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className={`flex items-center justify-between shadow-sm z-10 ${isEmbedded ? 'bg-white p-6 border-b border-slate-100' : 'bg-teal-600 p-4 text-white'}`}>
        <div className="flex items-center gap-3">
          <div className={`${isEmbedded ? 'bg-teal-100 p-3' : 'bg-white/20 p-2'} rounded-full backdrop-blur-sm`}>
            <Bot className={`w-6 h-6 ${isEmbedded ? 'text-teal-700' : 'text-white'}`} />
          </div>
          <div>
            <h3 className={`font-bold font-serif tracking-wide leading-tight ${isEmbedded ? 'text-2xl text-slate-800' : 'text-lg text-white'}`}>Travel Buddy AI</h3>
            <p className={`text-xs ${isEmbedded ? 'text-slate-500' : 'text-teal-100 opacity-90'}`}>Ask me anything about your trip</p>
          </div>
        </div>
        
        {!isEmbedded && (
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsMaximized(!isMaximized)}
              className="hover:bg-white/20 p-2 rounded-lg transition text-white/90 hover:text-white"
              title={isMaximized ? "Minimize" : "Maximize"}
            >
              {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-lg transition text-white/90 hover:text-white"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto space-y-6 bg-slate-50 ${isEmbedded ? 'p-8 max-w-5xl mx-auto w-full' : 'p-4'}`}>
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-teal-100' : 'bg-indigo-100'}`}>
               {msg.role === 'user' ? <User className="w-6 h-6 text-teal-700" /> : <Bot className="w-6 h-6 text-indigo-700" />}
            </div>
            
            <div className={`max-w-[80%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.image && (
                 <div className="mb-2 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                   <img src={msg.image} alt="User upload" className="max-w-full max-h-80 object-cover" />
                 </div>
              )}
              <div className={`rounded-2xl px-6 py-4 text-sm shadow-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-teal-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
              }`}>
                <ReactMarkdown 
                  components={{
                    p: ({children}) => <p className="mb-3 last:mb-0 text-base">{children}</p>,
                    a: ({href, children}) => <a href={href} target="_blank" rel="noopener" className="underline font-bold hover:text-teal-300 transition-colors">{children}</a>,
                    ul: ({children}) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                    strong: ({children}) => <strong className="font-bold">{children}</strong>
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-4 animate-pulse">
             <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-6 h-6 text-indigo-700" />
             </div>
             <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-6 py-4 shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`bg-white border-t border-slate-100 ${isEmbedded ? 'p-6 max-w-5xl mx-auto w-full pb-10' : 'p-4'}`}>
        {/* Image Preview */}
        {selectedImage && (
          <div className="mb-4 flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 inline-flex animate-in fade-in slide-in-from-bottom-2">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group">
              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <div className="pr-2">
               <p className="text-sm font-medium text-slate-700">Photo attached</p>
               <button 
                onClick={() => {
                  setSelectedImage(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }} 
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mt-1 font-medium"
               >
                 <Trash2 className="w-3.5 h-3.5" /> Remove photo
               </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="relative flex items-end gap-3">
           {/* Hidden File Input */}
           <input 
              type="file" 
              ref={fileInputRef}
              accept="image/*"
              className="hidden" 
              onChange={handleImageSelect}
           />
           
           <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all font-medium border ${
              selectedImage 
                ? 'bg-teal-50 text-teal-700 border-teal-200' 
                : 'text-slate-500 hover:text-teal-600 hover:bg-slate-50 border-transparent hover:border-slate-200'
            }`}
            title="Upload Photo"
           >
             <Camera className="w-5 h-5" />
             {(isEmbedded || isMaximized) && <span className="hidden sm:inline">Add Photo</span>}
           </button>

          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={selectedImage ? "Ask something about this photo..." : "Type your message..."}
              rows={1}
              className="w-full pl-5 pr-14 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition text-base text-slate-800 resize-none max-h-40 custom-scrollbar shadow-sm"
              style={{ minHeight: '52px' }}
            />
            <button 
              type="submit" 
              disabled={(!input.trim() && !selectedImage) || isTyping}
              className="absolute right-2 bottom-2 p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:hover:bg-teal-600 transition shadow-sm"
            >
              {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </form>
        
        {isEmbedded && (
          <p className="text-center text-xs text-slate-400 mt-4">
            AI can make mistakes. Please check important info.
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatAssistant;