import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Code2, 
  FileCode2, 
  Info, 
  Bug, 
  Zap, 
  ShieldCheck, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Flame,
  Search,
  CheckSquare,
  MessageSquare,
  Send,
  Award,
  Activity,
  LayoutDashboard,
  X,
  Play,
  Terminal
} from 'lucide-react';

// --- API Helper for Gemini ---
const apiKey = ""; // API key is provided by the execution environment

async function fetchGeminiData(prompt, systemInstruction, schema) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  };

  let retries = 5;
  let delay = 1000;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResponse) {
        return JSON.parse(textResponse);
      }
      throw new Error("Invalid response format");
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

// --- API Helper for Chatbot (Text Only) ---
async function fetchGeminiText(prompt, systemInstruction) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I encountered an error.";
  } catch (error) {
    console.error("Chat API Error:", error);
    return "Failed to connect to AI assistant. Please try again.";
  }
}

// --- Main Application Component ---
export default function App() {
  return <MainDashboard />;
}

// --- Main Dashboard ---
function MainDashboard() {
  // Navigation State: 'editor', 'results', or 'chat'
  const [activeView, setActiveView] = useState('editor'); 
  
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('Python');
  const [selectedModel, setSelectedModel] = useState('Llama 3.3 70B (Groq)');
  const [focusAreas, setFocusAreas] = useState({
    bugs: true,
    performance: true,
    security: true,
    bestPractices: true
  });
  
  const [isReviewing, setIsReviewing] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [rewriteData, setRewriteData] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);
  const [error, setError] = useState('');

  // AI Chat State
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: "Hi! I'm your AI coding assistant. Ask me anything about your code, or request help with a specific concept!" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);

  const handleReviewCode = async () => {
    if (!code.trim()) {
      setError("Please paste some code to review.");
      return;
    }
    setError('');
    setActiveView('results'); // Switch to results page
    setIsReviewing(true);
    
    const activeFocus = Object.keys(focusAreas).filter(k => focusAreas[k]).join(', ');
    const prompt = `Please review the following ${language} code focusing on: ${activeFocus}.\n\nCode:\n${code}`;
    const sysInst = `You are an expert code reviewer with 15+ years of experience, acting as the ${selectedModel} model. Analyze the provided code. Provide a structured response with counts of critical, high, medium, and low priority issues. Evaluate the code and provide an overall "codeScore" out of 100 based on code quality/maintainability, and an "accuracy" percentage out of 100 representing how functionally correct the logic is. Finally, provide detailed markdown suggestions.`;
    
    const schema = {
      type: "OBJECT",
      properties: {
        codeScore: { type: "INTEGER" },
        accuracy: { type: "INTEGER" },
        critical: { type: "INTEGER" },
        high: { type: "INTEGER" },
        medium: { type: "INTEGER" },
        low: { type: "INTEGER" },
        suggestions: { type: "STRING" }
      },
      required: ["codeScore", "accuracy", "critical", "high", "medium", "low", "suggestions"]
    };

    try {
      const data = await fetchGeminiData(prompt, sysInst, schema);
      setReviewData(data);
    } catch (err) {
      setError("Failed to analyze code. Please try again.");
    } finally {
      setIsReviewing(false);
    }
  };

  const handleRewriteCode = async () => {
    if (!code.trim()) {
      setError("Please paste some code to rewrite.");
      return;
    }
    setError('');
    setActiveView('results'); // Switch to results page
    setIsRewriting(true);
    
    const activeFocus = Object.keys(focusAreas).filter(k => focusAreas[k]).join(', ');
    const prompt = `Please rewrite the following ${language} code. Fix any issues related to: ${activeFocus}. Optimize it for production.\n\nCode:\n${code}`;
    const sysInst = `You are an expert software developer acting as the ${selectedModel} model. Rewrite the provided code to be production-ready, secure, and highly performant. Provide the full rewritten code, a list of key improvements, and a brief explanation.`;
    
    const schema = {
      type: "OBJECT",
      properties: {
        rewrittenCode: { type: "STRING" },
        improvements: { 
          type: "ARRAY", 
          items: { type: "STRING" } 
        },
        explanation: { type: "STRING" }
      },
      required: ["rewrittenCode", "improvements", "explanation"]
    };

    try {
      const data = await fetchGeminiData(prompt, sysInst, schema);
      setRewriteData(data);
    } catch (err) {
      setError("Failed to rewrite code. Please try again.");
    } finally {
      setIsRewriting(false);
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      setError("Please paste some code to run.");
      return;
    }
    setError('');
    setActiveView('results'); // Switch to results page
    setIsExecuting(true);

    const prompt = `Act as a strict ${language} compiler/interpreter. Simulate the execution of the following ${language} code. If the code has syntax errors, logic errors, or runtime exceptions, output them accurately in 'stderr' and return a non-zero exit 'code'. If it runs successfully, output the exact resulting text/console logs in 'stdout' and return an exit 'code' of 0. Do not provide any conversational text.

Code to execute:
${code}`;

    const sysInst = `You are an exact code execution engine simulator for ${language}. Simulate the code execution step-by-step in your "mind" and return the structured JSON containing the stdout, stderr, and exit code.`;

    const schema = {
      type: "OBJECT",
      properties: {
        stdout: { type: "STRING" },
        stderr: { type: "STRING" },
        code: { type: "INTEGER" }
      },
      required: ["stdout", "stderr", "code"]
    };

    try {
      const data = await fetchGeminiData(prompt, sysInst, schema);
      setExecutionResult({
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        code: data.code || 0
      });
    } catch (err) {
      setError("Failed to execute code simulation.");
      setExecutionResult({ stderr: "Error simulating code execution: " + err.message, stdout: '', code: 1 });
    } finally {
      setIsExecuting(false);
    }
  };

  const hasAnyResults = reviewData || rewriteData || executionResult || isReviewing || isRewriting || isExecuting;
  
  return (
    <div className="h-screen bg-slate-900 text-slate-200 font-sans flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <header className="bg-slate-800 border-b border-slate-700 py-3 px-6 flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Code Review Agent
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Unified Workspace</p>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 overflow-x-auto">
            <button 
              onClick={() => setActiveView('editor')}
              className={`flex items-center px-4 py-2 rounded-md transition-colors text-sm font-medium whitespace-nowrap ${activeView === 'editor' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Code2 size={16} className="mr-2" /> Editor
            </button>
            <button 
              onClick={() => setActiveView('results')}
              className={`flex items-center px-4 py-2 rounded-md transition-colors text-sm font-medium whitespace-nowrap ${activeView === 'results' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <LayoutDashboard size={16} className="mr-2" /> Results Feed
            </button>
            <button 
              onClick={() => setActiveView('chat')}
              className={`flex items-center px-4 py-2 rounded-md transition-colors text-sm font-medium whitespace-nowrap ${activeView === 'chat' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <MessageSquare size={16} className="mr-2" /> AI Chat
            </button>
          </div>
        </div>
      </header>

      {/* Top Welcome Banner - Only show on editor view */}
      {activeView === 'editor' && (
        <div className="bg-slate-800/30 border-b border-slate-700/50 py-4 px-6 flex-shrink-0 text-center animate-in fade-in duration-300">
          <h2 className="text-lg font-bold text-slate-100">Welcome to your Dashboard</h2>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            Your unified workspace for high-speed AI code analysis<br/>
            and automated refactoring.
          </p>
        </div>
      )}

      {/* Main Single-Page Workspace */}
      <main className="flex-grow flex flex-col p-6 overflow-hidden max-w-5xl mx-auto w-full transition-all duration-500">
        
        {/* VIEW 1: Editor */}
        {activeView === 'editor' && (
          <div className="w-full flex flex-col h-full overflow-y-auto custom-scrollbar pb-4 animate-in fade-in duration-300">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 shadow-lg flex flex-col flex-grow">
              <h2 className="text-lg font-semibold mb-4 flex items-center text-slate-100">
                <Code2 size={20} className="mr-2 text-indigo-400" /> Editor
              </h2>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Language</label>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option>Python</option>
                    <option>JavaScript</option>
                    <option>TypeScript</option>
                    <option>HTML</option>
                    <option>CSS</option>
                    <option>Java</option>
                    <option>C++</option>
                    <option>Go</option>
                    <option>Rust</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">AI Model</label>
                  <select 
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option>Llama 3.3 70B (Groq)</option>
                    <option>Gemini 2.5 Pro</option>
                    <option>GPT-4o</option>
                    <option>Claude 3.5 Sonnet</option>
                    <option>DeepSeek Coder V2</option>
                    <option>ChatGPT</option>
                    <option>Google AI Studio</option>
                    <option>NaN</option>
                  </select>
                </div>
              </div>

              <div className="flex-grow flex flex-col mb-4 min-h-[300px]">
                <label className="block text-xs font-medium text-slate-400 mb-1">Code snippet</label>
                <textarea 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your code here..."
                  className="w-full h-full flex-grow bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 font-mono text-sm text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none shadow-inner"
                ></textarea>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-400 mb-2">Focus Areas</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FocusCheckbox icon={<Bug size={14}/>} label="Bugs" checked={focusAreas.bugs} onChange={(v) => setFocusAreas({...focusAreas, bugs: v})} />
                  <FocusCheckbox icon={<Zap size={14}/>} label="Performance" checked={focusAreas.performance} onChange={(v) => setFocusAreas({...focusAreas, performance: v})} />
                  <FocusCheckbox icon={<ShieldCheck size={14}/>} label="Security" checked={focusAreas.security} onChange={(v) => setFocusAreas({...focusAreas, security: v})} />
                  <FocusCheckbox icon={<CheckCircle size={14}/>} label="Best Practices" checked={focusAreas.bestPractices} onChange={(v) => setFocusAreas({...focusAreas, bestPractices: v})} />
                </div>
              </div>

              {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded text-red-400 text-sm flex items-center"><AlertTriangle size={16} className="mr-2 flex-shrink-0"/>{error}</div>}

              <div className="mt-auto pt-4 border-t border-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button 
                    onClick={handleReviewCode}
                    disabled={isReviewing || isRewriting || isExecuting}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {isReviewing ? <RefreshCw className="animate-spin mr-2" size={16} /> : <Search size={16} className="mr-2" />}
                    Review Code
                  </button>
                  <button 
                    onClick={handleRewriteCode}
                    disabled={isReviewing || isRewriting || isExecuting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {isRewriting ? <RefreshCw className="animate-spin mr-2" size={16} /> : <FileCode2 size={16} className="mr-2" />}
                    Rewrite Code
                  </button>
                  <button 
                    onClick={handleRunCode}
                    disabled={isReviewing || isRewriting || isExecuting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {isExecuting ? <RefreshCw className="animate-spin mr-2" size={16} /> : <Play size={16} className="mr-2" />}
                    Run & View Output
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Results Feed */}
        {activeView === 'results' && (
          <div className="w-full flex flex-col h-full overflow-y-auto pr-2 pb-10 space-y-6 custom-scrollbar animate-in fade-in zoom-in-95 duration-300">
            
            {/* Quick Navigation Back to Editor */}
            <div className="flex items-center justify-between bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700 shadow-sm flex-shrink-0">
               <span className="text-slate-300 font-medium flex items-center">
                 <LayoutDashboard className="mr-2 text-indigo-400" size={18} /> Results Feed
               </span>
               <button 
                 onClick={() => setActiveView('editor')}
                 className="flex items-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20"
               >
                 <ArrowLeft size={16} className="mr-2" /> Back to Editor
               </button>
            </div>

            {!hasAnyResults && (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 min-h-[400px]">
                <div className="bg-slate-800/50 p-6 rounded-full border border-slate-700/50">
                  <LayoutDashboard size={48} className="text-slate-600" />
                </div>
                <h3 className="text-lg font-medium text-slate-300">No Results Yet</h3>
                <p className="text-sm text-center max-w-sm">
                  Go back to the Editor, paste your code, and run an analysis to see your results appear here.
                </p>
                <button 
                   onClick={() => setActiveView('editor')}
                   className="mt-4 bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Go to Editor
                </button>
              </div>
            )}

            {(isReviewing || reviewData) && (
               <ReviewSection isReviewing={isReviewing} reviewData={reviewData} onRewriteRequest={handleRewriteCode} />
            )}

            {(isRewriting || rewriteData) && (
               <RewriteSection isRewriting={isRewriting} rewriteData={rewriteData} />
            )}

            {(isExecuting || executionResult) && (
               <OutputSection isExecuting={isExecuting} executionResult={executionResult} />
            )}
          </div>
        )}

        {/* VIEW 3: AI Chat */}
        {activeView === 'chat' && (
          <div className="w-full h-full flex flex-col pb-2 animate-in fade-in zoom-in-95 duration-300">
            <ChatSection 
              messages={chatMessages}
              setMessages={setChatMessages}
              input={chatInput}
              setInput={setChatInput}
              isTyping={isChatTyping}
              setIsTyping={setIsChatTyping}
              codeContext={code}
              language={language}
            />
          </div>
        )}

      </main>

      {/* Global CSS for custom thin scrollbars to keep dashboard looking clean */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5); 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.8); 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 1); 
        }
      `}} />
    </div>
  );
}

