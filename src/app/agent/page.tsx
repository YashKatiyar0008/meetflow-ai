"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ArrowRight, Volume2, VolumeX, Wind, AlertTriangle, Check, LoaderCircle, Play, FileText, CalendarDays, History, ListTodo } from "lucide-react";
import type { Meeting, Store, Conflict, Task } from "@/lib/core";
import "./wild-agent.css";
import { importWisprFlow } from "@/lib/wispr-import";
import VoiceCommandPanel from "./VoiceCommandPanel";

type Tab = "overview" | "analyze" | "tasks" | "memory" | "digest";
const empty: Store = {meetings:[],tasks:[],conflicts:[]};
const demoOne = "Alice: Let's finalize the product launch.\nBob: We will launch on December 15.\nAlice: We decided to launch on December 15.\nCharlie: I will prepare the marketing campaign by November 10.\nBob: I will update the product roadmap by November 5.";
const demoTwo = "Alice: We need to change our launch date.\nBob: We previously decided December 15.\nAlice: Let's finalize the product launch on January 15 instead.\nCharlie: I will update the marketing campaign by November 12.\nBob: I will update the roadmap by November 8.";
const videoUrl = "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/175fbbcd-e50a-480c-bab2-ca16d4678322.mp4";
const posterUrl = "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/726b168c-da47-4682-a255-cc3e02f89bae.jpg";

function Contours() {
 const strokes=Array.from({length:15},(_,i)=>{
   const y=155+i*34;
   return <path key={i} d={`M -250 ${y+250} C 180 ${y+200}, 290 ${y-130}, 675 ${y+40} S 1110 ${y+340}, 1720 ${y-160}`} strokeWidth={1.2+(i%5)*.62} opacity={.55+(i%4)*.09}/>;
 });
 return <svg className="wa-contours" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">{strokes}</svg>;
}

