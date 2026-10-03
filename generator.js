<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Movixa App Maker</title>

<style>
body{font-family:Arial;margin:0;background:#f4f6f8}
.container{max-width:900px;margin:auto;padding:20px}
.card{background:white;padding:20px;border-radius:18px;margin-bottom:18px}
h1{margin-top:0}
input,select{width:100%;box-sizing:border-box;padding:13px;margin:7px 0;border:1px solid #ccc;border-radius:8px;font-size:16px}
button{padding:12px 18px;margin:5px;border:0;border-radius:8px;font-size:16px}
.add{background:#222;color:white}
.build{background:#0b57d0;color:white;width:100%;margin-top:15px}
.save{background:#16803c;color:white}
.load{background:#555;color:white}
.new{background:#8a2222;color:white}
.delete-saved{background:#eee}
.component{border:1px solid #ddd;padding:12px;border-radius:10px;margin-top:10px}
.preview{background:#fafafa;border:1px solid #ddd;min-height:180px;padding:15px;border-radius:10px}
.preview img{max-width:100%;display:block;margin:10px 0;border-radius:8px}
.preview video{width:100%;max-height:400px;display:block;margin:10px 0;border-radius:8px;background:#000}
.preview iframe{width:100%;height:300px;border:0;margin:10px 0}
.delete{background:#eee;float:right}
textarea{width:100%;height:160px;box-sizing:border-box;margin-top:10px}
.action-box{margin-top:10px;padding:10px;background:#f5f7fa;border-radius:8px}
.action-help{font-size:13px;color:#666;margin-top:3px}
#saveStatus{margin-top:10px;font-weight:bold}
</style>
</head>

<body>

<div class="container">

<div class="card">
<h1>Movixa App Maker</h1>
<p>अपना ऐप बिना JSON लिखे बनाइए</p>

<label>App Name</label>
<input id="appName" value="Vidora">

<br>

<button class="save" onclick="saveProject()">💾 Save Project</button>
<button class="load" onclick="loadSelectedProject()">📂 Load Project</button>
<button class="new" onclick="newProject()">🆕 New Project</button>

<select id="savedProjects">
<option value="">Saved Projects चुनें</option>
</select>

<button class="delete-saved" onclick="deleteSavedProject()">🗑️ Delete Saved Project</button>

<p id="saveStatus"></p>
</div>


<div class="card">
<h2>Add Component</h2>

<button class="add" onclick="addComponent('text')">+ Text</button>
<button class="add" onclick="addComponent('button')">+ Button</button>
<button class="add" onclick="addComponent('image')">+ Image</button>
<button class="add" onclick="addComponent('video')">+ Video</button>
<button class="add" onclick="addComponent('webview')">+ WebView</button>

<div id="components"></div>
</div>


<div class="card">
<h2>Live Preview</h2>
<div id="preview" class="preview">App Preview</div>
</div>


<div class="card">
<h2>Build App</h2>

<select id="format">
<option value="apk">APK</option>
<option value="aab">AAB</option>
</select>

<button class="build" onclick="buildApp()">Build App</button>

<p id="status"></p>
<div id="download"></div>
</div>


<div class="card">
<details>
<summary>Advanced JSON</summary>
<textarea id="json"></textarea>
</details>
</div>

</div>


<script>

let components=[];


/* ADD COMPONENT */

function addComponent(type){

let c={
type:type,
text:
type==="text" ? "Hello Vidora" :
type==="button" ? "START" : "",
action:type==="button" ? "toast" : "",
actionValue:""
};

components.push(c);
render();

}


/* REMOVE */

function removeComponent(index){

components.splice(index,1);
render();

}


/* UPDATE */

function updateComponent(index,key,value){

components[index][key]=value;

updatePreview();
updateJSON();

if(key==="action"){
render();
}

}


/* RENDER */

function render(){

let box=document.getElementById("components");
box.innerHTML="";

components.forEach((c,i)=>{

let div=document.createElement("div");
div.className="component";

div.innerHTML=`
<b>${c.type.toUpperCase()}</b>
<button class="delete" onclick="removeComponent(${i})">Delete</button>
<br><br>
`;

if(c.type==="button"){

div.innerHTML+=`

<label>Button Text</label>

<input
value="${escapeHtml(c.text||"")}"
placeholder="START"
oninput="updateComponent(${i},'text',this.value)"
>

<div class="action-box">

<label>Button Action</label>

<select onchange="updateComponent(${i},'action',this.value)">

<option value="toast" ${c.action==="toast"?"selected":""}>
Toast Message
</option>

<option value="url" ${c.action==="url"?"selected":""}>
Open URL
</option>

<option value="webview" ${c.action==="webview"?"selected":""}>
Open in WebView
</option>

<option value="video" ${c.action==="video"?"selected":""}>
Play Video
</option>

</select>

<label>Action Value</label>

<input
value="${escapeHtml(c.actionValue||"")}"
placeholder="${actionPlaceholder(c.action)}"
oninput="updateComponent(${i},'actionValue',this.value)"
>

<div class="action-help">
${actionHelp(c.action)}
</div>

</div>
`;

}else{

let label=
c.type==="video" ? "Video URL" :
c.type==="image" ? "Image URL" :
c.type==="webview" ? "WebView URL" :
"Text";

let placeholder=
c.type==="video" ? "https://example.com/video.mp4" :
c.type==="image" ? "https://example.com/image.jpg" :
c.type==="webview" ? "https://example.com" :
"";

div.innerHTML+=`

<label>${label}</label>

<input
value="${escapeHtml(c.text||"")}"
placeholder="${placeholder}"
oninput="updateComponent(${i},'text',this.value)"
>

`;

}

box.appendChild(div);

});

updatePreview();
updateJSON();

}


/* ACTION HELP */

function actionPlaceholder(action){

if(action==="toast") return "START clicked";
if(action==="url") return "https://example.com";
if(action==="webview") return "https://example.com";
if(action==="video") return "Optional: video URL, or leave blank to play first video";

return "";

}


function actionHelp(action){

if(action==="toast")
return "बटन दबाने पर ऐप में Toast message दिखेगा।";

if(action==="url")
return "बटन दबाने पर यह URL browser में खुलेगा।";

if(action==="webview")
return "बटन दबाने पर ऐप के पहले WebView में यह URL खुलेगा।";

if(action==="video")
return "बटन दबाने पर ऐप का पहला Video play होगा। Action Value खाली छोड़ सकते हैं।";

return "";

}


/* PREVIEW */

function updatePreview(){

let preview=document.getElementById("preview");
preview.innerHTML="";

components.forEach(c=>{

if(c.type==="text"){

let p=document.createElement("p");
p.textContent=c.text||"Text";
p.style.fontSize="20px";
preview.appendChild(p);

}


else if(c.type==="button"){

let b=document.createElement("button");
b.textContent=c.text||"Button";

b.onclick=function(){

let action=c.action||"toast";
let value=c.actionValue||"";

if(action==="toast"){

alert(value || ((c.text||"Button")+" clicked"));

}

else if(action==="url"){

if(value) window.open(value,"_blank");
else alert("URL डालें");

}

else if(action==="webview"){

let frame=preview.querySelector("iframe");

if(frame && value)
frame.src=value;
else
alert("WebView component या URL जोड़ें");

}

else if(action==="video"){

let video=preview.querySelector("video");

if(video){

if(value && video.src!==value)
video.src=value;

video.play().catch(()=>{});

}else{

alert("पहले Video component जोड़ें");

}

}

};

preview.appendChild(b);

}


else if(c.type==="image"){

if(c.text){

let img=document.createElement("img");
img.src=c.text;
img.alt="Image";
preview.appendChild(img);

}else{

let p=document.createElement("p");
p.textContent="Image URL डालें";
preview.appendChild(p);

}

}


else if(c.type==="video"){

if(c.text){

let video=document.createElement("video");
video.src=c.text;
video.controls=true;
video.playsInline=true;
preview.appendChild(video);

}else{

let p=document.createElement("p");
p.textContent="Video URL डालें";
preview.appendChild(p);

}

}


else if(c.type==="webview"){

if(c.text){

let iframe=document.createElement("iframe");
iframe.src=c.text;
preview.appendChild(iframe);

}else{

let p=document.createElement("p");
p.textContent="WebView URL डालें";
preview.appendChild(p);

}

}

});

if(components.length===0)
preview.textContent="App Preview";

}


/* PROJECT */

function getProject(){

return{
name:document.getElementById("appName").value || "Vidora",
components:components
};

}


function updateJSON(){

document.getElementById("json").value=
JSON.stringify(getProject(),null,2);

}


/* SAVE */

function saveProject(){

let project=getProject();
let name=project.name.trim();

if(!name){

alert("पहले App Name डालें");
return;

}

let saved={};

try{

saved=JSON.parse(
localStorage.getItem("movixa_projects")||"{}"
);

}catch(e){

saved={};

}

saved[name]=project;

localStorage.setItem(
"movixa_projects",
JSON.stringify(saved)
);

document.getElementById("saveStatus").textContent=
"✅ Project saved: "+name;

refreshSavedProjects();

}


/* REFRESH SAVED */

function refreshSavedProjects(){

let select=document.getElementById("savedProjects");

select.innerHTML=
'<option value="">Saved Projects चुनें</option>';

let saved={};

try{

saved=JSON.parse(
localStorage.getItem("movixa_projects")||"{}"
);

}catch(e){

saved={};

}

Object.keys(saved)
.sort()
.forEach(name=>{

let option=document.createElement("option");

option.value=name;
option.textContent=name;

select.appendChild(option);

});

}


/* LOAD */

function loadSelectedProject(){

let select=document.getElementById("savedProjects");
let name=select.value;

if(!name){

alert("पहले Saved Project चुनें");
return;

}

let saved={};

try{

saved=JSON.parse(
localStorage.getItem("movixa_projects")||"{}"
);

}catch(e){

saved={};

}

let project=saved[name];

if(!project){

alert("Project नहीं मिला");
return;

}

document.getElementById("appName").value=
project.name||name;

components=
Array.isArray(project.components)
? project.components
:[];

render();

document.getElementById("saveStatus").textContent=
"✅ Project loaded: "+name;

}


/* DELETE SAVED */

function deleteSavedProject(){

let select=document.getElementById("savedProjects");
let name=select.value;

if(!name){

alert("पहले Saved Project चुनें");
return;

}

if(!confirm("क्या यह saved project delete करना है?"))
return;

let saved={};

try{

saved=JSON.parse(
localStorage.getItem("movixa_projects")||"{}"
);

}catch(e){

saved={};

}

delete saved[name];

localStorage.setItem(
"movixa_projects",
JSON.stringify(saved)
);

refreshSavedProjects();

document.getElementById("saveStatus").textContent=
"🗑️ Project deleted: "+name;

}


/* NEW PROJECT */

function newProject(){

if(
components.length>0 &&
!confirm("नया project शुरू करना है?")
){

return;

}

document.getElementById("appName").value="Vidora";

components=[];

render();

document.getElementById("saveStatus").textContent=
"🆕 New project शुरू हो गया।";

}


/* BUILD */

async function buildApp(){

let project=getProject();

let status=document.getElementById("status");
let download=document.getElementById("download");

status.textContent="Building...";
download.innerHTML="";

try{

let r=await fetch("/api/build",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

format:document.getElementById("format").value,
project:project

})

});

let j=await r.json();

if(!r.ok){

status.textContent=j.error||"Build failed";
return;

}

poll(j.id);

}catch(e){

status.textContent="Build request failed";

}

}


/* POLL */

async function poll(id){

try{

let r=await fetch("/api/build/"+id);
let j=await r.json();

document.getElementById("status").textContent=
"Status: "+j.status+
(j.error ? " — "+j.error : "");

if(j.status==="completed"){

document.getElementById("download").innerHTML=
'<a href="'+j.download+'">Download '+
j.format.toUpperCase()+
'</a>';

return;

}

if(j.status==="failed")
return;

setTimeout(()=>poll(id),2000);

}catch(e){

document.getElementById("status").textContent=
"Build status error";

}

}


/* ESCAPE */

function escapeHtml(s){

return String(s)
.replace(/&/g,"&amp;")
.replace(/"/g,"&quot;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;");

}


/* APP NAME */

document.getElementById("appName")
.addEventListener("input",updateJSON);


/* START */

refreshSavedProjects();
render();

</script>

</body>
</html>
