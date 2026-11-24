(()=>{
const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shuf=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
/* Рівні клітинок 1–25 (1 — зелений, 2 — жовтий, 3 — червоний), як на полі */
const MAP="12312"+"31231"+"21321"+"23123"+"12312";
const ICON=["🗄️","📋","SQL","🔑","🔗","SQL","🔽","🔍","⚙️","🗂️","Σ","📊","➕","🛠️","👥","✏️","📈","🗂️","🔑","SQL","🗄️","🔽","SQL","⚙️","✅"];
const COLORS=["#e53935","#1e88e5","#43a047","#f9b600","#8e24aa","#fb8c00"];
const LV=[0,{r:"I",t:"Базовий",s:30,c:1},{r:"II",t:"Практичний",s:60,c:2},{r:"III",t:"Розширений",s:90,c:3}];
const PIPS={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
const FINISH=26,PENALTY=2,HINT=1,FINAL_BONUS=10;
let S,decks={};
const lv=i=>+MAP[i-1];
const draw=k=>{if(!decks[k]||!decks[k].length)decks[k]=shuf(window.QUESTIONS[k]);return decks[k].pop()};
const show=id=>["setup","game","result"].forEach(x=>$("#"+x).hidden=x!==id);

/* Налаштування */
const cnt=$("#count"),names=$("#names");
function drawNames(){const old=[...names.querySelectorAll("input")].map(i=>i.value);names.innerHTML="";
 for(let i=0;i<+cnt.value;i++){const l=document.createElement("label");
  l.innerHTML=`<i class="dot" style="background:${COLORS[i]}"></i><input maxlength="24" placeholder="Гравець ${i+1}" aria-label="Ім’я гравця ${i+1}">`;
  l.querySelector("input").value=old[i]||"";names.append(l)}}
cnt.onchange=drawNames;drawNames();
$("#start").onclick=()=>{
 S={cls:$("#cls").value.trim(),cur:0,busy:false,over:false,players:[...names.querySelectorAll("input")].map((x,i)=>({
  name:x.value.trim()||"Гравець "+(i+1),color:COLORS[i],pos:0,coins:2,ok:0,bad:0,hints:0,done:false,
  st:[0,{ok:0,all:0},{ok:0,all:0},{ok:0,all:0}]}))};
 decks={};show("game");buildBoard();$("#log").innerHTML="";face(0);render();log("Гра почалась! Кидайте кубик.")};

/* Поле */
function gridPos(i){if(i===0)return[1,1];if(i===FINISH)return[5,6];if(i<=5)return[1,i+1];
 const r=Math.ceil(i/5)-1,k=(i-1)%5;return[r+1,(r%2?4-k:k)+1]}
function buildBoard(){const b=$("#board");b.innerHTML="";
 for(let i=0;i<=FINISH;i++){const d=document.createElement("div"),[r,c]=gridPos(i);d.id="c"+i;d.style.gridArea=`${r}/${c}`;
  d.className="cell "+(i==0?"start":i==FINISH?"fin":"l"+lv(i));
  d.innerHTML=i==0?"<i>🏁</i><b>СТАРТ</b>":i==FINISH?"<i>🏁</i><b>ФІНІШ</b>":`<span>${i}</span><i>${ICON[i-1]}</i>`;
  d.insertAdjacentHTML("beforeend",'<div class="tk"></div>');b.append(d)}
 document.querySelectorAll(".lg").forEach((e,i)=>e.className="lg l"+(i+1))}
function render(){const p=S.players[S.cur];
 document.querySelectorAll(".tk").forEach(t=>t.innerHTML="");
 document.querySelectorAll(".cell").forEach(c=>c.classList.remove("now"));
 S.players.forEach((q,i)=>{const s=document.createElement("span");s.className="pawn"+(i==S.cur?" cur":"");
  s.style.setProperty("--c",q.color);s.title=q.name;$("#c"+q.pos+" .tk").append(s)});
 $("#c"+p.pos).classList.add("now");
 $("#plist").innerHTML=S.players.map((q,i)=>`<li class="${i==S.cur?"cur":""}"><i class="dot" style="background:${q.color}"></i><b>${esc(q.name)}</b><span>🪙${q.coins}</span><span>📍${q.pos}</span></li>`).join("");
 $("#roll").textContent="🎲 Кинути кубик: "+p.name;$("#roll").disabled=S.busy}
function log(t){const li=document.createElement("li");li.textContent=t;const l=$("#log");l.prepend(li);while(l.children.length>7)l.lastChild.remove()}
function face(v){$("#dice").innerHTML=Array.from({length:9},(_,i)=>`<i class="${(PIPS[v]||[]).includes(i)?"on":""}"></i>`).join("")}

/* Хід */
const rec=(p,k,ok)=>{p.st[k].all++;if(ok){p.st[k].ok++;p.ok++}else p.bad++};
async function roll(){if(S.busy||S.over)return;S.busy=true;const p=S.players[S.cur];render();
 const d=$("#dice");d.classList.add("rolling");let v;
 for(let i=0;i<10;i++){v=1+Math.floor(Math.random()*6);face(v);await sleep(70)}
 d.classList.remove("rolling");log(`${p.name} кидає кубик: ${v}`);
 for(let i=0;i<v&&p.pos<FINISH;i++){p.pos++;render();await sleep(240)}
 if(p.pos==FINISH){const ok=await ask(3,true);rec(p,3,ok);
  if(ok){p.coins+=FINAL_BONUS;p.done=true;log(`🏆 ${p.name} відновив(-ла) Великий Архів!`);return end()}
  log(`${p.name}: фінальне завдання не виконано, назад на клітинку 25`);p.pos=25}
 else{const k=lv(p.pos),ok=await ask(k,false);rec(p,k,ok);
  if(ok){p.coins+=LV[k].c;log(`✅ ${p.name}: +${LV[k].c} DataCoin`)}
  else{log(`❌ ${p.name}: назад на ${PENALTY} клітинки`);for(let i=0;i<PENALTY&&p.pos>0;i++){p.pos--;render();await sleep(240)}}}
 S.cur=(S.cur+1)%S.players.length;S.busy=false;render()}
$("#roll").onclick=roll;
$("#endbtn").onclick=()=>{if(S.busy)return alert("Спершу завершіть поточний хід.");if(confirm("Завершити гру та показати результати?"))end()};

/* Картка із завданням */
function ask(k,final){return new Promise(done=>{
 const L=LV[final?3:k],q=draw(final?4:k),p=S.players[S.cur],m=$("#modal");
 const o=shuf(q.slice(1,5).map((t,i)=>({t,ok:!i})));
 let total=final?150:L.s,left=total,over=false;
 m.hidden=false;
 m.innerHTML=`<div class="card l${final?3:k}" role="dialog" aria-modal="true"><div class="chead"><span>${final?"👑 Фінальне випробування":"Рівень "+L.r+" · "+L.t}</span><span>${esc(p.name)} · ⏱ <b id="tm">${left}</b> с</span></div><div class="bar"><i id="bar"></i></div><h2>${esc(q[0])}</h2><div id="opts">${o.map((x,i)=>`<button class="opt" data-i="${i}"><b>${"АБВГ"[i]}</b><span>${esc(x.t)}</span></button>`).join("")}</div><p id="hint" class="hint" hidden>💡 ${esc(q[5])}</p><div class="cfoot"><button id="hb" class="ghost">💡 Підказка (−${HINT} DataCoin)</button><span id="fb"></span><button id="nx" class="main" hidden>Далі</button></div></div>`;
 const B=[...m.querySelectorAll(".opt")],hb=$("#hb"),fb=$("#fb"),nx=$("#nx");
 hb.disabled=p.coins<HINT;
 hb.onclick=()=>{p.coins-=HINT;p.hints++;hb.disabled=true;$("#hint").hidden=false;
  shuf(B.map((_,i)=>i).filter(i=>!o[i].ok)).slice(0,2).forEach(i=>{B[i].disabled=true;B[i].classList.add("out")});
  render()};
 const iv=setInterval(()=>{left-=.1;$("#bar").style.width=Math.max(0,left/total*100)+"%";$("#tm").textContent=Math.max(0,Math.ceil(left));if(left<=0)fin(-1)},100);
 function fin(i){if(over)return;over=true;clearInterval(iv);const ok=i>=0&&o[i].ok;
  B.forEach((b,j)=>{b.disabled=true;if(o[j].ok)b.classList.add("right");else if(j==i)b.classList.add("wrong")});
  fb.textContent=ok?"✅ Правильно!":i<0?"⏰ Час вийшов.":"❌ Неправильно.";fb.className=ok?"good":"bad";
  hb.hidden=true;nx.hidden=false;nx.focus();nx.onclick=()=>{m.hidden=true;m.innerHTML="";done(ok)}}
 B.forEach(b=>b.onclick=()=>fin(+b.dataset.i))})}

/* Результати й сертифікати */
const g12=(ok,all)=>all?Math.max(1,Math.round(12*ok/all)):"—";
function grade(p){let w=0,a=0;for(let l=1;l<4;l++){w+=p.st[l].ok*l;a+=p.st[l].all*l}
 const acc=a?w/a:0;return Math.max(1,Math.min(12,Math.round(12*(.7*acc+.3*p.pos/FINISH)+(p.done?.5:0))))}
const title=(g,w)=>w?"Великий магістр баз даних":g>=10?"Архітектор даних":g>=7?"Хранитель таблиць":g>=4?"Учень архіваріуса":"Дослідник баз даних";
function end(){S.over=true;S.busy=false;show("result");
 const P=S.players.map(p=>({p,g:grade(p),s:(p.done?1000:0)+p.coins+p.pos})).sort((a,b)=>b.s-a.s);
 const win=P[0].p.done?P[0].p:null;
 $("#rank").innerHTML=`<h2>${win?"🏆 Переміг(-ла): "+esc(win.name):"Підсумки гри"}</h2><table><thead><tr><th>№</th><th>Гравець</th><th>Клітинка</th><th>Правильно</th><th>DataCoin</th><th>Оцінка</th></tr></thead><tbody>${P.map(({p,g},i)=>`<tr><td>${i+1}</td><td><i class="dot" style="background:${p.color}"></i>${esc(p.name)}</td><td>${p.pos}/${FINISH}</td><td>${p.ok}/${p.ok+p.bad}</td><td>${p.coins}</td><td><b>${g}</b></td></tr>`).join("")}</tbody></table>`;
 const date=new Date().toLocaleDateString("uk-UA");
 $("#certs").innerHTML=P.map(({p,g})=>{const w=p===win;return `<article class="cert"><div class="cin"><div class="cseal">${w?"🏆":"🎓"}</div><p class="ck">Королівство «База даних» · Інформатика${S.cls?" · "+esc(S.cls):""}</p><h2>Сертифікат</h2><p>видано учаснику / учасниці гри</p><div class="cname">${esc(p.name)}</div><p>за проходження навчальної гри «База даних» і здобуття титулу</p><div class="ctitle">${title(g,w)}</div><div class="cgrid">${[1,2,3].map(l=>{const s=p.st[l];return `<div><small>Рівень ${LV[l].r}</small><b>${g12(s.ok,s.all)}</b><span>${s.ok}/${s.all} правильно</span></div>`}).join("")}<div class="tot"><small>Підсумкова оцінка</small><b>${g}</b><span>із 12 балів</span></div></div><p class="cmeta">Пройдено клітинок: ${p.pos} із ${FINISH} · DataCoin: ${p.coins} · Підказок: ${p.hints}${p.done?" · Фінальне завдання виконано":""}</p><footer><span>${date}</span><span>Підпис учителя: ____________</span></footer></div></article>`}).join("");
 window.scrollTo(0,0)}
})();
