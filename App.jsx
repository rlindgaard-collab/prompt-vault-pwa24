import { useEffect, useMemo, useState } from "react";
import { Clipboard, ExternalLink, Search, RefreshCcw, Check } from "lucide-react";

export default function App(){
  const [data, setData] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("pv571b_tab") || "");
  const [activeSection, setActiveSection] = useState(() => localStorage.getItem("pv571b_section") || "");
  const [category, setCategory] = useState(() => localStorage.getItem("pv571b_cat") || "");
  const [q, setQ] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(null);

  useEffect(()=>localStorage.setItem("pv571b_tab", activeTab),[activeTab]);
  useEffect(()=>localStorage.setItem("pv571b_section", activeSection),[activeSection]);
  useEffect(()=>localStorage.setItem("pv571b_cat", category),[category]);

  async function loadJson(){
    try{
      const res = await fetch("/prompts.json", { cache:"no-store" });
      const json = await res.json();
      setData(json);
      // first-seen order for tabs
      const seen = new Set(); const order = [];
      for(const r of json){ if(!seen.has(r.fane)){ seen.add(r.fane); order.push(r.fane); } }
      setTabs(order);
      if(!activeTab && order.length){ setActiveTab(order[0]); }
    }catch(e){ console.error(e); alert("Kunne ikke læse prompts.json"); }
  }
  useEffect(()=>{ loadJson(); },[]);

  // Sections list in first-seen order for active tab
  const sections = useMemo(()=>{
    const seen = new Set(); const order = [];
    for(const r of data){
      if(r.fane !== activeTab) continue;
      const sec = r.section || "(Uden underkapitel)";
      if(!seen.has(sec)){ seen.add(sec); order.push(sec); }
    }
    return order;
  }, [data, activeTab]);

  // Categories (counts) filtered by section in first-seen order
  const categories = useMemo(()=>{
    const seen = new Map(); // cat => count
    for(const r of data){
      if(r.fane !== activeTab) continue;
      const sec = r.section || "(Uden underkapitel)";
      if(activeSection && sec !== activeSection) continue;
      const cat = r.kategori || "(Uden kategori)";
      seen.set(cat, (seen.get(cat) || 0) + 1);
    }
    return Array.from(seen.entries());
  }, [data, activeTab, activeSection]);

  // Visible prompts in original order
  const visible = useMemo(()=>{
    const out = [];
    for(const r of data){
      if(r.fane !== activeTab) continue;
      const sec = r.section || "(Uden underkapitel)";
      const cat = r.kategori || "(Uden kategori)";
      if(activeSection && sec !== activeSection) continue;
      if(category && cat !== category) continue;
      if(q && !r.prompt.toLowerCase().includes(q.toLowerCase())) continue;
      out.push(r);
    }
    return out;
  }, [data, activeTab, activeSection, category, q]);

  function copyPrompt(txt, idx){
    navigator.clipboard?.writeText(txt).then(()=>{
      setCopiedIdx(idx);
      setTimeout(()=> setCopiedIdx(null), 1100);
    }).catch(()=>{});
  }
  function openChatGPT(){ window.open("https://chat.openai.com/", "_blank"); }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b" style={{borderColor:"var(--brand-muted)"}}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Prompt Vault</h1>
            <p className="text-xs opacity-70">CY-styling • PWA-ready</p>
          </div>
          <div className="flex gap-2">
            <button onClick={openChatGPT} className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl font-medium active:scale-[0.98]" style={{background:"var(--brand-accent)", color:"var(--brand-accent-ink)", boxShadow:"var(--brand-shadow)"}}>
              <ExternalLink className="w-4 h-4"/> Åbn ChatGPT
            </button>
            <button onClick={loadJson} className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border active:scale-[0.98]" style={{borderColor:"var(--brand-muted)", background:"var(--brand-card)"}}>
              <RefreshCcw className="w-4 h-4"/> Opdatér
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-2 flex gap-2 flex-wrap">
          {tabs.map(t => (
            <button key={t} onClick={()=>{setActiveTab(t); setActiveSection(""); setCategory("");}} className="px-3 py-1.5 rounded-full border text-sm" style={{borderColor:"var(--brand-muted)", background: activeTab===t ? "var(--brand-accent)" : "var(--brand-card)", color: activeTab===t ? "var(--brand-accent-ink)" : "inherit", boxShadow: activeTab===t ? "var(--brand-shadow)" : "none"}}>
              {t}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 sm:grid-cols-12 gap-4">
        <aside className="sm:col-span-5 lg:col-span-4">
          <div className="rounded-3xl p-3 border sticky top-[76px]" style={{background:"var(--brand-card)", borderColor:"var(--brand-card-border)", boxShadow:"var(--brand-shadow)"}}>
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50"/>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Søg i prompts…" className="w-full pl-9 rounded-2xl px-3 py-2 border" style={{borderColor:"var(--brand-muted)", background:"var(--brand-bg)"}}/>
            </div>

            <label className="text-xs opacity-70 block mb-1">Underkapitel</label>
            <select value={activeSection} onChange={(e)=>{setActiveSection(e.target.value); setCategory("");}} className="w-full rounded-2xl px-3 py-2 border mb-3" style={{borderColor:"var(--brand-muted)", background:"var(--brand-bg)"}}>
              <option value="">Alle underkapitler</option>
              {sections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
            </select>

            <div className="flex flex-wrap gap-2 max-h-[54vh] overflow-auto pr-1">
              <button onClick={()=>setCategory("")} className="px-3 py-1.5 rounded-full border text-sm" style={{borderColor:"var(--brand-chip-border)", background: category==="" ? "var(--brand-accent)" : "var(--brand-chip)", color: category==="" ? "var(--brand-accent-ink)" : "inherit"}}>
                Alle kategorier
              </button>
              {categories.map(([cat, n], i) => (
                <button key={i+"::"+cat} onClick={()=>setCategory(cat)} className="px-3 py-1.5 rounded-full border text-sm" style={{borderColor:"var(--brand-chip-border)", background: category===cat ? "var(--brand-accent)" : "var(--brand-chip)", color: category===cat ? "var(--brand-accent-ink)" : "inherit"}}>
                  <span className="truncate max-w-[60vw] sm:max-w-[220px] inline-block align-middle">{cat}</span>
                  <span className="ml-2 text-xs opacity-70 align-middle">{n}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="sm:col-span-7 lg:col-span-8">
          {!!activeSection && <h2 className="text-xl font-semibold mb-1">{activeSection}</h2>}
          {!!category && <h3 className="text-base font-medium mb-3 opacity-80">{category}</h3>}

          <ul className="grid gap-3 sm:grid-cols-1">
            {visible.map((r, idx) => (
              <li key={idx} className="rounded-3xl p-4 border transition-transform duration-150 hover:-translate-y-[1px]" style={{background:"var(--brand-card)", borderColor:"var(--brand-card-border)", boxShadow:"var(--brand-shadow)"}}>
                <pre className="whitespace-pre-wrap text-[15px] leading-relaxed">{r.prompt}</pre>
                <div className="mt-3">
                  <button onClick={()=>copyPrompt(r.prompt, idx)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-colors active:scale-[0.98]" style={{
                    background: copiedIdx===idx ? "var(--brand-accent)" : "var(--brand-bg)",
                    color: copiedIdx===idx ? "var(--brand-accent-ink)" : "inherit",
                    borderColor: copiedIdx===idx ? "var(--brand-accent)" : "var(--brand-muted)"
                  }}>
                    {copiedIdx===idx ? <Check className="w-4 h-4"/> : <Clipboard className="w-4 h-4"/>}
                    {copiedIdx===idx ? "Kopieret!" : "Kopiér"}
                  </button>
                </div>
              </li>
            ))}
            {visible.length===0 && <li className="text-slate-500">Ingen prompts matcher.</li>}
          </ul>
        </main>
      </div>
    </div>
  );
}