function WisprFlowHero({onExplore}:{onExplore:()=>void}) {
 const row=useRef<HTMLDivElement>(null);
 const pill=useRef<HTMLDivElement>(null);
 const hair=useRef<HTMLDivElement>(null);
 const icons=useRef<HTMLDivElement>(null);
 const video=useRef<HTMLVideoElement>(null);
 const animations=useRef<Animation[]>([]);
 const [muted,setMuted]=useState(true);
 const [ready,setReady]=useState(false);
 const animateReveal=()=>{
   for(const a of animations.current) a.cancel();
   animations.current=[];
   if(!row.current||!pill.current||!hair.current||!icons.current)return;
   if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){
     pill.current.style.width=window.innerWidth<=720?"calc(100vw - 40px)":"calc(var(--fs) * 3.62)";
     hair.current.style.opacity="0";
     icons.current.style.opacity="1";
     video.current?.pause();return;
   }
   const mobile=window.innerWidth<=720;
   const fs=parseFloat(getComputedStyle(row.current).fontSize)||120;
   const settings:KeyframeAnimationOptions={duration:2100,fill:"forwards",easing:"linear"};
   const add=(el:Element,frames:Keyframe[])=>animations.current.push(el.animate(frames,settings));
   if(mobile){
      const finalHeight=(window.innerWidth-40)/1.85;
      add(pill.current,[{height:"1.5px",offset:0},{height:"1.5px",offset:.14},{height:finalHeight*.1+"px",offset:.3},{height:finalHeight*.55+"px",offset:.58},{height:finalHeight+"px",offset:1}]);
      add(pill.current,[{clipPath:"inset(0 50% round 999px)",offset:0},{clipPath:"inset(0 0 round 999px)",offset:.14},{clipPath:"inset(0 0 round 999px)",offset:1}]);
   }else{
      add(pill.current,[{width:fs*.012+"px",offset:0},{width:fs*.012+"px",offset:.14},{width:fs*.16+"px",offset:.3},{width:fs*1.81+"px",offset:.58},{width:fs*3.62+"px",offset:1}]);
      add(pill.current,[{clipPath:"inset(50% 0 round 999px)",offset:0},{clipPath:"inset(0 0 round 999px)",offset:.14},{clipPath:"inset(0 0 round 999px)",offset:1}]);
   }
   add(row.current,[{gap:fs*.026+"px",offset:0},{gap:fs*.026+"px",offset:.14},{gap:fs*.05+"px",offset:.58},{gap:fs*(mobile?.1:.085)+"px",offset:1}]);
   add(hair.current,[{opacity:1,offset:0},{opacity:1,offset:.14},{opacity:0,offset:.3},{opacity:0,offset:1}]);
   add(icons.current,[{opacity:0,offset:0},{opacity:0,offset:.8},{opacity:1,offset:1}]);
   video.current?.play().catch(()=>{});
   setReady(true);
 };
 useEffect(()=>{
  let cancelled=false;
  document.fonts.ready.then(()=>{if(!cancelled)animateReveal()});
  const handle=()=>{animations.current.forEach(a=>a.finish());if(!cancelled)animateReveal()};
  window.addEventListener("resize",handle);
  return ()=>{cancelled=true;window.removeEventListener("resize",handle);animations.current.forEach(a=>a.cancel())};
 },[]);
 const replay=async()=>{
   if(!ready||animations.current.length===0){animateReveal();return}
   const all=animations.current;
   for(const animation of all){animation.reverse();}
   await Promise.all(all.map(a=>a.finished.catch(()=>{})));
   for(const animation of all){animation.play();}
 };
 return <><div className="wa-hero">
   <p className="wa-hero-caption">Discover the extraordinary</p>
   <div className="wa-word-row" ref={row} style={{fontSize:"var(--fs)"}}>
     <span className="wa-word">WISPR</span>
     <div className="wa-pill" ref={pill}>
       <video ref={video} src={videoUrl} poster={posterUrl} autoPlay muted={muted} loop playsInline preload="auto" aria-label="Floating island with a waterfall above sunset clouds"/>
       <div className="wa-hair" ref={hair}/>
       <div className="wa-pill-icons" ref={icons}>
         <Wind aria-hidden="true"/>
         <button className="wa-sound" aria-label={muted?"Enable audio (clip may be silent)":"Mute video"} onClick={()=>setMuted(x=>!x)}>{muted?<VolumeX/>:<Volume2/>}</button>
       </div>
     </div>
     <span className="wa-word">FLOW.AI</span>
   </div>
   <span className="wa-float">Go beyond the ordinary.</span>
   <span className="wa-float-right">The better flow of every meeting.</span>
 </div>
 <div className="wa-lead">
   <p>Turn every conversation into a clear path from decisions to execution. Discover the decisions, owners and next steps hiding in every meeting, without losing your team's history.</p>
   <div className="wa-lead-line"/>
   <button className="wa-btn wa-btn-outline" onClick={replay}><Play size={14}/> Replay reveal</button>
   <button className="wa-btn" onClick={onExplore}>Get Into Flow <ArrowUpRight size={16}/></button>
 </div></>;
}

