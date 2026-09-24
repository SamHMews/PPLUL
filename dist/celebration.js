const plateImage=new Image();plateImage.src=new URL('./weight-plate.png',import.meta.url).href;
const plateReady=plateImage.decode();plateReady.catch(()=>{});
function runFrames(draw,signal){return new Promise((resolve,reject)=>{let frame;const start=performance.now();const stop=()=>{cancelAnimationFrame(frame);signal.removeEventListener('abort',stop);resolve();};signal.addEventListener('abort',stop,{once:true});if(signal.aborted){stop();return;}function tick(now){try{if(draw(now-start)){stop();return;}frame=requestAnimationFrame(tick);}catch(e){signal.removeEventListener('abort',stop);reject(e);}}frame=requestAnimationFrame(tick);});}
export async function celebrateDay(app,showHome=async()=>{}){
 const layer=document.createElement('div');layer.className='plate-celebration';layer.setAttribute('aria-hidden','true');document.body.append(layer);
 const canvas=document.createElement('canvas'),w=visualViewport?.width||innerWidth,h=visualViewport?.height||innerHeight,dpr=Math.min(devicePixelRatio,2);canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.cssText='display:block;width:100%;height:100%';layer.style.top=(visualViewport?.offsetTop||0)+'px';layer.style.height=h+'px';layer.append(canvas);
 const previousInert=app.inert,previousTransform=app.style.transform;app.inert=true;const events=new AbortController(),stop=()=>events.abort();document.addEventListener('visibilitychange',stop,{once:true});window.addEventListener('resize',stop,{once:true});canvas.addEventListener('webglcontextlost',stop,{once:true});let gl;
 async function stillPlate(){canvas.style.display='none';const image=plateImage.cloneNode();image.alt='';image.style.cssText='position:absolute;width:80%;left:29%;bottom:0';layer.append(image);await runFrames(t=>{image.style.opacity=t<200?'0':'1';return t>=650;},events.signal);}
 try{
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)await stillPlate();
  else{gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});if(gl){layer.dataset.renderer='webgl';await drawPlate(app,layer,canvas,gl,w,h,events.signal);}else await stillPlate();}
 }catch{if(!events.signal.aborted)await stillPlate();}
 finally{
  try{await showHome();}finally{
   // Home renders and the opaque plate is removed within the same microtask turn.
   // No rAF or timeout may separate these DOM changes.
   events.abort();document.removeEventListener('visibilitychange',stop);window.removeEventListener('resize',stop);app.inert=previousInert;app.style.transform=previousTransform;layer.remove();gl?.getExtension('WEBGL_lose_context')?.loseContext();
  }
 }
}
async function drawPlate(app,layer,canvas,gl,w,h,signal){
 const vs=`attribute vec3 p;attribute vec3 n;attribute vec2 uv;attribute float face;uniform mat4 model;uniform mat4 projection;varying vec3 normal;varying vec3 world;varying vec2 tex;varying float front;void main(){vec4 pos=model*vec4(p,1.);world=pos.xyz;normal=normalize(mat3(model)*n);tex=uv;front=face;pos.z-=6.;gl_Position=projection*pos;}`;
 const fs=`precision mediump float;varying vec3 normal;varying vec3 world;varying vec2 tex;varying float front;uniform sampler2D image;uniform float opacity;float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}void main(){vec3 N=normalize(normal);vec3 L=normalize(vec3(-.6,1.,1.6));vec3 V=normalize(vec3(0.,0.,6.)-world);float diffuse=max(dot(N,L),0.);float grain=noise(tex*1700.);vec3 base;float a=1.;if(front>.5){vec4 t=texture2D(image,tex);base=t.rgb;a=t.a;}else{base=vec3(.105+.055*grain);float scratches=step(.985,noise(vec2(floor(tex.x*240.),floor(tex.y*24.))));base+=scratches*.15;}if(a<.1)discard;float spec=pow(max(dot(reflect(-L,N),V),0.),24.)*.20;vec3 c=base*(.50+diffuse*.78)+vec3(spec);gl_FragColor=vec4(c,a*opacity);}`;
 function shader(type,code){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const data=[],positions=[];function vertex(r,a,z,nx,ny,nz,face){const x=r*Math.cos(a),y=r*Math.sin(a);data.push(x,y,z,nx,ny,nz,(x+1)/2,(1-y)/2,face);positions.push([x,y,z]);}
 function band(r1,z1,r2,z2,face,invert=false){for(let i=0;i<128;i++){const a=i/128*Math.PI*2,b=(i+1)/128*Math.PI*2;const dr=r2-r1,dz=z2-z1,len=Math.hypot(dr,dz),radial=-dz/len*(invert?-1:1),nz=dr/len*(invert?-1:1);for(const [r,z,t] of [[r1,z1,a],[r2,z2,a],[r2,z2,b],[r1,z1,a],[r2,z2,b],[r1,z1,b]])vertex(r,t,z,radial*Math.cos(t),radial*Math.sin(t),nz,face);}}
 const profile=[[.13,.07],[.16,.12],[.27,.12],[.30,.055],[.86,.055],[.9,.12],[.97,.12],[1,.075]];
 for(let i=0;i<profile.length-1;i++){band(...profile[i],...profile[i+1],1);band(profile[i][0],-profile[i][1],profile[i+1][0],-profile[i+1][1],1,true);}band(1,.075,1,-.075,0);band(.13,-.07,.13,.07,0);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);for(const [name,size,offset] of [['p',3,0],['n',3,3],['uv',2,6],['face',1,8]]){const at=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,size,gl.FLOAT,false,36,offset*4);}
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);await Promise.race([plateReady,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Plate load timeout')),1800))]);const image=plateImage;gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.viewport(0,0,canvas.width,canvas.height);
 const f=1/Math.tan(Math.PI/8),aspect=w/h,projection=new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,-1.002,-1,0,0,-.2002,0]);gl.uniformMatrix4fv(gl.getUniformLocation(program,'projection'),false,projection);
 const modelLoc=gl.getUniformLocation(program,'model'),opacityLoc=gl.getUniformLocation(program,'opacity');const scale=w*1.06*6/(f*h),pixelsToWorld=12/(f*h);let impact=null;
 await runFrames(elapsed=>{const now=elapsed;const t=now-220,fall=900,p=Math.max(0,Math.min(1,t/fall));const firstImpact=t>=fall&&impact===null;if(firstImpact)impact=now;const s=impact===null?0:now-impact;
 const rx=impact===null?56+34*p+12*Math.sin(p*Math.PI*4)*(1-p):90+8*Math.sin(s/48)*Math.exp(-s/100),ry=impact===null?24*Math.sin(p*Math.PI*2)*(1-p):5*Math.sin(s/60)*Math.exp(-s/100),rz=impact===null?(-17+12*Math.sin(p*Math.PI*3))*(1-p):4*Math.sin(s/65)*Math.exp(-s/100);
 const rotation=new DOMMatrix().rotate(rx,ry,rz).scale(scale);const x=(w*.69-w/2)*pixelsToWorld;let y=0;const bounce=s<300?20*4*(s/300)*(1-s/300):s<440?3*4*((s-300)/140)*(1-(s-300)/140):0;
 const desiredBottom=impact===null?-20+(h+20)*p*p:h-bounce;
 // Solve the projected mesh's lowest edge against the floor, including its thickness.
 const projected=positions.filter((_,i)=>i%3===0).map(p=>rotation.transformPoint({x:p[0],y:p[1],z:p[2]}));y=Math.max(...projected.map(q=>(h/2-desiredBottom)*(6-q.z)*2/(f*h)-q.y));const bottom=Math.max(...projected.map(q=>h/2-(q.y+y)*f/(6-q.z)*h/2));
 const model=new DOMMatrix().translate(x,y,0).multiply(rotation);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniformMatrix4fv(modelLoc,false,model.toFloat32Array());gl.uniform1f(opacityLoc,1);gl.drawArrays(gl.TRIANGLES,0,data.length/9);
 if(firstImpact){layer.dataset.impact='true';layer.dataset.contact=String(bottom);try{navigator.vibrate?.(40);}catch{}}
 if(impact!==null)app.style.transform='translateY('+(s<520?20*Math.exp(-s/140)*Math.cos(s/28):0)+'px)';return s>=1560;},signal);
}
