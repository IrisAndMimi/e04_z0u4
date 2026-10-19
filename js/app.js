(function(){
'use strict';
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);

/* ---------- 注音鍵盤 ---------- */
const LAYOUTS={
  daqian:{type:'zy',name:'大千',textName:'注音文',
    keys:{'1':'ㄅ','q':'ㄆ','a':'ㄇ','z':'ㄈ','2':'ㄉ','w':'ㄊ','s':'ㄋ','x':'ㄌ','e':'ㄍ','d':'ㄎ','c':'ㄏ','r':'ㄐ','f':'ㄑ','v':'ㄒ','5':'ㄓ','t':'ㄔ','g':'ㄕ','b':'ㄖ','y':'ㄗ','h':'ㄘ','n':'ㄙ','u':'ㄧ','j':'ㄨ','m':'ㄩ','8':'ㄚ','i':'ㄛ','k':'ㄜ',',':'ㄝ','9':'ㄞ','o':'ㄟ','l':'ㄠ','.':'ㄡ','0':'ㄢ','p':'ㄣ',';':'ㄤ','/':'ㄥ','-':'ㄦ'},
    tones:{' ':'','6':'ˊ','3':'ˇ','4':'ˋ','7':'˙'}},
  eten:{type:'zy',name:'倚天',textName:'注音文',
    keys:{'b':'ㄅ','p':'ㄆ','m':'ㄇ','f':'ㄈ','d':'ㄉ','t':'ㄊ','n':'ㄋ','l':'ㄌ','v':'ㄍ','k':'ㄎ','h':'ㄏ','g':'ㄐ','7':'ㄑ','c':'ㄒ',',':'ㄓ','.':'ㄔ','/':'ㄕ','j':'ㄖ',';':'ㄗ',"'":'ㄘ','s':'ㄙ','e':'ㄧ','x':'ㄨ','u':'ㄩ','a':'ㄚ','o':'ㄛ','r':'ㄜ','w':'ㄝ','i':'ㄞ','q':'ㄟ','z':'ㄠ','y':'ㄡ','8':'ㄢ','9':'ㄣ','0':'ㄤ','-':'ㄥ','=':'ㄦ'},
    tones:{' ':'','2':'ˊ','3':'ˇ','4':'ˋ','1':'˙'}}
};
for(const L of Object.values(LAYOUTS)){
  L.inv={}; for(const [k,s] of Object.entries(L.keys)) L.inv[s]=k;
  L.tinv={}; for(const [k,t] of Object.entries(L.tones)) L.tinv[t]=k;
}
/* ---------- 字形輸入法（倉頡、無蝦米）---------- */
function makeShape(name,textName,data){
  const L={type:'shape',name,textName,kn:data.kn,sel:data.sel,codes:new Map(),rev:new Map(),keyset:new Set()};
  for(const line of data.t.split('\n')){
    const tab=line.indexOf('\t'),code=line.slice(0,tab),chars=line.slice(tab+1).split('\u0001');
    L.codes.set(code,chars);
    for(const c of code) L.keyset.add(c);
    chars.forEach((ch,i)=>{ if(i>=L.sel.length) return; let a=L.rev.get(ch); if(!a) L.rev.set(ch,a=[]); a.push({code,i}); });
  }
  // 最少按鍵優先；同長度時，排第一個（空白就能送出）的優先
  for(const a of L.rev.values()) a.sort((x,y)=>(x.code.length+(x.i?0.5:0))-(y.code.length+(y.i?0.5:0)));
  return L;
}
LAYOUTS.cangjie=makeShape('倉頡','倉頡碼',window.ZY_SHAPE.cangjie);
LAYOUTS.boshiamy=makeShape('無蝦米','無蝦米碼',window.ZY_SHAPE.boshiamy);

/* ---------- 符號輸入（直接貼注音符號／字根，pseudo＝沒有實體鍵盤，base＝對應的真正輸入法）---------- */
// 注音符號：符號本身就是「按鍵」，ˊˇˋ˙ 是聲調鍵，空白或 ˉ 是一聲；dropSep：音節之間的分隔空白不保留
(function(){
  const keys={};for(let c=0x3105;c<=0x3129;c++){const s=String.fromCharCode(c);keys[s]=s;}
  keys['一']='ㄧ';   // 常有人用國字「一」代替注音「ㄧ」
  const tones={'ˉ':'',' ':'','ˊ':'ˊ','ˇ':'ˇ','ˋ':'ˋ','˙':'˙'},D=LAYOUTS.daqian;
  const L={type:'zy',pseudo:true,base:'daqian',name:'注音符號',textName:'注音符號',dropSep:true,keys,tones,
    inv:{},tinv:{'':' ','ˊ':'ˊ','ˇ':'ˇ','ˋ':'ˋ','˙':'˙'}};
  for(let c=0x3105;c<=0x3129;c++){const s=String.fromCharCode(c);L.inv[s]=s;}
  // 鍵盤圖要亮大千的哪些鍵
  L.toPhys=s=>[...s].map(c=>keys[c]?D.inv[keys[c]]:has(tones,c)?D.tinv[tones[c]]:c).join('');
  LAYOUTS.zysym=L;
})();
// 字根：把真正輸入法的字碼換成字根（倉頡 j→十；無蝦米 j→Ｊ）當作新的字碼表；commitEnd：最後一組沒接空白也算一個字
function makeRootLayout(baseKey,name){
  const B=LAYOUTS[baseKey],toR=code=>[...code].map(c=>B.kn[c]||c).join('');
  const L={type:'shape',pseudo:true,base:baseKey,name,textName:name,kn:{},sel:B.sel,codes:new Map(),rev:new Map(),keyset:new Set(),commitEnd:true};
  for(const [code,chars] of B.codes){const r=toR(code);L.codes.set(r,chars);for(const c of r) L.keyset.add(c);}
  for(const [ch,a] of B.rev) L.rev.set(ch,a.map(e=>({code:toR(e.code),i:e.i})));
  for(const c of L.keyset) L.kn[c]=c;
  const back={};for(const [k,v] of Object.entries(B.kn)) back[v]=k;
  L.toPhys=s=>[...s].map(c=>back[c]||c).join('');
  return L;
}
LAYOUTS.cjroot=makeRootLayout('cangjie','倉頡字根');
LAYOUTS.bsroot=makeRootLayout('boshiamy','無蝦米字根');
const shapeTerm=(L,i)=>i===0?' ':L.sel[i];
const shapeEnc=(L,e)=>e.code+shapeTerm(L,e.i);
const roots=(L,code)=>[...code].map(c=>L.kn[c]||c).join('');

const KB_ROWS=[['1','2','3','4','5','6','7','8','9','0','-','='],['q','w','e','r','t','y','u','i','o','p','[',']'],['a','s','d','f','g','h','j','k','l',';',"'"],['z','x','c','v','b','n','m',',','.','/'],[' ']];

/* ---------- 注音詞庫 ---------- */
const SYL=window.ZY_SYL.split(' ');
const SYLID=new Map(SYL.map((s,i)=>[s,i]));
const PH=new Map();
for(const line of window.ZY_DICT.split('\n')){const a=line.split('\t'); PH.set(a[0],{c:a[1],b:a[2]});}
const kc=id=>String.fromCharCode(0xE000+id);
const TONEMARKS='ˊˇˋ˙';
function slotOf(sym){const c=sym.charCodeAt(0); if(c>=0x3105&&c<=0x3119) return 0; if(c>=0x3127&&c<=0x3129) return 1; return 2;}
const SYLINFO=SYL.map(s=>{
  let tone='',base=s; if(TONEMARKS.includes(s[s.length-1])){tone=s[s.length-1];base=s.slice(0,-1);}
  const slots=['','','']; for(const ch of base) slots[slotOf(ch)]=ch;
  const e=PH.get(kc(SYLID.get(s)));
  return {base,tone,slots,top:e?parseInt(e.b[0],36):0};
});
function singles(id,limit){
  const e=PH.get(kc(id)); if(!e) return [];
  const n=Math.min(e.b.length,limit||9999),r=[];
  for(let i=0;i<n;i++) r.push({ch:e.c[i],v:parseInt(e.b[i],36)});
  return r;
}
const showReading=r=>r; // 依打字順序，輕聲點放最後（ㄌㄜ˙）
function compose(syms,reorder){
  if(!syms.length||syms.length>3) return null;
  const slots=['','',''];let last=-1;
  for(const s of syms){const k=slotOf(s); if(slots[k]) return null; if(!reorder&&k<last) return null; last=k; slots[k]=s;}
  return slots.join('');
}
function readingToKeys(reading,L){
  let tone='',base=reading;
  if(TONEMARKS.includes(reading[reading.length-1])){tone=reading[reading.length-1];base=reading.slice(0,-1);}
  let k='';for(const s of base) k+=L.inv[s]||s;
  return k+(L.tinv[tone]!==undefined?L.tinv[tone]:'');
}

/* ---------- 狀態 ---------- */
const S={layout:'daqian',mode:'dec',opts:{reorder:true,smart:true,numUnit:true,endTone1:false,shapeSplit:false},
  locks:{},sel:null,prev:[],glocks:{},gcodes:{},gsel:null,target:'zh',lastDoneCount:0,auto:true,detect:'idle',genPick:null,cands:null,candsFor:'',pin:null};
try{const sv=JSON.parse(localStorage.getItem('zyw-settings')||'null'); if(sv){ if(LAYOUTS[sv.layout]) S.layout=sv.layout; if(sv.target==='sym') S.target='sym'; if(sv.auto===false) S.auto=false; const so=Object.assign({},sv.opts); delete so.keepDigits; delete so.autoIme; Object.assign(S.opts,so); }}catch(e){}
function save(){try{localStorage.setItem('zyw-settings',JSON.stringify({v:3,layout:S.layout,opts:S.opts,target:S.target,auto:S.auto}));}catch(e){}}
const cur=()=>LAYOUTS[S.layout];
// demo：左邊內容是否還是「開場範例」。一旦按過 ⇄、自己打過字、用預測補完過、或已經點進去過，就不再是範例，不會被清空。
// （之前用「內容跟範例一樣」來判斷，但 ⇄ 會把範例翻好的「幹我又忘記切換輸入法了」搬過去，
//   剛好跟中文那邊的範例一模一樣，⇄ 又會把游標放進去，結果被誤清。）
const demo={src:true,g:true};

/* ---------- 數字判斷：看前後文決定一串數字是數字還是注音 ---------- */
// 單位：數字後面（可隔空白）接到這些，就當成數字
const UNIT_RE=/^\s*(?:[元塊圓毛角分個人位名次歲年月日號點時秒天週周代件張台臺支本隻條顆碗杯瓶包盒箱公斤克里米尺寸吋度樓層頁章集篇份倍成折趟班萬千百億兆%％]|(?:kg|km|cm|mm|ml|hz|kb|mb|gb|tb|fps|hr|min|sec|pcs|usd|twd|nt|g|m|l|k|w|h|s|p|x)(?![a-z]))/i;
// 前綴：數字前面（可隔空白）是這些，也當成數字
const PREFIX_RE=/(?:[$＄¥￥€£#＃]|nt\$|us\$|no\.|第|約|共|剩|只有|只要|大約|大概|將近|超過|不到|總共|總計|價錢|價格|花了)\s*$/i;
// 找出整段文字裡每一串數字（含 1,040、10.5 這種）
function numberRuns(text){
  const at=new Array(text.length),re=/[0-9]+(?:[.,][0-9]+)*/g;let m;
  while((m=re.exec(text))){const r={s:m.index,e:m.index+m[0].length};for(let k=r.s;k<r.e;k++) at[k]=r;}
  return at;
}
// s～e 這段（都是數字）在前後文裡看起來像數字嗎？
function looksLikeNumber(text,runs,s,e){
  const r=runs[s]; if(!r||runs[e-1]!==r) return false;
  if(r.s<s||r.e>e) return true;              // 這串數字比一個音節長，例如 1040、2104
  return UNIT_RE.test(text.slice(r.e,r.e+8))||PREFIX_RE.test(text.slice(Math.max(0,r.s-6),r.s));
}

/* ---------- 解碼：注音 ---------- */
function tokenizeZy(text,L,o){
  const toks=[];let buf=[];
  const runs=o.numUnit?numberRuns(text):null;
  const pushRaw=s=>{if(!s)return;const t=toks[toks.length-1]; if(t&&t.t==='raw') t.s+=s; else toks.push({t:'raw',s});};
  const bufKeys=b=>b.map(x=>x.ch).join('');
  // 把一段符號當成「一個」音節
  // tonePos：聲調鍵在原文的位置（沒有聲調鍵時為 -1）
  function single(part,tone,toneKey,tonePos){
    if(part.length>3) return null;
    const canon=compose(part.map(b=>b.sym),o.reorder); if(canon===null) return null;
    const reading=canon+tone,id=SYLID.get(reading); if(id===undefined) return null;
    const keys=bufKeys(part)+toneKey;
    if(o.numUnit&&/^[0-9]+$/.test(keys.replace(/ /g,''))){
      const end=(toneKey&&toneKey!==' '?tonePos:part[part.length-1].pos)+1;
      if(looksLikeNumber(text,runs,part[0].pos,end)) return null;
    }
    return {t:'syl',keys,id,reading,sig:'z'+id,z:showReading(reading),start:part[0].pos};
  }
  // 「沒打聲調時當一聲」：把一串符號拆成好幾個音節，前面的都當一聲，最後一個用實際按的聲調。
  // 例：e0su3 → ㄍㄢ（一聲）+ ㄋㄧˇ。拆法取音節最少者，同數量時偏好符號本來就照順序打的拆法。
  function split(tone,toneKey,tonePos){
    const n=buf.length,best=new Array(n+1).fill(null);best[0]={c:0,p:0};
    for(let i=0;i<n;i++){ if(!best[i]) continue;
      for(let l=1;l<=3&&i+l<=n;l++){
        const j=i+l,last=j===n,part=buf.slice(i,j);
        const tok=single(part,last?tone:'',last?toneKey:'',last?tonePos:-1); if(!tok) continue;
        if(!last) tok.assumed=true;
        const c=best[i].c+1,pn=best[i].p+(compose(part.map(b=>b.sym),false)===null?1:0),cu=best[j];
        if(!cu||c<cu.c||(c===cu.c&&pn<cu.p)) best[j]={c,p:pn,prev:i,tok};
      }
    }
    if(!best[n]) return null;
    const out=[];let j=n;while(j>0){out.unshift(best[j].tok);j=best[j].prev;}
    return out;
  }
  function resolve(tone,toneKey,tonePos){
    const one=single(buf,tone,toneKey,tonePos); if(one) return [one];
    return o.endTone1?split(tone,toneKey,tonePos):null;
  }
  // 跟輸入法一樣用「聲母／介音／韻母」三個位置判斷：同一個位置又出現符號，就代表開始打下一個字。
  // 回傳最後一個（正在打的）音節在 buf 裡的起點。
  function typingStart(){
    let start=0,slots=[0,0,0],last=-1;
    buf.forEach((b,i)=>{const k=slotOf(b.sym); if(slots[k]||(!o.reorder&&k<last)){start=i;slots=[0,0,0];} slots[k]=1;last=k;});
    return start;
  }
  function flush(atEnd){
    if(!buf.length) return;
    if(o.endTone1&&atEnd){
      // 句尾：最後一個還沒按聲調的音節算「正在打」，留在組字區；它前面的才拆開補一聲
      const b0=typingStart();
      if(b0>0){
        const all=buf,tail=all.slice(b0);
        buf=all.slice(0,b0);
        const r=split('','',-1);
        if(r){r.forEach(t=>t.assumed=true);toks.push(...r);toks.push({t:'pend',keys:bufKeys(tail),syms:tail.map(b=>b.sym),start:tail[0].pos});buf=[];return;}
        buf=all;
      }
    }else if(o.endTone1){const r=split('','',-1); if(r){r[r.length-1].assumed=true;toks.push(...r);buf=[];return;}}
    if(atEnd) toks.push({t:'pend',keys:bufKeys(buf),syms:buf.map(b=>b.sym),start:buf[0].pos});
    else pushRaw(bufKeys(buf));
    buf=[];
  }
  for(let i=0;i<text.length;i++){
    const ch=text[i],lc=ch.toLowerCase();
    if(L.dropSep&&!buf.length){
      const last=toks[toks.length-1];
      if(ch===' '&&last&&last.t==='syl') continue;              // 「ㄍㄢˋ ㄋㄧˇ」中間的空白只是分隔
      if(ch==='˙'&&i+1<text.length&&has(L.keys,text[i+1])){     // 「˙ㄌㄜ」：點在前面
        let j=i+1;while(j<text.length&&j-i<=3&&has(L.keys,text[j])){buf.push({ch:text[j],sym:L.keys[text[j]],pos:j});j++;}
        const r=resolve('˙','˙',i); if(r){r.forEach(t=>{t.keys='˙'+t.keys.slice(0,-1);t.start=i;});toks.push(...r);} else pushRaw(text.slice(i,j));
        buf=[];i=j-1;continue;
      }
    }
    if(buf.length&&has(L.tones,lc)){
      const r=resolve(L.tones[lc],ch,i);
      if(r) toks.push(...r); else pushRaw(bufKeys(buf)+ch);
      buf=[];
    }else if(has(L.keys,lc)) buf.push({ch,sym:L.keys[lc],pos:i});
    else{flush(false);pushRaw(ch);}
  }
  flush(true);
  return toks;
}
function choose(ids,lockArr,smart){
  const n=ids.length,best=new Array(n+1).fill(null);best[0]={seg:0,sc:0};
  for(let i=0;i<n;i++){
    if(!best[i]) continue;
    const maxL=smart?Math.min(8,n-i):1;let key='';
    for(let L=1;L<=maxL;L++){
      key+=kc(ids[i+L-1]);
      const e=PH.get(key); if(!e) continue;
      for(let k=0;k<e.b.length;k++){
        const w=e.c.substr(k*L,L);let ok=true;
        for(let j=0;j<L;j++){const lk=lockArr[i+j]; if(lk&&lk!==w[j]){ok=false;break;}}
        if(!ok) continue;
        const c={seg:best[i].seg+1,sc:best[i].sc+parseInt(e.b[k],36),prev:i,w},cu=best[i+L];
        if(!cu||c.seg<cu.seg||(c.seg===cu.seg&&c.sc>cu.sc)) best[i+L]=c;
        break;
      }
    }
  }
  if(!best[n]) return ids.map((id,i)=>({w:lockArr[i]||(singles(id,1)[0]||{ch:'?'}).ch}));
  const out=[];let i=n;while(i>0){const b=best[i];out.unshift({w:b.w});i=b.prev;}
  return out;
}

/* ---------- 解碼：字形（倉頡、無蝦米）---------- */
function segmentCodes(s,L){
  const n=s.length,best=new Array(n+1).fill(null);best[0]={seg:0};
  for(let i=0;i<n;i++){ if(!best[i]) continue;
    for(let l=1;l<=5&&i+l<=n;l++){ const c=s.substr(i,l); if(!L.codes.has(c)) continue;
      if(!best[i+l]||best[i+l].seg>best[i].seg+1) best[i+l]={seg:best[i].seg+1,prev:i,c}; } }
  if(!best[n]) return null;
  const out=[];let i=n;while(i>0){out.unshift(best[i].c);i=best[i].prev;}
  return out;
}
function tokenizeShape(text,L,o){
  const toks=[];let buf='',keys='',start=0;
  const pushRaw=s=>{if(!s)return;const t=toks[toks.length-1]; if(t&&t.t==='raw') t.s+=s; else toks.push({t:'raw',s});};
  const mk=(code,keys,sel,start)=>({t:'syl',keys,code,sel,cands:L.codes.get(code),sig:'c'+code,z:roots(L,code),start});
  function commit(term){ // term: 空白或選字鍵，'' 表示被其他字元打斷
    const sel=term===''?0:(term===' '?0:L.sel.indexOf(term.toLowerCase()));
    const c=L.codes.get(buf);
    if(c&&term!==''&&sel<c.length){toks.push(mk(buf,keys+term,sel,start));}
    else if(o.shapeSplit){
      const segs=segmentCodes(buf,L);
      if(segs){let p=start; segs.forEach((cd,j)=>{const last=j===segs.length-1; const s2=last&&term!==''&&sel<L.codes.get(cd).length?sel:0; toks.push(mk(cd,keys.substr(p-start,cd.length)+(last?term:''),s2,p)); p+=cd.length;});}
      else pushRaw(keys+term);
    }else pushRaw(keys+term);
    buf='';keys='';
  }
  for(let i=0;i<text.length;i++){
    const ch=text[i],lc=L.pseudo?ch:ch.toLowerCase();
    if(buf&&(ch===' '||(L.sel.includes(lc)&&!L.keyset.has(lc)))) commit(ch);
    else if(L.keyset.has(lc)){ if(!buf) start=i; buf+=lc; keys+=ch; }
    else{ if(buf) commit(''); pushRaw(ch); }
  }
  if(buf){ if(L.commitEnd&&L.codes.has(buf)) toks.push(mk(buf,keys,0,start)); else toks.push({t:'pend',keys,code:buf,start}); }
  return toks;
}

// L、locks 不給時用目前的輸入法與使用者鎖定的字；自動判斷輸入法時會傳別的輸入法和空的 locks 進來試翻
function decode(text,L=cur(),locks=S.locks,o=S.opts){
  const toks=L.type==='zy'?tokenizeZy(text,L,o):tokenizeShape(text,L,o);
  let idx=0;const sylToks=[];
  for(const t of toks) if(t.t==='syl'){t.idx=idx++;sylToks.push(t);}
  if(locks===S.locks) for(const k of Object.keys(S.locks)){const t=sylToks[k]; if(!t||t.sig!==S.locks[k].sig) delete S.locks[k];}
  if(L.type==='zy'){
    let run=[],g=0;
    const flushRun=()=>{
      if(!run.length) return;
      const phrases=choose(run.map(t=>t.id),run.map(t=>locks[t.idx]&&locks[t.idx].ch),o.smart);
      let p=0;
      for(const ph of phrases){for(let j=0;j<ph.w.length;j++){const t=run[p++];t.ch=ph.w[j];t.gkey=g;t.glen=ph.w.length;}g++;}
      run=[];
    };
    for(const t of toks){ if(t.t==='syl') run.push(t); else flushRun(); }
    flushRun();
  }else{
    for(const t of sylToks){
      const lk=locks[t.idx];
      t.ch=lk&&t.cands.includes(lk.ch)?lk.ch:t.cands[t.sel];
      t.gkey=t.idx;t.glen=1;
    }
  }
  return toks;
}
const plainOf=toks=>toks.map(t=>t.t==='raw'?t.s:t.t==='syl'?t.ch:'').join('');

/* ---------- 自動判斷輸入法 ---------- */
// 用每一種輸入法試翻一次，看三件事：
//  覆蓋率：鍵盤字元有多少比例真的翻成了中文字（最重要）
//  成詞率：翻出來的字，相鄰兩個字有多少比例是詞庫裡的詞
//  常用度：翻出來的字平均有多常用
// 三者加權成 0～1 的分數。
// 計算要被翻譯的字元數：空白和中文標點不算，其他都算（字根、注音符號、英文字母、數字…）
function keyishCount(text){return (text.match(/[^\s\u3000-\u303f\uff01-\uff0f\uff1a-\uff20\uff3b-\uff40\uff5b-\uff65]/g)||[]).length;}
function scoreLayout(text,key){
  if(!REV) buildRev();
  const L=LAYOUTS[key],o=Object.assign({},S.opts,{endTone1:false,shapeSplit:false});
  const toks=decode(text,L,{},o);
  const keyChars=keyishCount(text);
  if(!keyChars) return {key,score:0,n:0};
  let used=0,n=0,pairs=0,words=0,freq=0,prev=null;
  for(const t of toks){
    if(t.t!=='syl'){prev=null;continue;}
    used+=t.keys.replace(/ /g,'').length;n++;
    const rs=REV.ch.get(t.ch); freq+=rs?Math.min(1,rs[0].v/30):0;
    if(prev){pairs++; if(REV.ph.has(prev+t.ch)) words++;}
    prev=t.ch;
  }
  if(!n) return {key,score:0,n:0};
  const cov=used/keyChars,wr=pairs?words/pairs:0.5,fr=freq/n;
  return {key,score:cov*(0.55+0.3*wr+0.15*fr),n,cov,wr,fr};
}
function detectLayout(text){
  return Object.keys(LAYOUTS).map(k=>scoreLayout(text,k)).sort((a,b)=>b.score-a.score);
}

/* ---------- 產生：中文 → 各輸入法按鍵 ---------- */
let REV=null;
function buildRev(){
  REV={ch:new Map(),ph:new Map()};
  for(const [k,e] of PH){
    const L=k.length,ids=[];for(let i=0;i<L;i++) ids.push(k.charCodeAt(i)-0xE000);
    for(let j=0;j<e.b.length;j++){
      const w=e.c.substr(j*L,L),v=parseInt(e.b[j],36);
      if(L===1){let a=REV.ch.get(w); if(!a) REV.ch.set(w,a=[]); a.push({id:ids[0],v});}
      else{const c=REV.ph.get(w); if(!c||c.v<v) REV.ph.set(w,{ids,v});}
    }
  }
  for(const a of REV.ch.values()) a.sort((x,y)=>y.v-x.v);
}
function generate(text,locks){ // 注音讀音（依詞組判斷破音字）
  if(!REV) buildRev();
  locks=locks||{};
  const items=[];let i=0;
  while(i<text.length){
    if(!REV.ch.has(text[i])){const t=items[items.length-1]; if(t&&t.t==='raw') t.s+=text[i]; else items.push({t:'raw',s:text[i]}); i++; continue;}
    let j=i;while(j<text.length&&REV.ch.has(text[j])) j++;
    const run=text.slice(i,j),n=run.length,best=new Array(n+1).fill(null);best[0]={seg:0,sc:0};
    for(let a=0;a<n;a++){
      if(!best[a]) continue;
      for(let L=1;L<=Math.min(8,n-a);L++){
        let ids,v;
        if(L===1){const rs=REV.ch.get(run[a]),lk=locks[i+a]; const r=(lk!==undefined&&rs.find(x=>x.id===lk))||rs[0]; ids=[r.id]; v=r.v;}
        else{
          const p=REV.ph.get(run.substr(a,L)); if(!p) continue;
          let ok=true;for(let q=0;q<L;q++){const lk=locks[i+a+q]; if(lk!==undefined&&lk!==p.ids[q]){ok=false;break;}}
          if(!ok) continue; ids=p.ids; v=p.v;
        }
        const c={seg:best[a].seg+1,sc:best[a].sc+v,prev:a,ids,L},cu=best[a+L];
        if(!cu||c.seg<cu.seg||(c.seg===cu.seg&&c.sc>cu.sc)) best[a+L]=c;
      }
    }
    const segs=[];let b=n;while(b>0){segs.unshift(best[b]);b=best[b].prev;}
    let pos=0;
    for(const s of segs) for(let q=0;q<s.L;q++){items.push({t:'ch',ch:run[pos],id:s.ids[q],pos:i+pos});pos++;}
    i=j;
  }
  return items;
}
function shapeItems(text,L,codeLocks){ // 每個字取最少按鍵的字碼
  codeLocks=codeLocks||{};
  const items=[];
  for(let i=0;i<text.length;){
    const cp=text.codePointAt(i),ch=String.fromCodePoint(cp),w=ch.length;
    const rs=L.rev.get(ch);
    if(rs){const lk=codeLocks[i]; const e=(lk&&rs.find(x=>x.code===lk))||rs[0]; items.push({t:'ch',ch,pos:i,e,alts:rs});}
    else{const t=items[items.length-1]; if(t&&t.t==='raw') t.s+=ch; else items.push({t:'raw',s:ch});}
    i+=w;
  }
  return items;
}
function encodeText(text,L,zyLocks,codeLocks){
  if(L.type==='zy') return generate(text,zyLocks).map(it=>it.t==='raw'?it.s:readingToKeys(SYL[it.id],L)).join('');
  return shapeItems(text,L,codeLocks).map(it=>it.t==='raw'?it.s:shapeEnc(L,it.e)).join('');
}

/* ---------- 畫面：解碼 ---------- */
const $=id=>document.getElementById(id);
const src=$('src'),out=$('out'),chips=$('chips'),predPanel=$('predPanel'),candPanel=$('candPanel');
let TOKS=[],PRED=null;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const keysHTML=k=>esc(k).replace(/ /g,'␣');
const rawHTML=s=>esc(s).replace(/ /g,'<span class="spc"></span>').replace(/\n/g,'↵');

function runDecode(){
  TOKS=decode(src.value);
  const L=cur();
  const symOut=S.target==='sym';let txt='',prevSyl=false;
  for(const t of TOKS){
    if(t.t==='raw'){txt+=t.s;prevSyl=false;}
    // 被「沒打聲調時當一聲」補上一聲的字，在注音結果多加 ˉ，看得出有補
    else if(t.t==='syl'){txt+=symOut?(prevSyl?' ':'')+t.z+(t.assumed?'ˉ':''):t.ch;prevSyl=true;}
    else txt+=symOut?(prevSyl?' ':'')+(L.type==='zy'?t.syms.join(''):roots(L,t.code)):t.keys;
  }
  out.classList.toggle('sym',symOut&&!!src.value);
  const sylToks=TOKS.filter(t=>t.t==='syl'),pend=TOKS.find(t=>t.t==='pend');
  // 抖動規則：正在打的字留在組字區（虛線、還不算字），所以組字區裡「辨識出來的字」變多，
  // 就代表剛辨識出一個新字（不論對錯）→ 所有紅框（補一聲）的字抖一次。
  // 只是點字、開候選字這類重畫，或刪字讓字變少，都不抖。
  const recognized=sylToks.length>S.lastDoneCount;
  S.lastDoneCount=sylToks.length;
  const shakeSet=recognized&&L.type==='zy'?new Set(sylToks.filter(t=>t.assumed)):null;
  if(!src.value) out.innerHTML='<span class="muted">翻譯結果會出現在這裡</span>'; else out.textContent=txt;
  out.dataset.text=txt;
  renderAlts();
  $('stat').textContent=sylToks.length?`${sylToks.length} 個字`+(pend?' · 1 個組字中':''):'';
  let html='',open=null;
  const closeP=()=>{if(open!==null){html+='</span>';open=null;}};
  for(const t of TOKS){
    if(t.t==='syl'){
      if(open!==t.gkey){closeP();html+=`<span class="phrase${t.glen>1?' multi':''}">`;open=t.gkey;}
      const changed=S.prev[t.idx]!==undefined&&S.prev[t.idx]!==t.ch;
      html+=`<button type="button" class="chip${S.locks[t.idx]?' locked':''}${changed?' changed':''}${t.assumed?' assumed':''}${shakeSet&&shakeSet.has(t)&&!S.locks[t.idx]?' shake':''}" data-idx="${t.idx}" aria-pressed="${S.sel===t.idx}"${t.assumed?' title="沒打聲調，當成一聲"':''}><span class="k">${keysHTML(t.keys)}</span><span class="z">${esc(t.z)}</span><span class="h">${esc(t.ch)}</span></button>`;
    }else{
      closeP();
      if(t.t==='raw') html+=`<span class="rawtok">${rawHTML(t.s)}</span>`;
      else html+=`<span class="chip pend"><span class="k">${keysHTML(t.keys)}</span><span class="z">${esc(L.type==='zy'?t.syms.join(''):roots(L,t.code))}</span><span class="h"><span class="caret"></span></span></span>`;
    }
  }
  closeP();
  chips.innerHTML=html||`<span class="empty">在上面輸入${esc(L.textName)}，這裡會拆成一個個字。</span>`;
  S.prev=sylToks.map(t=>t.ch);
  if(S.sel!==null&&!sylToks[S.sel]) S.sel=null;
  renderPred(pend,sylToks.length);
  renderToneHint(L);
  renderCands(sylToks);
  let hk='';
  if(S.sel!==null) hk=sylToks[S.sel].keys; else if(pend) hk=pend.keys; else if(sylToks.length) hk=sylToks[sylToks.length-1].keys;
  highlightKeys(hk);
}

// 確定是「漏打聲調」的補一聲字：後面緊接著一個真的按了聲調鍵（不是空白）的字，或接著中文、全形標點。
// 這樣正在打、還沒按聲調的最後一個字不算，hello world 這類英文也不算。提示和抖動都用這個判斷。
function missedTones(toks,L){
  const realTone=t=>t&&t.t==='syl'&&!t.assumed&&/[^ ]$/.test(t.keys)&&has(L.tones,t.keys.slice(-1).toLowerCase());
  const cjkNext=t=>t&&t.t==='raw'&&/^[\u3000-\u9fff\uff00-\uffef]/.test(t.s);
  return toks.filter((t,i)=>{ if(!t.assumed) return false; let j=i+1; while(toks[j]&&toks[j].assumed) j++; return realTone(toks[j])||cjkNext(toks[j]); });
}
// 「沒打聲調時當一聲」沒開，但內容看起來像漏打聲調時，主動提示
function renderToneHint(L){
  const box=$('toneHint');
  if(L.type!=='zy'||S.opts.endTone1||!TOKS.some(t=>t.t==='raw')){box.hidden=true;return;}
  const alt=tokenizeZy(src.value,L,Object.assign({},S.opts,{endTone1:true}));
  const miss=missedTones(alt,L);
  if(!miss.length){box.hidden=true;return;}
  box.hidden=false;
  box.innerHTML=`<div class="panel-h">有 ${miss.length} 個地方像是漏打聲調（例如 <strong>${esc(miss[0].keys)}</strong>，可能是 ${esc(miss[0].reading)}ˉ）。<button type="button" class="btn" id="hintOn">當成一聲來翻</button></div>`;
}
$('toneHint').addEventListener('click',e=>{
  if(e.target.id!=='hintOn') return;
  const cb=$('optEnd'); cb.checked=true; cb.dispatchEvent(new Event('change'));
});
// 使用人數排序（平手時的優先順序）：大千 > 倚天 > 倉頡 > 無蝦米 > 直接貼的注音符號／字根
const POPULAR=['daqian','eten','cangjie','boshiamy','zysym','cjroot','bsroot'];
// 「也可能是」：太短、好幾種輸入法都翻得通時，主結果下面一行小字列出其他可能，點了就換過去
const alts=$('alts');
function renderAlts(){
  const list=S.auto&&S.mode==='dec'&&S.cands&&S.candsFor===src.value?S.cands.filter(c=>c.key!==S.layout):[];
  alts.hidden=!list.length;
  if(!list.length) return;
  const nm=k=>esc(LAYOUTS[k].pseudo?LAYOUTS[k].textName:LAYOUTS[k].name);
  alts.innerHTML='也可能是：'+list.map((c,i)=>`${i?'<span class="dot">・</span>':''}<button type="button" data-k="${c.key}">${nm(c.key)}「<b>${esc(c.text)}</b>」</button>`).join('');
}
alts.addEventListener('click',e=>{
  const b=e.target.closest('button[data-k]'); if(!b) return;
  S.pin=b.dataset.k;   // 記住你選的，繼續打字也以它為主
  setLayout(b.dataset.k,false);setLangs();runDecode();
});
function predictZy(syms){
  for(let len=Math.min(3,syms.length);len>=1;len--){
    const tail=syms.slice(syms.length-len),canon=compose(tail,S.opts.reorder); if(canon===null) continue;
    const need=[...canon],res=[];
    SYLINFO.forEach((si,id)=>{ if(!need.every(s=>si.slots[slotOf(s)]===s)) return; const exact=si.base===canon; res.push({id,exact,score:(exact?100:0)+si.top}); });
    if(!res.length) continue;
    res.sort((a,b)=>b.score-a.score);
    const items=[],L=cur(),keep=syms.length-len;
    for(const r of res){ for(const c of singles(r.id,r.exact?3:1)) items.push({ch:c.ch,hint:showReading(SYL[r.id]),keys:readingToKeys(SYL[r.id],L),lock:{sig:'z'+r.id,ch:c.ch}}); if(items.length>=18) break; }
    return {label:canon,keep,items:items.slice(0,18),note:'還沒打聲調'};
  }
  return null;
}
function predictShape(code,L){
  const items=[],seen=new Set();
  const add=(cd,i)=>{const ch=L.codes.get(cd)[i]; if(seen.has(ch)) return; seen.add(ch); items.push({ch,hint:cd,keys:cd+shapeTerm(L,i),lock:{sig:'c'+cd,ch}});};
  const ex=L.codes.get(code); if(ex) ex.slice(0,Math.min(ex.length,L.sel.length,8)).forEach((_,i)=>add(code,i));
  const more=[];
  for(const [cd,cs] of L.codes){ if(cd.length>code.length&&cd.startsWith(code)) more.push(cd); if(more.length>400) break; }
  more.sort((a,b)=>a.length-b.length);
  for(const cd of more){ if(items.length>=18) break; add(cd,0); }
  if(!items.length) return null;
  return {label:code,keep:0,items,note:ex?'還沒按空白送出':'字碼還沒打完'};
}
function renderPred(pend,sylCount){
  PRED=null;
  if(!pend){predPanel.hidden=true;return;}
  const L=cur();
  const p=L.type==='zy'?predictZy(pend.syms):predictShape(pend.code,L);
  predPanel.hidden=false;
  if(!p){predPanel.innerHTML=`<div class="panel-h">組字中 <strong>${esc(pend.keys)}</strong>：拼不出${L.type==='zy'?'注音':'字碼'}，會原樣保留。</div>`;return;}
  PRED={p,pend,idx:sylCount};
  predPanel.innerHTML=`<div class="panel-h">組字中 <strong>${esc(p.label)}</strong>，${p.note}。可能是：</div><div class="cands">`+
    p.items.map((it,n)=>`<button type="button" class="cand" data-n="${n}">${esc(it.ch)}<small>${esc(it.hint)}</small></button>`).join('')+'</div>';
}
predPanel.addEventListener('click',e=>{
  const b=e.target.closest('.cand'); if(!b||!PRED) return;
  const it=PRED.p.items[+b.dataset.n];
  demo.src=false;   // 用預測補完過，內容已經是自己的
  src.value=src.value.slice(0,PRED.pend.start)+PRED.pend.keys.slice(0,PRED.p.keep)+it.keys;
  S.locks[PRED.idx]=it.lock;
  runDecode();src.focus();
});
function candList(t){ return cur().type==='zy'?singles(t.id,80).map(c=>c.ch):t.cands; }
function renderCands(sylToks){
  if(S.sel===null){candPanel.hidden=true;return;}
  const t=sylToks[S.sel],L=cur();
  const what=L.type==='zy'?`<strong>${esc(t.z)}</strong>`:`字碼 <strong>${esc(t.code)}</strong>（${esc(t.z)}）`;
  candPanel.hidden=false;
  candPanel.innerHTML=`<div class="panel-h">第 ${S.sel+1} 個字 ${what} 的候選字${S.locks[S.sel]?'（已鎖定）':''}：</div><div class="cands">`+
    candList(t).map(c=>`<button type="button" class="cand" data-ch="${esc(c)}" aria-current="${c===t.ch}">${esc(c)}</button>`).join('')+
    `</div><div><button type="button" class="btn" id="unlock">${S.locks[S.sel]?'取消鎖定':'關閉'}</button></div>`;
}
chips.addEventListener('click',e=>{const b=e.target.closest('.chip[data-idx]'); if(!b) return; const i=+b.dataset.idx; S.sel=S.sel===i?null:i; runDecode();});
candPanel.addEventListener('click',e=>{
  if(e.target.id==='unlock'){ if(S.locks[S.sel]) delete S.locks[S.sel]; else S.sel=null; runDecode(); return; }
  const b=e.target.closest('.cand'); if(!b) return;
  const t=TOKS.filter(x=>x.t==='syl')[S.sel];
  S.locks[S.sel]={sig:t.sig,ch:b.dataset.ch}; runDecode();
});

/* ---------- 畫面：產生 ---------- */
const gsrc=$('gsrc'),gout=$('gout'),gchips=$('gchips'),gCandPanel=$('gCandPanel');
let GCODES={},GITEMS=[];
const spHTML=s=>esc(s).replace(/ /g,'<span class="sp"> </span>');
function runGen(){
  const text=gsrc.value,L=cur();
  const zyItems=generate(text,S.glocks);
  // 只產生右上選單選的那一種輸入法（按鍵），以及它的「注音」或「字根」
  GCODES={};
  GCODES[S.layout]=L.type==='zy'?zyItems.map(it=>it.t==='raw'?it.s:readingToKeys(SYL[it.id],L)).join(''):encodeText(text,L,null,S.gcodes);
  if(L.type==='shape'){let r='',ps=false;for(const it of shapeItems(text,L,S.gcodes)){ if(it.t==='raw'){r+=it.s;ps=false;} else {r+=(ps?' ':'')+roots(L,it.e.code);ps=true;} } GCODES.sym=r;}
  else GCODES.sym=zyItems.map(it=>it.t==='raw'?it.s:showReading(SYL[it.id])+' ').join('').trim();
  const symOut=S.target==='sym',val=symOut?GCODES.sym:GCODES[S.layout];   // 跟另一個方向共用同一個選擇
  gout.classList.toggle('sym',symOut&&!!text);
  if(!text) gout.innerHTML='<span class="muted">結果會出現在這裡</span>';
  else gout.innerHTML=symOut?esc(val):spHTML(val);   // 按鍵模式把空白（一聲／送出）標成灰底，看得出來
  gout.dataset.text=val;
  let html='',n=0,selIt=null;
  if(L.type==='zy'){
    GITEMS=zyItems;
    for(const it of zyItems){
      if(it.t==='raw'){html+=`<span class="rawtok">${rawHTML(it.s)}</span>`;continue;}
      n++; if(it.pos===S.gsel) selIt=it;
      const multi=REV.ch.get(it.ch).length>1;
      html+=`<button type="button" class="chip${S.glocks[it.pos]!==undefined?' locked':''}" data-pos="${it.pos}" aria-pressed="${S.gsel===it.pos}"><span class="k">${keysHTML(readingToKeys(SYL[it.id],L))}</span><span class="z">${esc(showReading(SYL[it.id]))}${multi?' *':''}</span><span class="h">${esc(it.ch)}</span></button>`;
    }
  }else{
    GITEMS=shapeItems(text,L,S.gcodes);
    for(const it of GITEMS){
      if(it.t==='raw'){html+=`<span class="rawtok">${rawHTML(it.s)}</span>`;continue;}
      n++; if(it.pos===S.gsel) selIt=it;
      html+=`<button type="button" class="chip${S.gcodes[it.pos]?' locked':''}" data-pos="${it.pos}" aria-pressed="${S.gsel===it.pos}"><span class="k">${keysHTML(shapeEnc(L,it.e))}</span><span class="z">${esc(roots(L,it.e.code))}${it.alts.length>1?' *':''}</span><span class="h">${esc(it.ch)}</span></button>`;
    }
  }
  gchips.innerHTML=html||`<span class="empty">在上面輸入中文，這裡會列出每個字的${L.type==='zy'?'讀音':'字碼'}與按鍵。</span>`;
  $('gstat').textContent=n?`${n} 個字 · `+(L.type==='zy'?'一聲以空白鍵表示':'空白鍵送出第一個字、數字鍵選第 N 個'):'';
  if(!selIt){S.gsel=null;gCandPanel.hidden=true;}
  else if(L.type==='zy'){
    const rs=REV.ch.get(selIt.ch);
    gCandPanel.hidden=false;
    gCandPanel.innerHTML=`<div class="panel-h">「${esc(selIt.ch)}」的讀音：</div><div class="cands">`+rs.map(r=>`<button type="button" class="cand" data-rid="${r.id}" aria-current="${r.id===selIt.id}">${esc(showReading(SYL[r.id]))}</button>`).join('')+
      `</div><div><button type="button" class="btn" id="gunlock">${S.glocks[selIt.pos]!==undefined?'取消鎖定':'關閉'}</button></div>`;
  }else{
    gCandPanel.hidden=false;
    gCandPanel.innerHTML=`<div class="panel-h">「${esc(selIt.ch)}」的字碼：</div><div class="cands">`+selIt.alts.map(a=>`<button type="button" class="cand" data-code="${esc(a.code)}" aria-current="${a.code===selIt.e.code}">${keysHTML(shapeEnc(L,a))}<small>${esc(roots(L,a.code))}</small></button>`).join('')+
      `</div><div><button type="button" class="btn" id="gunlock">${S.gcodes[selIt.pos]?'取消鎖定':'關閉'}</button></div>`;
  }
  const last=GITEMS.filter(x=>x.t==='ch').pop(),hl=selIt||last;
  highlightKeys(hl?(L.type==='zy'?readingToKeys(SYL[hl.id],L):shapeEnc(L,hl.e)):'');
}
gchips.addEventListener('click',e=>{const b=e.target.closest('.chip[data-pos]'); if(!b) return; const p=+b.dataset.pos; S.gsel=S.gsel===p?null:p; runGen();});
gCandPanel.addEventListener('click',e=>{
  const zy=cur().type==='zy';
  if(e.target.id==='gunlock'){ const m=zy?S.glocks:S.gcodes; if(m[S.gsel]!==undefined) delete m[S.gsel]; else S.gsel=null; runGen(); return; }
  const b=e.target.closest('.cand'); if(!b) return;
  if(zy) S.glocks[S.gsel]=+b.dataset.rid; else S.gcodes[S.gsel]=b.dataset.code;
  runGen();
});
$('copyG').addEventListener('click',()=>copy(gout.dataset.text||''));
// 「按鍵」＝第一個位置（對應另一邊的「中文」），「注音／字根」＝第二個位置；⇄ 前後停在同一個位置
$('gtargets').addEventListener('click',e=>{const b=e.target.closest('[data-gtarget]'); if(!b) return; S.target=b.dataset.gtarget==='sym'?'sym':'zh'; save(); setLangs(); runGen();});

/* ---------- 鍵盤圖 ---------- */
const kb=$('kb');
function renderKB(){
  const L=LAYOUTS[cur().base||S.layout];
  $('kbTitle').textContent=L.name+'鍵盤對照';
  $('lg1').textContent=L.type==='zy'?'注音符號':'字根';
  $('lg2').textContent=L.type==='zy'?'聲調':'選字鍵';
  kb.innerHTML=KB_ROWS.map(row=>'<div class="kb-row">'+row.map(k=>{
    if(k===' ') return `<span class="key space tone" data-k=" "><b>space</b><i>${L.type==='zy'?'一聲（空白鍵）':'送出第一個字'}</i></span>`;
    let cls='key',leg='';
    if(L.type==='zy'){ if(has(L.keys,k)) leg=L.keys[k]; else if(has(L.tones,k)){cls+=' tone';leg=L.tones[k];} else cls+=' dead'; }
    else{ if(L.keyset.has(k)) leg=L.kn[k]||k.toUpperCase(); else if(L.sel.includes(k)){cls+=' tone sel';leg='選'+(L.sel.indexOf(k)+1);} else cls+=' dead'; }
    return `<span class="${cls}" data-k="${esc(k)}"><b>${esc(k.toUpperCase())}</b><i>${esc(leg)}</i></span>`;
  }).join('')+'</div>').join('');
}
function highlightKeys(keys){
  if(cur().toPhys) keys=cur().toPhys(keys||'');
  const set=new Set([...(keys||'').toLowerCase()]);
  kb.querySelectorAll('.key').forEach(el=>el.classList.toggle('on',set.has(el.dataset.k)));
}

/* ---------- 輸入法下拉選單 ---------- */
const ime=$('ime'),imeBtn=$('imeBtn'),imeMenu=$('imeMenu'),imeHl=imeMenu.querySelector('.ime-hl');
const imeOpts=[...imeMenu.querySelectorAll('button[data-layout]')];
function moveHl(b){ if(!b) return; imeHl.style.top=b.offsetTop+'px'; imeHl.style.height=b.offsetHeight+'px'; }
function openIme(open){
  ime.classList.toggle('open',open); imeBtn.setAttribute('aria-expanded',String(open));
  // 打開時停在目前選的那一項（自動偵測開著就停在「自動偵測」）
  if(open){ const want=S.auto&&S.mode==='dec'?'auto':S.layout; const b=imeOpts.find(x=>x.dataset.layout===want); moveHl(b); b.focus({preventScroll:true}); }
}
imeBtn.addEventListener('click',()=>openIme(!ime.classList.contains('open')));
imeMenu.addEventListener('mouseover',e=>moveHl(e.target.closest('button[data-layout]')));
imeMenu.addEventListener('focusin',e=>moveHl(e.target.closest('button[data-layout]')));
imeMenu.addEventListener('click',e=>{
  const b=e.target.closest('button[data-layout]'); if(!b) return;
  if(b.dataset.layout==='auto'){ S.auto=true; S.pin=null; save(); autoDetect(); }   // 重新自動偵測時，忘掉之前點選的「也可能是」
  else if(S.mode==='gen'){ S.genPick=b.dataset.layout; setLayout(b.dataset.layout); setLangs(); }
  else{ clearTimeout(detectTimer); S.auto=false; S.detect='idle'; save(); setLayout(b.dataset.layout); setLangs(); markSrcBox(); }   // 取消排隊中的偵測，免得剛選的被「左邊是空的 → 回自動偵測」蓋掉
  openIme(false); imeBtn.focus();
});
imeMenu.addEventListener('keydown',e=>{
  const vis=imeOpts.filter(b=>!b.hidden),i=vis.indexOf(document.activeElement); // 跳過隱藏的「自動偵測」（產生器模式）
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault(); vis[(i+(e.key==='ArrowDown'?1:-1)+vis.length)%vis.length].focus();}
  else if(e.key==='Escape'||e.key==='Tab'){openIme(false); if(e.key==='Escape') imeBtn.focus();}
});
imeBtn.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();openIme(true);}});
document.addEventListener('click',e=>{ if(!ime.contains(e.target)) openIme(false); });