// --- Section Components (For the Results Tab) ---

function ReviewSection({ isReviewing, reviewData, onRewriteRequest }) {
  if (isReviewing) {
    return <LoadingCard message="Analyzing code for bugs, security vulnerabilities, and optimizations..." icon={<Search size={24} className="text-indigo-400"/>} />;
  }

  if (!reviewData) return null;

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg flex-shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center text-slate-100">
          <CheckSquare className="mr-2 text-indigo-400" /> Code Review Results
        </h2>
        <button 
          onClick={onRewriteRequest}
          className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center border border-indigo-500/30 hover:border-indigo-600"
        >
          Fix & Rewrite <ArrowRight size={14} className="ml-2" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <HealthMetricCard 
          title="Overall Code Score" 
          value={reviewData.codeScore} 
          icon={<Award size={20} />} 
          subtitle="Code quality, maintainability"
        />
        <HealthMetricCard 
          title="Estimated Accuracy" 
          value={reviewData.accuracy} 
          suffix="%"
          icon={<Activity size={20} />} 
          subtitle="Functional correctness"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SeverityCard title="Critical" count={reviewData.critical} color="red" icon={<AlertTriangle size={16} />} />
        <SeverityCard title="High" count={reviewData.high} color="orange" icon={<Flame size={16} />} />
        <SeverityCard title="Medium" count={reviewData.medium} color="yellow" icon={<Info size={16} />} />
        <SeverityCard title="Low" count={reviewData.low} color="blue" icon={<CheckCircle size={16} />} />
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-700 p-5 shadow-inner">
        <h3 className="text-sm font-semibold mb-3 border-b border-slate-800 pb-2 text-slate-300">Detailed Suggestions</h3>
        <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
          <MarkdownRenderer text={reviewData.suggestions} />
        </div>
      </div>
    </div>
  );
}

