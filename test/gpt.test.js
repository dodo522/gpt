import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
test('服务端鉴权、角色请求和聊天上下文通过模拟上游验证',()=>{
 execFileSync(process.execPath,['--input-type=module','-e',`
 import assert from 'node:assert/strict';
 process.env.NODE_ENV='test';process.env.OPENAI_API_KEY='test-not-a-real-key';process.env.APP_PASSWORD='private-test-password';
 const {handle,authorized}=await import('./server.js');
 assert.equal(authorized(),false);
 assert.equal(authorized('Basic '+Buffer.from('user:wrong').toString('base64')),false);
 assert.equal(authorized('Basic '+Buffer.from('user:private-test-password').toString('base64')),true);
 const calls=[];
 globalThis.fetch=async(url,options)=>{calls.push(JSON.parse(options.body));return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(calls.length===1?{employees:[{name:'甲',role:'研究员',description:'谨慎，关注需求'},{name:'乙',role:'策划',description:'大胆，偏好实验'}]}:{text:'甲提到访谈，我建议先明确访谈对象，再测试活动邀请。'})}}]})};};
 const {employees}=await handle('generate',{count:2,topic:'咖啡店开业',demo:false});
 const history=[{kind:'user',name:'我',text:'预算很少，怎么办？'},{kind:'employee',name:'甲',text:'先访谈附近居民。'}];
 const reply=await handle('reply',{employee:employees[1],history,topic:'咖啡店开业',demo:false});
 assert.equal(calls.length,2);assert.equal(calls[0].model,'gpt-4.1-mini');
 assert.deepEqual(JSON.parse(calls[1].messages[1].content).history,history);
 assert.match(calls[1].messages[0].content,/不要套用/);assert.match(reply.text,/访谈对象/);
 `],{cwd:process.cwd(),stdio:'pipe'});
});
