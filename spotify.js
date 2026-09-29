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
    const body=await response.text();
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
  if(busy)throw new Error('Spotify is still handling the previous command. Try again in a moment.');
  if(Date.now()<blockedUntil)throw new Error('Spotify needs a moment. Try again in '+Math.ceil((blockedUntil-Date.now())/1000)+' seconds.');
  busy=true;const epoch=generation;
  const check=()=>{if(epoch!==generation){const e=new Error('Spotify control interrupted. Try again.');e.name='AbortError';throw e;}};
  try{
   let token=await accessToken();check();
   async function api(path,method){
    check();const send=()=>request('https://api.spotify.com/v1/me/player'+path,{method,headers:{Authorization:'Bearer '+token}});
    let r,retried=false;
    // Reads are safe to retry once. A playback command might already have run.
    try{r=await send();}catch(error){check();if(method!=='GET'||error.name==='AbortError'||navigator.onLine===false)throw error;retried=true;r=await send();}
    check();if(method==='GET'&&!retried&&r.status>=500){r=await send();check();}
    if(r.status===401){token=await accessToken(true);check();r=await send();check();}
    if(r.ok)return r;
    if(r.status===404){const error=new Error('Spotify is not available to remote controls. Open Spotify once on your phone, then try again.');error.status=404;throw error;}
    if(r.status===403&&method==='GET'){const e=new Error('Reconnect Spotify once to enable pause and play.');e.reconnect=true;throw e;}
    if(r.status===403)throw new Error('Spotify cannot control this playback. Check Premium and your active device.');
    if(r.status===401){localStorage.removeItem(AUTH_KEY);throw new Error('Please reconnect Spotify in Backup & settings.');}
    if(r.status===429){const seconds=Math.max(1,Number(r.headers.get('Retry-After'))||30);blockedUntil=Date.now()+seconds*1000;throw new Error('Spotify is busy. Try again in '+seconds+' seconds.');}
    throw new Error('Spotify could not confirm the command. Check your music before trying again.');
   }
   async function discoverDevice(){
    const response=await api('/devices','GET');const data=await response.json();check();
    const devices=(data.devices||[]).filter(d=>d.id&&!d.is_restricted),remembered=read(AUTH_KEY)?.last_device_id;
    const phones=devices.filter(d=>d.type?.toLowerCase()==='smartphone');
    const target=devices.find(d=>d.is_active)||devices.find(d=>d.id===remembered)||(phones.length===1?phones[0]:devices.length===1?devices[0]:null);
    if(devices.length&&!target)throw new Error('Several Spotify devices are available. Choose your phone in Spotify once.');
    return target?.id||null;
   }
   let deviceId=null;
   if(action==='toggle'){
    let r;try{r=await api('','GET');}catch(error){if(error.status!==404)throw error;}
    const state=!r||r.status===204?null:await r.json();check();
    if(state?.device?.is_restricted)throw new Error('Spotify does not allow remote control of this device.');
    if(state?.device?.id){deviceId=state.device.id;action=state.is_playing?'pause':'play';}
    else{deviceId=await discoverDevice();action='play';}
   }
   // With no listed device, still let Spotify try its default active player once.
   // Never retry ambiguous command failures or replay a skip automatically.
   const sendCommand=()=>api('/'+action+(deviceId?'?device_id='+encodeURIComponent(deviceId):''),action==='next'?'POST':'PUT');
   try{await sendCommand();}catch(error){
    // A definite 404 means Spotify rejected the command. Refresh a stale target
    // once, preserving the original action rather than toggling it again.
    if(error.status!==404)throw error;
    const refreshed=await discoverDevice();
    if(!refreshed||refreshed===deviceId)throw error;
    deviceId=refreshed;await sendCommand();
   }
   if(deviceId){const auth=read(AUTH_KEY);if(auth){auth.last_device_id=deviceId;localStorage.setItem(AUTH_KEY,JSON.stringify(auth));}}
   return action;
  }finally{if(epoch===generation)busy=false;}
 }
 return {connected,connect,disconnect,finishLogin,cancelPending,next:()=>playback('next'),toggle:()=>playback('toggle')};
}
