const express=require("express");
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const {execFile}=require("child_process");
const {generateAndroidProject}=require("./generator");

const app=express();
app.use(express.json({limit:"5mb"}));

app.get("/",(q,s)=>s.sendFile(path.join(__dirname,"index.html")));
app.use(express.static(__dirname));

const ROOT=__dirname;
const J=path.join(ROOT,"jobs");
const W=path.join(ROOT,"workspace");
const A=path.join(ROOT,"artifacts");

[J,W,A].forEach(x=>fs.mkdirSync(x,{recursive:true}));

const jf=id=>path.join(J,id+".json");
const save=j=>fs.writeFileSync(jf(j.id),JSON.stringify(j,null,2));
const load=id=>fs.existsSync(jf(id))
  ? JSON.parse(fs.readFileSync(jf(id),"utf8"))
  : null;

app.get("/health",(q,s)=>s.json({
  ok:true,
  version:"V8",
  android:process.env.ANDROID_HOME||null
}));

app.post("/api/build",(q,s)=>{
  const {format="apk",project}=q.body||{};

  if(!["apk","aab"].includes(format))
    return s.status(400).json({error:"format must be apk or aab"});

  if(!project||typeof project!=="object")
    return s.status(400).json({error:"project is required"});

  const id=crypto.randomUUID();
  const dir=path.join(W,id);

  const job={
    id,
    status:"queued",
    format,
    projectName:project.name||"Movixa App",
    createdAt:new Date().toISOString()
  };

  save(job);
  s.status(202).json(job);

  setImmediate(async()=>{
    try{
      job.status="generating";
      save(job);

      generateAndroidProject(project,dir);

      job.status="generated";
      save(job);

      job.status="building";
      save(job);

      const cmd=format==="apk"
        ?"gradle assembleDebug"
        :"gradle bundleRelease";

      const parts=cmd.split(" ");
      const exe=parts.shift();

      await new Promise((resolve,reject)=>{
        execFile(
          exe,
          parts,
          {cwd:dir,timeout:15*60*1000},
          (e,out,err)=>{
            if(e){
              job.status="failed";
              job.error=(err||e.message).slice(-5000);
              save(job);
              return reject(e);
            }

            job.log=(out||"").slice(-5000);
            resolve();
          }
        );
      });

      const rel=format==="apk"
        ?"app/build/outputs/apk/debug/app-debug.apk"
        :"app/build/outputs/bundle/release/app-release.aab";

      const src=path.join(dir,rel);

      if(!fs.existsSync(src)){
        job.status="failed";
        job.error="Expected artifact was not produced.";
        save(job);
        return;
      }

      fs.copyFileSync(src,path.join(A,id+"."+format));

      job.status="completed";
      job.download="/api/build/"+id+"/download";
      save(job);

    }catch(e){
      if(job.status!=="failed"){
        job.status="failed";
        job.error=e.message;
        save(job);
      }
    }
  });
});

app.get("/api/build/:id",(q,s)=>{
  const j=load(q.params.id);
  j?s.json(j):s.status(404).json({error:"build not found"});
});

app.get("/api/build/:id/download",(q,s)=>{
  const j=load(q.params.id);

  if(!j||j.status!=="completed")
    return s.status(404).json({error:"artifact not ready"});

  const f=path.join(A,j.id+"."+j.format);

  if(!fs.existsSync(f))
    return s.status(404).json({error:"artifact missing"});

  s.download(
    f,
    (j.projectName||"MovixaApp").replace(/[^a-z0-9_-]/gi,"_")+"."+j.format
  );
});

app.listen(
  process.env.PORT||8080,
  ()=>console.log("Movixa V8 builder ready")
);
