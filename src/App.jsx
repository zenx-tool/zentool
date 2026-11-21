import React, { useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import jsQR from "jsqr";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { PDFDocument } from "pdf-lib";
import { jsPDF } from "jspdf";
import * as pdfjsLib from "pdfjs-dist";
import {
  Activity, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Barcode, Check,
  ChevronDown, Copy, Download, FileImage, FilePlus2, FileText, Files,
  Image as ImageIcon, Layers, Menu, Moon, QrCode, ScanLine, Settings2,
  ShieldCheck, Sparkles, Sun, Upload, WandSparkles, X
} from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url
).toString();

const tools = [
  { id:"qr", title:"QR Decoder", desc:"Read QR codes from images or camera.", icon:QrCode, group:"Scanner" },
  { id:"barcode", title:"Barcode Decoder", desc:"Decode common retail and product barcodes.", icon:Barcode, group:"Scanner" },
  { id:"imagepdf", title:"Image to PDF", desc:"Turn crisp images into a downloadable PDF.", icon:FileImage, group:"PDF tools" },
  { id:"enhance", title:"Image Enhancer", desc:"Adjust brightness, contrast and sharpness.", icon:WandSparkles, group:"Image tools" },
  { id:"merge", title:"Merge PDFs", desc:"Combine multiple PDF documents.", icon:Files, group:"PDF tools" },
  { id:"reorder", title:"Reorder PDF pages", desc:"Move pages into the order you need.", icon:Layers, group:"PDF tools" },
  { id:"compress", title:"Compress PDF", desc:"Re-save and optimize PDF structure.", icon:Activity, group:"PDF tools" },
  { id:"pdfimage", title:"PDF to Images", desc:"Export PDF pages as PNG images.", icon:ImageIcon, group:"PDF tools" },
  { id:"qrgenerate", title:"QR Generator", desc:"Create a QR code from text or a link.", icon:QrCode, group:"Generators" },
  { id:"bargenerate", title:"Barcode Generator", desc:"Generate a Code 128 barcode.", icon:Barcode, group:"Generators" },
  { id:"convert", title:"Image Converter", desc:"Convert images to JPG or PNG.", icon:ImageIcon, group:"Image tools" }
];

const prettyBytes = n => n < 1024 ? `${n} B` : n < 1048576 ? `${(n/1024).toFixed(1)} KB` : `${(n/1048576).toFixed(2)} MB`;
const saveBlob = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};
const readDataURL = file => new Promise((resolve,reject) => {
  const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file);
});
const loadImage = src => new Promise((resolve,reject) => {
  const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src;
});
const fileToCanvas = async file => {
  const img = await loadImage(await readDataURL(file));
  const canvas = document.createElement("canvas"); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  canvas.getContext("2d").drawImage(img,0,0); return canvas;
};
const downloadCanvas = (canvas, name, type="image/png", quality=.96) =>
  new Promise(resolve => canvas.toBlob(blob => { saveBlob(blob,name); resolve(); },type,quality));