function RewriteSection({ isRewriting, rewriteData }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (rewriteData?.rewrittenCode) {
      document.execCommand('copy');
      navigator.clipboard.writeText(rewriteData.rewrittenCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isRewriting) {
    return <LoadingCard message="Refactoring code to apply best practices and optimizations..." icon={<FileCode2 size={24} className="text-indigo-400"/>} />;
  }

  if (!rewriteData) return null;

  // Safe improvements array mapping to prevent Object Rendering errors
  const safeImprovements = Array.isArray(rewriteData.improvements) 
    ? rewriteData.improvements 
    : typeof rewriteData.improvements === 'string' 
      ? [rewriteData.improvements] 
      : [];

  return (
    <div className="flex flex-col gap-6 flex-shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 gap-4">
        {/* Rewritten Code Card */}
        <div className="bg-slate-800 rounded-xl border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)] flex flex-col overflow-hidden">
          <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center text-indigo-400">
               <FileCode2 size={18} className="mr-2" /> Rewritten Code
            </h2>
            <button onClick={handleCopy} className="text-slate-300 hover:text-white transition-colors flex items-center text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-md shadow-sm border border-slate-600">
              {copied ? <Check size={14} className="mr-1 text-green-400" /> : <Copy size={14} className="mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="p-4 bg-slate-950 overflow-auto max-h-[500px] custom-scrollbar">
            <pre className="font-mono text-sm text-indigo-200">
              <code>{typeof rewriteData.rewrittenCode === 'string' ? rewriteData.rewrittenCode : JSON.stringify(rewriteData.rewrittenCode, null, 2)}</code>
            </pre>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg">
        <h3 className="text-md font-semibold mb-4 text-slate-200 flex items-center">
          <Zap size={18} className="mr-2 text-indigo-400" /> Applied Improvements
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {safeImprovements.map((imp, idx) => (
            <li key={idx} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 text-sm text-slate-300 flex items-start shadow-sm">
              <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>{typeof imp === 'string' ? imp : JSON.stringify(imp)}</span>
            </li>
          ))}
        </ul>

        <h3 className="text-md font-semibold mb-3 text-slate-200 flex items-center border-t border-slate-700 pt-4">
          <Info size={18} className="mr-2 text-indigo-400" /> AI Explanation
        </h3>
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-sm text-slate-300 leading-relaxed shadow-inner">
           <MarkdownRenderer text={rewriteData.explanation} />
        </div>
      </div>
    </div>
  );
}

function OutputSection({ isExecuting, executionResult }) {
  if (isExecuting) {
    return <LoadingCard message="Simulating code execution and compiling output..." icon={<Terminal size={24} className="text-emerald-400"/>} />;
  }

  if (!executionResult) return null;

  const isError = executionResult.code !== 0 || executionResult.stderr;

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg flex flex-col flex-shrink-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-800 px-5 py-4 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center text-slate-100">
          <Terminal className="mr-2 text-emerald-400" size={20} /> Execution Output
        </h2>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-inner ${isError ? 'bg-red-950/80 text-red-400 border border-red-800/50' : 'bg-green-950/80 text-green-400 border border-green-800/50'}`}>
          {isError ? 'Exited with Error' : 'Success'} (Code {executionResult.code || 0})
        </span>
      </div>
      
      <div className="bg-[#0a0a0c] p-5 font-mono text-sm overflow-x-auto min-h-[150px] custom-scrollbar">
        {executionResult.stdout && (
          <div className="text-slate-300 whitespace-pre-wrap mb-4">{executionResult.stdout}</div>
        )}
        
        {executionResult.stderr && (
          <div className="text-red-400 whitespace-pre-wrap">{executionResult.stderr}</div>
        )}
        
        {!executionResult.stdout && !executionResult.stderr && (
          <div className="text-slate-600 italic">No output produced.</div>
        )}
      </div>
    </div>
  );
}

// --- Section Component (Chat View) ---

function ChatSection({ messages, setMessages, input, setInput, isTyping, setIsTyping, codeContext, language }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    const convoHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
    const prompt = `Code Context (Language: ${language}):\n\`\`\`\n${codeContext || 'No code provided yet.'}\n\`\`\`\n\nConversation History:\n${convoHistory}\n\nUser: ${userMsg}\nAssistant:`;
    const sysInst = "You are a helpful and expert AI coding assistant. Answer the user's questions clearly and concisely. You have access to the user's current code context. Provide code snippets in Markdown where helpful.";

    const aiResponse = await fetchGeminiText(prompt, sysInst);
    
    setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    setIsTyping(false);
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg h-full flex flex-col overflow-hidden animate-in fade-in duration-300">
      <div className="bg-slate-800/90 px-6 py-5 border-b border-slate-700 flex justify-between items-center shadow-sm z-10">
        <h2 className="text-xl font-bold flex items-center text-slate-100">
          <MessageSquare className="mr-3 text-indigo-400" size={24} /> AI Coding Assistant
        </h2>
        <span className="text-xs uppercase font-bold text-indigo-300 bg-indigo-900/40 px-3 py-1.5 rounded border border-indigo-500/30">
          Context Aware ({language})
        </span>
      </div>

      <div className="flex-grow p-6 overflow-y-auto bg-slate-900/50 space-y-6 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl p-4 text-sm shadow-md ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-slate-700 text-slate-200 rounded-bl-none border border-slate-600'
            }`}>
              {msg.role === 'user' ? (
                <div className="whitespace-pre-wrap">{typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text)}</div>
              ) : (
                <MarkdownRenderer text={msg.text} />
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-slate-400 rounded-xl rounded-bl-none p-4 text-sm border border-slate-600 flex space-x-1.5 items-center shadow-md">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-slate-800 border-t border-slate-700 flex space-x-3">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your code..."
          className="flex-grow bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 shadow-inner"
        />
        <button 
          type="submit"
          disabled={!input.trim() || isTyping}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center font-medium shadow-md"
        >
          <Send size={18} className="mr-2" /> Send
        </button>
      </form>
    </div>
  );
}

// --- Small Reusable UI Components ---

function LoadingCard({ message, icon }) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 shadow-lg flex flex-col items-center justify-center text-slate-400 text-center flex-shrink-0 animate-in fade-in duration-300">
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-indigo-500 rounded-full blur animate-pulse opacity-20"></div>
        <RefreshCw size={36} className="animate-spin text-indigo-400 relative z-10" />
      </div>
      <p className="text-sm font-medium max-w-xs">{message}</p>
    </div>
  );
}

function FocusCheckbox({ label, icon, checked, onChange }) {
  return (
    <label className={`flex items-center p-2 rounded-lg border cursor-pointer transition-all ${checked ? 'bg-indigo-900/30 border-indigo-500/50 text-indigo-300 shadow-inner' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
      <input 
        type="checkbox" 
        className="hidden" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)} 
      />
      <span className="mr-2 opacity-80">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
      {checked && <Check size={12} className="ml-auto text-indigo-400" />}
    </label>
  );
}

