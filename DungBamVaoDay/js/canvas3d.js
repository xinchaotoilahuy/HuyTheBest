import * as THREE from 'three';

/* Same scene geometry, projected on Canvas when WebGL is unavailable. */
export class Canvas3DRenderer {
  constructor(){
    this.domElement=document.createElement('canvas');this.context=this.domElement.getContext('2d',{alpha:true});
    this.isSoftware=true;this.pixelRatio=1;this.width=1;this.height=1;this.shadowMap={};
    this.vector=new THREE.Vector3();this.normal=new THREE.Vector3();this.view=new THREE.Vector3();this.half=new THREE.Vector3();
    this.light=new THREE.Vector3(-.4,.7,.65).normalize();this.fill=new THREE.Vector3(.7,.25,.65).normalize();
    this.color=new THREE.Color();this.matrix=new THREE.Matrix4();this.normalMatrix=new THREE.Matrix3();
    this.surface=document.createElement('canvas');this.surfaceContext=this.surface.getContext('2d');
  }
  setClearColor(){}
  setPixelRatio(ratio){this.pixelRatio=Math.min(ratio,1.35);this.setSize(this.width,this.height);}
  setSize(w,h){
    this.width=w;this.height=h;const width=Math.max(1,Math.round(w*this.pixelRatio)),height=Math.max(1,Math.round(h*this.pixelRatio));
    if(this.domElement.width===width&&this.domElement.height===height)return;
    this.domElement.width=this.surface.width=width;this.domElement.height=this.surface.height=height;
    this.pixels=this.surfaceContext.createImageData(width,height);this.depth=new Float32Array(width*height);
  }
  project(point,camera){return point.clone().project(camera);}
  shadow(scene,camera,ctx){
    const floor=scene.children.find(x=>x.material?.isShadowMaterial),model=scene.children.find(x=>x.isGroup);if(!floor||!model)return;
    const parts=model.children.filter(x=>x.isGroup);
    for(const part of parts){
      const world=part.getWorldPosition(new THREE.Vector3());world.y=floor.position.y;
      const p=world.clone().project(camera),edge=world.clone().add(new THREE.Vector3(1,0,0)).project(camera);
      const radius=Math.max(18,Math.abs(edge.x-p.x)*this.width*.62);
      const x=(p.x+1)*this.width/2,y=(1-p.y)*this.height/2;
      ctx.save();ctx.translate(x,y);ctx.scale(1,.25);
      const g=ctx.createRadialGradient(0,0,0,0,0,radius*1.5);g.addColorStop(0,'rgba(28,42,57,.18)');g.addColorStop(.35,'rgba(28,42,57,.09)');g.addColorStop(1,'rgba(28,42,57,0)');ctx.fillStyle=g;ctx.fillRect(-radius*1.5,-radius*1.5,radius*3,radius*3);ctx.restore();
    }
  }
  render(scene,camera){
    const started=performance.now();
    const ctx=this.context;if(!ctx)return;
    ctx.setTransform(this.pixelRatio,0,0,this.pixelRatio,0,0);ctx.clearRect(0,0,this.width,this.height);
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    this.shadow(scene,camera,ctx);
    const triangles=[];
    scene.traverse(object=>{
      if(!object.isMesh||!object.visible||object.material?.isShadowMaterial)return;
      const geometry=object.geometry,position=geometry.getAttribute('position'),normal=geometry.getAttribute('normal'),uv=geometry.getAttribute('uv'),index=geometry.index;
      const materials=Array.isArray(object.material)?object.material:[object.material];
      const vertices=[],normals=[];
      const objectCenter=object.getWorldPosition(new THREE.Vector3());
      this.matrix.multiplyMatrices(camera.matrixWorldInverse,object.matrixWorld);this.normalMatrix.getNormalMatrix(object.matrixWorld);
      for(let i=0;i<position.count;i++){
        this.vector.fromBufferAttribute(position,i);const world=this.vector.clone().applyMatrix4(object.matrixWorld);const eye=this.vector.clone().applyMatrix4(this.matrix);const projected=world.clone().project(camera);
        vertices.push({x:(projected.x+1)*this.width/2,y:(1-projected.y)*this.height/2,z:eye.z,clip:projected.z,world});
        normals.push(normal?this.normal.fromBufferAttribute(normal,i).applyMatrix3(this.normalMatrix).normalize().clone():new THREE.Vector3(0,0,1));
      }
      const length=index?index.count:position.count;
      for(let i=0;i<length;i+=3){
        const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j),v=ids.map(j=>vertices[j]);
        const group=geometry.groups.find(g=>i>=g.start&&i<g.start+g.count);const material=materials[group?.materialIndex||0]||materials[0];if(!material||material.visible===false)continue;
        if(v.some(p=>p.clip<-1||p.clip>1||p.z>0))continue;
        const area=(v[1].x-v[0].x)*(v[2].y-v[0].y)-(v[1].y-v[0].y)*(v[2].x-v[0].x);
        if(material.side!==THREE.DoubleSide&&area>=0)continue;
        this.normal.copy(normals[ids[0]]).add(normals[ids[1]]).add(normals[ids[2]]).normalize();
        this.view.copy(camera.position).sub(objectCenter).normalize();this.half.copy(this.light).add(this.view).normalize();
        const diffuse=Math.max(0,this.normal.dot(this.light)),fill=Math.max(0,this.normal.dot(this.fill));
        const shine=Math.pow(Math.max(0,this.normal.dot(this.half)),material.metalness>.5?65:32);
        const fresnel=Math.pow(1-Math.max(0,this.normal.dot(this.view)),4);
        this.color.copy(material.color||new THREE.Color('#ffffff')).multiplyScalar(.59+diffuse*.46+fill*.2);
        if(material.emissive)this.color.add(material.emissive.clone().multiplyScalar((material.emissiveIntensity||0)*.5));
        this.color.lerp(new THREE.Color('#ffffff'),Math.min(.63,shine*(material.clearcoat?.3:.13)+(material.metalness||0)*shine*.5+fresnel*(material.transmission?.26:.05)));
        const image=material.map?.image;
        const hex=this.color.getHex(THREE.SRGBColorSpace);
        triangles.push({v,depth:(v[0].z+v[1].z+v[2].z)/3,r:hex>>16,g:(hex>>8)&255,b:hex&255,opacity:material.transmission?Math.max(.65,1-material.transmission*.35):material.opacity??1,image,uv:image&&uv?ids.map(j=>({x:uv.getX(j)*image.width,y:(1-uv.getY(j))*image.height})):null});
      }
    });
    this.pixels.data.fill(0);this.depth.fill(Infinity);
    triangles.sort((a,b)=>a.opacity===1&&b.opacity!==1?-1:a.opacity!==1&&b.opacity===1?1:a.depth-b.depth);
    for(const triangle of triangles){
      if(!triangle.image){this.rasterize(triangle);continue;}
      const {v}=triangle;ctx.globalAlpha=triangle.opacity;ctx.beginPath();ctx.moveTo(v[0].x,v[0].y);ctx.lineTo(v[1].x,v[1].y);ctx.lineTo(v[2].x,v[2].y);ctx.closePath();
      if(triangle.image&&triangle.uv){
        const s=triangle.uv,den=s[0].x*(s[1].y-s[2].y)+s[1].x*(s[2].y-s[0].y)+s[2].x*(s[0].y-s[1].y);
        if(Math.abs(den)<.0001)continue;
        const solve=values=>[(values[0]*(s[1].y-s[2].y)+values[1]*(s[2].y-s[0].y)+values[2]*(s[0].y-s[1].y))/den,(values[0]*(s[2].x-s[1].x)+values[1]*(s[0].x-s[2].x)+values[2]*(s[1].x-s[0].x))/den,(values[0]*(s[1].x*s[2].y-s[2].x*s[1].y)+values[1]*(s[2].x*s[0].y-s[0].x*s[2].y)+values[2]*(s[0].x*s[1].y-s[1].x*s[0].y))/den];
        const x=solve(v.map(p=>p.x)),y=solve(v.map(p=>p.y));
        ctx.save();ctx.clip();ctx.transform(x[0],y[0],x[1],y[1],x[2],y[2]);ctx.drawImage(triangle.image,0,0);ctx.restore();
      }
    }
    this.surfaceContext.putImageData(this.pixels,0,0);ctx.globalAlpha=1;ctx.drawImage(this.surface,0,0,this.width,this.height);
    ctx.globalAlpha=1;
    if(!this.reportedAt||started-this.reportedAt>1500){this.domElement.dataset.renderMs=String(Math.round(performance.now()-started));this.reportedAt=started;}
  }
  rasterize(triangle){
    const ratio=this.pixelRatio,width=this.surface.width,height=this.surface.height;
    const [a,b,c]=triangle.v.map(p=>({x:p.x*ratio,y:p.y*ratio,z:p.clip}));
    const area=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);if(Math.abs(area)<.001)return;
    const minX=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),maxX=Math.min(width-1,Math.ceil(Math.max(a.x,b.x,c.x)));
    const minY=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),maxY=Math.min(height-1,Math.ceil(Math.max(a.y,b.y,c.y)));
    const data=this.pixels.data,alpha=triangle.opacity;
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      const px=x+.5,py=y+.5;
      const u=((b.x-px)*(c.y-py)-(b.y-py)*(c.x-px))/area;
      const v=((c.x-px)*(a.y-py)-(c.y-py)*(a.x-px))/area;
      const w=1-u-v;if(u<-.00001||v<-.00001||w<-.00001)continue;
      const z=u*a.z+v*b.z+w*c.z,index=y*width+x;if(z>=this.depth[index])continue;
      const offset=index*4;
      if(alpha<1&&data[offset+3]){
        data[offset]=triangle.r*alpha+data[offset]*(1-alpha);data[offset+1]=triangle.g*alpha+data[offset+1]*(1-alpha);data[offset+2]=triangle.b*alpha+data[offset+2]*(1-alpha);
      }else{data[offset]=triangle.r;data[offset+1]=triangle.g;data[offset+2]=triangle.b;data[offset+3]=255;}
      if(alpha===1)this.depth[index]=z;
    }
  }
}
