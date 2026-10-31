export async function requestAI(action,data){
 let response;
 try{response=await fetch('/api/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});}catch{throw new Error('连接中断或网络不可用，请确认网络后重试。');}
 const raw=await response.text();
 let result;
 try{result=JSON.parse(raw);}catch{
  if(response.status===401)throw new Error('网站登录已失效，请刷新页面并重新输入访问密码。');
  if([502,503,504].includes(response.status))throw new Error('网站服务暂时不可用或请求超时，请等待服务恢复后重试。');
  throw new Error(`服务器返回的数据不完整${response.status?`（HTTP ${response.status}）`:''}，请稍后重试。`);
 }
 if(!response.ok)throw new Error(typeof result?.error==='string'?result.error:'请求失败，请稍后重试。');
 if(!result||typeof result!=='object')throw new Error('服务器返回的数据格式不正确，请稍后重试。');
 if(action==='reply'&&(typeof result.text!=='string'||!result.text.trim()))throw new Error('员工返回了空发言，请重试。');
 return result;
}