function App() {
  const [dark,setDark] = useState(() => localStorage.getItem("zt-theme") !== "light");
  const [active,setActive] = useState("home");
  const [query,setQuery] = useState("");
  const [mobileMenu,setMobileMenu] = useState(false);
  const [toast,setToast] = useState("");
  const [recent,setRecent] = useState([]);
  const [history,setHistory] = useState(false);
  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; localStorage.setItem("zt-theme",dark?"dark":"light"); },[dark]);
  const notify = msg => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  const selected = tools.find(t=>t.id===active);
  const filtered = tools.filter(t => `${t.title} ${t.desc} ${t.group}`.toLowerCase().includes(query.toLowerCase()));
  const openTool = id => { setActive(id); setMobileMenu(false); if(id!=="home") setRecent(r=>[id,...r.filter(x=>x!==id)].slice(0,4)); };
  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu?"show":""}`}>
      <div className="brand" onClick={()=>openTool("home")}><div className="brand-mark"><Sparkles size={21}/></div><span>Zen<span className="brand-accent">Tools</span></span></div>
      <div className="side-label">WORKSPACE</div>
      <button className={`nav-item ${active==="home"?"active":""}`} onClick={()=>openTool("home")}><Activity size={17}/> Overview</button>
      <div className="side-label side-label-gap">TOOLS</div>
      {["Scanner","PDF tools","Image tools","Generators"].map(group=><div key={group}>
        <div className="group-label">{group}</div>
        {tools.filter(t=>t.group===group).map(t=><button key={t.id} className={`nav-item ${active===t.id?"active":""}`} onClick={()=>openTool(t.id)}><t.icon size={17}/><span>{t.title}</span></button>)}
      </div>)}
      <div className="sidebar-bottom">
        <div className="privacy-card"><ShieldCheck size={18}/><div><b>Your files stay yours</b><small>Processed locally in your browser.</small></div></div>
        <button className="nav-item" onClick={()=>setHistory(!history)}><Activity size={17}/> Recent tools</button>
        <div className="side-foot">ZEN TOOLS · VERSION 1.0</div>
      </div>
    </aside>
    {mobileMenu && <div className="scrim" onClick={()=>setMobileMenu(false)}/>}
    <main className="main">
      <header className="topbar">
        <button className="icon-btn mobile-toggle" onClick={()=>setMobileMenu(!mobileMenu)}><Menu size={19}/></button>
        <div className="breadcrumb">Workspace <span>/</span> <b>{selected?.title || "Overview"}</b></div>
        <div className="top-actions"><div className="secure-pill"><span/> Private processing</div><button className="icon-btn" aria-label="Toggle theme" onClick={()=>setDark(!dark)}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button><div className="avatar">Z</div></div>
      </header>
      <div className="content">
        {active==="home" ? <Home query={query} setQuery={setQuery} filtered={filtered} openTool={openTool} recent={recent}/> :
          <ToolPage key={active} tool={selected} notify={notify} onBack={()=>openTool("home")}/>}
      </div>
      <footer className="footer"><span>© {new Date().getFullYear()} ZenTools</span><span><ShieldCheck size={13}/> Files are processed on your device · No account required</span></footer>
    </main>
    {toast && <div className="toast"><Check size={16}/>{toast}</div>}
  </div>;
}

function Home({query,setQuery,filtered,openTool,recent}) {
  return <div className="home-view">
    <section className="hero">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot"/> YOUR EVERYDAY DIGITAL TOOLKIT</div>
        <h1>Smart tools.<br/><span>Simple workflow.</span></h1>
        <p>Scan, convert, enhance and organize your files — all in one place. Fast, free and private by design.</p>
        <div className="hero-actions"><button className="primary-btn" onClick={()=>openTool("qr")}><ScanLine size={17}/> Start scanning <ArrowRight size={16}/></button><div className="hero-note"><ShieldCheck size={15}/> No uploads. No sign-up.</div></div>
      </div>
      <div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="art-card card-back"><FileText size={26}/><span>PDF</span></div><div className="art-card card-front"><div className="fake-qr">{Array.from({length:49},(_,i)=><i key={i} className={(i*7+i%3)%4===0?"empty":""}/>)}</div><div className="scan-line"/></div><div className="float-chip"><Sparkles size={14}/> Crisp output</div></div>
    </section>
    <div className="section-head"><div><div className="eyebrow">ALL THE ESSENTIALS</div><h2>What would you like to do?</h2></div><div className="search-box"><ScanLine size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a tool..."/></div></div>
    {query && <div className="results-note">{filtered.length} tools found</div>}
    <div className="tool-grid">{filtered.map(t=><button className="tool-card" key={t.id} onClick={()=>openTool(t.id)}><div className={`tool-icon icon-${t.group.toLowerCase().replace(" ","-")}`}><t.icon size={20}/></div><div className="tool-card-title">{t.title}<ArrowUp size={14}/></div><p>{t.desc}</p><span className="tool-category">{t.group}</span></button>)}</div>
    <section className="bottom-banner"><div className="banner-icon"><ShieldCheck size={22}/></div><div><b>Privacy is not an extra feature.</b><p>ZenTools runs file operations in your browser. Your files are not sent to a ZenTools server.</p></div><span className="banner-tag">LOCAL-FIRST</span></section>
  </div>;
}

function ToolPage({tool,notify,onBack}) {
  if(!tool) return null;
  const props={notify};
  return <div className="tool-view"><button className="back-link" onClick={onBack}><ArrowLeft size={15}/> All tools</button>
    <div className="tool-heading"><div className="tool-icon large"><tool.icon size={23}/></div><div><div className="eyebrow">{tool.group.toUpperCase()}</div><h1>{tool.title}</h1><p>{tool.desc}</p></div></div>
    <div className="tool-workspace"><ToolContent id={tool.id} {...props}/></div>
  </div>;
}

function Dropzone({accept,multiple=false,onFiles,label="Choose files",hint="or drag and drop here",capture}) {
  const input=useRef(null),[drag,setDrag]=useState(false);
  const handle=files=>{const list=Array.from(files||[]);if(list.length)onFiles(list);};
  return <div className={`dropzone ${drag?"dragging":""}`} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);handle(e.dataTransfer.files)}} onClick={()=>input.current?.click()}>
    <input ref={input} type="file" accept={accept} multiple={multiple} capture={capture} onChange={e=>{handle(e.target.files);e.target.value=""}} hidden/>
    <div className="upload-icon"><Upload size={21}/></div><b>{label}</b><span>{hint}</span><small>Supported: {accept.replaceAll(","," · ")}</small>
  </div>;
}

function ToolContent({id,notify}) {
  switch(id) {
    case "qr": return <CodeScanner kind="qr" notify={notify}/>;
    case "barcode": return <CodeScanner kind="barcode" notify={notify}/>;
    case "imagepdf": return <ImageToPdf notify={notify}/>;
    case "enhance": return <Enhancer notify={notify}/>;
    case "merge": return <MergePdf notify={notify}/>;
    case "reorder": return <ReorderPdf notify={notify}/>;
    case "compress": return <CompressPdf notify={notify}/>;
    case "pdfimage": return <PdfToImages notify={notify}/>;
    case "qrgenerate": return <QrGenerator notify={notify}/>;
    case "bargenerate": return <BarcodeGenerator notify={notify}/>;
    case "convert": return <ImageConverter notify={notify}/>;
    default: return null;
  }
}

function ResultBox({value,notify}) {
  return <div className="result-box"><div className="result-head"><b><Check size={16}/> Scan result</b><button className="text-btn" onClick={()=>{navigator.clipboard?.writeText(value);notify("Copied to clipboard")}}><Copy size={14}/> Copy</button></div><p className="result-value">{value}</p>{/^https?:\/\//i.test(value)&&<a href={value} target="_blank" rel="noreferrer" className="result-link">Open link <ArrowUp size={13}/></a>}</div>;
}

function CodeScanner({kind,notify}) {
  const [result,setResult]=useState(""),[error,setError]=useState(""),[scanning,setScanning]=useState(false);
  const videoRef=useRef(null),controlsRef=useRef(null);
  useEffect(()=>()=>{controlsRef.current?.stop();},[]);
  const scanFile=async file=>{
    setResult("");setError("");
    try {
      if(kind==="qr") {
        const canvas=await fileToCanvas(file),ctx=canvas.getContext("2d"),img=ctx.getImageData(0,0,canvas.width,canvas.height);
        const code=jsQR(img.data,img.width,img.height,{inversionAttempts:"attemptBoth"});
        if(!code) throw new Error("No QR code found. Try a clearer, straight-on image.");
        setResult(code.data);
      } else {
        const reader=new BrowserMultiFormatReader();
        const url=URL.createObjectURL(file);
        try { const res=await reader.decodeFromImageUrl(url); setResult(res.getText()); }
        finally { URL.revokeObjectURL(url); }
      }
    } catch(e){setError(e.message||"Could not read this image.");}
  };
  const startCamera=async()=>{
    setError("");setResult("");
    try {
      const reader=new BrowserMultiFormatReader();
      const controls=await reader.decodeFromVideoDevice(undefined,videoRef.current,(res,err)=>{
        if(res){setResult(res.getText());controlsRef.current?.stop();setScanning(false);}
      });
      controlsRef.current=controls;setScanning(true);
    } catch(e){setError("Camera could not start. Allow camera permission and use HTTPS or localhost.");}
  };
  const stop=()=>{controlsRef.current?.stop();setScanning(false);};
  return <div className="tool-columns"><div className="panel"><div className="panel-title"><b>Scan a {kind==="qr"?"QR code":"barcode"}</b><span className="live-label">LOCAL SCAN</span></div><Dropzone accept="image/*" onFiles={f=>scanFile(f[0])} label="Upload an image" hint="PNG, JPG, WEBP or camera photo"/><div className="or-divider"><span>OR USE YOUR CAMERA</span></div><video ref={videoRef} className={`camera-view ${scanning?"visible":""}`} playsInline muted/><div className="camera-actions">{!scanning?<button className="secondary-btn" onClick={startCamera}><ScanLine size={16}/> Start camera scanner</button>:<button className="danger-btn" onClick={stop}><X size={16}/> Stop camera</button>}</div>{error&&<div className="error-box">{error}</div>}</div><div className="panel side-panel"><div className="panel-title"><b>Decoded information</b></div>{result?<ResultBox value={result} notify={notify}/>:<div className="empty-state"><div className="empty-graphic"><QrCode size={34}/></div><b>Waiting for a scan</b><p>Your decoded text or link will appear here.</p></div>}<div className="tip"><ShieldCheck size={16}/><span>Images are decoded locally. Nothing is uploaded.</span></div></div></div>;
}

function ImageToPdf({notify}) {
  const [files,setFiles]=useState([]),[size,setSize]=useState("a4"),[orientation,setOrientation]=useState("portrait"),[quality,setQuality]=useState("high"),[fit,setFit]=useState("contain");
  const create=async()=>{
    if(!files.length)return;
    try{
      const pdf=new jsPDF({orientation,unit:"pt",format:size,compress:true});
      for(let i=0;i<files.length;i++){
        const img=await loadImage(await readDataURL(files[i]));
        if(i)pdf.addPage(size,orientation);
        const w=pdf.internal.pageSize.getWidth(),h=pdf.internal.pageSize.getHeight(),ratio=img.width/img.height;
        let dw=w,dh=h;
        if(fit==="contain"){if(w/h>ratio)dw=h*ratio;else dh=w/ratio;}
        else {if(w/h>ratio)dh=w/ratio;else dw=h*ratio;}
        const q=quality==="high"?1:quality==="balanced"?.88:.72;
        const c=document.createElement("canvas");c.width=Math.max(1,Math.round(img.width*q));c.height=Math.max(1,Math.round(img.height*q));
        c.getContext("2d").drawImage(img,0,0,c.width,c.height);
        const data=c.toDataURL("image/jpeg",quality==="high"?.98:quality==="balanced"?.9:.78);
        pdf.addImage(data,"JPEG",(w-dw)/2,(h-dh)/2,dw,dh,undefined,"FAST");
      }
      pdf.save("zentools-images.pdf");notify("PDF downloaded");
    }catch(e){notify("Could not create PDF: "+e.message);}
  };
  return <div className="panel"><div className="panel-title"><b>Convert images to PDF</b><span className="live-label">HIGH-RES EXPORT</span></div><Dropzone accept="image/*" multiple onFiles={f=>setFiles(old=>[...old,...f])} label="Add images" hint="Select one or multiple image files"/>{files.length>0&&<FileList files={files} onRemove={i=>setFiles(files.filter((_,x)=>x!==i))}/>}<div className="settings-grid"><Field label="Page size"><select value={size} onChange={e=>setSize(e.target.value)}><option value="a4">A4</option><option value="a3">A3</option><option value="letter">Letter</option><option value="legal">Legal</option></select></Field><Field label="Orientation"><select value={orientation} onChange={e=>setOrientation(e.target.value)}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></Field><Field label="Image quality"><select value={quality} onChange={e=>setQuality(e.target.value)}><option value="high">High — best available</option><option value="balanced">Balanced</option><option value="small">Smaller file</option></select></Field><Field label="Fit to page"><select value={fit} onChange={e=>setFit(e.target.value)}><option value="contain">Fit entire image</option><option value="cover">Fill page (may crop)</option></select></Field></div><div className="action-row"><span className="muted">{files.length} image(s) selected</span><button className="primary-btn" disabled={!files.length} onClick={create}><Download size={16}/> Create PDF</button></div><p className="fine-print">Export preserves the source image dimensions as far as possible. It cannot restore detail missing from a low-resolution original.</p></div>;
}

function FileList({files,onRemove}) {
  return <div className="file-list">{files.map((f,i)=><div className="file-row" key={`${f.name}-${i}`}><div className="file-mini"><FileImage size={17}/></div><div className="file-meta"><b>{f.name}</b><small>{prettyBytes(f.size)}</small></div><button className="icon-btn tiny" onClick={()=>onRemove(i)}><X size={15}/></button></div>)}</div>;
}
function Field({label,children}) { return <label className="field"><span>{label}</span>{children}</label>; }

function Enhancer({notify}) {
  const [file,setFile]=useState(null),[src,setSrc]=useState(""),[brightness,setBrightness]=useState(100),[contrast,setContrast]=useState(100),[saturation,setSaturation]=useState(100),[sharp,setSharp]=useState(0);
  const canvasRef=useRef(null);
  useEffect(()=>{if(!src)return;let alive=true;(async()=>{const img=await loadImage(src);if(!alive)return;const c=canvasRef.current;c.width=img.width;c.height=img.height;const ctx=c.getContext("2d");ctx.filter=`brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;ctx.drawImage(img,0,0);ctx.filter="none";if(sharp>0)applySharpen(ctx,c,sharp);})();return()=>{alive=false}},[src,brightness,contrast,saturation,sharp]);
  const choose=async f=>{setFile(f);setSrc(await readDataURL(f));};
  const reset=()=>{setBrightness(100);setContrast(100);setSaturation(100);setSharp(0)};
  return <div className="tool-columns enhance-layout"><div className="panel"><div className="panel-title"><b>Image preview</b><span className="live-label">LIVE EDIT</span></div>{!src?<Dropzone accept="image/*" onFiles={f=>choose(f[0])} label="Upload an image" hint="PNG, JPG or WEBP"/>:<><div className="preview-frame"><canvas ref={canvasRef}/></div><div className="action-row"><span className="muted">{file?.name}</span><button className="text-btn" onClick={()=>{setFile(null);setSrc("")}}>Change image</button></div></>}</div><div className="panel"><div className="panel-title"><b>Adjustments</b><button className="text-btn" onClick={reset}>Reset</button></div>{[["Brightness",brightness,setBrightness],["Contrast",contrast,setContrast],["Saturation",saturation,setSaturation]].map(([name,val,fn])=><label className="range-field" key={name}><span>{name}<b>{val}%</b></span><input type="range" min="0" max="200" value={val} onChange={e=>fn(+e.target.value)}/></label>)}<label className="range-field"><span>Sharpen <b>{sharp}</b></span><input type="range" min="0" max="1" step=".1" value={sharp} onChange={e=>setSharp(+e.target.value)}/></label><button className="primary-btn full-btn" disabled={!src} onClick={()=>downloadCanvas(canvasRef.current,"zentools-enhanced.png")}><Download size={16}/> Download enhanced PNG</button><p className="fine-print">Edits are applied to a canvas preview. Sharpening is a lightweight local filter.</p></div></div>;
}
function applySharpen(ctx,c,amount) {
  if(!amount)return;const {width:w,height:h}=c;if(w*h>12000000)return;
  const src=ctx.getImageData(0,0,w,h),d=src.data,out=new Uint8ClampedArray(d);
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++)for(let k=0;k<3;k++){const i=(y*w+x)*4;const sum=d[i+k]*5-d[i-4+k]-d[i+4+k]-d[i-w*4+k]-d[i+w*4+k];out[i+k]=Math.max(0,Math.min(255,d[i+k]+(sum-d[i+k])*amount*.35));}
  src.data.set(out);ctx.putImageData(src,0,0);
}

