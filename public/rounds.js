// A round snapshot survives refresh/retry; partial answers never change independent inputs.
export function beginRound(state,text,independent=false){
 const number=state.messages.filter(m=>m.kind==='user').length;
 const phase=number===0||independent?'independent':'shared';
 const order=state.employees.map((_,i)=>(i+number)%state.employees.length);
 state.messages.push({kind:'user',name:'我',text,phase});
 state.round={phase,order,baseHistory:state.messages.map(m=>({...m})),brandContext:state.brandContext||'',discussionMode:state.discussionMode||'discussion'};
 state.pending=0;
}
export function restoreRound(state){
 if(state.pending===null||state.round)return;
 // Old versions always used original employee order. Preserve progress on migration.
 state.round={phase:'shared',order:state.employees.map((_,i)=>i),baseHistory:[],brandContext:state.brandContext||'',discussionMode:state.discussionMode||'discussion'};
}
export function replyInput(state){
 restoreRound(state);
 const round=state.round;
 return {employee:state.employees[round.order[state.pending]],history:round.phase==='independent'?round.baseHistory:state.messages,topic:state.topic,demo:state.demo,brandContext:round.brandContext,discussionMode:round.discussionMode,roundPhase:round.phase};
}
export function recordReply(state,text){
 const {employee}=replyInput(state);
 state.messages.push({kind:'employee',name:employee.name,text});
 state.pending++;
 if(state.pending===state.round.order.length){state.pending=null;state.round=null;}
}
