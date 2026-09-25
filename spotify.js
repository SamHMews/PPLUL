// Public app identifier. No client secret is used by the PKCE browser flow.
const CLIENT_ID='abea48f03d904d628583c15cbc27a7a9';
const REDIRECT='https://samhmews.github.io/PPLUL/';
const AUTH_KEY='pplul-spotify-auth',FLOW_KEY='pplul-spotify-login';
const SCOPE='user-modify-playback-state';
const encode=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const random=()=>encode(crypto.getRandomValues(new Uint8Array(32)));
function read(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}

export function createSpotify({notify=()=>{}}={}){
 let refreshing=null,busy=false,blockedUntil=0,generation=0;
 const connected=()=>Boolean(read(AUTH_KEY)?.refresh_token);
 function disconnect(){generation++;localStorage.removeItem(AUTH_KEY);localStorage.removeItem(FLOW_KEY);notify('Spotify disconnected on this device.');}
 async function request(url,options){
  if(navigator.onLine===false)throw new Error('Go online to control Spotify.');
  try{return await fetch(url,{...options,cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(12000)});}
  catch{throw new Error('Spotify could not be reached. Check your connection and try again.');}
 }
 async function tokenRequest(params,previous,epoch){
  const r=await request('https://accounts.spotify.com/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:CLIENT_ID,...params})});
  if(!r.ok){if(r.status===400||r.status===401){if(epoch===generation)localStorage.removeItem(AUTH_KEY);throw new Error('Please reconnect Spotify in Backup & settings.');}throw new Error('Spotify sign-in is unavailable. Please try again shortly.');}
  const data=await r.json();
  if(epoch!==generation)throw new Error('Spotify connection changed. Please try again.');
  if(!data.access_token||!(data.refresh_token||previous?.refresh_token))throw new Error('Spotify did not finish connecting. Please reconnect.');
  if(data.scope&&!data.scope.split(' ').includes(SCOPE))throw new Error('Please reconnect Spotify and allow playback control.');
  const auth={access_token:data.access_token,refresh_token:data.refresh_token||previous.refresh_token,expires_at:Date.now()+(Number(data.expires_in)||3600)*1000};
  localStorage.setItem(AUTH_KEY,JSON.stringify(auth));return auth.access_token;
 }
 async function accessToken(force=false){
  const auth=read(AUTH_KEY);if(!auth?.refresh_token)throw new Error('Connect Spotify in Backup & settings first.');
  if(!force&&auth.access_token&&auth.expires_at>Date.now()+60000)return auth.access_token;
  if(!refreshing)refreshing=tokenRequest({grant_type:'refresh_token',refresh_token:auth.refresh_token},auth,generation).finally(()=>{refreshing=null;});
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
  notify('Spotify connected. Start music in Spotify, then use the next-track button.');return true;
 }
 async function next(){
  if(busy)return false;
  if(Date.now()<blockedUntil)throw new Error('Spotify needs a moment. Try again in '+Math.ceil((blockedUntil-Date.now())/1000)+' seconds.');
  busy=true;
  try{
   let token=await accessToken();
   const send=()=>request('https://api.spotify.com/v1/me/player/next',{method:'POST',headers:{Authorization:'Bearer '+token}});
   let r=await send();if(r.status===401){token=await accessToken(true);r=await send();}
   if(r.ok)return true;
   if(r.status===404)throw new Error('Start music in Spotify on your phone, then try again.');
   if(r.status===403)throw new Error('Spotify cannot skip here. Check Premium, your app’s allowed users, and whether this playback allows skipping.');
   if(r.status===401){localStorage.removeItem(AUTH_KEY);throw new Error('Please reconnect Spotify in Backup & settings.');}
   if(r.status===429){const seconds=Math.max(1,Number(r.headers.get('Retry-After'))||30);blockedUntil=Date.now()+seconds*1000;throw new Error('Spotify is busy. Try again in '+seconds+' seconds.');}
   // Never retry an ambiguous playback failure: it could skip two songs.
   throw new Error('Spotify could not confirm the skip. Check your music before trying again.');
  }finally{busy=false;}
 }
 return {connected,connect,disconnect,finishLogin,next};
}