const targets=$('targets');
targets.addEventListener('click',e=>{const b=e.target.closest('[data-target]'); if(!b) return; S.target=b.dataset.target; save(); setLangs(); runDecode();});
function setLangs(){
  const L=cur();
  const name=L.pseudo?esc(L.textName):L.type==='zy'?`注音文<small>${L.name}</small>`:esc(L.textName);
  const autoOn=S.auto&&S.mode==='dec';
  // 像 Google 翻譯的「偵測語言」：自動偵測時，標籤顯示偵測狀態
  $('imeLbl').innerHTML=!autoOn?name
    :S.detect==='ok'?`<small class="det">偵測到·</small>${name}`
    :S.detect==='fail'?`<span class="bad">無法辨識</span>`
    :S.detect==='detecting'?'偵測中…':'自動偵測';
  imeOpts.forEach(b=>b.setAttribute('aria-selected',String(b.dataset.layout==='auto'?autoOn:(!autoOn&&b.dataset.layout===S.layout))));
  $('optAutoIme').hidden=S.mode!=='dec';
  imeMenu.querySelectorAll('[data-pseudo]').forEach(el=>el.hidden=S.mode!=='dec');   // 符號類只用在「→ 中文」
  $('tgtSym').textContent=L.type==='zy'?'注音':'字根';
  targets.querySelectorAll('[data-target]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.target===S.target)));
  // 像 Google 翻譯一樣：交換方向時，輸入法選單跟著換到另一側
  const gt=$('gtargets');
  $('gtgtSym').textContent=L.type==='zy'?'注音':'字根';
  gt.querySelectorAll('[data-gtarget]').forEach(b=>b.setAttribute('aria-selected',String((b.dataset.gtarget==='sym')===(S.target==='sym'))));
  if(S.mode==='dec'){ $('langL').appendChild(ime); ime.classList.remove('at-right'); targets.hidden=false; gt.hidden=true; $('zhStatic').hidden=true; $('langR').prepend(targets); }
  else{ $('langR').appendChild(ime); $('langR').appendChild(gt); ime.classList.add('at-right'); targets.hidden=true; gt.hidden=false; $('zhStatic').hidden=false; $('langL').appendChild($('zhStatic')); }
  const gv=gsrc.value;
  $('zhStatic').innerHTML=!S.auto?'中文':!gv.trim()?'自動偵測':isChinese(gv)?'<small class="det">偵測到·</small>中文':'偵測中…';
  src.setAttribute('aria-label',L.textName);
  $('compLbl').textContent=L.type==='zy'?'組字區 · 按鍵 / 注音 / 選字':'組字區 · 按鍵 / 字根 / 選字';
  $('gcompLbl').textContent=L.type==='zy'?'逐字對照 · 點字可換讀音':'逐字對照 · 點字可換字碼';
  document.querySelectorAll('[data-for]').forEach(el=>el.hidden=el.dataset.for!==L.type);
}
// convert=false：只切換輸入法、不改寫左邊的內容（自動判斷時用，因為內容本來就是用新輸入法打的）
function setLayout(k,convert=true){
  if(k===S.layout) return;
  const old=cur(),nw=LAYOUTS[k];
  if(convert&&src.value){
    const toks=decode(src.value);
    if(old.type==='zy'&&nw.type==='zy') src.value=toks.map(t=>t.t==='raw'?t.s:t.t==='syl'?readingToKeys(t.reading,nw):t.syms.map(s=>nw.inv[s]||s).join('')).join('');
    else src.value=encodeText(toks.map(t=>t.t==='raw'?t.s:t.t==='syl'?t.ch:'').join(''),nw);
  }
  S.layout=k;S.locks={};S.sel=null;S.prev=[];S.gcodes={};S.gsel=null;save();
  renderKB();setLangs();
  if(S.mode==='dec') runDecode(); else runGen();
}
function setMode(m){
  if(m==='gen'&&cur().pseudo){S.layout=cur().base;S.locks={};S.sel=null;renderKB();}
  S.mode=m;setLangs();
  $('panDec').hidden=m!=='dec';$('panGen').hidden=m!=='gen';
  $('panDec').style.display=m==='dec'?'flex':'';$('panGen').style.display=m==='gen'?'flex':'';
  if(m==='dec') runDecode(); else runGen();
  markSrcBox();
}
$('swap').addEventListener('click',()=>{
  demo.src=demo.g=false;   // 按過 ⇄ 之後兩邊都是使用者自己的內容，不再自動清空
  $('swap').classList.toggle('spin');
  if(S.mode==='dec'){ gsrc.value=plainOf(TOKS); S.glocks={};S.gcodes={};S.gsel=null; setMode('gen'); gsrc.focus(); }
  else{ src.value=GCODES[S.layout]||''; S.locks={};S.sel=null;S.prev=[]; setMode('dec'); scheduleDetect(); src.focus(); }
});

/* ---------- 其他 ---------- */
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),1400);}
function copy(text){try{navigator.clipboard.writeText(text).then(()=>toast('已複製'),()=>fallback(text));}catch(e){fallback(text);}}
function fallback(text){const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy');}catch(e){} ta.remove(); toast(ok?'已複製':'請手動選取複製');}
$('copyOut').addEventListener('click',()=>copy(out.dataset.text||''));
$('clearSrc').addEventListener('click',()=>{src.value='';S.pin=null;scheduleDetect();S.locks={};S.sel=null;S.prev=[];runDecode();src.focus();});
$('clearG').addEventListener('click',()=>{gsrc.value='';S.glocks={};S.gcodes={};S.gsel=null;runGen();scheduleDetect();gsrc.focus();});
src.addEventListener('input',()=>{runDecode();scheduleDetect();});
let detectTimer=0;
function scheduleDetect(){clearTimeout(detectTimer);detectTimer=setTimeout(autoDetect,350);}
// 中文判斷：有中文字，而且中文字數不少於鍵盤字元數（「我說e04」這種夾雜的不算）
function isChinese(text){
  const cjk=(text.match(/[\u3400-\u9fff\uf900-\ufaff]/g)||[]).length,keys=(text.match(/[!-~]/g)||[]).length;
  return cjk>=1&&cjk>=keys;
}
// 自動偵測到中文 → 兩邊對調，改成「中文 → 注音文」，預設轉成大千（在那邊選過輸入法就用選的）
function toGen(text){
  demo.src=demo.g=false;
  gsrc.value=text; src.value='';
  S.locks={};S.sel=null;S.prev=[];S.glocks={};S.gcodes={};S.gsel=null;S.detect='idle';
  setMode('gen'); setLayout(S.genPick||'daqian',false); setLangs();
  gsrc.focus(); gsrc.setSelectionRange(text.length,text.length);
}
// 在「中文 → 注音文」那邊貼上注音文、倉頡碼等 → 對調回「注音文 → 中文」
function toDec(text,key){
  demo.src=demo.g=false;
  src.value=text; gsrc.value='';
  S.locks={};S.sel=null;S.prev=[];S.glocks={};S.gcodes={};S.gsel=null;S.detect='ok';
  setMode('dec'); setLayout(key,false); setLangs(); markSrcBox();
  src.focus(); src.setSelectionRange(text.length,text.length);
  autoDetect();   // 在這一邊重新偵測一次：太短時才會補上「也可能是」
}
// 自動偵測（選單選「自動偵測」時才會跑；左邊清空時會自動打開）：
//  空白 → 「自動偵測」
//  是中文（而且不像字根）→ 對調成「中文 → 注音文」
//  有輸入法分數 ≥ 0.6 而且辨識出 ≥ 2 個字 → 「偵測到」，切過去（目前的輸入法分數差不到 0.15 就不換，避免跳來跳去）
//  太短但有輸入法整段翻得通 → 照使用人數挑主結果，其他放「也可能是」
//  還太短、什麼都翻不通（鍵盤字元少於 6 個）→ 「偵測中…」
//  其他 → 「無法辨識」，輸入框變紅框並晃一下
//  在「中文 → 注音文」那邊：貼上的不是中文、而是某種輸入法 → 對調回來
function autoDetect(){
  // 左邊（目前輸入的那一格）清空了 → 回到自動偵測（反正中文、各輸入法、符號都偵測得到）
  if(!(S.mode==='gen'?gsrc:src).value.trim()&&!S.auto){S.auto=true;S.pin=null;S.detect='idle';save();}
  if(!S.auto){markSrcBox();return;}
  if(S.mode==='gen'){
    // 中文那邊貼上的若其實是注音文／注音符號／字根，就對調回去（字根是國字，所以不能先用「是不是中文」擋掉）
    const t=gsrc.value;
    if(t.trim()){
      const ranks=detectLayout(t),best=ranks[0];
      if(best.n>=2&&best.score>=0.6){toDec(t,best.key);return;}
      // 太短（像 e04 只有一個字）但不是中文、而且有輸入法整段都翻得通 → 一樣對調回去，照使用人數挑
      if(!isChinese(t)&&/[^\d\s]/.test(t)){   // 純數字（像 104）在中文那格就是數字，不對調
        const c=ranks.filter(r=>r.n>=1&&r.cov>=0.99).sort((a,b)=>POPULAR.indexOf(a.key)-POPULAR.indexOf(b.key));
        if(c.length){toDec(t,c[0].key);return;}
      }
    }
    setLangs();return;
  }
  const text=src.value;
  if(!text.trim()) S.detect='idle';
  else{
    const ranks=detectLayout(text),best=ranks[0],now=ranks.find(r=>r.key===S.layout);
    const good=r=>r.n>=2&&r.score>=0.6;
    // 每個字元都翻得出來的輸入法；看起來是中文時，只留「字根」而且平均每個字用到 2.5 個以上字根的
    // （十十人一十＝1 個字 5 個字根 → 字根；「大人」「人口」＝2 個字根 → 當成一般中文）
    const zh=isChinese(text);
    const full=ranks.filter(r=>r.n>=1&&r.cov>=0.99&&(!zh||(LAYOUTS[r.key].pseudo&&LAYOUTS[r.key].type==='shape'&&keyishCount(text)/r.n>=2.5)));
    if(zh&&!good(best)&&!full.length){toGen(text);return;}   // 不是字根 → 真的是中文 → 對調
    S.cands=null;
    if(good(best)){
      S.detect='ok';
      const target=good(now)&&now.score>=best.score-0.15?S.layout:best.key;
      if(target!==S.layout){
        setLayout(target,false);
        imeBtn.classList.remove('pulse');void imeBtn.offsetWidth;imeBtn.classList.add('pulse');
      }
    }else{
      // 太短（不到 2 個字）沒辦法靠上下文判斷：把「每個字元都翻得出來」的輸入法都找出來
      const o=Object.assign({},S.opts,{endTone1:false,shapeSplit:false});
      const cands=full.map(r=>({key:r.key,text:plainOf(decode(text,LAYOUTS[r.key],{},o)).trim()}));
      if(best.n<2&&cands.length){
        // 太短、沒有上下文：照使用人數挑一個當主結果（你點過「也可能是」的就以你點的為主），其他放到下方「也可能是」
        cands.sort((a,b)=>POPULAR.indexOf(a.key)-POPULAR.indexOf(b.key));
        const primary=(S.pin&&cands.find(c=>c.key===S.pin))||cands[0];
        S.detect='ok';S.cands=cands;S.candsFor=text;
        if(primary.key!==S.layout) setLayout(primary.key,false);
      }else if(best.n<2&&keyishCount(text)<6) S.detect='detecting';
      else S.detect='fail';
    }
  }
  if(!text.trim()){S.cands=null;S.pin=null;}
  setLangs();markSrcBox(true);renderAlts();
}
// 無法辨識：輸入框紅框；shake=true 時順便晃一下
function markSrcBox(shake){
  const box=src.closest('.box'),bad=S.auto&&S.mode==='dec'&&S.detect==='fail';
  box.classList.toggle('bad',bad);
  box.classList.remove('shake');
  if(bad&&shake){void box.offsetWidth;box.classList.add('shake');}
}
gsrc.addEventListener('input',()=>{S.glocks={};S.gcodes={};S.gsel=null;runGen();scheduleDetect();});
const optMap={optReorder:'reorder',optSmart:'smart',optDigits:'numUnit',optEnd:'endTone1',optSplit:'shapeSplit'};
for(const [id,key] of Object.entries(optMap)){const el=$(id); el.checked=!!S.opts[key]; el.addEventListener('change',()=>{S.opts[key]=el.checked;save();runDecode();});}

/* ---------- 開場範例 ---------- */
const SAMPLE_ZH='幹我又忘記切換輸入法了';
gsrc.value=SAMPLE_ZH;
(function(){
  const L=cur();
  if(L.type==='zy'){ // 故意把「我」打成ㄛㄨˇ，示範自動校正順序
    src.value=generate(SAMPLE_ZH).map(it=>it.ch==='我'?L.inv['ㄛ']+L.inv['ㄨ']+L.tinv['ˇ']:readingToKeys(SYL[it.id],L)).join('');
  }else src.value=encodeText(SAMPLE_ZH,L);
})();
renderKB();
setMode(location.hash==='#gen'?'gen':'dec');
autoDetect();
// 開場範例只是展示用：第一次點進輸入框時，內容還是範例就自動清空（判斷方式見上面 demo 的說明）
src.addEventListener('focus',()=>{ if(demo.src){demo.src=false; $('clearSrc').click();} });
gsrc.addEventListener('focus',()=>{ if(demo.g){demo.g=false; $('clearG').click();} });
src.addEventListener('input',()=>{demo.src=false;});
gsrc.addEventListener('input',()=>{demo.g=false;});
// 自動化測試（tests/regression.js）用的入口，頁面本身不會用到；拿掉的話測試就不能跑
window.__zy={SYL,detectLayout,decode,generate,encodeText,LAYOUTS,S,setLayout};
})();
