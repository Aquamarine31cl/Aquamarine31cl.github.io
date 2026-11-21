/* Private journal: no remote AI calls, no plaintext diary or photo URLs in the HTML. */
(() => {
  'use strict';
  const app=document.querySelector('[data-personal-journal]');if(!app)return;
  const endpoint=app.dataset.journalUrl,keyStore='aquamarine.journal.key.v1';

  let lang='en';
  const tr=(en,zh)=>lang==='en'?en:zh;
  const monthName=(n,mode=lang)=>mode==='en'?['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][n-1]:n+'月';
  function localized(o,field){const value=o?.[field+'_'+lang];if(value)return value;const legacy=o?.[field]||'';return lang==='en'&&/[\u3400-\u9fff]/.test(legacy)?'English translation pending.':legacy;}
  const axis=id=>({joy:tr('Mood','心情'),energy:tr('Energy','精力'),calm:tr('Calm','平静'),focus:tr('Focus','专注'),connection:tr('Connection','联结'),fulfillment:tr('Fulfillment','充实')})[id];
  function applyLanguage(){
    document.querySelector('.journal-page').lang=lang==='en'?'en':'zh-Hans';const loadingStatus=app.querySelector('.journal-loading [role=status]');if(loadingStatus)loadingStatus.textContent=tr('Opening your journal…','正在打开手记…');
    document.querySelectorAll('[data-journal-en]').forEach(e=>{const text=e.dataset[lang==='en'?'journalEn':'journalZh'];if(e.textContent!==text)e.textContent=text;});
    document.querySelectorAll('[data-journal-language]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.journalLanguage===lang));});
    const dialog=document.getElementById('access-dialog');
    if(dialog){dialog.lang=lang==='en'?'en':'zh-Hans';dialog.querySelector('[data-close-access]')?.setAttribute('aria-label',tr('Close access dialog','关闭通行对话框'));const labels=[['#access-heading',tr('Personal access','个人通行')],[':scope>p:not([role])',tr('Use your access code to view this section.','输入个人通行码以查看此部分。')],['label[for=access-code]',tr('Access Code','通行码')],['[type=submit]',tr('Unlock','解锁')],['[data-relock]',tr('Lock again','重新锁定')]];labels.forEach(([q,t])=>{const e=dialog.querySelector(q);if(e&&e.textContent!==t)e.textContent=t;});}
    if(typeof viewer!=='undefined'){viewer.lang=lang==='en'?'en':'zh-Hans';viewer.setAttribute('aria-label',tr('Monthly photographs','月度照片'));viewer.querySelector('.journal-view-header>span').textContent=tr('A moment from this month','这一月的一帧');viewer.querySelector('[data-close]').textContent=tr('Close','关闭');viewer.querySelector('[data-prev]').textContent=tr('Previous','上一张');viewer.querySelector('[data-next]').textContent=tr('Next','下一张');}
  }

  const textEncoder=new TextEncoder(),textDecoder=new TextDecoder();
  const dimensions=[['joy'],['energy'],['calm'],['focus'],['connection'],['fulfillment']];
  const bins=[[1],[2],[3,4],[5],[6],[7,8],[9],[10],[11,12]];
  let data=null,key=null,envelope=null,generation=0,yearIndex=0,monthNumber=11,tab='monthly',returnFocus=null;
  const images=new Map(),urls=new Set();
  const b64=bytes=>btoa(Array.from(new Uint8Array(bytes),b=>String.fromCharCode(b)).join(''));
  const bytes=str=>Uint8Array.from(atob(str),c=>c.charCodeAt(0));
  function node(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
  function message(text){
    app.setAttribute('aria-busy','true');const loading=node('div','journal-loading');
    const status=node('p','journal-muted',text);status.setAttribute('role','status');loading.append(status);
    const placeholders=node('div','journal-loading-photos');placeholders.setAttribute('aria-hidden','true');for(let i=0;i<3;i++)placeholders.append(node('div','journal-loading-photo'));
    const lines=node('div','journal-loading-lines');lines.setAttribute('aria-hidden','true');for(let i=0;i<3;i++)lines.append(node('span'));
    loading.append(placeholders,lines);app.replaceChildren(loading);
  }
  async function getEnvelope(){if(!envelope){const response=await fetch(endpoint,{cache:'no-store'});if(!response.ok)throw Error('The journal file is unavailable.');envelope=await response.json();if(envelope.version!==1||envelope.kdf!=='PBKDF2-SHA256'||envelope.iterations<100000||envelope.iterations>1000000)throw Error('Invalid journal format.');}return envelope;}
  async function decrypt(k,packet,aad){return crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(packet.iv),additionalData:textEncoder.encode(aad)},k,bytes(packet.body));}
  function validate(input){if(input.version!==1||!Array.isArray(input.years)||!input.years.length)throw Error('Invalid journal data.');for(const year of input.years){if(!Number.isInteger(year.year)||(!Array.isArray(year.months)||year.months.length<1||year.months.length>12))throw Error('Invalid year.');for(const m of year.months)if(!Number.isInteger(m.month)||m.photos?.length!==3)throw Error('Invalid month.');}return input;}
  async function unlock(code){
    message(tr("Opening your journal…","正在打开手记…"));const packet=await getEnvelope();
    const material=await crypto.subtle.importKey('raw',textEncoder.encode(code),'PBKDF2',false,['deriveKey']);
    const nextKey=await crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(packet.salt),iterations:packet.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},true,['encrypt','decrypt']);
    const decoded=validate(JSON.parse(textDecoder.decode(await decrypt(nextKey,packet,'personal-journal107:manifest'))));
    key=nextKey;data=decoded;try{sessionStorage.setItem(keyStore,JSON.stringify({salt:packet.salt,key:b64(await crypto.subtle.exportKey('raw',key))}));}catch{}chooseInitial();render();
  }
  async function resume(){
    if(data){render();return;}const token=generation;message(tr("Opening your journal…","正在打开手记…"));
    try{const saved=JSON.parse(sessionStorage.getItem(keyStore)||'null'),packet=await getEnvelope();if(!saved||saved.salt!==packet.salt)throw Error('Please unlock again.');
      const restored=await crypto.subtle.importKey('raw',bytes(saved.key),{name:'AES-GCM'},false,['decrypt']);
      const decoded=validate(JSON.parse(textDecoder.decode(await decrypt(restored,packet,'personal-journal107:manifest'))));if(token!==generation)return;key=restored;data=decoded;chooseInitial();render();
    }catch{clear();document.dispatchEvent(new CustomEvent('personal-vault-invalid'));}
  }
  function clear(){app.removeAttribute('aria-busy');generation++;key=data=null;envelope=null;images.clear();urls.forEach(url=>URL.revokeObjectURL(url));urls.clear();try{sessionStorage.removeItem(keyStore);}catch{}closeViewer();app.replaceChildren();}
  function chooseInitial(){const now=new Date(),thisYear=data.years.findIndex(y=>y.year===now.getFullYear());yearIndex=thisYear>=0?thisYear:data.years.indexOf(data.years.reduce((a,b)=>a.year>b.year?a:b));monthNumber=thisYear>=0?now.getMonth()+1:currentYear().months.filter(recorded).pop()?.month||currentYear().months[0].month;}
  window.personalJournalAccess={unlock,hasSession:()=>{try{return Boolean(sessionStorage.getItem(keyStore));}catch{return Boolean(key&&data);}}};
  document.addEventListener('site-access-changed',()=>{if(document.documentElement.hasAttribute('data-access-unlocked')){if(!data)resume();}else clear();});
  async function picture(p){
    if(!p.src)return null;if(images.has(p.id))return images.get(p.id);
    const token=generation,currentKey=key;
    const task=(async()=>{const url=new URL(p.src,new URL(endpoint,location.href));const base=new URL('.',new URL(endpoint,location.href));if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname+'media/'))throw Error('Invalid photograph path.');
      const response=await fetch(url);if(!response.ok)throw Error('Photograph unavailable.');const packet=await response.json();
      const raw=await decrypt(currentKey,packet,'personal-journal107:photo:'+p.id);if(token!==generation||!key)throw Error('Journal locked.');
      if(!['image/jpeg','image/png','image/webp'].includes(p.mime))throw Error('Invalid photograph type.');const blob=URL.createObjectURL(new Blob([raw],{type:p.mime}));urls.add(blob);return blob;
    })();images.set(p.id,task);task.catch(()=>images.delete(p.id));return task;
  }
  function photoFace(photo,photos,caption=true){
    const face=node(photo.src?'button':'div','journal-photo-face');if(photo.src)face.type='button';
    face.append(node('span','',photo.src?tr("Loading…","正在加载…"):tr("Photo to add","照片待补")));
    if(photo.src){const token=generation;picture(photo).then(async src=>{if(token!==generation)return;const image=node('img');image.alt=localized(photo,'caption')||tr("Monthly photograph","月度照片");image.src=src;await image.decode();if(token!==generation)return;face.replaceChildren(image);}).catch(()=>{if(token===generation)face.replaceChildren(node('span','',tr("This photograph is unavailable.","照片暂时无法打开")));});face.addEventListener('click',()=>openViewer(photos,photos.indexOf(photo),face));}
    if(!caption)return face;const figure=node('figure','journal-photo');figure.append(face,node('figcaption','',localized(photo,'caption')||tr("A frame from this month","留给这一月的一帧")));return figure;
  }
  function binsForYear(y){if(y.months.length===12)return bins;const groups=y.months.map(m=>[m.month]);while(groups.length>9){const tail=groups.pop();groups[groups.length-1].push(...tail);}while(groups.length<9)groups.push([]);return groups;}
  function currentYear(){return data.years[yearIndex];}
  function currentMonth(){return currentYear().months.find(m=>m.month===monthNumber);}
  function recorded(m){return Boolean((m.note||m.note_en||m.note_zh||'').trim()||m.photos.some(p=>p.src));}
  function render(){
    if(!data)return;app.removeAttribute('aria-busy');app.replaceChildren();
    const toolbar=node('div','journal-toolbar'),label=node('label','',tr("Year","年份")),select=node('select');select.setAttribute('aria-label',tr("Choose a year","选择年份"));
    data.years.forEach((y,i)=>{const option=node('option','',y.year+'');option.value=i;select.append(option);});select.value=yearIndex;select.addEventListener('change',()=>{yearIndex=+select.value;if(!currentYear().months.some(m=>m.month===monthNumber))monthNumber=currentYear().months[0].month;render();});label.append(select);toolbar.append(label);
    const tabs=node('div','journal-tabs');tabs.setAttribute('role','group');tabs.setAttribute('aria-label',tr("Journal view","手记视图"));for(const [id,title]of [['monthly',tr("Monthly","月记")],['annual',tr("Year in review","年计")]]){const button=node('button','',title);button.type='button';button.setAttribute('aria-pressed',String(tab===id));button.addEventListener('click',()=>{tab=id;render();app.querySelector('.journal-tabs button[aria-pressed=true]')?.focus({preventScroll:true});});tabs.append(button);}toolbar.append(tabs);app.append(toolbar);
    if(tab==='annual'){renderAnnual();return;}
    const months=node('nav','journal-months');if(currentYear().months.length<12){months.classList.add('journal-months-partial');months.style.setProperty('--journal-month-count',Math.min(5,currentYear().months.length));}months.setAttribute('aria-label',tr("Choose a month","选择月份"));for(const entry of currentYear().months){const i=entry.month;const button=node('button','',monthName(i));button.type='button';button.setAttribute('aria-pressed',String(monthNumber===i));button.addEventListener('click',()=>{monthNumber=i;render();app.querySelector('.journal-months button[aria-pressed=true]')?.focus({preventScroll:true});});months.append(button);}app.append(months);
    const m=currentMonth(),heading=node('header','journal-heading');heading.append(node('h2','',localized(m,'title')||tr(monthName(m.month)+' '+currentYear().year,currentYear().year+'年 · '+m.month+'月')),node('p','',recorded(m)?tr("This month, remembered","这一月，留在这里"):tr("No entry yet","这一月，尚待记录")));app.append(heading);
    const strip=node('div','journal-photos');m.photos.forEach(p=>strip.append(photoFace(p,m.photos)));app.append(strip);
    const details=node('div','journal-details'),note=node('article','journal-note');note.append(node('h3','',tr("Monthly notes","这一月的文字")),node('p',localized(m,'note')?'':'journal-empty',localized(m,'note')||tr("Add photographs, moments and thoughts when you are ready.","照片、发生过的事，和当时的想法，都可以慢慢补上。")));details.append(note,radar(m.analysis));app.append(details);
  }
  function radar(analysis){
    const section=node('section','journal-mood');section.append(node('h3','',tr("Mood & state","心情与状态")));
    const valid=analysis?.status==='reviewed'&&dimensions.every(([id])=>Number.isFinite(analysis.scores?.[id])&&analysis.scores[id]>=1&&analysis.scores[id]<=5);
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 280 260');svg.setAttribute('class','journal-radar');svg.setAttribute('role','img');svg.setAttribute('aria-label',valid?tr("Monthly mood and state radar: six dimensions, scored out of five.","当月心情与状态雷达图，六个维度，满分五分"):tr("Mood and state radar, awaiting a monthly entry.","心情与状态雷达图，等待月度记录分析"));
    const point=(i,r)=>[140+Math.cos(-Math.PI/2+i*Math.PI/3)*r,128+Math.sin(-Math.PI/2+i*Math.PI/3)*r];
    const polygon=(r,cls)=>{const p=document.createElementNS(svg.namespaceURI,'polygon');p.setAttribute('points',dimensions.map((d,i)=>point(i,typeof r==='number'?r:r[i]).join(',')).join(' '));p.setAttribute('class',cls);svg.append(p);};
    for(let ring=1;ring<=5;ring++)polygon(ring*16,'radar-grid');for(let i=0;i<6;i++){const line=document.createElementNS(svg.namespaceURI,'line'),[x,y]=point(i,80);line.setAttribute('x1','140');line.setAttribute('y1','128');line.setAttribute('x2',x);line.setAttribute('y2',y);line.setAttribute('class','radar-grid');svg.append(line);const label=document.createElementNS(svg.namespaceURI,'text'),[lx,ly]=point(i,107);label.setAttribute('x',lx);label.setAttribute('y',ly+5);label.setAttribute('text-anchor','middle');label.textContent=axis(dimensions[i][0]);svg.append(label);}if(valid)polygon(dimensions.map(([id])=>analysis.scores[id]*16),'radar-fill');section.append(svg);
    const values=node('dl');for(const[id,title]of dimensions){const item=node('div');item.append(node('dt','',axis(id)),node('dd','',valid?analysis.scores[id]+' / 5':tr("Not reviewed","待整理")));values.append(item);}section.append(values,node('p',valid?'':'journal-empty',valid?(localized(analysis,'summary')||tr("This month’s reflection is ready.","这一月的状态已整理。")):tr("Add your entry before reflecting on this month’s mood and state.","等故事写下，再回看这一月的心情与状态。")));
    const translatedEvidence=analysis?.['evidence_'+lang];const evidenceItems=translatedEvidence?.length?translatedEvidence:analysis?.evidence||[];if(valid&&evidenceItems.length){const evidence=node('details','journal-evidence');evidence.append(node('summary','',tr("Basis for this reflection","整理依据")));const list=node('ul');evidenceItems.forEach(t=>list.append(node('li','',lang==='en'&&/[\u3400-\u9fff]/.test(String(t))?'English translation pending.':String(t))));evidence.append(list);section.append(evidence);}return section;
  }
  function representative(m){return m.photos[m.highlight||0]?.src?m.photos[m.highlight||0]:m.photos.find(p=>p.src)||m.photos[0];}
  function renderAnnual(){
    const y=currentYear(),heading=node('header','journal-year-heading');heading.append(node('h2','',y.year+' · '+tr('Year in review','年计')),node('p','',y.months.filter(recorded).length+' / '+y.months.length+tr(' months recorded',' 个月已记录')));app.append(heading);
    const note=node('article','journal-year-note');note.append(node('h3','',tr("A year to remember","把这一年收好")),node('p',localized(y,'summary')?'':'journal-empty',localized(y,'summary')||tr("A short reflection will bring this year’s moments together.","等这一年的故事慢慢齐了，再把它浓缩成一段话。")));app.append(note);
    const grid=node('div','journal-year-grid');grid.setAttribute('aria-label',tr("Nine-frame annual collage covering the available months.","年度九宫格，覆盖这一年已开放的月份"));
    binsForYear(y).forEach(months=>{const cell=node('div','journal-year-cell'+(months.length===2?' is-paired':''));if(!months.length){cell.append(node('span','journal-empty-cell',tr("Left blank","留白")));}months.forEach(n=>{const m=y.months.find(m=>m.month===n),frame=node('div','journal-year-frame');frame.append(photoFace(representative(m),m.photos,false),node('span','journal-year-label',monthName(n)));cell.append(frame);});grid.append(cell);});app.append(grid,node('p','journal-year-caption',y.months.length===12?tr("All twelve months are included. Mar–Apr, Jul–Aug and Nov–Dec each share one frame.","九宫格保留十二个月：3—4月、7—8月、11—12月各共用一格。"):tr('Records start in '+monthName(y.months[0].month)+'. Unused cells are left blank.','这一年的记录从'+y.months[0].month+'月开始；未使用的格子留白。')));
    const button=node('button','',tr("Export annual collage","导出年度九宫格"));button.type='button';button.disabled=!y.months.some(m=>m.photos.some(p=>p.src));button.addEventListener('click',async()=>{button.disabled=true;button.textContent=tr("Preparing images…","正在整理图片…");try{await exportYear(y);}catch{app.append(node('p','journal-muted',tr("The images are not ready. Please try again.","图片还没准备好，请稍后重试。")));}finally{button.disabled=false;button.textContent=tr("Export annual collage","导出年度九宫格");}});app.append(button);
  }
  async function exportYear(y){
    const exportLanguage=lang,xt=(en,zh)=>exportLanguage==='en'?en:zh;const exportToken=generation,canvas=document.createElement('canvas');canvas.width=2400;canvas.height=2700;const c=canvas.getContext('2d');const gradient=c.createLinearGradient(0,0,2400,2700);gradient.addColorStop(0,'#161931');gradient.addColorStop(1,'#243c49');c.fillStyle=gradient;c.fillRect(0,0,2400,2700);c.fillStyle='#f0e9fa';c.font='bold 90px system-ui,"Microsoft YaHei"';c.fillText(y.year+' · '+xt('Year in review','年计'),80,150);c.fillStyle='#b9c8df';c.font='34px system-ui,"Microsoft YaHei"';c.fillText(xt(y.months.length+' months in nine frames.',y.months.length+'个月，留在九格里。'),85,215);const yearBins=binsForYear(y);
    const imageOf=async p=>{if(!p.src)return null;const image=new Image();image.src=await picture(p);await image.decode();return image;};
    for(let i=0;i<yearBins.length;i++){const x=60+(i%3)*780,y0=300+Math.floor(i/3)*780;if(!yearBins[i].length){c.fillStyle='#ffffff08';c.fillRect(x,y0,750,742);c.fillStyle='#8e9bac';c.font='32px system-ui,"Microsoft YaHei"';c.fillText(xt("Left blank","留白"),x+340,y0+375);}for(let j=0;j<yearBins[i].length;j++){if(exportToken!==generation)throw Error('Journal locked.');const month=y.months.find(m=>m.month===yearBins[i][j]),p=representative(month),height=750/yearBins[i].length,top=y0+j*height;c.fillStyle='#ffffff08';c.fillRect(x,top,750,height-8);const image=await imageOf(p);if(image){const scale=Math.min(730/image.width,(height-65)/image.height);c.drawImage(image,x+(750-image.width*scale)/2,top+(height-55-image.height*scale)/2,image.width*scale,image.height*scale);}else{c.fillStyle='#8e9bac';c.font='32px system-ui,"Microsoft YaHei"';c.textAlign='center';c.fillText(xt("Photo to add","照片待补"),x+375,top+height/2);c.textAlign='left';}c.fillStyle='#edf0fa';c.font='32px system-ui,"Microsoft YaHei"';c.fillText(monthName(month.month,exportLanguage),x+25,top+height-23);}}
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob||exportToken!==generation)throw Error('Export unavailable.');const href=URL.createObjectURL(blob),link=node('a');link.href=href;link.download=y.year+(exportLanguage==='en'?'-year-in-review.png':'年计-九宫格.png');link.click();setTimeout(()=>URL.revokeObjectURL(href),1000);
  }
  const viewer=document.createElement('dialog');viewer.className='journal-view';viewer.setAttribute('aria-label',tr("Monthly photograph","月度照片"));viewer.innerHTML='<div class="journal-view-header"><span>A moment from this month</span><button type="button" data-close>Close</button></div><img alt=""><p data-caption></p><div class="journal-view-controls"><button type="button" data-prev>Previous</button><span data-count></span><button type="button" data-next>Next</button></div>';document.body.append(viewer);
  let viewPhotos=[],viewIndex=0,viewGeneration=0;
  async function showPhoto(index){if(!viewPhotos.length)return;viewIndex=(index+viewPhotos.length)%viewPhotos.length;const p=viewPhotos[viewIndex],token=++viewGeneration,image=viewer.querySelector('img');image.removeAttribute('src');image.alt=localized(p,'caption')||tr("Monthly photograph","月度照片");viewer.querySelector('[data-caption]').textContent=localized(p,'caption')||'';viewer.querySelector('[data-count]').textContent=(viewIndex+1)+' / '+viewPhotos.length;try{const src=await picture(p);if(token===viewGeneration&&viewer.hasAttribute('open'))image.src=src;}catch{if(token===viewGeneration)viewer.querySelector('[data-caption]').textContent=tr("This photograph is unavailable.","照片暂时无法打开。");}}
  function openViewer(photos,index,trigger){viewPhotos=photos.filter(p=>p.src);viewIndex=Math.max(0,viewPhotos.indexOf(photos[index]));returnFocus=trigger;if(typeof viewer.showModal==='function')viewer.showModal();else viewer.setAttribute('open','');document.documentElement.classList.add('journal-view-open');showPhoto(viewIndex);viewer.querySelector('[data-close]').focus();}
  function closeViewer(){viewGeneration++;if(viewer.open&&typeof viewer.close==='function')viewer.close();else viewer.removeAttribute('open');viewer.querySelector('img').removeAttribute('src');viewer.querySelector('[data-caption]').textContent='';viewPhotos=[];document.documentElement.classList.remove('journal-view-open');if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});returnFocus=null;}
  viewer.querySelector('[data-close]').addEventListener('click',closeViewer);viewer.querySelector('[data-prev]').addEventListener('click',()=>showPhoto(viewIndex-1));viewer.querySelector('[data-next]').addEventListener('click',()=>showPhoto(viewIndex+1));viewer.addEventListener('cancel',e=>{e.preventDefault();closeViewer();});viewer.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();showPhoto(viewIndex+1);}if(e.key==='ArrowLeft'){e.preventDefault();showPhoto(viewIndex-1);}if(e.key==='Escape'){e.preventDefault();closeViewer();}});viewer.addEventListener('click',e=>{if(e.target===viewer)closeViewer();});
  document.querySelectorAll('[data-journal-language]').forEach(button=>button.addEventListener('click',()=>{lang=button.dataset.journalLanguage;closeViewer();applyLanguage();if(data)render();button.focus({preventScroll:true});}));
  document.addEventListener('site-access-changed',applyLanguage);
  const feedback=document.getElementById('access-feedback');
  if(feedback){const messages={'That code did not match. Please try again.':'通行码不正确，请重试。','Personal and Daily Events are unlocked in this tab.':'当前标签页已解锁个人日记。','This tab is locked again.':'当前标签页已重新锁定。','The journal could not be opened. Check the file and try again.':'手记暂时无法打开，请检查文件后重试。'};new MutationObserver(()=>{const current=feedback.textContent;const next=lang==='zh'?messages[current]:Object.keys(messages).find(k=>messages[k]===current);if(next&&current!==next)feedback.textContent=next;}).observe(feedback,{childList:true,subtree:true});}
  applyLanguage();
  addEventListener('pagehide',closeViewer);
})();
