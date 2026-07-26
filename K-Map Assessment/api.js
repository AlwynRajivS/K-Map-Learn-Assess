/* ============================================================
   Shared API + session helpers.
   IMPORTANT: after every change to Code.gs you must create a NEW
   deployment version (Deploy > Manage deployments > Edit > New
   version) — editing the script alone does NOT update the live
   /exec URL. Also confirm: Execute as "Me", Who has access "Anyone".
   ============================================================ */
const API_URL="https://script.google.com/macros/s/AKfycbzRto1IKJzv3WhFwcsJ7t-ohpqUE2qYA9G9zwet53PP00t6wXykbjXxvORiBtY5xfyI/exec";

async function api(action,payload={}){
  if(!API_URL||API_URL.includes("PASTE_YOUR")) throw Error("Set API_URL in api.js");
  let r;
  try{
    r=await fetch(API_URL,{
      method:"POST",
      headers:{"Content-Type":"text/plain;charset=utf-8"}, // text/plain avoids a CORS preflight against Apps Script
      body:JSON.stringify({action,...payload})
    });
  }catch(networkErr){
    // A rejected fetch() here almost always means the deployment URL is wrong,
    // the deployment access isn't set to "Anyone", or there's no internet connection.
    throw Error("Could not reach the server. Check your connection, or ask the admin to verify the Apps Script deployment is published with access set to \"Anyone\".");
  }
  let text=await r.text();
  let j;
  try{
    j=JSON.parse(text);
  }catch(parseErr){
    // Apps Script returned HTML (e.g. a Google login/permission page) instead of JSON.
    throw Error("Server returned an unexpected response. The deployment may need to be redeployed, or access is restricted. (Raw status: "+r.status+")");
  }
  if(!j.ok) throw Error(j.error||"Request failed");
  return j;
}

function session(){
  try{ return JSON.parse(localStorage.getItem("kmapSession")); }
  catch(e){ return null; }
}
function saveSession(user){ localStorage.setItem("kmapSession",JSON.stringify(user)); }
function requireRole(role){
  let s=session();
  if(!s||s.role!==role){ location.href="index.html"; return null; }
  return s;
}
function logout(){ localStorage.removeItem("kmapSession"); location.href="index.html"; }

function initTheme(){
  let t=localStorage.getItem("kmapTheme")||"light";
  document.documentElement.dataset.theme=t;
  document.querySelectorAll(".themeToggle").forEach(b=>b.textContent=t==="dark"?"☀ Light":"🌙 Dark");
}
function toggleTheme(){
  let t=document.documentElement.dataset.theme==="dark"?"light":"dark";
  document.documentElement.dataset.theme=t;
  localStorage.setItem("kmapTheme",t);
  initTheme();
}
document.addEventListener("DOMContentLoaded",initTheme);
