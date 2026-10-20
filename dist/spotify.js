// Public app identifier. No client secret is used by the PKCE browser flow.
const CLIENT_ID='abea48f03d904d628583c15cbc27a7a9';
const REDIRECT='https://samhmews.github.io/PPLUL/';
const AUTH_KEY='pplul-spotify-auth',FLOW_KEY='pplul-spotify-login';
const SCOPE='user-modify-playback-state user-read-playback-state';
const encode=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const random=()=>encode(crypto.getRandomValues(new Uint8Array(32)));
function read(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}

export function createSpotify({notify=()=>{}}={}){
 let refreshing=null,busy=false,blockedUntil=0,generation=0;
 const pending=new Set();
 function cancelPending(){generation++;busy=false;refreshing=null;for(const cancel of pending)cancel();}

 const connected=()=>Boolean(read(AUTH_KEY)?.refresh_token);
 function disconnect(){cancelPending();localStorage.removeItem(AUTH_KEY);localStorage.removeItem(FLOW_KEY);notify('Spotify disconnected on this device.');}
 async function request(url,options){
  if(navigator.onLine===false)throw new Error('Go online to control Spotify.');
  const controller=new AbortController();let cancel,timer;
  const interrupted=new Promise((_,reject)=>{cancel=()=>{controller.abort();const error=new Error('Spotify control interrupted. Try again.');error.name='AbortError';reject(error);};pending.add(cancel);timer=setTimeout(()=>{controller.abort();reject(new Error('Spotify took too long. Check your music before trying again.'));},5000);});
  try{
   // A fetch resolves at headers; reading the body can still stall indefinitely.
   // Keep timeout/background cancellation active through the entire response.
   const complete=fetch(url,{...options,cache:'no-store',referrerPolicy:'no-referrer',signal:controller.signal}).then(async response=>{
    const body=response.status===204?'':await response.text();
    return {ok:response.ok,status:response.status,headers:response.headers,json:async()=>JSON.parse(body)};
   });
   return await Promise.race([complete,interrupted]);
  }
  finally{clearTimeout(timer);pending.delete(cancel);}
 }
 async function tokenRequest(params,previous,epoch){
  const r=await request('https://accounts.spotify.com/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:CLIENT_ID,...params})});
  if(!r.ok){if(r.status===400||r.status===401){if(epoch===generation)localStorage.removeItem(AUTH_KEY);throw new Error('Please reconnect Spotify in Backup & settings.');}throw new Error('Spotify sign-in is unavailable. Please try again shortly.');}
  const data=await r.json();
  if(epoch!==generation)throw new Error('Spotify connection changed. Please try again.');
  if(!data.access_token||!(data.refresh_token||previous?.refresh_token))throw new Error('Spotify did not finish connecting. Please reconnect.');
  if(data.scope&&!(params.grant_type==='authorization_code'?SCOPE.split(' '):['user-modify-playback-state']).every(scope=>data.scope.split(' ').includes(scope)))throw new Error('Please reconnect Spotify and allow playback control.');
  const auth={last_device_id:previous?.last_device_id||null,scope:data.scope||previous?.scope||SCOPE,access_token:data.access_token,refresh_token:data.refresh_token||previous.refresh_token,expires_at:Date.now()+(Number(data.expires_in)||3600)*1000};
  localStorage.setItem(AUTH_KEY,JSON.stringify(auth));return auth.access_token;
 }
 async function accessToken(force=false){
  const auth=read(AUTH_KEY);if(!auth?.refresh_token)throw new Error('Connect Spotify in Backup & settings first.');
  if(!force&&auth.access_token&&auth.expires_at>Date.now()+60000)return auth.access_token;
  if(!refreshing){const epoch=generation;refreshing=tokenRequest({grant_type:'refresh_token',refresh_token:auth.refresh_token},auth,epoch).finally(()=>{if(epoch===generation)refreshing=null;});}
  return refreshing;
 }
 async function connect(){
  if(navigator.onLine===false)throw new Error('Go online to connect Spotify.');
  const verifier=random(),state=random(),challenge=encode(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)));
  localStorage.setItem(FLOW_KEY,JSON.stringify({verifier,state,created:Date.now()}));
  const query=new URLSearchParams({client_id:CLIENT_ID,response_type:'code',redirect_uri:REDIRECT,scope:SCOPE,state,code_challenge_method:'S256',code_challenge:challenge});
  location.assign('https://accounts.spotify.com/authorize?'+query);
 }
 async function finishLogin(){
  const url=new URL(location.href);if(!url.searchParams.has('code')&&!url.searchParams.has('error'))return false;
  const code=url.searchParams.get('code'),error=url.searchParams.get('error'),state=url.searchParams.get('state'),flow=read(FLOW_KEY);
  for(const key of ['code','state','error','error_description'])url.searchParams.delete(key);
  history.replaceState(history.state,'',url.pathname+url.search+url.hash);
  localStorage.removeItem(FLOW_KEY);
  if(!flow||!state||state!==flow.state||Date.now()-flow.created>600000)throw new Error('Spotify sign-in expired or opened in a different browser. Connect again from this app.');
  if(error)throw new Error('Spotify connection cancelled. You can connect again in Backup & settings.');
  await tokenRequest({grant_type:'authorization_code',code,redirect_uri:REDIRECT,code_verifier:flow.verifier},null,generation);
  notify('Spotify connected. Drag up to pause or play, or down for the next song.');return true;
 }
 async function playback(action){
  // A second gesture never queues an extra skip while a command is in flight.
  if(busy)return;
  if(Date.now()<blockedUntil)throw new Error('Spotify needs a moment. Try again in '+Math.ceil((blockedUntil-Date.now())/1000)+' seconds.');
  busy=true;const epoch=generation;
  const check=()=>{if(epoch!==generation){const e=new Error('Spotify control interrupted. Try again.');e.name='AbortError';throw e;}};
  try{
   let token=await accessToken();check();
   async function api(path,method){
    check();const send=()=>request('https://api.spotify.com/v1/me/player'+path,{method,headers:{Authorization:'Bearer '+token}});
    let r,retried=false;
    try{r=await send();}catch(error){check();if(method!=='GET'||error.name==='AbortError'||navigator.onLine===false)throw error;retried=true;r=await send();}
    check();if(method==='GET'&&!retried&&r.status>=500){r=await send();check();}
    if(r.status===401){token=await accessToken(true);check();r=await send();check();}
    if(r.ok)return r;
    let reason='';try{reason=(await r.json()).error?.reason||'';}catch{}
    const error=new Error('Spotify could not confirm the command. Check your music before trying again.');error.status=r.status;error.reason=reason;
    if(r.status===404)error.message='Spotify has no reachable playback device. Start playback in Spotify once, then try again.';
    if(r.status===403&&method==='GET'){error.message='Reconnect Spotify once to enable playback control.';error.reconnect=true;}
    else if(r.status===403)error.message='Spotify cannot control this playback. Check Premium and your active device.';
    if(r.status===401){localStorage.removeItem(AUTH_KEY);error.message='Please reconnect Spotify in Backup & settings.';}
    if(r.status===429){const seconds=Math.max(1,Number(r.headers.get('Retry-After'))||30);blockedUntil=Date.now()+seconds*1000;error.message='Spotify is busy. Try again in '+seconds+' seconds.';}
    throw error;
   }
   async function current(){try{const r=await api('','GET');return r.status===204?null:await r.json();}catch(e){if(e.status===404)return null;throw e;}}
   async function devices(){const r=await api('/devices','GET');const data=await r.json();check();return (data.devices||[]).filter(d=>d.id&&!d.is_restricted);}
   function choose(list){
    const remembered=read(AUTH_KEY)?.last_device_id,phones=list.filter(d=>d.type?.toLowerCase()==='smartphone');
    // Reuse a remembered ID only when a fresh device list still contains it.
    return list.find(d=>d.is_active)||list.find(d=>d.id===remembered)||(phones.length===1?phones[0]:list.length===1?list[0]:null);
   }
   let before=null;
   try{before=await current();}catch(e){
    // Temporary discovery failure need not block a skip to the default active player.
    if(action==='toggle'||[401,403,429].includes(e.status)||e.name==='AbortError'||navigator.onLine===false)throw e;
   }
   check();
   if(before?.device?.is_restricted)throw new Error('Spotify does not allow remote control of this device.');
   let deviceId=before?.device?.id||null;
   if(action==='toggle')action=before?.is_playing?'pause':'play';
   if(!deviceId){try{deviceId=choose(await devices())?.id||null;}catch(e){if([401,403,429].includes(e.status)||e.name==='AbortError')throw e;}}
   const itemId=s=>s?.item?.uri||s?.item?.id;
   const achieved=after=>{
    if(!after)return false;
    if(action==='play')return after.is_playing===true;
    if(action==='pause')return after.is_playing===false&&Boolean(after.device);
    if(itemId(before)&&itemId(after)&&itemId(before)!==itemId(after))return true;
    return action==='previous'&&itemId(before)&&itemId(before)===itemId(after)&&before.progress_ms>2000&&after.progress_ms<1000;
   };
   const send=()=>api('/'+action+(deviceId?'?device_id='+encodeURIComponent(deviceId):''),['next','previous'].includes(action)?'POST':'PUT');
   async function verify(){try{const after=await current();check();return after;}catch(e){check();if(e.name==='AbortError')throw e;return null;}}
   try{await send();}catch(error){
    check();if(error.name==='AbortError'||[400,401,403,429].includes(error.status)||navigator.onLine===false)throw error;
    // Successful 204 responses never reach discovery or verification.
    let after=await verify();if(achieved(after))return action;
    if(error.status!==404){
     // Ambiguous network/5xx failures may follow a successful skip. Verify, never repeat it.
     await new Promise(resolve=>setTimeout(resolve,220));check();after=await verify();if(achieved(after))return action;throw error;
    }
    // Explicit rejection: refresh the route once, preserving the original action.
    let refreshed=after?.device&&!after.device.is_restricted?after.device.id:null;
    if(!refreshed||refreshed===deviceId){try{refreshed=choose(await devices())?.id||null;}catch(e){if(e.name==='AbortError'||[401,403,429].includes(e.status))throw e;}}
    if(refreshed===deviceId||!refreshed&&!deviceId)throw error;
    deviceId=refreshed;
    try{await send();}catch(retryError){check();if(retryError.name==='AbortError'||[400,401,403,429].includes(retryError.status))throw retryError;if(achieved(await verify()))return action;throw retryError;}
   }
   check();
   if(deviceId){const auth=read(AUTH_KEY);if(auth){auth.last_device_id=deviceId;localStorage.setItem(AUTH_KEY,JSON.stringify(auth));}}
   return action;
  }finally{if(epoch===generation)busy=false;}
 }

 return {connected,connect,disconnect,finishLogin,cancelPending,next:()=>playback('next'),previous:()=>playback('previous'),toggle:()=>playback('toggle')};
}