function MergePdf({notify}) {
  const [files,setFiles]=useState([]);
  const merge=async()=>{try{const out=await PDFDocument.create();for(const f of files){const src=await PDFDocument.load(await f.arrayBuffer());const pages=await out.copyPages(src,src.getPageIndices());pages.forEach(p=>out.addPage(p));}saveBlob(new Blob([await out.save()],{type:"application/pdf"}),"zentools-merged.pdf");notify("PDFs merged successfully");}catch(e){notify("Merge failed: "+e.message)}};
  return <div className="panel"><div className="panel-title"><b>Merge PDF documents</b><span className="live-label">MULTI-FILE</span></div><Dropzone accept=".pdf,application/pdf" multiple onFiles={f=>setFiles(old=>[...old,...f])} label="Add PDF files" hint="Choose two or more PDF documents"/><FileList files={files} onRemove={i=>setFiles(files.filter((_,x)=>x!==i))}/><div className="action-row"><span className="muted">{files.length} PDF(s) · merged in listed order</span><button className="primary-btn" disabled={files.length<2} onClick={merge}><Files size={16}/> Merge PDFs</button></div></div>;
}

function ReorderPdf({notify}) {
  const [file,setFile]=useState(null),[pages,setPages]=useState([]),[busy,setBusy]=useState(false);
  const load=async f=>{try{setBusy(true);const pdf=await PDFDocument.load(await f.arrayBuffer());setPages(pdf.getPageIndices());setFile(f);}catch(e){notify("Could not open PDF: "+e.message)}finally{setBusy(false)}};
  const move=(i,dir)=>{const j=i+dir;if(j<0||j>=pages.length)return;const next=[...pages];[next[i],next[j]]=[next[j],next[i]];setPages(next)};
  const exportPdf=async()=>{try{const src=await PDFDocument.load(await file.arrayBuffer()),out=await PDFDocument.create(),copied=await out.copyPages(src,pages);copied.forEach(p=>out.addPage(p));saveBlob(new Blob([await out.save()],{type:"application/pdf"}),"zentools-reordered.pdf");notify("Reordered PDF downloaded");}catch(e){notify(e.message)}};
  return <div className="panel"><div className="panel-title"><b>Reorder PDF pages</b><span className="live-label">PAGE ORDER</span></div>{!file?<Dropzone accept=".pdf,application/pdf" onFiles={f=>load(f[0])} label="Upload a PDF" hint="Choose the PDF you want to rearrange"/>:<><div className="file-row"><FileText/><div className="file-meta"><b>{file.name}</b><small>{pages.length} pages</small></div><button className="text-btn" onClick={()=>{setFile(null);setPages([])}}>Change</button></div><p className="muted">Use the arrows to move pages. The top item becomes page 1.</p><div className="page-list">{pages.map((p,i)=><div className="page-row" key={`${p}-${i}`}><div className="page-number">{i+1}</div><div className="page-desc">Original page {p+1}</div><button className="icon-btn tiny" disabled={i===0} onClick={()=>move(i,-1)}><ArrowUp size={15}/></button><button className="icon-btn tiny" disabled={i===pages.length-1} onClick={()=>move(i,1)}><ArrowDown size={15}/></button></div>)}</div><button className="primary-btn full-btn" onClick={exportPdf}><Download size={16}/> Export reordered PDF</button></>}</div>;
}

