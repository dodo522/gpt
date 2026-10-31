import {test} from 'node:test';
import assert from 'node:assert/strict';
import {beginRound,replyInput,recordReply} from '../public/rounds.js';
function fresh(){return {employees:['甲','乙','丙'].map(name=>({name,description:'角色'})),messages:[],pending:null,brandContext:'品牌资料',discussionMode:'discussion'};}
function finish(state){while(state.pending!==null)recordReply(state,replyInput(state).employee.name+'的观点');}
test('首轮每人看到相同独立快照；保存、刷新与重试不泄漏同事本轮答案',()=>{
 let s=fresh();beginRound(s,'怎么做营销？');
 const first=structuredClone(replyInput(s));assert.equal(first.roundPhase,'independent');
 recordReply(s,'甲的独特建议');s=JSON.parse(JSON.stringify(s));
 const second=replyInput(s);assert.equal(second.employee.name,'乙');assert.deepEqual(second.history,first.history);
 assert.ok(!JSON.stringify(second.history).includes('甲的独特建议'));
 const retry=replyInput(JSON.parse(JSON.stringify(s)));assert.deepEqual(retry,second);
 finish(s);assert.equal(s.messages.length,4);assert.equal(s.round,null);
});
test('后续共享轮按乙丙甲、丙甲乙轮换，能看到本轮同事回复',()=>{
 const s=fresh();beginRound(s,'第一个问题');finish(s);
 beginRound(s,'继续谈谈');assert.equal(replyInput(s).roundPhase,'shared');assert.equal(replyInput(s).employee.name,'乙');
 recordReply(s,'乙的补充');assert.equal(replyInput(s).employee.name,'丙');assert.equal(replyInput(s).history.at(-1).text,'乙的补充');
 finish(s);beginRound(s,'再讨论');assert.deepEqual(s.round.order,[2,0,1]);finish(s);
 beginRound(s,'第四轮');assert.deepEqual(s.round.order,[0,1,2]);
});
test('新问题恢复独立回答但保留此前对话、品牌及角色',()=>{
 const s=fresh();beginRound(s,'老问题');finish(s);beginRound(s,'新问题',true);
 const before=structuredClone(replyInput(s));assert.equal(before.roundPhase,'independent');assert.equal(before.history.length,5);assert.equal(before.brandContext,'品牌资料');
 recordReply(s,'新轮第一条');assert.deepEqual(replyInput(s).history,before.history);
});
test('旧版中途失败会话保留原始顺序和已完成进度',()=>{
 const s=fresh();s.messages=[{kind:'user',text:'问题'},{kind:'employee',name:'甲',text:'完成'}];s.pending=1;
 assert.equal(replyInput(s).employee.name,'乙');assert.equal(replyInput(s).roundPhase,'shared');finish(s);assert.equal(s.messages.length,4);
});
