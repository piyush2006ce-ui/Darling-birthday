import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

const canvas = document.querySelector("#love-scene-canvas");
const host = document.querySelector("#three-scene");
const loading = document.querySelector("#three-loading");
const hint = document.querySelector("#three-hint");
const cutButton = document.querySelector("#cut-cake-button");
const feedButton = document.querySelector("#feed-cake-button");
const hugButton = document.querySelector("#hug-button");

let renderer, scene, camera, boy, girl, cake, cakeSlice, plate, sliceGroup, forkCake;
let mode = "idle";
let modeStart = 0;
let cutDone = false;
let resizeObserver;
const clock = new THREE.Clock();
const hearts = [];
const decorative = [];
const tmp = new THREE.Vector3();

const mat = (color, roughness = 0.72, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });
const skinMat = mat("#f2c5a5");
const hairMat = mat("#3a202b");
const boyHairMat = mat("#2d1b25");
const boyShirtMat = mat("#75405f");
const girlDressMat = mat("#dc7ca4");
const frostingMat = mat("#fff0f4");
const cakeMat = mat("#dc7d9e");
const cakeDarkMat = mat("#9e4569");
const goldMat = new THREE.MeshStandardMaterial({ color:"#e7c38e", roughness:.35, metalness:.35 });

function addMesh(parent, geometry, material, position, scale) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  if (scale) mesh.scale.set(...scale);
  parent.add(mesh);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
function sphere(parent, material, position, scale) {
  return addMesh(parent, new THREE.SphereGeometry(1, 24, 18), material, position, scale);
}
function roundedBox(parent, material, position, scale, radius = .1) {
  // Soft stylized shapes built from spheres and boxes for broad compatibility.
  const mesh = addMesh(parent, new THREE.BoxGeometry(...scale), material, position);
  mesh.geometry.computeVertexNormals();
  return mesh;
}
function cylinder(parent, material, position, radiusTop, radiusBottom, height, radial = 32) {
  return addMesh(parent, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radial), material, position);
}
function makeCharacter(type, x) {
  const root = new THREE.Group();
  root.position.set(x, 0, 0);
  scene.add(root);
  const isGirl = type === "girl";
  const shirt = isGirl ? girlDressMat : boyShirtMat;
  // Feet and legs
  const legMat = mat(isGirl ? "#e9b0c5" : "#3b3045");
  for (const dx of [-.19, .19]) {
    cylinder(root, legMat, [dx, .39, 0], .075, .085, .48, 16);
    sphere(root, mat("#f3e6e8"), [dx, .13, .08], [.13, .07, .22]);
  }
  // Body / shoulders
  const body = sphere(root, shirt, [0, .92, 0], [.43, .52, .27]);
  body.rotation.z = isGirl ? -.02 : .02;
  // Neck and head
  cylinder(root, skinMat, [0, 1.42, 0], .105, .12, .18, 16);
  sphere(root, skinMat, [0, 1.77, 0], [.42, .48, .36]);
  // Ears
  sphere(root, skinMat, [-.405, 1.78, 0], [.09, .13, .08]);
  sphere(root, skinMat, [.405, 1.78, 0], [.09, .13, .08]);
  // Hair cap and fringe
  sphere(root, isGirl ? hairMat : boyHairMat, [0, 2.04, -.005], [.44, .28, .38]);
  if (isGirl) {
    // long hair falling down behind the shoulders
    sphere(root, hairMat, [0, 1.71, -.20], [.43, .48, .23]);
    sphere(root, hairMat, [-.36, 1.67, -.06], [.13, .39, .15]);
    sphere(root, hairMat, [.36, 1.67, -.06], [.13, .39, .15]);
    // pink bow
    sphere(root, mat("#ffb4d0"), [.30, 2.21, .04], [.14, .10, .08]);
    sphere(root, mat("#ffb4d0"), [.43, 2.21, .04], [.14, .10, .08]);
    sphere(root, goldMat, [.365, 2.21, .105], [.045, .045, .04]);
  } else {
    sphere(root, boyHairMat, [-.18, 2.13, .18], [.25, .16, .16]);
    sphere(root, boyHairMat, [.08, 2.15, .18], [.24, .17, .16]);
    sphere(root, boyHairMat, [.28, 2.09, .14], [.17, .13, .15]);
  }
  // Face: eyes, highlights, blush, nose and smile
  const eyeMat = mat("#2a1723", .3);
  const whiteMat = mat("#fff8f4", .25);
  for (const ex of [-.15, .15]) {
    sphere(root, whiteMat, [ex, 1.82, .322], [.07, .09, .035]);
    sphere(root, eyeMat, [ex + .012, 1.82, .354], [.035, .052, .025]);
    sphere(root, whiteMat, [ex + .023, 1.845, .375], [.014, .018, .01]);
    sphere(root, mat("#ef9aa9"), [ex * 1.8, 1.68, .315], [.075, .035, .018]);
  }
  sphere(root, skinMat, [0, 1.73, .35], [.045, .055, .04]);
  // Smile curve
  const smilePoints = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    smilePoints.push(new THREE.Vector3(-.09 + .18*t, 1.62 - Math.sin(t*Math.PI)*.045, .345));
  }
  const smile = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(smilePoints), 16, .012, 6, false), mat("#9b4c65"));
  root.add(smile);
  // Arms as pivoted groups for simple feeding/hugging animation
  const arms = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side*.36, 1.12, 0);
    root.add(pivot);
    const arm = cylinder(pivot, skinMat, [side*.13, -.22, .015], .075, .09, .48, 16);
    arm.rotation.z = side * -.32;
    sphere(pivot, skinMat, [side*.24, -.43, .025], [.09, .09, .09]);
    arms.push({pivot, side});
  }
  root.userData = { arms, type, baseX: x };
  return root;
}