function Item({children}:{children:React.ReactNode}){return <div className="wa-item">{children}</div>}
export default function AgentPage(){
 const [tab,setTab]=useState<Tab>("overview");
 const [store,setStore]=useState<Store>(empty);
 const [title,setTitle]=useState("Product strategy meeting");
 const [date,setDate]=useState(()=>new Date().toLocaleDateString("en-CA"));
 const [transcript,setTranscript]=useState("");
 const [wisprNotice,setWisprNotice]=useState("");
 const [meeting,setMeeting]=useState<Meeting|null>(null);
 const [conflicts,setConflicts]=useState<Conflict[]>([]);
 const [approvedD,setApprovedD]=useState<string[]>([]);
 const [approvedT,setApprovedT]=useState<string[]>([]);
 const [resolutions,setResolutions]=useState<Record<string,"unresolved"|"supersede"|"keep-both">>({});
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 async function refresh(){
    try{const res=await fetch("/api/dashboard",{cache:"no-store"});if(res.ok)setStore(await res.json());}
    catch{setError("Could not load saved meetings.")}
 }
 useEffect(()=>{refresh()},[]);
 async function pasteWisprFlow(){
  setError("");setWisprNotice("");
  try{
    const raw=await navigator.clipboard.readText();
    const imported=importWisprFlow(raw);
    setTranscript(imported.transcript);
    if(imported.title)setTitle(imported.title);
    setMeeting(null);
    setWisprNotice(imported.source==="wispr-notetaker"
      ? "Imported full meeting transcript from Wispr Flow"+(imported.speakers.length?" · "+imported.speakers.length+" identified speakers":"")+"."
      : "Pasted transcript from clipboard. Review it before analysis.");
    if(imported.warning)setWisprNotice(imported.warning);
  }catch(e){setError(e instanceof Error?e.message:"Clipboard access failed. Paste with Cmd/Ctrl + V instead.")}
 }
 function loadWisprText(raw:string){
   try{
     const imported=importWisprFlow(raw);
     setTranscript(imported.transcript);
     if(imported.title)setTitle(imported.title);
     setMeeting(null);
     setWisprNotice(imported.warning||"Wispr Flow transcript is ready for review.");
     setError("");
   }catch(e){setError(e instanceof Error?e.message:"Could not read transcript")}
 }
 async function analyze(){
  setBusy(true);setError("");setNotice("");
  try{
    const response=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,date,transcript})});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||"Analysis failed");
    setMeeting(result.meeting);
    setConflicts(result.conflicts);
    setApprovedD(result.meeting.decisions.map((d:{id:string})=>d.id));
    setApprovedT(result.meeting.tasks.map((t:{id:string})=>t.id));
    setResolutions({});
  }catch(e){setError(e instanceof Error?e.message:"Analysis failed")}
  finally{setBusy(false)}
 }
 async function confirm(){
  if(!meeting)return;setBusy(true);setError("");
  try{
    const response=await fetch("/api/confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({meeting,approvedDecisionIds:approvedD,approvedTaskIds:approvedT,resolutions})});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||"Confirmation failed");
    setMeeting(null);setTranscript("");await refresh();setTab("overview");setNotice(result.createdTasks+" tasks confirmed in the mock tracker.");
  }catch(e){setError(e instanceof Error?e.message:"Confirmation failed")}
  finally{setBusy(false)}
 }
 const today=new Date().toLocaleDateString("en-CA");
 const week=new Date(Date.now()+7*86400000).toLocaleDateString("en-CA");
 const open=store.tasks.filter(t=>t.status==="open");
 const overdue=open.filter(t=>t.deadline&&t.deadline<today);
 const upcoming=open.filter(t=>t.deadline&&t.deadline>=today&&t.deadline<=week);
 const ownerGroups=Object.entries(store.tasks.reduce((acc,t)=>{const k=t.owner||"Unassigned";(acc[k]||=[]).push(t);return acc},{} as Record<string,Task[]>));
 const nav:[Tab,string][]=[["overview","Home"],["analyze","Analyze"],["tasks","Tasks"],["memory","Memory"],["digest","Digest"]];
 return <div className="wa">
   <Contours/>
   <div className="wa-shell">
     <nav className="wa-nav" aria-label="Main navigation">
       <a href="/" className="wa-logo">wisprflow.ai</a>
       <div className="wa-links">{nav.map(([key,label])=><button className="wa-tab" key={key} aria-current={tab===key?"page":undefined} onClick={()=>setTab(key)}>{label}</button>)}</div>
       <a className="wa-back" href="/">Explore wisprflow.ai <ArrowUpRight size={13} style={{display:"inline"}}/></a>
     </nav>
     <main className="wa-main">
       <VoiceCommandPanel
         onNavigate={setTab}
         onAnalyze={analyze}
         onLoadSample={() => {
           setTranscript(demoOne);
           setTitle("Voice command demo meeting");
           setMeeting(null);
           setWisprNotice("Demo transcript loaded by voice command.");
         }}
         hasTranscript={transcript.trim().length >= 10}
       />
       {tab==="overview"&&<WisprFlowHero onExplore={()=>setTab("analyze")}/>}
       {error&&<div className="wa-error" role="alert">{error}</div>}
       {notice&&<div className="wa-success" role="status">{notice}</div>}
       {tab==="overview"&&<section className="wa-section">
         <p className="wa-eyebrow">001 / Your command centre</p>
         <h2>Meetings. Into motion.</h2>
         <p className="wa-section-description">Your team's decisions, action items and changing commitments, in one place. Make every conversation count.</p>
         <div className="wa-stats">{[["Meetings",store.meetings.length],["Action items",store.tasks.length],["Conflicts",store.conflicts.length],["Overdue",overdue.length]].map(([name,count])=><div key={name} className="wa-stat"><span>{name}</span><strong>{count}</strong></div>)}</div>
         <div className="wa-feature">
           <div><h3>Start with a conversation.</h3><p>Paste a transcript, detect decisions, surface changes from past meetings, then approve everything before execution.</p></div>
           <button className="wa-btn" onClick={()=>setTab("analyze")}>Analyze a meeting <ArrowRight size={16}/></button>
         </div>
       </section>}
       {tab==="analyze"&&<section className="wa-section">
         <p className="wa-eyebrow">002 / Meeting intelligence</p><h1>Turn talk into action.</h1>
         <p className="wa-section-description">Use Wispr Flow to dictate or import a meeting transcript, or upload a plain text file. The agent identifies who said what, extracts commitments and checks earlier decisions.</p>
         <div className="wa-grid">
          <div className="wa-panel">
           <h3>New meeting</h3>
           <div className="wa-field-row"><label className="wa-field">Meeting name<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Weekly strategy sync"/></label><label className="wa-field">Meeting date<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></div>
           <div className="wa-wispr" aria-label="Wispr Flow meeting input">
             <div className="wa-wispr-title"><span className="wa-eyebrow">Voice-powered input</span><strong>Wispr Flow → wisprflow.ai</strong></div>
             <p>Dictate directly into the transcript field with the Wispr Flow desktop app, or copy a full Notetaker meeting (Markdown) and import it here. Speaker labels are preserved when present.</p>
             <div className="wa-chips">
               <button type="button" className="wa-btn" onClick={pasteWisprFlow}>Import from clipboard <ArrowRight size={15}/></button>
               <a className="wa-chip" href="https://wisprflow.ai/" target="_blank" rel="noreferrer">Open Wispr Flow ↗</a>
             </div>
             <label className="wa-field wa-file">Upload Wispr Flow export (.md or .txt)<input type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" onChange={async e=>{const file=e.target.files?.[0];if(file)loadWisprText(await file.text())}}/></label>
             {wisprNotice&&<p className="wa-success" role="status">{wisprNotice}</p>}
             <p className="wa-small">Clipboard import is local to your browser. This does not connect to or sync a Wispr account.</p>
           </div>
           <label className="wa-field">Transcript — click here and dictate with Wispr Flow<textarea value={transcript} onChange={e=>setTranscript(e.target.value)} placeholder={"Alice: We decided to launch on December 15.\nBob: I'll update the roadmap by Friday."}/></label>
           <div className="wa-chips"><button className="wa-chip" onClick={()=>{setTranscript(demoOne);setTitle("Initial launch planning");setMeeting(null)}}>Use demo meeting 01</button><button className="wa-chip" onClick={()=>{setTranscript(demoTwo);setTitle("Launch follow-up");setMeeting(null)}}>Use demo meeting 02</button></div>
           <button className="wa-btn" disabled={busy||transcript.trim().length<10||!title.trim()} onClick={analyze}>{busy?<LoaderCircle size={16} className="animate-spin"/>:<FileText size={16}/>} Analyze transcript <ArrowUpRight size={16}/></button>
          </div>
          <aside className="wa-panel"><h3>The journey</h3>{["Upload or paste a transcript","Extract decisions and action items","Compare historical commitments","Review, edit and approve","Push to mock tracker and digest"].map((text,i)=><div className="wa-step" key={text}><strong>0{i+1}</strong><span>{text}</span></div>)}<p className="wa-small" style={{marginTop:30}}>AI-powered extraction runs when a Sarvam key is configured. Otherwise the demo parser is used.</p></aside>
         </div>
         {meeting&&<div className="wa-panel" style={{marginTop:30}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap"}}><h3>Review before execution</h3><span className="wa-tag">{meeting.engine} extraction</span></div>
            <p className="wa-summary">{meeting.summary}</p><p className="wa-small">Speakers: {meeting.speakers.join(", ")||"Unknown"}</p>
            <h3 style={{marginTop:30}}>Decisions ({meeting.decisions.length})</h3>
            {meeting.decisions.map(d=><Item key={d.id}><label><input type="checkbox" className="wa-checkbox" checked={approvedD.includes(d.id)} onChange={()=>setApprovedD(a=>a.includes(d.id)?a.filter(x=>x!==d.id):[...a,d.id])}/><div><strong>{d.statement}</strong><p>{d.topic} · Evidence: {d.evidence}</p></div></label></Item>)}
            {meeting.decisions.length===0&&<p className="wa-empty">No finalized decisions detected.</p>}
            {conflicts.filter(c=>approvedD.includes(c.newId)).length>0&&<h3 style={{marginTop:30,display:"flex",alignItems:"center",gap:10}}><AlertTriangle size={20}/> Potential contradictions</h3>}
            {conflicts.filter(c=>approvedD.includes(c.newId)).map(c=><div key={c.id} className="wa-conflict"><p><b>Previous:</b> {c.oldStatement}</p><p><b>Current:</b> {c.newStatement}</p><p>{c.reason}</p><label className="wa-field">Resolution<select className="wa-select" value={resolutions[c.newId+":"+c.oldId]||"unresolved"} onChange={e=>setResolutions(r=>({...r,[c.newId+":"+c.oldId]:e.target.value as "unresolved"|"supersede"|"keep-both"}))}><option value="unresolved">Keep flagged for review</option><option value="supersede">Replace previous decision</option><option value="keep-both">Keep both decisions</option></select></label></div>)}
            <h3 style={{marginTop:32}}>Action items ({meeting.tasks.length})</h3>
            {meeting.tasks.map(t=><Item key={t.id}><label><input type="checkbox" className="wa-checkbox" checked={approvedT.includes(t.id)} onChange={()=>setApprovedT(a=>a.includes(t.id)?a.filter(x=>x!==t.id):[...a,t.id])}/><div style={{width:"100%"}}><label className="wa-field">Task<input value={t.title} onChange={e=>setMeeting(m=>m?{...m,tasks:m.tasks.map(v=>v.id===t.id?{...v,title:e.target.value}:v)}:m)}/></label><div className="wa-field-row" style={{marginTop:15}}><label className="wa-field">Owner<input value={t.owner||""} onChange={e=>setMeeting(m=>m?{...m,tasks:m.tasks.map(v=>v.id===t.id?{...v,owner:e.target.value||null}:v)}:m)}/></label><label className="wa-field">Deadline<input type="date" value={t.deadline||""} onChange={e=>setMeeting(m=>m?{...m,tasks:m.tasks.map(v=>v.id===t.id?{...v,deadline:e.target.value||null}:v)}:m)}/></label></div><p>Evidence: {t.evidence}</p></div></label></Item>)}
            {meeting.tasks.length===0&&<p className="wa-empty">No action items detected.</p>}
            <button className="wa-btn" disabled={busy} style={{marginTop:25}} onClick={confirm}><Check size={16}/> Confirm and create tasks</button>
         </div>}
       </section>}
       {tab==="tasks"&&<section className="wa-section"><p className="wa-eyebrow">003 / Execution</p><h1>Every next move.</h1><p className="wa-section-description">All approved work, with a named owner and a tracker ID. Tasks are recorded to the demo task tracker.</p><div className="wa-panel"><h3>Confirmed tasks</h3>{store.tasks.length===0&&<p className="wa-empty">No approved tasks yet. Analyze your first meeting to begin.</p>}{store.tasks.map(t=><Item key={t.id}><div style={{display:"flex",alignItems:"start",justifyContent:"space-between",gap:18}}><div><strong>{t.title}</strong><p>{t.owner||"Unassigned"} · {t.deadline||"No deadline"} · {t.priority}</p></div><span className="wa-tag">{t.trackerId||"Mock task"}</span></div></Item>)}</div></section>}
       {tab==="memory"&&<section className="wa-section"><p className="wa-eyebrow">004 / Collective intelligence</p><h1>Never lose a decision.</h1><p className="wa-section-description">Persistent context connects decisions across meetings and surfaces possible contradictions before they become costly surprises.</p><div className="wa-grid"><div className="wa-panel"><h3>Decision history</h3>{store.meetings.length===0&&<p className="wa-empty">Your approved meetings will appear here.</p>}{store.meetings.slice().reverse().map(m=><div key={m.id} className="wa-item"><strong>{m.title}</strong><p className="wa-small">{m.date} · {m.engine}</p>{m.decisions.map(d=><p key={d.id} style={{marginTop:12}}>{d.statement} <span className="wa-tag">{d.status}</span></p>)}</div>)}</div><div className="wa-panel"><h3>Cross-meeting conflicts</h3>{store.conflicts.length===0&&<p className="wa-empty">No conflicts recorded so far.</p>}{store.conflicts.map(c=><div className="wa-conflict" key={c.id}><p><b>Before:</b> {c.oldStatement}</p><p><b>Now:</b> {c.newStatement}</p><span className="wa-tag">{c.resolution}</span></div>)}</div></div></section>}
       {tab==="digest"&&<section className="wa-section"><p className="wa-eyebrow">005 / Stay accountable</p><h1>The week ahead.</h1><p className="wa-section-description">Person-by-person commitments and deadline reminders, generated automatically from confirmed tasks.</p><div className="wa-stats">{[["Assigned tasks",store.tasks.length],["Owners",ownerGroups.length],["Overdue",overdue.length],["Due soon",upcoming.length]].map(([label,n])=><div key={label} className="wa-stat"><span>{label}</span><strong>{n}</strong></div>)}</div><div className="wa-grid"><div className="wa-panel"><h3>By owner</h3>{ownerGroups.length===0&&<p className="wa-empty">No assigned tasks yet.</p>}{ownerGroups.map(([name,tasks])=><Item key={name}><strong>{name} · {tasks.length} task(s)</strong>{tasks.map(t=><p key={t.id}>{t.title} · {t.deadline||"No deadline"}</p>)}</Item>)}</div><div className="wa-panel"><h3>Deadline reminders</h3><p className="wa-eyebrow" style={{marginTop:24}}>Overdue ({overdue.length})</p>{overdue.map(t=><Item key={t.id}><strong>{t.title}</strong><p>{t.deadline} · {t.owner||"Unassigned"}</p></Item>)}<p className="wa-eyebrow" style={{marginTop:25}}>Within 7 days ({upcoming.length})</p>{upcoming.map(t=><Item key={t.id}><strong>{t.title}</strong><p>{t.deadline} · {t.owner||"Unassigned"}</p></Item>)}{overdue.length+upcoming.length===0&&<p className="wa-empty">No urgent deadlines. Enjoy the view.</p>}</div></div></section>}
       <footer className="wa-footer"><span>wisprflow.ai / Meeting-to-Execution AI</span><span>Go further. Remember more. Do better.</span><span>Demo workspace · No authentication · Temporary file storage</span></footer>
     </main>
   </div>
 </div>
}