function CompressPdf({notify}) {
  const [file,setFile]=useState(null),[level,setLevel]=useState("balanced"),[status,setStatus]=useState("");
  const run=async()=>{try{setStatus("Processing…");const pdf=await PDFDocument.load(await file.arrayBuffer());const bytes=await pdf.save({useObjectStreams:true,addDefaultPage:false,objectsPerTick:50});const blob=new Blob([bytes],{type:"application/pdf"});saveBlob(blob,"zentools-optimized.pdf");setStatus(`Original: ${prettyBytes(file.size)} · Output: ${prettyBytes(blob.size)}`);notify("PDF re-saved and optimized");}catch(e){setStatus("Could not process this PDF: "+e.message)}};
  return <div className="panel"><div className="panel-title"><b>Optimize a PDF</b><span className="live-label">LOCAL PROCESSING</span></div><Dropzone accept=".pdf,application/pdf" onFiles={f=>setFile(f[0])} label="Choose a PDF" hint="Select one PDF document"/>{file&&<div className="file-row"><FileText/><div className="file-meta"><b>{file.name}</b><small>{prettyBytes(file.size)}</small></div></div>}<div className="notice-box"><b>About PDF compression</b><p>This browser-only tool re-saves PDF structure and object streams. It may reduce some files, but cannot guarantee smaller output or recompress every embedded image. Image-heavy PDFs may need raster-based compression, which can reduce quality.</p></div><Field label="Optimization mode"><select value={level} onChange={e=>setLevel(e.target.value)}><option value="balanced">Balanced (recommended)</option><option value="preserve">Preserve quality</option></select></Field><button className="primary-btn full-btn" disabled={!file} onClick={run}><Download size={16}/> Optimize & download</button>{status&&<p className="muted">{status}</p>}</div>;
}

