import {test} from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';
const {parseModelResponse}=await import('../server.js');
const {requestAI}=await import('../public/api.js');
const envelope=(content,finish_reason='stop')=>({choices:[{finish_reason,message:{content}}]});
test('员工发言直接接受正文，兼容完整旧格式，拒绝空白或截断结果',()=>{
 assert.deepEqual(parseModelResponse(envelope('我不同意先打折，应先验证客户需求。'),'text'),{text:'我不同意先打折，应先验证客户需求。'});
 assert.deepEqual(parseModelResponse(envelope('{"text":"补充一个测试方案"}'),'text'),{text:'补充一个测试方案'});
 assert.throws(()=>parseModelResponse(envelope('{"text":"未结束'),'text'),/不完整/);
 assert.throws(()=>parseModelResponse(envelope(''),'text'),/空回复/);
 assert.throws(()=>parseModelResponse(envelope('未完成','length'),'text'),/长度上限/);
 assert.throws(()=>parseModelResponse(envelope('{"employees":[')),/角色资料格式不完整/);
 assert.deepEqual(parseModelResponse(envelope('{"employees":[]}')),{employees:[]});
});
test('网页将空响应、HTML错误页、网络中断转为明确提示，不显示原始解析异常',async()=>{
 const original=globalThis.fetch;
 try{
 for(const [status,raw,pattern] of [[200,'',/数据不完整/],[502,'<html>Bad gateway<\/html>',/暂时不可用/],[401,'Authentication required',/登录已失效/],[400,JSON.stringify({error:'模型返回了空回复'}),/空回复/]]){
 globalThis.fetch=async()=>({status,ok:status===200,text:async()=>raw});
 await assert.rejects(requestAI('reply',{}),pattern);
 }
 globalThis.fetch=async()=>{throw new TypeError('Failed to fetch');};
 await assert.rejects(requestAI('reply',{}),/连接中断/);
 globalThis.fetch=async()=>({status:200,ok:true,text:async()=>'{"text":"完整发言"}'});
 assert.deepEqual(await requestAI('reply',{}),{text:'完整发言'});
 }finally{globalThis.fetch=original;}
});
