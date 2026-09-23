import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
http.createServer(async(req,res)=>{try{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403).end();return}const target=p===root?path.join(root,'index.html'):p;const data=await readFile(target);const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'};res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'text/plain','Cache-Control':'no-cache'});res.end(data);}catch{res.writeHead(404).end('Not found')}}).listen(5173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:5173'));