function makeCake() {
  const group = new THREE.Group();
  group.position.set(0, 0, .2);
  scene.add(group);
  // Plate
  plate = cylinder(group, mat("#f8e7ef", .35), [0, .22, 0], .94, .94, .12, 48);
  cylinder(group, goldMat, [0, .15, 0], .78, .78, .035, 48);
  // Two cake layers
  cylinder(group, cakeDarkMat, [0, .53, 0], .68, .68, .52, 48);
  cylinder(group, cakeMat, [0, .84, 0], .72, .72, .25, 48);
  // frosting top and drips
  cylinder(group, frostingMat, [0, .99, 0], .74, .74, .10, 48);
  for (let i = 0; i < 9; i++) {
    const a = i * Math.PI * 2 / 9;
    sphere(group, frostingMat, [Math.cos(a)*.68, .92 + (i%2)*.025, Math.sin(a)*.68], [.09,.13,.09]);
  }
  // tiny berries
  const berryMat = mat("#b73565", .4);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI * 2 / 6;
    sphere(group, berryMat, [Math.cos(a)*.38, 1.065, Math.sin(a)*.38], [.075,.055,.075]);
  }
  // Candles and flames
  const candleMat = mat("#fff2f6");
  for (let i = -1; i <= 1; i++) {
    cylinder(group, candleMat, [i*.22, 1.18, 0], .035, .035, .24, 12);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(.055, 12, 10), new THREE.MeshBasicMaterial({color:"#ffb34d"}));
    flame.position.set(i*.22, 1.34, 0);
    flame.scale.set(.72, 1.45, .72);
    group.add(flame);
    decorative.push({type:"flame", mesh:flame, phase:Math.random()*4});
  }
  // Cake slice is a separate wedge-shaped group, hidden until cut.
  sliceGroup = new THREE.Group();
  sliceGroup.position.set(.08, .98, .03);
  const shape = new THREE.Shape();
  shape.moveTo(0,0); shape.lineTo(.52,0); shape.lineTo(.36,.46); shape.lineTo(0,.46); shape.closePath();
  const extrude = new THREE.ExtrudeGeometry(shape, {depth:.38, bevelEnabled:true, bevelSegments:2, steps:1, bevelSize:.025, bevelThickness:.025});
  cakeSlice = new THREE.Mesh(extrude, cakeMat);
  cakeSlice.rotation.x = -Math.PI/2;
  cakeSlice.position.set(.04, .02, .05);
  cakeSlice.visible = false;
  sliceGroup.add(cakeSlice);
  // frosting stripe on slice
  const sliceFrost = addMesh(sliceGroup, new THREE.BoxGeometry(.45,.035,.34), frostingMat, [.23,.025,.20]);
  sliceFrost.visible = false;
  sliceGroup.userData.frost = sliceFrost;
  group.add(sliceGroup);
  group.userData.slice = sliceGroup;
  return group;
}

