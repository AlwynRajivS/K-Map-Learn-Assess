(()=>{"use strict";
const $=x=>document.getElementById(x),colors=[["#e63946","rgba(230,57,70,.18)"],["#2563eb","rgba(37,99,235,.18)"],["#16a34a","rgba(22,163,74,.18)"],["#f59e0b","rgba(245,158,11,.2)"],["#9333ea","rgba(147,51,234,.18)"],["#0891b2","rgba(8,145,178,.18)"]];
let S={V:3,form:"SOP",method:"normal",phase:"place",vals:[],sel:new Set,groups:[]};
function reset(){
  let q = KM.config(S.V);
  S.phase = "place";

  // SOP starts with all 0s
  // POS starts with all 1s
  S.vals = Array(q.R * q.C).fill(S.form === "POS" ? 1 : 0);

  S.sel = new Set;
  S.groups = [];

  ui();
  render();
}
function ui(){$("start").hidden=false;$("check").hidden=true;$("cancel").hidden=true;$("undo").hidden=true;$("finish").hidden=true;$("groupCards").innerHTML="";$("answer").innerHTML="";$("result").className="result";$("result").textContent="Place the required values first."}
function render(){let q=KM.config(S.V),g=$("grid");g.innerHTML="";g.className="grid "+(q.C===8?"g8":q.C===4?"g4":"g2");$("cols").innerHTML="";$("cols").className="cols "+(q.C===8?"c8":q.C===4?"c4":"c2");$("rows").innerHTML="";$("topAxis").textContent =
  S.V === 5
    ? "CDE →"
    : q.cv.join("") + " →";$("sideAxis").textContent=q.rv.join("")+" ↓";
q.cl.forEach(x=>{let d=document.createElement("div");d.textContent=x;$("cols").appendChild(d)});q.rl.forEach(x=>{let d=document.createElement("div");d.className="rlabel";d.textContent=x;$("rows").appendChild(d)});
for(let r=0;r<q.R;r++)for(let c=0;c<q.C;c++){let i=r*q.C+c,b=document.createElement("button"),v=S.vals[i];b.className="cell "+(v===1?"one":v==="X"?"dc":"zero")+(S.sel.has(i)?" current":"");b.innerHTML='<span class="m">m'+KM.mt(S.V,r,c)+'</span><span class="val">'+v+"</span>";S.groups.forEach((gr,j)=>{if(gr.ids.includes(i)){let o=document.createElement("span");o.className="overlay d"+(j%4+1);o.style.setProperty("--gc",gr.color[0]);o.style.setProperty("--gb",gr.color[1]);b.appendChild(o)}});b.onclick=()=>cell(i);g.appendChild(b)}
$("instruction").innerHTML=S.phase==="place"?(S.form==="SOP"?"<b>Step 1 — SOP:</b> Place <b>1</b> in required minterms. "+(S.method==="dc"?"Add <b>X</b> at don't-care terms.":"All other cells remain 0."):"<b>Step 1 — POS:</b> The map starts with <b>0</b> in every cell. Tap non-zero cells to change them to <b>1</b>. "+(S.method==="dc"?"Add <b>X</b> where required.":"Keep required maxterms as 0.")):"<b>Grouping:</b> Select one complete group. Previously accepted groups remain visible in transparent colours."}
function cell(i) {
  if (S.phase === "place") {
    let v = S.vals[i];

    if (S.form === "SOP") {
      // SOP Normal: 0 → 1 → 0
      // SOP Don't Care: 0 → 1 → X → 0
      if (S.method === "dc") {
        S.vals[i] = v === 0 ? 1 : v === 1 ? "X" : 0;
      } else {
        S.vals[i] = v === 0 ? 1 : 0;
      }
    } else {
      // POS Normal: 1 → 0 → 1
      // POS Don't Care: 1 → 0 → X → 1
      if (S.method === "dc") {
        S.vals[i] = v === 1 ? 0 : v === 0 ? "X" : 1;
      } else {
        S.vals[i] = v === 1 ? 0 : 1;
      }
    }
  } else {
    // Grouping mode
    S.sel.has(i) ? S.sel.delete(i) : S.sel.add(i);
  }

  render();
}
function bad(x){$("result").className="result bad";$("result").innerHTML="❌ <b>Check again:</b> "+x}
function check(){let ids=[...S.sel].sort((a,b)=>a-b);if(!Solver.valid(ids,S))return bad("The selected cells do not form a valid "+S.form+" power-of-two rectangle.");if(!Solver.maximal(ids,S))return bad("A larger valid group is possible. Use the largest possible group instead of this smaller group.");let key=ids.join();if(S.groups.some(g=>g.ids.join()===key))return bad("This exact group is already accepted.");let gr={ids,term:Solver.term(ids,S),color:colors[S.groups.length%colors.length]};S.groups.push(gr);S.sel=new Set;render();cards();$("result").className="result ok";$("result").innerHTML='🎉 <b>Correct group!</b> Expression for this group: <span class="term" style="color:'+gr.color[0]+'">'+gr.term+"</span>";Anim.celebrate()}
function cards(){$("groupCards").innerHTML=S.groups.map((g,i)=>'<div class="groupCard" style="--gc:'+g.color[0]+'"><b>Group '+(i+1)+'</b> → <span class="term">'+g.term+"</span><br><span class='small'>Cells: "+g.ids.map(x=>{let q=KM.config(S.V);return"m"+KM.mt(S.V,Math.floor(x/q.C),x%q.C)}).join(", ")+"</span></div>").join("")}
function finish(){if(!S.groups.length)return bad("No valid group has been created.");let req=Solver.required(S),cov=new Set;S.groups.forEach(g=>g.ids.forEach(i=>{if(S.vals[i]!=="X")cov.add(i)}));let miss=req.filter(i=>!cov.has(i));if(miss.length){let q=KM.config(S.V);return bad("Final answer is incomplete. Required "+(S.form==="SOP"?"1":"0")+" cells still ungrouped: "+miss.map(i=>"m"+KM.mt(S.V,Math.floor(i/q.C),i%q.C)).join(", ")+".")}let min=Solver.minimumCount(S);if(min!==null&&S.groups.length>min)return bad("All target cells are covered, but this is not a minimum solution. The map can be completed with "+min+" group(s); you used "+S.groups.length+".");let terms=[...new Set(S.groups.map(g=>g.term))],ans=terms.join(S.form==="SOP"?" + ":"");$("answer").className="answer ok";$("answer").innerHTML="✅ <b>Verified Final "+S.form+" Expression:</b> "+terms.map((t,i)=>'<span class="term" style="color:'+colors[i%colors.length][0]+'">'+t+"</span>").join(S.form==="SOP"?" + ":"")+"<br><span class='small'>All required cells are covered and the grouping passed maximal/minimal checks.</span>";Anim.celebrate()}
$("start").onclick=()=>{S.phase="group";S.sel=new Set;$("start").hidden=true;$("check").hidden=false;$("cancel").hidden=false;$("undo").hidden=false;$("finish").hidden=false;render()};$("check").onclick=check;$("cancel").onclick=()=>{S.sel=new Set;render()};$("undo").onclick=()=>{S.groups.pop();cards();render();$("answer").innerHTML=""};$("finish").onclick=finish;
$("clear").onclick=reset;$("resetAll").onclick=()=>{S.V=3;S.form="SOP";S.method="normal";$("form").value="SOP";$("method").value="normal";document.querySelectorAll("[data-v]").forEach(x=>x.classList.toggle("active",x.dataset.v==="3"));reset()};$("form").onchange=()=>{S.form=$("form").value;reset()};$("method").onchange=()=>{S.method=$("method").value;reset()};$("sample").onclick=()=>{reset();let q=KM.config(S.V);if(S.form==="POS")S.vals=Array(q.R*q.C).fill(1);let a=S.V===2?[0,1]:S.V===3?[0,1,4,5]:S.V===4?[0,3,4,7,8,11,12,15]:[0,3,8,11,16,19,24,27];a.forEach(i=>S.vals[i]=S.form==="SOP"?1:0);if(S.method==="dc")S.vals[Math.min(2,S.vals.length-1)]="X";render()};
document.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-v]").forEach(x=>x.classList.remove("active"));b.classList.add("active");S.V=+b.dataset.v;reset()});
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>{document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));$(b.dataset.page+"Page").classList.add("active")});
document.querySelectorAll("[data-fold]").forEach(b=>b.onclick=()=>Anim.fold(b.dataset.fold));
$("foldReset").onclick=()=>Anim.reset();
$("foldPlay").onclick=()=>{if(Anim.timer)Anim.reset();else Anim.play()};
document.querySelectorAll(".wrapExample").forEach(b=>b.onclick=()=>Anim.example(b.dataset.ex,b));
$("theme").onclick=()=>{let d=document.documentElement.dataset.theme==="dark",n=d?"light":"dark";document.documentElement.dataset.theme=n;$("theme").textContent=n==="dark"?"☀ Light":"🌙 Dark";localStorage.setItem("kmpro",n)};if(localStorage.getItem("kmpro")==="dark"){document.documentElement.dataset.theme="dark";$("theme").textContent="☀ Light"}reset()
})();