function PdfToImages({notify}) {
  const [file,setFile]=useState(null),[scale,setScale]=useState("2"),[busy,setBusy]=useState(false);
  const convert=async()=>{try{setBusy(true);const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n),viewport=page.getViewport({scale:+scale}),canvas=document.createElement("canvas");canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise;await downloadCanvas(canvas,`zentools-page-${n}.png`);}notify(`${pdf.numPages} page image(s) exported`);}catch(e){notify("Conversion failed: "+e.message)}finally{setBusy(false)}};
  return <div className="panel"><div className="panel-title"><b>Export PDF pages as images</b><span className="live-label">PNG EXPORT</span></div><Dropzone accept=".pdf,application/pdf" onFiles={f=>setFile(f[0])} label="Upload a PDF" hint="Each page will be exported as a PNG"/>{file&&<div className="file-row"><FileText/><div className="file-meta"><b>{file.name}</b><small>{prettyBytes(file.size)}</small></div></div>}<Field label="Render resolution"><select value={scale} onChange={e=>setScale(e.target.value)}><option value="1">Standard (1×)</option><option value="1.5">High (1.5×)</option><option value="2">Very high (2×)</option><option value="3">Maximum (3×)</option></select></Field><button className="primary-btn full-btn" disabled={!file||busy} onClick={convert}>{busy?"Rendering pages…":<><Download size={16}/> Convert pages to PNG</>}</button></div>;
}