function addHeart(x,y,z, scale=1) {
  const shape = new THREE.Shape();
  shape.moveTo(0,0);
  shape.bezierCurveTo(-.2,.2,-.45,.05,-.27,-.14);
  shape.bezierCurveTo(-.15,-.27,0,-.12,0,-.05);
  shape.bezierCurveTo(0,-.12,.15,-.27,.27,-.14);
  shape.bezierCurveTo(.45,.05,.2,.2,0,0);
  const geo = new THREE.ShapeGeometry(shape);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color:["#ff9fc4","#ffd3e2","#dba5ff"][Math.floor(Math.random()*3)], side:THREE.DoubleSide, transparent:true, opacity:.95}));
  mesh.position.set(x,y,z);
  mesh.scale.setScalar(scale);
  scene.add(mesh);
  hearts.push({mesh, born:clock.elapsedTime, drift: .25+Math.random()*.35, spin:(Math.random()-.5)*1.5});
}

function confettiHearts(count=18) {
  for (let i=0;i<count;i++) addHeart((Math.random()-.5)*4, .8+Math.random()*2.2, .4+Math.random()*.6, .13+Math.random()*.13);
}

function setMode(next) {
  mode = next;
  modeStart = clock.elapsedTime;
  if (next === "cut") {
    hint.textContent = "A slice, made with love. Next, tap “Feed my Darling” ♡";
    cutDone = true;
    cakeSlice.visible = true;
    sliceGroup.userData.frost.visible = true;
    confettiHearts(24);
  } else if (next === "feed") {
    hint.textContent = "A sweet bite for my sweetest Baby. ♡";
    if (!cutDone) {
      cakeSlice.visible = true;
      sliceGroup.userData.frost.visible = true;
      cutDone = true;
    }
    confettiHearts(12);
  } else if (next === "hug") {
    hint.textContent = "Big hugs, tiny hearts, and all my love. ♡";
    confettiHearts(36);
  }
}

