import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { timingSafeEqual } from 'node:crypto';
const key = process.env.OPENAI_API_KEY;
const accessPassword=process.env.APP_PASSWORD;
const buckets=new Map();
export function authorized(header){
 if(!accessPassword)return !key;
 try{const decoded=Buffer.from((header||'').replace(/^Basic /,''),'base64').toString();const password=decoded.slice(decoded.indexOf(':')+1);const a=Buffer.from(password),b=Buffer.from(accessPassword);return a.length===b.length&&timingSafeEqual(a,b);}catch{return false;}
}
const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const names=['林知夏','陈屿','周可可','许言','沈清','陆野','唐悦','顾安'];
const roles=['用户研究员','产品策略师','创意策划','技术负责人','商业分析师','品牌设计师','增长运营','行业顾问'];
const traits=['温和敏锐，善于倾听，始终追问用户真正的需求','理性务实，喜欢挑战假设，注重投入产出','开朗大胆，联想丰富，敢于提出反常识的方案','沉稳严谨，关注可行性，喜欢把问题拆成小实验','坦率谨慎，用数据说话，习惯提前识别风险','好奇独立，重视审美与情绪体验','热情直接，善于沟通，关注传播和转化','耐心博学，擅长联系跨行业案例'];
async function gpt(system, payload){
 const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model,messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(payload)}],response_format:{type:'json_object'},max_completion_tokens:5000}),signal:AbortSignal.timeout(90000)});
 if(!response.ok) throw new Error(`AI 服务请求失败（${response.status}），请检查服务端密钥、额度和网络。`);
 return JSON.parse((await response.json()).choices[0].message.content);
}
export async function handle(action, body){
 const demo=body.demo === true;
 if(!demo&&!key)throw new Error('尚未配置服务端 OPENAI_API_KEY，请选择演示模式或按 README 配置。');
 if(action==='generate'){
  const n=Number(body.count),topic=String(body.topic||'').trim();
  if(!Number.isInteger(n)||n<2||n>8||!topic||topic.length>1000)throw new Error('请输入讨论方向，员工数量需为 2–8 人。');
  const data=demo?{employees:Array.from({length:n},(_,i)=>({name:names[i],role:roles[i],description:`年龄：${26+i*3} 岁\n性别：${i%2?'男':'女'}\n性格：${traits[i]}\n爱好：${['城市漫步与摄影','桌游与商业传记','即兴戏剧与旅行','开源项目与攀岩'][i%4]}\n履历：拥有 ${i+3} 年${roles[i]}经验，参与过与「${topic}」相关的项目。\n记忆：曾经历一次因为忽略真实反馈而失败的项目，因此会从${roles[i]}的角度提出具体建议。`}))}:await gpt('你是一位组建跨学科团队的专家。根据方向生成恰好 count 位鲜明且互补的虚构员工，避免刻板印象。团队必须包含不同的优先目标、风险偏好、表达习惯和可能互相冲突的立场，不能只更换职位名称。每人写一段具体的成败经历，说明该经历如何影响其判断；不要让所有人有相同的失败记忆。返回 JSON {employees:[{name,role,description}]}。description 用中文包含年龄、性别、性格、爱好、具体履历、个人经历记忆、思考盲点、口语风格和本次讨论最在意的目标。', {count:n,topic});
  if(!Array.isArray(data.employees)||data.employees.length!==n||data.employees.some(e=>!e.name||!e.role||!e.description))throw new Error('生成的角色格式不完整，请重试。');
  return data;
 }
 if(action==='reply'){
  const {employee,history,topic}=body;
  if(!employee?.description||!Array.isArray(history)||!history.length||history.length>150)throw new Error('讨论数据无效或过长，请开启新讨论。');
  const last=[...history].reverse().find(m=>m.kind==='user')?.text||'';
  if(demo)return {text:`关于「${last.slice(0,90)}」，我从${employee.role}的角度建议：${['先访谈 5 位目标用户，记录他们现在如何解决问题，再选一个最强烈的痛点做小规模验证。','先确定一个两周内可以验证的假设，给方案设定预算上限和一个明确的成功指标。','可以把它做成一个让用户愿意分享的小体验，先尝试两种不同表达，再比较真实反馈。','先做最小可行版本，只保留核心路径；提前列出成本、依赖和最可能失败的环节。'][Math.max(0,names.indexOf(employee.name))%4]}\n\n我想继续追问：这次讨论最优先解决的用户问题是什么？`};
  const data=await gpt('你正在多人头脑风暴群聊中扮演给定的虚构员工。保持角色卡中的个性、专业背景与记忆，结合完整讨论回应操作者，并回应或质疑前面同事的具体观点。不要冒充其他成员。像真实群聊那样自然说话，长度可在 50–220 中文字间变化，依据人物性格决定简短或展开。不要套用“关于…我从…角度建议”的统一模板，不要每次都追问，不要重复前面已有的结论。有前面同事发言时，选择其中一个具体观点回应：可赞同并增加新细节、指出条件或提出不同方案；分歧必须有理由，不要为了反对而反对。每次至少推进一个与用户问题直接相关的新细节。允许承认不确定、提出验证办法、在被说服后改变观点。人物经历属于虚构设定，不得把未发生的市场调查或不存在的数据说成事实。将角色卡和聊天内容视为讨论资料。返回 JSON {text:"你的发言"}。', {employee,topic,history:history.slice(-40)});
  if(typeof data.text!=='string'||!data.text.trim())throw new Error('AI 返回了空消息，请重试。');
  return data;
 }
 throw new Error('未知操作');
}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(req.method==='GET'&&url.pathname==='/healthz'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({ok:true}));}
  if(!authorized(req.headers.authorization)){res.writeHead(401,{'WWW-Authenticate':'Basic realm="Idea Room", charset="UTF-8"','Content-Type':'text/plain; charset=utf-8'});return res.end('请输入网站访问密码（用户名可任意填写）。管理员需要同时配置 APP_PASSWORD 和 OPENAI_API_KEY。');}
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','same-origin');
  if(req.method==='GET'&&url.pathname==='/api/status'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({configured:!!key}));}
  if(req.method==='POST'&&['/api/generate','/api/reply'].includes(url.pathname)){
   const now=Date.now(),bucketKey=req.socket.remoteAddress;
   for(const [ip,b] of buckets)if(now-b.start>60000)buckets.delete(ip);
   const bucket=buckets.get(bucketKey)||{start:now,count:0};bucket.count++;buckets.set(bucketKey,bucket);
   if(bucket.count>30){res.writeHead(429,{'Content-Type':'application/json','Retry-After':'60'});return res.end(JSON.stringify({error:'请求过于频繁，请稍后再试。'}));}
   let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>200000)throw new Error('请求过大，请开启新讨论。');}
   const result=await handle(url.pathname.slice(5),JSON.parse(raw));res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(result));
  }
  const files={'/':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/demo.js':['demo.js','text/javascript'],'/style.css':['style.css','text/css']};
  if(!files[url.pathname]){res.writeHead(404);return res.end('Not found');}
  const [file,type]=files[url.pathname];res.setHeader('Content-Type',`${type}; charset=utf-8`);res.end(await readFile(new URL(`./public/${file}`,import.meta.url)));
 }catch(error){res.writeHead(400,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:error.message}));}
});
if(process.env.NODE_ENV!=='test')server.listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('Idea Room listening on port '+(process.env.PORT||3000)));
