/* Register real directional images here; never mirror painted lighting or markings. */
const enemyDirectionalAssets={raider:{},interceptor:{},gunship:{}};
const enemyViewTextures={};
function enemyView(e,basis){
 const velocity=FM.unit(e.velocity||{x:0,y:0,z:-1}),toward=FM.unit({x:-e.x,y:-e.y,z:-e.z});
 const approach=FM.dot(velocity,toward),side=FM.dot(velocity,basis.r),vertical=FM.dot(velocity,basis.u);
 const direction=approach>.72?'front':approach<-.72?'rear':Math.abs(approach)<.3?(side>0?'right':'left'):(approach>0?'front-':'rear-')+(side>0?'right':'left');
 const path=enemyDirectionalAssets[e.className]?.[direction];
 const image=path?(enemyViewTextures[path]??=texture(path)):null;
 return {direction,image,bank:FM.clamp(-side*.35,-.35,.35),heading:Math.abs(side)+Math.abs(vertical)>.12?Math.atan2(vertical,side)-Math.PI/2:0};
}