function init() {
  if (!canvas || !host) return;
  try {
    renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  } catch (e) {
    loading.textContent = "This browser could not start the 3D scene. Try Chrome or update graphics settings.";
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.setSize(host.clientWidth, host.clientHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog("#160d1c", 9, 22);
  camera = new THREE.PerspectiveCamera(35, host.clientWidth/host.clientHeight, .1, 100);
  camera.position.set(0, 3.5, 9.2);
  camera.lookAt(0, 1.25, 0);

  scene.add(new THREE.HemisphereLight("#ffe4f1", "#39223c", 2.0));
  const key = new THREE.DirectionalLight("#fff0df", 3.0);
  key.position.set(-3, 7, 5); key.castShadow = true; scene.add(key);
  const rim = new THREE.PointLight("#ec6ca7", 35, 10); rim.position.set(3,3,2); scene.add(rim);
  const fill = new THREE.PointLight("#b88bff", 18, 12); fill.position.set(-4,2,-2); scene.add(fill);

  // Ground and softly glowing backdrop
  const ground = new THREE.Mesh(new THREE.CircleGeometry(5.5, 64), mat("#211326"));
  ground.rotation.x = -Math.PI/2; ground.position.y = .02; ground.receiveShadow = true; scene.add(ground);
  const platform = cylinder(scene, mat("#38203a"), [0,.11,0], 3.2,3.2,.16,64);
  platform.material = new THREE.MeshStandardMaterial({color:"#3a203b", roughness:.48, metalness:.12});
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.12,.018,8,96), goldMat);
  ring.rotation.x = Math.PI/2; ring.position.y = .2; scene.add(ring);

  // Sparkles in the background
  for (let i=0;i<45;i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(.018+Math.random()*.025, 8, 8), new THREE.MeshBasicMaterial({color:i%3===0?"#ffd4e6":"#e9c7ff", transparent:true, opacity:.65}));
    s.position.set((Math.random()-.5)*8, .7+Math.random()*4.3, -2-Math.random()*2);
    scene.add(s); decorative.push({type:"spark",mesh:s,phase:Math.random()*6});
  }

  boy = makeCharacter("boy", -1.85);
  girl = makeCharacter("girl", 1.85);
  boy.rotation.y = .16;
  girl.rotation.y = -Math.PI + .16;
  cake = makeCake();
  // cake placed front-center, lower than characters
  cake.position.set(0,0,.95);

  // Pointer drag: gently orbit camera around the scene.
  let dragging=false, lastX=0, lastY=0, yaw=0, pitch=0;
  canvas.addEventListener("pointerdown", e => { dragging=true; lastX=e.clientX; lastY=e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", e => {
    if (!dragging) return;
    yaw += (e.clientX-lastX)*.004;
    pitch = THREE.MathUtils.clamp(pitch+(e.clientY-lastY)*.003,-.18,.28);
    lastX=e.clientX; lastY=e.clientY;
    camera.position.set(Math.sin(yaw)*9.2,3.5+pitch*4,Math.cos(yaw)*9.2);
    camera.lookAt(0,1.25,0);
  });
  canvas.addEventListener("pointerup",()=>dragging=false);
  canvas.addEventListener("pointercancel",()=>dragging=false);

  // Tap cake area to cut it.
  canvas.addEventListener("click", e => {
    const rect=canvas.getBoundingClientRect();
    const y=(e.clientY-rect.top)/rect.height;
    if (y>.40 && !cutDone) setMode("cut");
  });

  cutButton.addEventListener("click",()=>setMode("cut"));
  feedButton.addEventListener("click",()=>setMode("feed"));
  hugButton.addEventListener("click",()=>setMode("hug"));

  resizeObserver = new ResizeObserver(() => {
    if (!renderer) return;
    const w=host.clientWidth, h=host.clientHeight;
    renderer.setSize(w,h,false);
    camera.aspect=w/h; camera.updateProjectionMatrix();
  });
  resizeObserver.observe(host);
  loading.classList.add("hidden");
  setTimeout(()=>loading.remove(),650);
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  const t=clock.getElapsedTime();
  if (boy && girl) {
    boy.position.y = Math.sin(t*1.7)*.035;
    girl.position.y = Math.sin(t*1.7+1)*.035;
    for (const a of boy.userData.arms) {
      a.pivot.rotation.z = 0;
      a.pivot.rotation.x = 0;
    }
    for (const a of girl.userData.arms) {
      a.pivot.rotation.z = 0;
      a.pivot.rotation.x = 0;
    }
    if (mode==="feed") {
      const p=(t-modeStart);
      const rightArm=boy.userData.arms.find(a=>a.side===1);
      if (rightArm) { rightArm.pivot.rotation.z = -.65+Math.sin(p*4)*.08; rightArm.pivot.rotation.x=-.8; }
      const girlLeft=girl.userData.arms.find(a=>a.side===-1);
      if (girlLeft) girlLeft.pivot.rotation.z=.15;
      // Slice floats from cake toward the girl, then returns to cake.
      const q=Math.min(p/1.3,1);
      sliceGroup.position.set(.08 + .95*q, .98 + Math.sin(Math.min(p,1.3)/1.3*Math.PI)*.6, .03 + .4*q);
      sliceGroup.rotation.z = -.15*q;
      if (p>2.2) { mode="idle"; sliceGroup.position.set(.08,.98,.03); sliceGroup.rotation.z=0; }
    } else if (mode==="hug") {
      const p=t-modeStart;
      const q=Math.min(p/1.2,1);
      boy.position.x=-1.85+1.15*q;
      girl.position.x=1.85-1.15*q;
      boy.rotation.y=.16 + .2*q;
      girl.rotation.y=-Math.PI+.16 - .2*q;
      if (p>2.5) {
        mode="idle";
        boy.position.x=-1.85; girl.position.x=1.85;
        boy.rotation.y=.16; girl.rotation.y=-Math.PI+.16;
      }
    } else {
      boy.position.x += (-1.85-boy.position.x)*.08;
      girl.position.x += (1.85-girl.position.x)*.08;
      boy.rotation.y += (.16-boy.rotation.y)*.08;
      girl.rotation.y += ((-Math.PI+.16)-girl.rotation.y)*.08;
    }
  }
  if (cake) {
    cake.rotation.y = Math.sin(t*.45)*.045;
    cake.scale.setScalar(1+Math.sin(t*2)*.008);
  }
  decorative.forEach(d=>{
    if (d.type==="flame") {
      d.mesh.scale.y=1.35+Math.sin(t*12+d.phase)*.18;
      d.mesh.rotation.z=Math.sin(t*9+d.phase)*.12;
    } else {
      d.mesh.material.opacity=.3+(.35*Math.sin(t*1.5+d.phase)+.35);
    }
  });
  for (let i=hearts.length-1;i>=0;i--) {
    const h=hearts[i], age=t-h.born;
    h.mesh.position.y += h.drift*.012;
    h.mesh.position.x += Math.sin(age*2+h.spin)*.003;
    h.mesh.rotation.z += h.spin*.01;
    h.mesh.material.opacity=Math.max(0,1-age/3.5);
    h.mesh.scale.multiplyScalar(1.001);
    if (age>3.5) { scene.remove(h.mesh); h.mesh.geometry.dispose(); h.mesh.material.dispose(); hearts.splice(i,1); }
  }
  renderer.render(scene,camera);
}

init();
