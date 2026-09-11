const API_URL="https://script.google.com/macros/s/AKfycbwHMX9vrCtwnfM-Ino3s64YS1ywNDIfadPZG3M5ElPs66P9PF5RarF53b8sW-LIa2PV/exec";
function api(action,params={}){
 return new Promise((resolve,reject)=>{
  const cb="chenab_cb_"+Date.now()+"_"+Math.floor(Math.random()*100000),s=document.createElement("script");
  const q=new URLSearchParams({action,callback:cb,_cache:Date.now(),...params}); let done=false,t;
  const clean=()=>{clearTimeout(t);try{delete window[cb]}catch(e){};s.remove()};
  window[cb]=d=>{if(done)return;done=true;clean();d&&d.ok===false?reject(new Error(d.error||"Server error")):resolve(d||{})};
  s.onerror=()=>{if(done)return;done=true;clean();reject(new Error("Google Sheet API connection failed. Please refresh and try again."))};
  s.src=API_URL+"?"+q.toString();document.head.appendChild(s);
  t=setTimeout(()=>{if(done)return;done=true;clean();reject(new Error("Google Sheet API timed out. Please refresh and try again."))},20000);
 });
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
