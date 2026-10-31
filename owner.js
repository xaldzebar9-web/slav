let ws, pc, roomId, ownerKey;
const $=id=>document.getElementById(id);
function status(t){$("status").textContent=t}
function connect(){return new Promise((resolve,reject)=>{const proto=location.protocol==="https:"?"wss:":"ws:";ws=new WebSocket(`${proto}//${location.host}`);ws.onopen=resolve;ws.onerror=reject;ws.onmessage=async e=>{const m=JSON.parse(e.data);
 if(m.type==="created"){roomId=m.roomId;ownerKey=m.ownerKey;const u=`${location.origin}/viewer.html#${roomId}`;$("url").value=u;$("invite").classList.remove("hidden");status("لینک هاتە دروستکرن. چاوەڕێی بەشداربووی.");}
 if(m.type==="viewer-waiting")status("بەشداربوو هاتە ژوور. چاوەڕێی Start و مۆڵەتا وی.");
 if(m.type==="offer"){try{pc=new RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"}]});pc.ontrack=e=>{$("screen").srcObject=e.streams[0];status("شاشەیا بەشداربووی دێتە پیشاندان.");};pc.onicecandidate=e=>{if(e.candidate)ws.send(JSON.stringify({type:"ice",candidate:e.candidate}));};await pc.setRemoteDescription(m.offer);const a=await pc.createAnswer();await pc.setLocalDescription(a);ws.send(JSON.stringify({type:"answer",answer:a}));}catch(err){status("نەتوانرا پەیوەندی دروست ببیت: "+err.message)}}
 if(m.type==="ice"&&pc){try{await pc.addIceCandidate(m.candidate)}catch{}}
 if(m.type==="ended"){if(pc)pc.close();pc=null;$("screen").srcObject=null;$("stop").disabled=true;status(m.message||"دانیشتن تەواو بوو.");}
 if(m.type==="error")status(m.message);
};});}
$("create").onclick=async()=>{try{await connect();ws.send(JSON.stringify({type:"create"}));$("create").disabled=true;}catch{status("نەتوانرا بە سێرڤەر پەیوەندی بکرێت. دڵنیابە وێب‌ئەپ ل سێرڤەرە.");}};
$("copy").onclick=async()=>{try{await navigator.clipboard.writeText($("url").value);status("لینک کۆپی بوو.");}catch{$("url").select();document.execCommand("copy");status("لینک هەڵبژێردرا؛ کۆپی بکە.");}};
$("stop").onclick=()=>{if(ws&&ws.readyState===1)ws.send(JSON.stringify({type:"end"}));if(pc)pc.close();pc=null;$("screen").srcObject=null;$("stop").disabled=true;status("دانیشتن وەستا.");};