function QrGenerator({notify}) {
  const [value,setValue]=useState("https://example.com"),[size,setSize]=useState("512"),[data,setData]=useState("");
  useEffect(()=>{let alive=true;if(value.trim())QRCode.toDataURL(value.trim(),{width:+size,margin:2,errorCorrectionLevel:"H",color:{dark:"#111827",light:"#ffffff"}}).then(v=>{if(alive)setData(v)}).catch(()=>setData(""));else setData("");return()=>{alive=false}},[value,size]);
  return <div className="tool-columns"><div className="panel"><div className="panel-title"><b>Customize your QR</b></div><Field label="Text or URL"><textarea value={value} onChange={e=>setValue(e.target.value)} rows="4" placeholder="Enter a URL or any text"/></Field><Field label="Image resolution"><select value={size} onChange={e=>setSize(e.target.value)}><option value="256">256 × 256</option><option value="512">512 × 512</option><option value="1024">1024 × 1024</option><option value="2048">2048 × 2048</option></select></Field></div><div className="panel qr-preview"><div className="panel-title"><b>Live preview</b></div>{data?<><img src={data} alt="Generated QR code"/><button className="primary-btn full-btn" onClick={()=>{const a=document.createElement("a");a.href=data;a.download="zentools-qr.png";a.click();notify("QR code downloaded")}}><Download size={16}/> Download QR PNG</button></>:<p className="muted">Enter content to generate a QR code.</p>}</div></div>;
}