function HealthMetricCard({ title, value, subtitle, icon, suffix = "" }) {
  const safeValue = Number(value) || 0;
  let colorClass = "text-red-400 bg-red-500/5 border-red-500/20";
  let ringClass = "stroke-red-500";
  
  if (safeValue >= 80) {
    colorClass = "text-green-400 bg-green-500/5 border-green-500/20";
    ringClass = "stroke-green-500";
  } else if (safeValue >= 50) {
    colorClass = "text-yellow-400 bg-yellow-500/5 border-yellow-500/20";
    ringClass = "stroke-yellow-500";
  }

  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeValue / 100) * circumference;

  return (
    <div className={`p-4 rounded-xl border flex items-center justify-between ${colorClass}`}>
      <div className="flex flex-col">
        <div className="flex items-center space-x-2 mb-1 opacity-90 font-semibold text-sm">
          {icon} <span>{title}</span>
        </div>
        <span className="text-xs opacity-70 mt-1 max-w-[150px] leading-tight">{subtitle}</span>
      </div>
      
      <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="24" fill="none" className="stroke-slate-800/50" strokeWidth="5" />
          <circle 
            cx="28" cy="28" r="24" 
            fill="none" 
            className={ringClass} 
            strokeWidth="5" 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex items-center justify-center text-lg font-bold">
          {safeValue}{suffix}
        </div>
      </div>
    </div>
  );
}

