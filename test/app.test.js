import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';
const {handle}=await import('../server.js');
test('生成指定数量且可编辑的不同员工，聊天采用修改后的职位',async()=>{
 const {employees}=await handle('generate',{demo:true,count:4,topic:'咖啡店低预算开业'});
 assert.equal(employees.length,4);assert.equal(new Set(employees.map(e=>e.name)).size,4);
 for(const e of employees)assert.match(e.description,/年龄：[\s\S]*性格：[\s\S]*履历：[\s\S]*记忆：/);
 employees[0].role='咖啡师';const reply=await handle('reply',{demo:true,employee:employees[0],topic:'开业',history:[{kind:'user',text:'如何吸引附近居民？'}]});
 assert.match(reply.text,/咖啡师/);assert.match(reply.text,/如何吸引附近居民/);
});
test('拒绝无效数量和空方向',async()=>{
 for(const count of [0,1,9,2.5])await assert.rejects(handle('generate',{demo:true,count,topic:'测试'}));
 await assert.rejects(handle('generate',{demo:true,count:3,topic:'  '}));
});
test('拒绝无角色或空上下文的讨论',async()=>{
 await assert.rejects(handle('reply',{demo:true,history:[]}));
 await assert.rejects(handle('reply',{demo:true,employee:{description:'test'},history:[]}));
});
test('品牌资料兼容旧会话，拒绝非文本或过长内容',async()=>{
 for(const brandContext of [123,{},'字'.repeat(12001)])await assert.rejects(handle('generate',{demo:true,count:2,topic:'测试',brandContext}),/品牌资料/);
 assert.equal((await handle('generate',{demo:true,count:2,topic:'测试',brandContext:''})).employees.length,2);
});
