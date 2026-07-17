const API_URL="https://script.google.com/macros/s/AKfycbxK73eeYQ5ouUq70DpxUUs2eQxylBNWM2gCscVygmWW0xDnbjmyyur-ijNmZKW8OFd7/exec";
async function api(action,payload={}){if(API_URL.includes("PASTE_YOUR"))throw Error("Set API_URL in api.js");let r=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action,...payload})});let j=await r.json();if(!j.ok)throw Error(j.error||"Request failed");return j}
function session(){try{return JSON.parse(localStorage.getItem("kmapSession"))}catch(e){return null}}
function requireRole(role){let s=session();if(!s||s.role!==role){location.href="index.html";return null}return s}
function logout(){localStorage.removeItem("kmapSession");location.href="index.html"}
function initTheme(){let t=localStorage.getItem("kmapTheme")||"light";document.documentElement.dataset.theme=t;document.querySelectorAll(".themeToggle").forEach(b=>b.textContent=t==="dark"?"☀ Light":"🌙 Dark")}
function toggleTheme(){let t=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=t;localStorage.setItem("kmapTheme",t);initTheme()}
document.addEventListener("DOMContentLoaded",initTheme);
