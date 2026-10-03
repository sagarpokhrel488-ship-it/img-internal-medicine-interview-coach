const $=id=>document.getElementById(id);
const questions=[
"Tell me about yourself.",
"Why did you choose Internal Medicine?",
"Why do you want to train in the United States?",
"Why are you interested in our program?",
"Tell me about a challenging clinical case you managed.",
"Tell me about a time you received difficult feedback.",
"How has your experience as an IMG prepared you for residency?",
"Tell me about your research experience.",
"Tell me about a clinical mistake or near miss and what you learned.",
"How do you approach disagreement with a senior resident or attending?",
"What is one weakness you are actively working on?",
"Where do you see yourself five years after residency?"
];
const interviewerNames={
"harvard-pd":"Harvard-style Program Director","harvard-chief":"Harvard-style Chief Resident",
"stanford-pd":"Stanford-style Program Director","stanford-chief":"Stanford-style Chief Resident",
"mayo-pd":"Mayo Clinic-style Program Director","mayo-chief":"Mayo Clinic-style Chief Resident"
};
let state={index:0,length:12,history:[],interviewer:"mayo-pd",mode:"standard",profile:{},currentQuestion:"",blob:null,stream:null,rec:null,timer:null,seconds:0};

function toast(msg){$("toast").textContent=msg;$("toast").classList.remove("hidden");setTimeout(()=>$("toast").classList.add("hidden"),3500)}
function speak(text){if(!window.speechSynthesis)return; speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=.92;speechSynthesis.speak(u)}
function setQuestion(q){state.currentQuestion=q;$("question").textContent=q;$("counter").textContent=`${state.index+1} / ${state.length}`;$("typed").value="";$("send").disabled=true;$("answerAudio").classList.add("hidden");$("answerAudio").removeAttribute("src");$("liveFeedback").classList.add("hidden");$("recordStatus").textContent="Tap the microphone and answer as if you are in the interview.";speak(q)}
function resetTimer(){clearInterval(state.timer);state.seconds=0;$("timer").textContent="00:00"}
function timerStart(){resetTimer();state.timer=setInterval(()=>{state.seconds++;const m=String(Math.floor(state.seconds/60)).padStart(2,"0"),s=String(state.seconds%60).padStart(2,"0");$("timer").textContent=`${m}:${s}`},1000)}
function timerStop(){clearInterval(state.timer)}
function bestMime(){for(const m of ["audio/mp4","audio/webm;codecs=opus","audio/webm"])if(MediaRecorder.isTypeSupported(m))return m;return ""}
async function startRecording(){
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){toast("This iPad/browser cannot record audio. Use current Safari or Chrome.");return}
 try{
  state.stream=await navigator.mediaDevices.getUserMedia({audio:true});
  const mime=bestMime(); state.rec=mime?new MediaRecorder(state.stream,{mimeType:mime}):new MediaRecorder(state.stream);
  const chunks=[];state.rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);
  state.rec.onstop=()=>{state.blob=new Blob(chunks,{type:state.rec.mimeType||"audio/mp4"});const url=URL.createObjectURL(state.blob);$("answerAudio").src=url;$("answerAudio").classList.remove("hidden");$("send").disabled=false;state.stream?.getTracks().forEach(t=>t.stop());$("record").classList.remove("recording");$("record").innerHTML="🎙️<span>Start recording</span>";$("recordStatus").textContent="Recording ready. Play it back, then Send Answer.";timerStop()};
  state.rec.start();timerStart();$("record").classList.add("recording");$("record").innerHTML="⏹️<span>Stop recording</span>";$("recordStatus").textContent="Recording… speak naturally. Tap again when finished.";
 }catch(e){toast("Microphone permission was denied or unavailable. Allow microphone access for this site in Safari Settings.")}
}
function stopRecording(){if(state.rec?.state==="recording")state.rec.stop()}
async function sendAnswer(){
 const typed=$("typed").value.trim();
 if(!state.blob&&!typed){toast("Record or type an answer first.");return}
 $("send").disabled=true;$("recordStatus").textContent="Analyzing your answer…";
 try{
  let transcript=typed;
  if(state.blob){
   const buf=await state.blob.arrayBuffer();
   const bytes=new Uint8Array(buf);let binary="";const step=0x8000;for(let i=0;i<bytes.length;i+=step)binary+=String.fromCharCode(...bytes.subarray(i,i+step));
   const audioBase64=btoa(binary);
   const tr=await fetch("api/transcribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({audioBase64,mimeType:state.blob.type||"audio/mp4"})});
   if(!tr.ok)throw new Error(await tr.text()); const tj=await tr.json(); transcript=tj.text||typed;
  }
  const payload={interviewer:state.interviewer,mode:state.mode,question:state.currentQuestion,answer:transcript,history:state.history,profile:state.profile,remaining:state.length-state.index-1};
  const r=await fetch("api/next",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  if(!r.ok)throw new Error(await r.text()); const data=await r.json();
  state.history.push({question:state.currentQuestion,answer:transcript,feedback:data.feedback||null,scores:data.scores||null});
  showLiveFeedback(data);
  if(state.index+1>=state.length){await finishReport();return}
  state.index++;setTimeout(()=>setQuestion(data.nextQuestion||questions[state.index%questions.length]),1200);
 }catch(e){console.error(e);toast("AI processing failed. Check your API configuration and try again.");$("send").disabled=false;$("recordStatus").textContent="Could not process the answer."}
}
function showLiveFeedback(d){const el=$("liveFeedback");el.innerHTML=`<strong>Quick AI feedback</strong><p>${escapeHtml(d.feedback||"Answer received.")}</p>`;el.classList.remove("hidden")}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function finishReport(){
 $("interview").classList.add("hidden");$("report").classList.remove("hidden");$("reportSummary").textContent="Generating your individualized residency interview report…";
 try{
  const r=await fetch("api/report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({history:state.history,interviewer:state.interviewer,mode:state.mode,profile:state.profile})});
  if(!r.ok)throw new Error(await r.text());const d=await r.json();renderReport(d);
 }catch(e){renderReport({overall:0,communication:0,structure:0,specificity:0,professionalism:0,imgReadiness:0,summary:"Report could not be generated. Your recorded interview history is still available in this session.",strengths:[],improvements:["Check the AI API configuration and retry."],history:state.history})}
}
function renderReport(d){
 $("reportSummary").textContent=d.summary||"Interview completed.";
 const scores=[["Overall",d.overall],["Communication",d.communication],["Structure",d.structure],["Specificity",d.specificity],["Professionalism",d.professionalism],["IMG readiness",d.imgReadiness]];
 $("scoreGrid").innerHTML=scores.map(x=>`<div class="score">${x[0]}<strong>${x[1]??"—"}</strong><small>/10</small></div>`).join("");
 $("strengths").innerHTML=(d.strengths||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
 $("improvements").innerHTML=(d.improvements||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
 $("history").innerHTML=(d.history||state.history).map((h,i)=>`<div class="review"><h3>${i+1}. ${escapeHtml(h.question)}</h3><p><strong>Your answer:</strong> ${escapeHtml(h.answer)}</p><div class="feedback">${escapeHtml(h.feedback||"")}</div></div>`).join("");
}
$("start").onclick=()=>{state.interviewer=$("interviewer").value;state.mode=$("mode").value;state.length=Number($("length").value);state.index=0;state.history=[];state.profile={name:$("name").value,school:$("school").value,yog:$("yog").value,exam:$("exam").value,usce:$("usce").value,goal:$("goal").value};$("who").textContent=interviewerNames[state.interviewer];$("modePill").textContent=state.mode;$("setup").classList.add("hidden");$("report").classList.add("hidden");$("interview").classList.remove("hidden");setQuestion(questions[0])}
$("record").onclick=()=>state.rec?.state==="recording"?stopRecording():startRecording();
$("typed").oninput=()=>{$("send").disabled=!$("typed").value.trim()&&!state.blob};
$("send").onclick=sendAnswer;$("listen").onclick=()=>speak(state.currentQuestion);$("end").onclick=finishReport;
$("restart").onclick=()=>{location.reload()};