function BarcodeGenerator({notify}) {
  const [value,setValue]=useState("ZEN-TOOLS-2026"),[data,setData]=useState("");
  useEffect(()=>{try{const c=document.createElement("canvas");JsBarcode(c,value||" ",{format:"CODE128",displayValue:true,margin:12,lineColor:"#111827",background:"#ffffff"});setData(c.toDataURL("image/png"));}catch{setData("")}},[value]);
  return <div className="tool-columns"><div className="panel"><div className="panel-title"><b>Barcode content</b></div><Field label="Text or product code"><input value={value} onChange={e=>setValue(e.target.value)} placeholder="Enter code"/></Field><div className="notice-box"><b>Code 128</b><p>Generated barcodes use Code 128, a widely supported format for alphanumeric data. Check your scanner or business requirements before printing labels.</p></div></div><div className="panel qr-preview"><div className="panel-title"><b>Barcode preview</b></div>{data&&<><img className="barcode-preview" src={data} alt="Generated barcode"/><button className="primary-btn full-btn" onClick={()=>{const a=document.createElement("a");a.href=data;a.download="zentools-barcode.png";a.click();notify("Barcode downloaded")}}><Download size={16}/> Download barcode</button></>}</div></div>;
}

function ImageConverter({notify}) {
  const [file,setFile]=useState(null),[format,setFormat]=useState("image/png"),[quality,setQuality]=useState(92);
  const convert=async()=>{try{const c=await fileToCanvas(file);await new Promise(resolve=>c.toBlob(b=>{saveBlob(b,`zentools-converted.${format==="image/png"?"png":"jpg"}`);resolve()},format,quality/100));notify("Image converted and downloaded")}catch(e){notify(e.message)}};
  return <div className="panel"><div className="panel-title"><b>Convert image format</b></div><Dropzone accept="image/*" onFiles={f=>setFile(f[0])} label="Upload an image" hint="JPG, PNG or WEBP"/>{file&&<div className="file-row"><FileImage/><div className="file-meta"><b>{file.name}</b><small>{prettyBytes(file.size)}</small></div></div>}<div className="settings-grid"><Field label="Output format"><select value={format} onChange={e=>setFormat(e.target.value)}><option value="image/png">PNG</option><option value="image/jpeg">JPG</option></select></Field><Field label="JPG quality"><select value={quality} onChange={e=>setQuality(+e.target.value)}><option value="70">70% · Smaller</option><option value="85">85% · Balanced</option><option value="92">92% · High</option><option value="100">100% · Maximum</option></select></Field></div><button className="primary-btn full-btn" disabled={!file} onClick={convert}><Download size={16}/> Convert & download</button></div>;
}
