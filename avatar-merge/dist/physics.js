(function(global){
 'use strict';
 const RADII=[15,20,26,33,41,50,60,72,86,102,122];
 class MergeWorld{
  constructor(onMerge){this.balls=[];this.time=0;this.serial=0;this.onMerge=onMerge||(()=>{});}
  add(level,x,y,velocity={x:0,y:0}){const b={id:++this.serial,level,r:RADII[level],x,y,vx:velocity.x,vy:velocity.y,age:0,angle:0,spin:0};this.balls.push(b);return b;}
  step(dt){
   this.time+=dt;
   for(const b of this.balls){b.age+=dt;b.vy=Math.min(1400,b.vy+1000*dt);b.vx*=Math.pow(.992,dt*60);b.x+=b.vx*dt;b.y+=b.vy*dt;b.angle+=b.spin*dt;b.spin*=.985;}
   const consumed=new Set(),joins=[];
   for(let pass=0;pass<8;pass++){
    for(const b of this.balls){
     if(consumed.has(b.id))continue;
     if(b.x<b.r+6){b.x=b.r+6;if(b.vx<0)b.vx*=-.25;}
     if(b.x>414-b.r){b.x=414-b.r;if(b.vx>0)b.vx*=-.25;}
     if(b.y>634-b.r){b.y=634-b.r;if(b.vy>0)b.vy=b.vy>65?-b.vy*.16:0;b.vx*=.95;}
    }
    for(let i=0;i<this.balls.length;i++)for(let j=i+1;j<this.balls.length;j++){
     const a=this.balls[i],b=this.balls[j];if(consumed.has(a.id)||consumed.has(b.id))continue;
     let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),overlap=a.r+b.r-d;if(overlap<=0)continue;
     if(a.level===b.level&&a.level<10&&a.age>.13&&b.age>.13){consumed.add(a.id);consumed.add(b.id);joins.push({level:a.level+1,x:(a.x+b.x)/2,y:(a.y+b.y)/2,vx:(a.vx+b.vx)/2,vy:Math.min(0,(a.vy+b.vy)/2)});continue;}
     if(d<.001){dx=.01;dy=.001;d=Math.hypot(dx,dy);}
     const nx=dx/d,ny=dy/d,ia=1/(a.r*a.r),ib=1/(b.r*b.r),inv=ia+ib;
     const correction=Math.max(0,overlap-.05)*.8/inv;
     a.x-=nx*correction*ia;a.y-=ny*correction*ia;b.x+=nx*correction*ib;b.y+=ny*correction*ib;
     const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
     if(rel<0){const impulse=-(1+(rel < -90?.16:0))*rel/inv;a.vx-=impulse*nx*ia;a.vy-=impulse*ny*ia;b.vx+=impulse*nx*ib;b.vy+=impulse*ny*ib;
      const tx=-ny,ty=nx,tan=(b.vx-a.vx)*tx+(b.vy-a.vy)*ty,friction=Math.max(-impulse*.2,Math.min(impulse*.2,-tan/inv));
      a.vx-=friction*tx*ia;a.vy-=friction*ty*ia;b.vx+=friction*tx*ib;b.vy+=friction*ty*ib;a.spin=a.vx*.008;b.spin=b.vx*.008;
     }
    }
   }
   if(consumed.size){this.balls=this.balls.filter(b=>!consumed.has(b.id));for(const m of joins){const b=this.add(m.level,Math.max(RADII[m.level]+6,Math.min(414-RADII[m.level],m.x)),Math.min(634-RADII[m.level],m.y),{x:m.vx*.4,y:m.vy*.2});this.onMerge(b);}}
  }
 }
 global.AvatarPhysics={MergeWorld,RADII};
 if(typeof module!=='undefined')module.exports=global.AvatarPhysics;
})(typeof window!=='undefined'?window:globalThis);
