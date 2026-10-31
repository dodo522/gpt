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
test('区分上游额度不足、速率限制和无效密钥且不暴露上游原始信息',()=>{
 execFileSync(process.execPath,['--input-type=module','-e',`
 import assert from 'node:assert/strict';
 process.env.NODE_ENV='test';process.env.OPENAI_API_KEY='test-not-a-real-key';
 const {handle}=await import('./server.js');
 for(const [status,code,expected] of [[429,'insufficient_quota',/可用额度不足/],[429,'rate_limit_exceeded',/调用速率受限/],[429,'unknown',/暂未能区分/],[401,'invalid_api_key',/密钥验证失败/]]){
 globalThis.fetch=async()=>({ok:false,status,json:async()=>({error:{code,message:'sensitive-upstream-detail'}})});
 await assert.rejects(handle('generate',{count:2,topic:'测试',demo:false}),error=>{assert.match(error.message,expected);assert.ok(!error.message.includes('sensitive-upstream-detail'));return true;});
 }
 `],{cwd:process.cwd(),stdio:'pipe'});
});
test('DeepSeek 使用独立密钥、正确接口及参数，并区分余额和限流',()=>{
 execFileSync(process.execPath,['--input-type=module','-e',`
 import assert from 'node:assert/strict';
 process.env.NODE_ENV='test';process.env.AI_PROVIDER='deepseek';process.env.DEEPSEEK_API_KEY='test-deepseek-key';process.env.OPENAI_API_KEY='must-not-be-used';delete process.env.DEEPSEEK_MODEL;
 const {handle,authorized}=await import('./server.js');
 assert.equal(authorized(),false);
 const employee={name:'测试',role:'设计师',description:'谨慎，重视用户体验'};
 const history=[{kind:'user',name:'我',text:'怎么设计活动？'}];
 globalThis.fetch=async(url,options)=>{
 assert.equal(url,'https://api.deepseek.com/chat/completions');assert.equal(options.headers.Authorization,'Bearer test-deepseek-key');
 const body=JSON.parse(options.body);assert.equal(body.model,'deepseek-chat');assert.equal(body.max_tokens,5000);assert.ok(!('max_completion_tokens' in body));assert.deepEqual(body.response_format,{type:'json_object'});assert.deepEqual(JSON.parse(body.messages[1].content).history,history);
 return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({text:'先明确用户场景。'})}}]})};
 };
 assert.equal((await handle('reply',{demo:false,employee,history,topic:'活动'})).text,'先明确用户场景。');
 for(const [status,pattern] of [[402,/DeepSeek API 余额不足/],[429,/DeepSeek API 调用速率受限/],[401,/DEEPSEEK_API_KEY/]]){
 globalThis.fetch=async()=>({ok:false,status,json:async()=>({error:{message:'private upstream information'}})});
 await assert.rejects(handle('reply',{demo:false,employee,history}),pattern);
 }
 `],{cwd:process.cwd(),stdio:'pipe',env:{...process.env,APP_PASSWORD:''}});
});
