import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Image as ImageIcon, Info, LayoutGrid, Rocket, Loader2, ExternalLink, RefreshCw } from 'lucide-react';

/**
 * [환경 변수 설정 안내]
 * Vercel 배포 시 Project Settings > Environment Variables 메뉴에서 
 * VITE_NASA_API_KEY 항목에 발급받은 키를 입력하세요.
 * 로컬 개발 시에는 .env 파일에 작성하면 됩니다.
 */
// 특정 환경에서 import.meta 접근 오류가 발생할 수 있어 안전한 방식으로 키를 관리합니다.
const NASA_API_KEY = "3ZpWN3RhyIixEUngGlXmO8a23VTg7cUyvaIA32wR";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";

const App = () => {
  const [view, setView] = useState('home');
  const [loading, setLoading] = useState(true);
  const [mainData, setMainData] = useState(null);
  const [translatedDesc, setTranslatedDesc] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [error, setError] = useState(null);

  // 브라우저 탭 타이틀 업데이트
  useEffect(() => {
    document.title = "Cosmos View | 오늘의 우주사진";
  }, []);

  // Gemini API를 이용한 한글 번역 및 요약 함수
  const translateDescription = async (text) => {
    const apiKey = ""; // 시스템 환경에 의해 자동으로 제공됩니다.
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `NASA의 오늘의 우주 사진 설명을 한국어로 친절하고 전문적으로 번역해줘. 
              일반인이 이해하기 쉽게 3~4문장 정도로 요약해줘: "${text}"`
            }]
          }]
        })
      });

      if (!response.ok) throw new Error("Translation request failed");
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text || "설명을 가져오는 중 오류가 발생했습니다.";
    } catch (err) {
      console.error("Translation Error:", err);
      return "현재 번역 서비스가 원활하지 않습니다. 아래 영문 설명을 참고해 주세요.";
    }
  };

  // NASA APOD 데이터 가져오기
  const fetchAPOD = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    setTranslatedDesc("");
    try {
      const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&date=${date}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "NASA 서버에서 데이터를 가져올 수 없습니다.");
      }
      const data = await response.json();
      setMainData(data);
      
      if (data.explanation) {
        const koDesc = await translateDescription(data.explanation);
        setTranslatedDesc(koDesc);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 랜덤 갤러리 데이터 가져오기
  const fetchGallery = async () => {
    setGalleryLoading(true);
    try {
      const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&count=6`);
      if (!response.ok) throw new Error("갤러리 데이터를 가져오지 못했습니다.");
      const data = await response.json();
      setGalleryItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setGalleryLoading(false);
    }
  };

  useEffect(() => {
    fetchAPOD(selectedDate);
  }, [selectedDate, fetchAPOD]);

  useEffect(() => {
    if (view === 'gallery' && galleryItems.length === 0) {
      fetchGallery();
    }
  }, [view, galleryItems.length]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setView('home'); setSelectedDate(new Date().toISOString().split('T')[0]); }}>
            <div className="bg-blue-600 p-2 rounded-lg group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500/20">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              COSMOS VIEW
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-800 rounded-full p-1 border border-white/10">
              <button 
                onClick={() => setView('home')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${view === 'home' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                <ImageIcon size={16} />
                <span>오늘의 사진</span>
              </button>
              <button 
                onClick={() => setView('gallery')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${view === 'gallery' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                <LayoutGrid size={16} />
                <span>갤러리</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded-xl border border-white/10 shadow-inner">
              <Calendar size={14} className="text-blue-400" />
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="bg-transparent border-none outline-none text-xs text-slate-200 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-10">
        {view === 'home' ? (
          <div className="space-y-8 animate-in fade-in duration-1000">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-48 gap-4">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-slate-400 text-sm font-medium">NASA에서 우주 조각을 가져오는 중...</p>
              </div>
            ) : error ? (
              <div className="text-center py-40 border border-dashed border-red-500/30 rounded-3xl bg-red-500/5">
                <h3 className="text-red-400 text-xl font-bold mb-2">데이터 로드 실패</h3>
                <p className="text-slate-400 mb-6">{error}</p>
                <button onClick={() => fetchAPOD(selectedDate)} className="bg-slate-800 px-6 py-2 rounded-full text-sm hover:bg-slate-700 transition-colors">
                  다시 시도
                </button>
              </div>
            ) : mainData && (
              <div className="grid lg:grid-cols-5 gap-12 items-start">
                {/* Visual Content Column */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="relative group rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/40 ring-1 ring-white/10 bg-slate-900">
                    {mainData.media_type === "image" ? (
                      <img 
                        src={mainData.hdurl || mainData.url} 
                        alt={mainData.title}
                        className="w-full h-auto object-cover max-h-[80vh] transition-transform duration-700 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="aspect-video">
                        <iframe 
                          src={mainData.url} 
                          title={mainData.title}
                          className="w-full h-full"
                          frameBorder="0"
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none"></div>
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <p className="text-xs text-slate-500 flex items-center gap-2 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                      TYPE: {mainData.media_type.toUpperCase()}
                    </p>
                    <a href={mainData.hdurl || mainData.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 transition-colors">
                      원본 보기 <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                {/* Content Details Column */}
                <div className="lg:col-span-2 space-y-8">
                  <header>
                    <div className="inline-block bg-blue-500/10 text-blue-400 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4 border border-blue-500/20">
                      Space Exploration • {mainData.date}
                    </div>
                    <h2 className="text-4xl font-black leading-tight mb-4 text-white tracking-tight">
                      {mainData.title}
                    </h2>
                    {mainData.copyright && (
                      <p className="text-slate-400 text-sm italic">By {mainData.copyright}</p>
                    )}
                  </header>

                  <section className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-2xl relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Rocket size={64} />
                    </div>
                    <h3 className="text-blue-300 font-bold mb-4 flex items-center gap-2">
                      <Info size={18} />
                      AI 한글 요약
                    </h3>
                    {translatedDesc ? (
                      <p className="text-slate-200 leading-relaxed text-lg break-keep font-medium">
                        {translatedDesc}
                      </p>
                    ) : (
                      <div className="space-y-3 animate-pulse">
                        <div className="h-4 bg-white/10 rounded w-full"></div>
                        <div className="h-4 bg-white/10 rounded w-5/6"></div>
                        <div className="h-4 bg-white/10 rounded w-4/6"></div>
                      </div>
                    )}
                  </section>

                  <section className="px-2">
                    <h4 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-8 h-px bg-slate-800"></span>
                      Original English Context
                    </h4>
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-6 hover:line-clamp-none transition-all duration-500 cursor-help">
                      {mainData.explanation}
                    </p>
                  </section>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in duration-1000">
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-4xl font-black mb-3 bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">GALLERY</h2>
                <p className="text-slate-400">우주의 신비로운 순간들을 무작위로 탐험해보세요.</p>
              </div>
              <button 
                onClick={fetchGallery}
                disabled={galleryLoading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-bold flex items-center gap-2 transition-all shadow-xl shadow-blue-600/30 disabled:opacity-50 active:scale-95"
              >
                {galleryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw size={16} />}
                새로운 사진 셔플
              </button>
            </header>

            {galleryLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[4/5] bg-slate-900 rounded-3xl animate-pulse ring-1 ring-white/5"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {galleryItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="group relative rounded-3xl overflow-hidden bg-slate-900 ring-1 ring-white/10 hover:ring-blue-500/50 transition-all duration-500 cursor-pointer shadow-lg hover:shadow-blue-900/40"
                    onClick={() => {
                      setSelectedDate(item.date);
                      setView('home');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <div className="aspect-[4/5] overflow-hidden">
                      <img 
                        src={item.url} 
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                        loading="lazy"
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800"; }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity"></div>
                    <div className="absolute bottom-0 left-0 p-6 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <span className="text-xs text-blue-400 font-mono tracking-tighter mb-2 block">{item.date}</span>
                      <h3 className="font-bold text-lg text-white line-clamp-2 leading-tight group-hover:text-blue-100">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="mt-32 py-20 border-t border-white/5 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Rocket className="w-5 h-5 text-blue-400" />
            <span className="font-bold tracking-tighter">COSMOS VIEW</span>
          </div>
          <p className="text-slate-500 text-xs text-center leading-relaxed">
            모든 이미지는 NASA APOD(Astronomy Picture of the Day) API를 통해 제공됩니다.<br/>
            © {new Date().getFullYear()} Cosmos View Project. Created for Space Enthusiasts.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
