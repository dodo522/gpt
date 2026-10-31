const names=['林知夏','陈屿','周可可','许言','沈清','陆野','唐悦','顾安'];
const roles=['用户研究员','产品策略师','创意策划','技术负责人','商业分析师','品牌设计师','增长运营','行业顾问'];
const traits=['温和敏锐，善于倾听，关注用户真实需求','理性务实，挑战假设，注重投入产出','开朗大胆，联想丰富，敢于提出反常识的方案','沉稳严谨，关注可行性，喜欢拆解问题','坦率谨慎，用数据说话，提前识别风险','好奇独立，重视审美和情绪体验','热情直接，关注传播与转化','耐心博学，善于联系跨行业案例'];
export async function demoRequest(action,data){
 await new Promise(resolve=>setTimeout(resolve,450));
 if(action==='generate'){
 const count=Number(data.count),topic=String(data.topic||'').trim();
 if(!Number.isInteger(count)||count<2||count>8||!topic)throw new Error('请输入讨论方向，员工数量需为 2–8 人。');
 return {employees:Array.from({length:count},(_,i)=>({name:names[i],role:roles[i],description:`年龄：${26+i*3} 岁\n性别：${i%2?'男':'女'}\n性格：${traits[i]}\n爱好：${['摄影与城市漫步','桌游与商业传记','即兴戏剧与旅行','开源项目与攀岩'][i%4]}\n履历：拥有 ${i+3} 年${roles[i]}经验，参与过与「${topic}」相关的项目。\n记忆：曾经历一次忽略真实反馈而失败的项目，因此习惯从${roles[i]}的角度提出具体建议。`}))};
 }
 const employee=data.employee,last=[...data.history].reverse().find(m=>m.kind==='user')?.text||'';
 const suggestions=['先访谈 5 位目标用户，记录他们目前如何解决问题，再选最强烈的痛点做小规模验证。','先确定一个两周内可以验证的假设，给方案设定预算上限和明确的成功指标。','可以做一个让用户愿意分享的小体验，尝试两种不同表达，再比较真实反馈。','先做最小可行版本，只保留核心路径；列出成本、依赖和最可能失败的环节。','先列出固定成本和单次获客成本，设定止损线，避免在验证之前投入过多。','为核心体验设计清晰的视觉线索，让用户一眼知道价值，再观察他们是否愿意尝试。','邀请第一批用户共同参与，把反馈转成下一轮行动，衡量留存而非只看曝光。','找三个相似案例，对比它们的约束条件，再决定哪些经验适合我们。'];
 return {text:`关于「${last.slice(0,90)}」，我从${employee.role}的角度建议：${suggestions[Math.max(0,names.indexOf(employee.name))]}\n\n我想继续追问：这次讨论最优先解决的用户问题是什么？`};
}
