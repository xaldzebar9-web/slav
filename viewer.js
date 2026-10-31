let ws,pc,stream;
const $=id=>document.getElementById(id);
function status(t){$("status").textContent=t}
function stop(){if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;if(pc)pc.close();pc=null;if(ws&&ws.readyState===1)ws.send(JSON.stringify({type:"end"}));$("start").disabled=false;$("stop").disabled=true;status("Screen sharing stopped.");}
$("stop").onclick=stop;
$("start").onclick=async()=>{
 const roomId=location.hash.slice(1);
 if(!roomId){status("Invalid invitation link.");return;}
 if(!window.isSecureContext||!navigator.mediaDevices?.getDisplayMedia){status("Screen sharing is not supported in this browser/device. Try a supported desktop browser. No screen has been shared.");return;}
 $("start").disabled=true;
 try{
  stream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});
  ws=new WebSocket(`${location.protocol==="https:"?"wss:":"ws:"}//${location.host}`);
  ws.onopen=()=>ws.send(JSON.stringify({type:"join",roomId}));
  ws.onmessage=async e=>{const m=JSON.parse(e.data);
   if(m.type==="joined"){pc=new RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"}]});stream.getTracks().forEach(t=>pc.addTrack(t,stream));pc.onicecandidate=e=>{if(e.candidate)ws.send(JSON.stringify({type:"ice",candidate:e.candidate}));};const offer=await pc.createOffer();await pc.setLocalDescription(offer);ws.send(JSON.stringify({type:"offer",offer}));$("stop").disabled=false;status("Screen share started. Press Stop at any time.");}
   if(m.type==="answer"&&pc)await pc.setRemoteDescription(m.answer);
   if(m.type==="ice"&&pc){try{await pc.addIceCandidate(m.candidate)}catch{}}
   if(m.type==="ended"){if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;if(pc)pc.close();pc=null;$("start").disabled=false;$("stop").disabled=true;status("Session ended.");}
   if(m.type==="error"){stop();status(m.message);}
  };
  stream.getVideoTracks()[0].addEventListener("ended",stop,{once:true});
 }catch(err){$("start").disabled=false;status(err.name==="NotAllowedError"?"Permission was not granted. Nothing was shared.":"Could not start screen sharing: "+err.message);}
};