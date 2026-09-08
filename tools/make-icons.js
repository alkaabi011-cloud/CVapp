/* Generates the PWA PNG icons with zero dependencies.
   Raw RGBA bitmap -> zlib deflate -> hand-written PNG chunks. */
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'icons');
fs.mkdirSync(OUT, { recursive: true });

/* ---- PNG writer ---- */
function crc32(buf){
  let c, t = crc32.t;
  if(!t){ t = crc32.t = []; for(let n=0;n<256;n++){ c=n; for(let k=0;k<8;k++) c = c&1 ? 0xEDB88320 ^ (c>>>1) : c>>>1; t[n]=c>>>0; } }
  let crc = 0xFFFFFFFF;
  for(let i=0;i<buf.length;i++) crc = t[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data){
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td  = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
/* `rgb: true` writes colour type 2 (no alpha channel at all). The App Store
   rejects icons that carry an alpha channel even when every pixel is opaque,
   so store artwork must be encoded this way, not merely made fully opaque. */
function png(w, h, rgba, rgb=false){
  const bpp = rgb ? 3 : 4;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w,0); ihdr.writeUInt32BE(h,4);
  ihdr[8]=8; ihdr[9]= rgb ? 2 : 6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  const stride = w*bpp+1;
  const raw = Buffer.alloc(stride*h);
  for(let y=0;y<h;y++){
    raw[y*stride] = 0;                                         // filter: none
    if(rgb){
      for(let x=0;x<w;x++){
        const s=(y*w+x)*4, d=y*stride+1+x*3;
        raw[d]=rgba[s]; raw[d+1]=rgba[s+1]; raw[d+2]=rgba[s+2];
      }
    } else {
      rgba.copy(raw, y*stride+1, y*w*4, (y+1)*w*4);
    }
  }
  return Buffer.concat([
    Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ---- tiny raster canvas ---- */
function canvas(size){
  const px = Buffer.alloc(size*size*4);
  const set = (x,y,r,g,b,a)=>{
    if(x<0||y<0||x>=size||y>=size||a<=0) return;
    const i=(y*size+x)*4, sa=a/255, da=px[i+3]/255, oa=sa+da*(1-sa);
    if(oa<=0) return;
    px[i]   = Math.round((r*sa + px[i]  *da*(1-sa))/oa);
    px[i+1] = Math.round((g*sa + px[i+1]*da*(1-sa))/oa);
    px[i+2] = Math.round((b*sa + px[i+2]*da*(1-sa))/oa);
    px[i+3] = Math.round(oa*255);
  };
  // supersampled rounded rect (4x4 per pixel => smooth edges)
  const rrect = (x0,y0,w,h,r,col)=>{
    const [cr,cg,cb,ca=255]=col, S=4;
    for(let y=Math.floor(y0-1);y<Math.ceil(y0+h+1);y++)
      for(let x=Math.floor(x0-1);x<Math.ceil(x0+w+1);x++){
        let hit=0;
        for(let sy=0;sy<S;sy++) for(let sx=0;sx<S;sx++){
          const px2=x+(sx+.5)/S, py=y+(sy+.5)/S;
          if(px2<x0||py<y0||px2>x0+w||py>y0+h) continue;
          const dx=Math.max(x0+r-px2, 0, px2-(x0+w-r));
          const dy=Math.max(y0+r-py , 0, py -(y0+h-r));
          if(dx*dx+dy*dy <= r*r) hit++;
        }
        if(hit) set(x,y,cr,cg,cb,Math.round(ca*hit/(S*S)));
      }
  };
  const circle=(cx,cy,rad,col)=> rrect(cx-rad,cy-rad,rad*2,rad*2,rad,col);
  // vertical gradient background, full bleed or rounded
  const bg=(c1,c2,radius)=>{
    const S=4;
    for(let y=0;y<size;y++){
      const tt=y/(size-1);
      const r=Math.round(c1[0]+(c2[0]-c1[0])*tt),
            g=Math.round(c1[1]+(c2[1]-c1[1])*tt),
            b=Math.round(c1[2]+(c2[2]-c1[2])*tt);
      for(let x=0;x<size;x++){
        if(!radius){ set(x,y,r,g,b,255); continue; }
        let hit=0;
        for(let sy=0;sy<S;sy++) for(let sx=0;sx<S;sx++){
          const px2=x+(sx+.5)/S, py=y+(sy+.5)/S;
          const dx=Math.max(radius-px2,0,px2-(size-radius));
          const dy=Math.max(radius-py ,0,py -(size-radius));
          if(dx*dx+dy*dy<=radius*radius) hit++;
        }
        if(hit) set(x,y,r,g,b,Math.round(255*hit/(S*S)));
      }
    }
  };
  return { px, rrect, circle, bg, out:(rgb)=>png(size,size,px,rgb) };
}

/* ---- the mark: a document with lines, on the brand gradient ---- */
function icon(size, { maskable=false, apple=false, rgb=false } = {}){
  const c = canvas(size);
  const u = size/64;                       // design grid = 64
  // iOS applies its own superellipse mask to apple-touch-icon, so this one must
  // ship square-cornered and fully opaque — baked-in rounded corners would show
  // as a rounded rect clipped inside another rounded rect.
  c.bg([124,58,237], [37,99,235], (maskable || apple) ? 0 : size*0.22);

  // maskable keeps the mark inside the safe circle (~80%); apple insets a little
  // so iOS's corner mask never clips the document edges
  const s = maskable ? 0.72 : apple ? 0.80 : 0.92;
  const cx = size/2, cy = size/2;
  const P = (x,y)=>[cx+(x-32)*u*s, cy+(y-32)*u*s];
  const D = n => n*u*s;

  const [px0,py0] = P(17,10);
  c.rrect(px0, py0, D(30), D(44), D(4), [255,255,255,242]);          // page
  const [fx,fy] = P(41,10);
  c.rrect(fx, fy, D(6), D(6), D(2), [214,220,255,255]);              // folded corner

  const [ax,ay] = P(22.5,17.5);
  c.circle(ax+D(3.4), ay+D(3.4), D(3.6), [124,58,237,255]);          // avatar dot

  const bars = [[30,16.4,13,2.6],[30,21.2,9.5,2.2],
                [22.5,29,25,2.2],[22.5,34,25,2.2],[22.5,39,17,2.2],
                [22.5,45,21,2.2]];
  bars.forEach(([x,y,w,h],i)=>{
    const [bx,by]=P(x,y);
    c.rrect(bx,by,D(w),D(h),D(h/2), i<2 ? [79,70,229,255] : [150,158,190,235]);
  });
  const [gx,gy]=P(22.5,49.6);
  c.rrect(gx,gy,D(11),D(2.6),D(1.3),[219,39,119,255]);               // accent bar
  return c.out(rgb);
}

fs.writeFileSync(path.join(OUT,'icon-192.png'), icon(192));
fs.writeFileSync(path.join(OUT,'icon-512.png'), icon(512));
fs.writeFileSync(path.join(OUT,'icon-maskable-512.png'), icon(512,{maskable:true}));
fs.writeFileSync(path.join(OUT,'apple-touch-icon.png'), icon(180,{apple:true}));
// App Store / Play Store / Median upload: 1024px, square, fully opaque.
// Apple rejects icons with an alpha channel and applies its own corner mask.
fs.writeFileSync(path.join(OUT,'store-icon-1024.png'), icon(1024,{apple:true,rgb:true}));

/* ---- matching SVG (crisp at any size, used for the tab icon) ---- */
fs.writeFileSync(path.join(OUT,'icon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#2563eb"/></linearGradient></defs>
  <rect width="64" height="64" rx="14" fill="url(#g)"/>
  <rect x="17" y="10" width="30" height="44" rx="4" fill="#fff" opacity=".95"/>
  <rect x="41" y="10" width="6" height="6" rx="2" fill="#d6dcff"/>
  <circle cx="25.9" cy="20.9" r="3.6" fill="#7c3aed"/>
  <rect x="30" y="16.4" width="13" height="2.6" rx="1.3" fill="#4f46e5"/>
  <rect x="30" y="21.2" width="9.5" height="2.2" rx="1.1" fill="#4f46e5"/>
  <rect x="22.5" y="29" width="25" height="2.2" rx="1.1" fill="#969ebe"/>
  <rect x="22.5" y="34" width="25" height="2.2" rx="1.1" fill="#969ebe"/>
  <rect x="22.5" y="39" width="17" height="2.2" rx="1.1" fill="#969ebe"/>
  <rect x="22.5" y="45" width="21" height="2.2" rx="1.1" fill="#969ebe"/>
  <rect x="22.5" y="49.6" width="11" height="2.6" rx="1.3" fill="#db2777"/>
</svg>`);

console.log('icons written ->', fs.readdirSync(OUT).join(', '));