function SeverityCard({ title, count, color, icon }) {
  const safeCount = typeof count === 'object' ? JSON.stringify(count) : String(count || 0);
  const colorMap = {
    red: 'bg-red-500/5 border-red-500/20 text-red-400',
    orange: 'bg-orange-500/5 border-orange-500/20 text-orange-400',
    yellow: 'bg-yellow-500/5 border-yellow-500/20 text-yellow-400',
    blue: 'bg-blue-500/5 border-blue-500/20 text-blue-400',
  };

  return (
    <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center shadow-sm ${colorMap[color]}`}>
      <div className="mb-1 opacity-80">{icon}</div>
      <div className="text-xl font-bold mb-0.5">{safeCount}</div>
      <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80">{title}</div>
    </div>
  );
}

// Safely Render LLM Output to prevent crash
function MarkdownRenderer({ text }) {
  if (!text) return null;

  // Defensive fallback in case AI hallucinates object/array syntax outside schema
  let safeText = '';
  if (typeof text === 'string') {
    safeText = text;
  } else if (Array.isArray(text)) {
    safeText = text.join('\n');
  } else {
    safeText = JSON.stringify(text, null, 2);
  }

  const blocks = safeText.split('\n\n');

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        if (block.startsWith('```')) {
          const lines = block.split('\n');
          const hasEndFence = lines.length > 1 && lines[lines.length - 1].startsWith('```');
          const code = lines.slice(1, hasEndFence ? lines.length - 1 : lines.length).join('\n');
          return (
            <pre key={i} className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-[11px] overflow-x-auto text-indigo-200">
              <code>{code}</code>
            </pre>
          );
        }

        if (block.trim().startsWith('- ') || block.trim().startsWith('* ')) {
          const items = block.split('\n').filter(l => l.trim().startsWith('- ') || l.trim().startsWith('* '));
          return (
            <ul key={i} className="list-disc pl-5 space-y-1 text-xs">
              {items.map((item, j) => (
                <li key={j}>{renderInline(item.replace(/^[-*]\s/, ''))}</li>
              ))}
            </ul>
          );
        }
        
        if (block.startsWith('### ')) {
           return <h4 key={i} className="text-sm font-bold text-slate-200 mt-4 mb-1">{renderInline(block.replace('### ', ''))}</h4>;
        }
        if (block.startsWith('## ')) {
           return <h3 key={i} className="text-md font-bold text-indigo-300 mt-4 mb-1 border-b border-slate-700/50 pb-1">{renderInline(block.replace('## ', ''))}</h3>;
        }

        return <p key={i} className="text-sm">{renderInline(block)}</p>;
      })}
    </div>
  );

  function renderInline(str) {
    if (typeof str !== 'string') return String(str);
    const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-slate-200 font-semibold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300 font-mono text-xs border border-slate-700/50">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  }
}