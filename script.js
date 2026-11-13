import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $ = (selector) => document.querySelector(selector);
const sceneHost = $('#scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050914);
scene.fog = new THREE.FogExp2(0x050914, 0.0025);

const camera = new THREE.PerspectiveCamera(43, window.innerWidth / window.innerHeight, 0.1, 1300);
camera.position.set(-0.5, 14, 28);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
sceneHost.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 5.5;
controls.maxDistance = 80;
controls.maxPolarAngle = Math.PI * 0.91;
controls.target.set(2.5, 0, 0);
controls.rotateSpeed = 0.62;
controls.zoomSpeed = 0.85;
controls.panSpeed = 0.65;

const ambient = new THREE.HemisphereLight(0x7899d1, 0x19101a, 0.58);
scene.add(ambient);
const sunLight = new THREE.PointLight(0xffd6a0, 330, 0, 1.3);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);
const landingFillLight = new THREE.PointLight(0xc6dcff, 0, 4, 2);
scene.add(landingFillLight);

const textureLoader = new THREE.TextureLoader();
const textureUrls = {
  earth: './textures/earth.jpg',
  moon: './textures/moon.jpg',
  mars: './textures/mars.jpg',
  jupiter: './textures/jupiter.jpg'
};
const texCache = new Map();
function getTexture(key, fallbackColor) {
  if (!texCache.has(key)) {
    const texture = textureLoader.load(textureUrls[key], undefined, undefined, () => {
      const fallback = new THREE.DataTexture(new Uint8Array([fallbackColor[0], fallbackColor[1], fallbackColor[2], 255]), 1, 1);
      fallback.colorSpace = THREE.SRGBColorSpace;
      fallback.needsUpdate = true;
      const target = texCache.get(key);
      if (target) target.image = fallback.image;
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    texCache.set(key, texture);
  }
  return texCache.get(key);
}

function makeStars() {
  const count = 7200;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = [new THREE.Color(0xffffff), new THREE.Color(0xa8c7ff), new THREE.Color(0xffdcb1), new THREE.Color(0x9ff5f4)];
  for (let i = 0; i < count; i += 1) {
    const radius = 280 + Math.random() * 690;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    const color = palette[Math.floor(Math.random() * palette.length)];
    const brightness = 0.52 + Math.random() * 0.48;
    colors[i * 3] = color.r * brightness;
    colors[i * 3 + 1] = color.g * brightness;
    colors[i * 3 + 2] = color.b * brightness;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({ size: 1.05, vertexColors: true, sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false });
  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
  return stars;
}
const starfield = makeStars();

function makeGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(128, 128, 3, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255,232,173,0.96)');
  gradient.addColorStop(0.11, 'rgba(255,183,93,0.5)');
  gradient.addColorStop(0.38, 'rgba(255,142,54,0.12)');
  gradient.addColorStop(1, 'rgba(255,115,38,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const sunGroup = new THREE.Group();
scene.add(sunGroup);
const sun = new THREE.Mesh(new THREE.SphereGeometry(2.12, 64, 48), new THREE.MeshBasicMaterial({ color: 0xffd47c }));
sun.name = 'sun';
sunGroup.add(sun);
const sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(), color: 0xffb457, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9 }));
sunHalo.scale.set(12, 12, 1);
sunGroup.add(sunHalo);
const sunHaloFar = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunHalo.material.map, color: 0xffa23f, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.24 }));
sunHaloFar.scale.set(21, 21, 1);
sunGroup.add(sunHaloFar);
const sunCore = new THREE.Mesh(new THREE.SphereGeometry(2.16, 40, 32), new THREE.MeshBasicMaterial({ color: 0xffe6a6, transparent: true, opacity: 0.15, side: THREE.BackSide }));
sunGroup.add(sunCore);

const planetData = {
  sun: { name: 'الشمس', subtitle: 'النجم الذي يمنح مجموعتنا الضوء والطاقة', index: '٠١', gravity: '٢٧٤', atmosphere: 'هيدروجين وهيليوم', atmosphereNote: 'بلا سطح صلب', mission: 'مرصد باركر الشمسي', missionNote: 'اقترب من الهالة الشمسية لدراسة الرياح الشمسية.', description: 'الشمس نجم متوسط الحجم يقع في مركز نظامنا الشمسي. جاذبيتها تحفظ الكواكب في مداراتها، والطاقة الناتجة في قلبها تمد الأرض بالضوء والحرارة. ليست كرة نار مشتعلة؛ إنها كرة من البلازما شديدة السخونة.', url: 'https://science.nasa.gov/sun/' },
  earth: { name: 'الأرض', subtitle: 'موطننا الوحيد المعروف للحياة', index: '٠٣', gravity: '٩٫٨', atmosphere: '٧٨٪ نيتروجين · ٢١٪ أكسجين', atmosphereNote: 'محيطات تغطي ٧١٪ من السطح', mission: 'منظومة رصد الأرض التابعة لناسا', missionNote: 'أقمار صناعية تراقب المحيطات والغلاف الجوي والجليد.', description: 'الأرض هي الكوكب الثالث من الشمس، وعلى سطحها ماء سائل وفير وغلاف جوي غني بالأكسجين. يستغرق ضوء الشمس نحو ٨ دقائق ليصل إلينا، وتكمل الأرض دورة حول محورها خلال ٢٣٫٩ ساعة تقريباً.', url: 'https://science.nasa.gov/earth/facts/' },
  moon: { name: 'القمر', subtitle: 'وجهة بعثة Apollo V التعليمية', index: '٠٠', gravity: '١٫٦٢', atmosphere: 'إكسوسفير رقيق جداً', atmosphereNote: 'ليس له غلاف جوي كثيف', mission: 'Apollo 5 · يناير 1968', missionNote: 'اختبار غير مأهول؛ أول رحلة اختبارية للوحدة القمرية.', description: 'القمر تابع الأرض الطبيعي، ويبعد عنها في المتوسط نحو ٣٨٤٬٤٠٠ كيلومتر. جاذبيته نحو ١٫٦٢ م/ث²، ولا يحيط به غلاف جوي كثيف. اختبرت مهمة Apollo 5 غير المأهولة الوحدة القمرية للمرة الأولى. Apollo V هنا اسم فريقكم، واللعبة محاكاة تعليمية وليست إعادة بناء تاريخية دقيقة للمهمة.', url: 'https://www.nasa.gov/the-apollo-program/' },
  mars: { name: 'المريخ', subtitle: 'الكوكب الأحمر وعالم الروبوتات', index: '٠٤', gravity: '٣٫٧١', atmosphere: 'ثاني أكسيد الكربون غالباً', atmosphereNote: 'غلاف رقيق وبارد', mission: 'بيرسيفيرانس · كيوريوسيتي', missionNote: 'مركبتان جوالتان تدرسان صخور المريخ وتاريخه المائي.', description: 'المريخ عالم صخري بارد، ولونه المحمر يأتي من أكاسيد الحديد في تربته. تشير الأدلة إلى أن مياهه السطحية القديمة كانت أكثر وفرة. تستكشف مركبات ناسا سطحه بحثاً عن دلائل على بيئات قديمة صالحة للحياة.', url: 'https://science.nasa.gov/mars/' },
  jupiter: { name: 'المشتري', subtitle: 'عملاق غازي بعواصف هائلة', index: '٠٥', gravity: '٢٣٫١', atmosphere: 'هيدروجين وهيليوم', atmosphereNote: 'لا يملك سطحاً صلباً', mission: 'جونو · يوروبا كليبر', missionNote: 'جونو تدرس المشتري؛ ويوروبا كليبر تبحث في قمره الجليدي.', description: 'المشتري أكبر كواكب النظام الشمسي، ويدور حوله جو من الهيدروجين والهيليوم. البقعة الحمراء العظيمة عاصفة أضخم من الأرض. قاس مسبار جونو مجاله الجاذبي والمغناطيسي وكشف تفاصيل جديدة عن داخل الكوكب.', url: 'https://science.nasa.gov/jupiter/jupiter-facts/' }
};
const clickableBodies = [];
const bodyMap = {};
const orbitObjects = [];
const loaderColor = { earth: [48, 118, 183], moon: [137, 139, 148], mars: [182, 74, 51], jupiter: [202, 137, 100] };
function createPlanet(key, radius, orbitRadius, period, phase, rotation, parent = scene, textureKey = key) {
  const pivot = new THREE.Group();
  parent.add(pivot);
  const material = new THREE.MeshStandardMaterial({
    map: textureKey in textureUrls ? getTexture(textureKey, loaderColor[textureKey]) : null,
    color: 0xffffff,
    roughness: key === 'jupiter' ? 0.82 : 0.95,
    metalness: 0
  });
  if (!material.map) material.color.set(0x999999);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 36), material);
  mesh.name = key;
  mesh.rotation.z = key === 'earth' ? THREE.MathUtils.degToRad(23.4) : 0.04;
  pivot.add(mesh);
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(orbitRadius, 0.008, 6, 240), new THREE.MeshBasicMaterial({ color: 0x99b3d0, transparent: true, opacity: 0.2 }));
  orbit.rotation.x = Math.PI / 2;
  orbit.position.y = -0.07;
  scene.add(orbit);
  orbitObjects.push(orbit);
  const body = { key, mesh, pivot, orbitRadius, period, phase, rotation, basePosition: new THREE.Vector3(), radius };
  pivot.position.set(Math.cos(phase) * orbitRadius, 0, Math.sin(phase) * orbitRadius);
  body.basePosition.copy(pivot.position);
  bodyMap[key] = body;
  clickableBodies.push(mesh);
  return body;
}
const earth = createPlanet('earth', 0.73, 7.4, 365.25, -0.56, 0.42);
const mars = createPlanet('mars', 0.55, 10.4, 687, 2.38, 0.35);
const jupiter = createPlanet('jupiter', 1.34, 14.6, 4331, 0.76, 0.16);
const moon = createPlanet('moon', 0.205, 1.18, 27.3, 2.1, 0.045, earth.pivot);
const moonOrbit = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.008, 6, 160), new THREE.MeshBasicMaterial({ color: 0xc2d2e7, transparent: true, opacity: 0.34 }));
moonOrbit.rotation.x = Math.PI / 2;
earth.pivot.add(moonOrbit);

function createRocket() {
  const group = new THREE.Group();
  const silver = new THREE.MeshStandardMaterial({ color: 0xe8eef8, metalness: 0.68, roughness: 0.27 });
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xff765f, metalness: 0.26, roughness: 0.3 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x283d58, metalness: 0.75, roughness: 0.34 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.1, 20), silver);
  body.position.y = 0.05;
  group.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 20), noseMat);
  nose.position.y = 0.81;
  group.add(nose);
  const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.19, 0.2, 18), darkMetal);
  engine.position.y = -0.59;
  group.add(engine);
  for (let i = 0; i < 3; i += 1) {
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.52, 4), noseMat);
    fin.position.y = -0.42;
    fin.rotation.z = Math.PI;
    fin.rotation.y = i * Math.PI * 2 / 3;
    fin.scale.set(0.72, 1, 0.34);
    group.add(fin);
  }
  const window = new THREE.Mesh(new THREE.SphereGeometry(0.073, 16, 12), new THREE.MeshStandardMaterial({ color: 0x73d9ff, emissive: 0x1678aa, emissiveIntensity: 1.2, metalness: 0.25, roughness: 0.15 }));
  window.position.set(0, 0.32, 0.148);
  group.add(window);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.65, 16), new THREE.MeshBasicMaterial({ color: 0xff9c4c, transparent: true, opacity: 0.86 }));
  flame.position.y = -0.98;
  flame.rotation.z = Math.PI;
  group.add(flame);
  const innerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.39, 12), new THREE.MeshBasicMaterial({ color: 0xffe8a1, transparent: true, opacity: 0.95 }));
  innerFlame.position.y = -0.86;
  innerFlame.rotation.z = Math.PI;
  group.add(innerFlame);
  group.scale.setScalar(0.72);
  group.visible = false;
  scene.add(group);
  return { group, flame, innerFlame };
}
const rocket = createRocket();

function createLandingCraft() {
  const group = new THREE.Group();
  const foil = new THREE.MeshStandardMaterial({ color: 0xe8bf77, metalness: 0.58, roughness: 0.32 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.2, 6), foil);
  body.position.y = 0.045;
  group.add(body);
  const cabin = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), new THREE.MeshStandardMaterial({ color: 0xf1e5c4, metalness: 0.28, roughness: 0.26 }));
  cabin.position.y = 0.19;
  group.add(cabin);
  const dark = new THREE.MeshStandardMaterial({ color: 0x405065, metalness: 0.68, roughness: 0.36 });
  const legGeo = new THREE.CylinderGeometry(0.012, 0.018, 0.24, 5);
  const footGeo = new THREE.BoxGeometry(0.085, 0.018, 0.065);
  for (let i = 0; i < 4; i += 1) {
    const angle = i * Math.PI / 2 + Math.PI / 4;
    const x = Math.cos(angle) * 0.13;
    const z = Math.sin(angle) * 0.13;
    const leg = new THREE.Mesh(legGeo, dark);
    leg.position.set(x, -0.105, z);
    leg.rotation.z = Math.cos(angle) * -0.38;
    leg.rotation.x = Math.sin(angle) * 0.38;
    group.add(leg);
    const foot = new THREE.Mesh(footGeo, foil);
    foot.position.set(x * 1.68, -0.22, z * 1.68);
    group.add(foot);
  }
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, 0.08, 8), dark);
  nozzle.position.y = -0.12;
  group.add(nozzle);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.18, 8), new THREE.MeshBasicMaterial({ color: 0xffa14f, transparent: true, opacity: 0.9 }));
  flame.position.y = -0.245;
  flame.rotation.z = Math.PI;
  flame.visible = false;
  group.add(flame);
  const marker = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 8, 28), new THREE.MeshBasicMaterial({ color: 0x23d9ff, transparent: true, opacity: 1, depthTest: false, depthWrite: false, toneMapped: false }));
  marker.rotation.x = Math.PI / 2;
  marker.position.y = 0.45;
  marker.renderOrder = 20;
  group.add(marker);
  group.scale.setScalar(0.23);
  group.visible = false;
  scene.add(group);
  group.userData.flame = flame;
  group.userData.marker = marker;
  return group;
}
const landingCraft = createLandingCraft();

function createRescueBeacon() {
  const group = new THREE.Group();
  const frame = new THREE.MeshStandardMaterial({ color: 0x8da5b9, metalness: 0.72, roughness: 0.3 });
  const panel = new THREE.MeshStandardMaterial({ color: 0x183d62, metalness: 0.42, roughness: 0.33, emissive: 0x082344, emissiveIntensity: 0.7 });
  const signal = new THREE.MeshStandardMaterial({ color: 0xffbd72, emissive: 0xff8a3d, emissiveIntensity: 1.5, metalness: 0.15, roughness: 0.2 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.025, 8), frame);
  base.position.y = 0.014;
  group.add(base);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.01, 0.13, 6), frame);
  mast.position.y = 0.085;
  group.add(mast);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), signal);
  lamp.position.y = 0.16;
  group.add(lamp);
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.008, 0.045), panel);
    wing.position.set(side * 0.07, 0.065, 0);
    group.add(wing);
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.07, 5), frame);
    strut.position.set(side * 0.035, 0.055, 0);
    group.add(strut);
  }
  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffbd72, transparent: true, opacity: 0.92, depthTest: false, depthWrite: false, toneMapped: false });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.006, 7, 36), ringMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.006;
  ring.renderOrder = 19;
  group.add(ring);
  group.scale.setScalar(0.62);
  group.visible = false;
  scene.add(group);
  return { group, signal, ringMaterial };
}
const rescueBeacon = createRescueBeacon();

const raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 1;
const pointer = new THREE.Vector2();
let pointerStart = null;
let selected = 'moon';
let paused = false;
let speed = 1;
let elapsed = 0;
let activeMission = null;
let landingMission = null;
const landingInput = { thrust: false, steer: 0 };
const landingModes = {
  training: {
    name: ['تدريب الهبوط', 'LANDING SCHOOL'], badge: ['تدريب', 'TRAINING'],
    description: ['اقتراب أهدأ ووقود أكثر. تعلّم التوجيه والفرملة من دون ضغط.', 'A calmer approach and extra fuel. Learn to steer and brake without pressure.'],
    icon: '◉', difficulty: ['مبتدئ', 'EASY'], start: { altitude: 780, verticalSpeed: 16, lateral: 55, lateralSpeed: -1.15, fuel: 64, targetRadius: 54, driftLimit: 3.2, windAmplitude: 0 }
  },
  rescue: {
    name: ['إنقاذ LUMA-1', 'LUMA-1 RESCUE'], badge: ['المهمة الأساسية', 'MAIN MISSION'],
    description: ['موازنة الوقود والسرعة والانحراف لإعادة بث الإشارة.', 'Balance fuel, speed, and drift to bring the beacon back online.'],
    icon: '✦', difficulty: ['متوسط', 'STANDARD'], start: { altitude: 920, verticalSpeed: 23, lateral: 105, lateralSpeed: -1.55, fuel: 49, targetRadius: 38, driftLimit: 2.5, windAmplitude: 0 }
  },
  storm: {
    name: ['عبور العاصفة', 'STORM CROSSING'], badge: ['تحدّي النخبة', 'ELITE CHALLENGE'],
    description: ['هبات جانبية تتبدل مع الوقت. حافظ على خط الهبوط وسط العاصفة.', 'Crosswinds shift during descent. Hold your line and land through the storm.'],
    icon: 'ϟ', difficulty: ['صعب', 'HARD'], start: { altitude: 1080, verticalSpeed: 26, lateral: 135, lateralSpeed: -1.8, fuel: 50, targetRadius: 31, driftLimit: 2.2, windAmplitude: 4.8 }
  }
};
let selectedLandingMode = 'rescue';
const landingModeHeadings = {
  training: { kicker: ['تدريب القمر · رحلة تعليمية', 'LUNAR PRACTICE · TRAINING'], heading: ['تدريب الهبوط', 'LANDING SCHOOL'], aria: ['تدريب الهبوط على القمر', 'Lunar landing training'] },
  rescue: { kicker: ['إشارة إنقاذ · LUMA-1', 'RESCUE SIGNAL · LUMA-1'], heading: ['الهبوط قرب المنارة', 'Land by the beacon'], aria: ['تحدي إنقاذ LUMA-1', 'LUMA-1 rescue challenge'] },
  storm: { kicker: ['تحدّي العاصفة · القمر', 'STORM RUN · MOON'], heading: ['الهبوط وسط الهبات', 'Land through the gusts'], aria: ['عبور عاصفة الهبوط', 'Storm landing challenge'] }
};
function updateLandingModeHeading(modeId = selectedLandingMode) {
  const copy = landingModeHeadings[modeId] || landingModeHeadings.rescue;
  $('.landing-kicker').textContent = L(...copy.kicker);
  $('.landing-head h2').textContent = L(...copy.heading);
  $('#landingHud').setAttribute('aria-label', L(...copy.aria));
}
const saveKey = 'apollo-v-flight-records-v1';
function readFlightRecords() {
  try {
    const value = JSON.parse(localStorage.getItem(saveKey) || '{}');
    return { stormUnlocked: Boolean(value.stormUnlocked), rescues: Math.max(0, Number(value.rescues) || 0), records: value.records && typeof value.records === 'object' ? value.records : {} };
  } catch { return { stormUnlocked: false, rescues: 0, records: {} }; }
}
let flightRecords = readFlightRecords();
let toastTimer;
let soundEnabled = true;
let audioContext;
const clock = new THREE.Clock();

let currentLanguage = (() => { try { return localStorage.getItem('apollo-v-language') || 'ar'; } catch { return 'ar'; } })();
const L = (ar, en) => currentLanguage === 'en' ? en : ar;
function formatArabic(number) { const value = String(number); return currentLanguage === 'en' ? value : value.replace(/[0-9]/g, digit => '٠١٢٣٤٥٦٧٨٩'[digit]); }
function setDirectText(selector, value) {
  const element = $(selector);
  if (!element) return;
  const nodes = [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
  if (!nodes.length) { element.textContent = value; return; }
  nodes.forEach((node, index) => { node.textContent = index === 0 ? value : ''; });
}
const staticTranslations = [
  ['.brand small', 'فريق استكشاف القمر', 'Lunar exploration team'],
  ['#simulationLabel', 'أزمة الإشارة القمرية', 'MOON SIGNAL CRISIS'],
  ['.panel-head .eyebrow', 'بعثة Apollo V · غرفة العمليات', 'Apollo V · Mission control'],
  ['.mission-code', 'عملية ٠١ · إنقاذ الإشارة', 'OP 01 · SIGNAL RESCUE'],
  ['#activeTitle', 'أعِد إشارة LUMA-1', 'Bring LUMA-1 back online'],
  ['#activeSummary', 'انقطعت منارة الإنقاذ على الوجه البعيد. اهبط قربها لتعيد بث الإشارة.', 'LUMA-1 has gone dark on the far side. Land in the marked zone to restore its signal.'],
  ['.mission-meta span:first-child', 'تحكّم مباشر', 'PILOT CONTROL'],
  ['.mission-meta span:last-child', 'جاذبية NASA', 'NASA GRAVITY'],
  ['#quickPlay', 'اختر المهمة', 'CHOOSE MISSION'],
  ['.section-label span:first-child', 'استكشف الأجرام', 'EXPLORE WORLDS'],
  ['.body-row[data-focus="earth"] .body-name b', 'الأرض', 'Earth'],
  ['.body-row[data-focus="earth"] .body-name small', 'كوكبنا الأزرق', 'Our blue home'],
  ['.body-row[data-focus="earth"] .body-distance', '١ وحدة فلكية', '1 AU'],
  ['.body-row[data-focus="moon"] .body-name b', 'القمر', 'Moon'],
  ['.body-row[data-focus="moon"] .body-name small', 'تابع الأرض', 'Earth’s satellite'],
  ['.body-row[data-focus="moon"] .body-distance', '٣٨٤٬٤٠٠ كم', '384,400 km'],
  ['.body-row[data-focus="mars"] .body-name b', 'المريخ', 'Mars'],
  ['.body-row[data-focus="mars"] .body-name small', 'الكوكب الأحمر', 'The red planet'],
  ['.body-row[data-focus="mars"] .body-distance', '١٫٥٢ وحدة فلكية', '1.52 AU'],
  ['.body-row[data-focus="jupiter"] .body-name b', 'المشتري', 'Jupiter'],
  ['.body-row[data-focus="jupiter"] .body-name small', 'عملاق الغاز', 'Gas giant'],
  ['.body-row[data-focus="jupiter"] .body-distance', '٥٫٢ وحدة فلكية', '5.2 AU'],
  ['.flight-kicker', 'مسار الإنقاذ', 'RESCUE TRAJECTORY'],
  ['.flight-heading > div > b', 'الأرض ', 'Earth '],
  ['#routeTarget', 'القمر', 'Moon'],
  ['.flight-stats > span:first-child', 'المدة ', 'TIME '],
  ['.flight-stats > span:last-child', 'الحالة ', 'STATUS '],
  ['#launchButton span:first-child', 'مختبر المركبة', 'VEHICLE LAB'],
  ['#abortButton', 'إنهاء المهمة', 'ABORT MISSION'],
  ['.connection', 'بيانات موثقة', 'NASA DATA'],
  ['.panel-bottom > span:last-child', 'فريق Apollo V', 'Apollo V team'],
  ['.scene-label', 'عملية إنقاذ LUMA-1', 'LUMA-1 SIGNAL RESCUE'],
  ['#sceneTitle', 'أعِد بث الإشارة', 'Restore the signal'],
  ['#sceneHint', 'هبوط ناعم · وقود محدود · نافذة إنقاذ واحدة', 'Soft landing · limited fuel · one rescue window'],
  ['.camera-hint > span:nth-child(2)', 'اسحب للدوران', 'Drag to orbit'],
  ['.camera-hint small', 'مرّر للتقريب · زر يمين للتحريك', 'Scroll to zoom · right-drag to pan'],
  ['.scale-note > span:first-child', 'المسافات والأحجام مصغّرة للمحاكاة', 'Distances and sizes are scaled for play'],
  ['.legend span:nth-child(1)', 'الشمس', 'SUN'],
  ['.legend span:nth-child(2)', 'كواكب', 'PLANETS'],
  ['.legend span:nth-child(3)', 'مدارات', 'ORBITS'],
  ['.section-count', '٠٤', '04'],
  ['.speed-control label', 'السرعة', 'SIM SPEED'],
  ['.texture-credit', 'خرائط الكواكب: ', 'Planet textures: '],
  ['.landing-kicker', 'إشارة إنقاذ · LUMA-1', 'RESCUE SIGNAL · LUMA-1'],
  ['.landing-head h2', 'الهبوط قرب المنارة', 'Land by the beacon'],
  ['#landingObjective', 'وجّه المركبة إلى منطقة الإشارة وخفّض سرعتك قبل ملامسة السطح.', 'Steer into the signal zone and slow down before touching the lunar surface.'],
  ['.landing-readouts > div:nth-child(1) small', 'ارتفاع', 'ALTITUDE'],
  ['.landing-readouts > div:nth-child(1) b i', 'م', 'm'],
  ['.landing-readouts > div:nth-child(2) small', 'سرعة الهبوط', 'DESCENT SPEED'],
  ['.landing-readouts > div:nth-child(2) b i', 'م/ث', 'm/s'],
  ['.landing-readouts > div:nth-child(3) small', 'وقود المناورة', 'FUEL'],
  ['.landing-readouts > div:nth-child(3) b i', '٪', '%'],
  ['.landing-science > span', 'جاذبية القمر', 'MOON GRAVITY'],
  ['.landing-science strong', '١٫٦٢ م/ث² · NASA', '1.62 m/s² · NASA'],
  ['.landing-target > span', 'منطقة الإشارة', 'SIGNAL ZONE'],
  ['.landing-target > small', 'أدخِل المؤشر في الحلقة الذهبية', 'Guide the marker into the gold ring'],
  ['.steer-control[data-land-steer="-1"] small', 'يسار', 'LEFT'],
  ['#landThrust', 'اضغط للدفع', 'THRUST'],
  ['#landThrust small', 'أو استمر بالضغط', ' or hold'],
  ['.steer-control[data-land-steer="1"] small', 'يمين', 'RIGHT'],
  ['#landingTip', 'نبضات قصيرة للدفع. خفّض سرعة الهبوط، ولا تهدر الوقود.', 'Use short thrust bursts. Slow your descent and conserve fuel.'],
  ['#landingResult', 'تم استعادة الإشارة!', 'SIGNAL RESTORED!'],
  ['#landingResultText', 'تمت إعادة بث LUMA-1. نجاح الإنقاذ يعتمد على هبوطك الناعم.', 'LUMA-1 is back online. A gentle landing completed the rescue.'],
  ['#landingRetry', 'أعد المحاولة', 'TRY AGAIN'],
  ['.briefing-brand > span:last-child', 'APOLLO V', 'APOLLO V'],
  ['.briefing-brand small', 'غرفة العمليات · ٠١', 'MISSION CONTROL · 01'],
  ['.briefing-eyebrow', 'القمر · إنقاذ الإشارة', 'MOON · SIGNAL RESCUE'],
  ['#briefingHeadlineTop', 'هبوط واحد.', 'One descent.'],
  ['#briefingHeadlineEm', 'إشارة واحدة لنعيدها.', 'One signal to restore.'],
  ['#briefingIntro', 'LUMA-1 خيالية. يحوّل تحدي الهبوط جاذبية القمر التي تقيسها NASA إلى قرار قابل للعب: وجّه المركبة إلى الحلقة، استخدم الدفع بحذر، واهبط مع وقود متبقٍ.', 'LUMA-1 is fictional. This lander challenge turns NASA’s measured Moon gravity into a playable decision: steer inside the signal ring, spend thrust carefully, and land with fuel to spare.'],
  ['#briefingLaunch span', 'اختر مهمة الهبوط', 'Choose a landing mission'],
  ['#briefingExplore', 'استكشف النظام أولاً', 'Explore the system first'],
  ['#briefingNote', 'Apollo V اسم الفريق. هذه محاكاة تعليمية مبسطة وليست إعادة بناء لمهمة Apollo تاريخية.', 'Apollo V is the team name. This is a simplified educational simulation, not an Apollo mission reconstruction.'],
  ['.evidence-heading > span:first-child', 'منطق المهمة', 'MISSION LOGIC'],
  ['.evidence-live', 'محاكاة', 'SIMULATION'],
  ['.mission-steps > div:nth-child(1) strong', 'وجّه', 'Steer'],
  ['.mission-steps > div:nth-child(1) small', 'ضع المؤشر داخل الحلقة الذهبية', 'Line up with the gold signal ring'],
  ['.mission-steps > div:nth-child(2) strong', 'خفّف', 'Brake'],
  ['.mission-steps > div:nth-child(2) small', 'نبضات قصيرة لإبطاء الهبوط', 'Use short engine pulses to slow down'],
  ['.mission-steps > div:nth-child(3) strong', 'أنقذ', 'Rescue'],
  ['.mission-steps > div:nth-child(3) small', 'اهبط بنعومة ووفّر الوقود', 'Land softly; conserve your fuel'],
  ['.evidence-facts > div:first-child > span', 'جاذبية سطح القمر', 'MOON SURFACE GRAVITY'],
  ['.evidence-facts > div:last-child > span', 'متوسط البعد عن الأرض', 'MEAN EARTH DISTANCE'],
  ['#briefingDataNote', 'قيمة جاذبية القمر من NASA تحرّك نموذج السقوط. الوقود والمقياس والنقاط مبسّطة للعب، وليست هندسة طيران.', 'NASA’s lunar-gravity value drives the fall model. Fuel, scale, and scoring are simplified for play—not flight engineering.'],
  ['#briefingSourceLabel', 'مصادر البحث · NASA / NSSDC', 'RESEARCH · NASA / NSSDC'],
  ['.briefing-footer > span:first-child', 'ثري دي · تجربة تفاعلية', 'THREE.JS · INTERACTIVE 3D'],
  ['.briefing-sources a:nth-child(2)', 'ورقة حقائق القمر ↗', 'Lunar fact sheet ↗'],
  ['.briefing-sources a:nth-child(3)', 'برنامج Apollo ↗', 'Apollo program ↗'],
  ['.briefing-sources a:nth-child(4)', 'حقائق القمر ↗', 'Moon facts ↗'],
  ['.briefing-footer > span:last-child', 'من تنفيذ فريق Apollo V', 'BUILT BY APOLLO V'],
  ['#workshop .workshop-kicker', 'Apollo V · مختبر المهمة القمرية', 'Apollo V · Lunar vehicle lab'],
  ['#workshopTitle', 'صمّم ', 'Design your '],
  ['#workshopTitle em', 'مركبتك', 'lander'],
  ['#workshop .workshop-header-note', 'اختياراتك تغيّر سلوك الهبوط', 'Your kit changes descent handling'],
  ['#workshop .picker-label b', 'اختر وجهتك', 'Choose destination'],
  ['#workshop .picker-label small', 'الجاذبية والجو يختلفان من عالم لآخر', 'Gravity and atmospheres vary by world'],
  ['#workshop .preview-top span:first-child', 'معاينة ثلاثية الأبعاد', '3D vehicle preview'],
  ['#workshop .preview-spin', 'اسحب لتدوير النموذج', 'Drag to rotate'],
  ['.summary-label', 'تكوينك الحالي', 'CURRENT BUILD'],
  ['#workshop .catalog-heading b', 'مكتبة القطع', 'PARTS LIBRARY'],
  ['#workshop .catalog-heading small', 'اختر قطعة لكل جزء من المركبة', 'Choose a part for each subsystem'],
  ['#workshop .engineering-heading .eyebrow', 'لوحة المهندس', 'ENGINEER CONSOLE'],
  ['#workshop .engineering-heading h3', 'اختبار التحمل', 'Stress test'],
  ['#workshop .tuning-heading b', 'ضبط المركبة', 'VEHICLE TUNING'],
  ['#workshop .tuning-heading span', 'إعدادات قابلة للتعديل', 'Adjustable settings'],
  ['#testButton', 'اختبار الصاروخ', 'TEST VEHICLE'],
  ['#launchConfirmed', 'المركبة جاهزة — أطلق المهمة', 'Vehicle ready — launch mission'],
  ['.engineering-disclaimer', 'نتائج تعليمية تقريبية وليست بديلاً عن تحليل هندسي حقيقي.', 'Educational estimates only; not a substitute for engineering analysis.'],
  ['.modal-source > span', 'حقائق ومهمات موثقة', 'Verified mission facts'],
  ['#nasaLink', 'افتح مصدر NASA ↗', 'OPEN NASA SOURCE ↗'],
  ['#missionBoardSaveNote', 'تقدمك وأفضل نتائجك تُحفظ على هذا الجهاز', 'Progress and personal bests are saved on this device'],
  ['#missionBoardGravity', 'جاذبية القمر · ١٫٦٢ م/ث²', 'MOON GRAVITY · 1.62 m/s²']
];
function landingOutcomeCopy(mission) {
  const score = formatArabic(mission.score || 0);
  const speed = formatArabic(Number(mission.verticalSpeed || 0).toFixed(1));
  const fuel = formatArabic(Math.round(mission.fuel || 0));
  const isRescue = mission.mode === 'rescue';
  const isStorm = mission.mode === 'storm';
  if (mission.outcome === 'landed') {
    return {
      title: isRescue ? L(`إشارة LUMA-1 عادت · ${score} نقطة`, `LUMA-1 ONLINE · ${score} PTS`) : isStorm ? L(`تم عبور العاصفة · ${score} نقطة`, `STORM CROSSED · ${score} PTS`) : L(`اكتمل التدريب · ${score} نقطة`, `TRAINING COMPLETE · ${score} PTS`),
      description: isRescue ? L(`نجاح الإنقاذ. سرعة الهبوط ${speed} م/ث، والوقود المتبقي ${fuel}٪. جاذبية القمر ١٫٦٢ م/ث².`, `Rescue complete. Touchdown at ${speed} m/s with ${fuel}% fuel left. Lunar gravity: 1.62 m/s².`) : isStorm ? L(`عبرت الهبات الجانبية وهبطت بسرعة ${speed} م/ث مع ${fuel}٪ وقود متبقٍ.`, `You held your line through the crosswinds and touched down at ${speed} m/s with ${fuel}% fuel left.`) : L(`هبوط تدريبي آمن بسرعة ${speed} م/ث مع ${fuel}٪ وقود متبقٍ.`, `Safe training touchdown at ${speed} m/s with ${fuel}% fuel left.`),
      retry: L('جولة جديدة', 'FLY AGAIN'),
      tip: isRescue ? L('أحسنت — بُثّت إشارة الإنقاذ من جديد.', 'Well done — the rescue signal is back online.') : isStorm ? L('أحسنت — حافظت على المسار وسط الهبات.', 'Well done — you held your line through the gusts.') : L('أحسنت — هبوط آمن. جرّب إعداداً آخر للمركبة.', 'Well done — safe landing. Try another vehicle setup.'),
      flightStatus: isRescue ? L('أُعيد بث الإشارة', 'SIGNAL RESTORED') : isStorm ? L('عُبرت العاصفة', 'STORM CROSSED') : L('اكتمل التدريب', 'TRAINING COMPLETE'),
      missionState: isRescue ? L('اكتمل الإنقاذ · الإشارة عادت', 'RESCUE COMPLETE · SIGNAL RESTORED') : isStorm ? L('اكتمل عبور العاصفة', 'STORM CROSSING COMPLETE') : L('اكتمل التدريب · هبوط آمن', 'TRAINING COMPLETE · SAFE LANDING')
    };
  }
  const reason = Math.abs(mission.lateral) >= mission.targetRadius ? L('خرجت عن منطقة الهبوط.', 'You missed the landing zone.') : mission.verticalSpeed > 5.5 ? L('سرعة الاصطدام كانت عالية.', 'Touchdown speed was too high.') : Math.abs(mission.lateralSpeed) >= mission.driftLimit ? L('الانحراف الجانبي لم يستقر.', 'Lateral drift was not under control.') : L('لم تستقر المركبة فوق السطح.', 'The lander did not stabilize above the surface.');
  return {
    title: isRescue ? L('انقطع الاتصال — حاول مجددًا', 'SIGNAL LOST — TRY AGAIN') : L('فشل الهبوط — حاول مجددًا', 'LANDING FAILED — TRY AGAIN'),
    description: `${reason} ${L('خفّض السرعة، ووجّه المؤشر إلى الحلقة، ووفر الوقود.', 'Slow down, guide the marker into the ring, and conserve fuel.')}`,
    retry: L('أعد المحاولة', 'TRY AGAIN'),
    tip: isRescue ? L('حاول مجددًا — منارة LUMA-1 ما زالت تنتظر.', 'Try again — the LUMA-1 beacon is still waiting.') : L('حاول مجددًا — تبدأ الجاذبية بسحبك فورًا.', 'Try again — lunar gravity starts pulling immediately.'),
    flightStatus: L('فشلت المحاولة', 'LANDING FAILED'),
    missionState: isRescue ? L('فُقدت الإشارة · حاول مجددًا', 'SIGNAL LOST · TRY AGAIN') : L('لم يكتمل الهبوط · حاول مجددًا', 'LANDING INCOMPLETE · TRY AGAIN')
  };
}
function applyLanguage() {
  const en = currentLanguage === 'en';
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = currentLanguage === 'en' ? 'ltr' : 'rtl';
  document.body.classList.toggle('english', en);
  for (const [selector, ar, english] of staticTranslations) setDirectText(selector, en ? english : ar);
  updateLandingModeHeading(landingMission?.mode || selectedLandingMode);
  setDirectText('.panel-head h1', en ? 'Return to ' : 'عودة إلى ');
  $('.panel-head h1 em').textContent = en ? 'the Moon' : 'القمر';
  $('#languageToggle').textContent = en ? 'عربي' : 'EN';
  $('#languageToggle').setAttribute('aria-label', en ? 'التبديل إلى العربية' : 'Switch to English');
  $('#languageToggle').title = en ? 'العربية' : 'English';
  $('#soundToggle').title = en ? 'Toggle sound' : 'تشغيل أو إيقاف الصوت';
  $('#soundToggle').setAttribute('aria-label', soundEnabled ? L('إيقاف الصوت', 'Mute sound') : L('تشغيل الصوت', 'Enable sound'));
  $('#zoomOut').setAttribute('aria-label', L('إبعاد الكاميرا', 'Zoom out'));
  $('#zoomIn').setAttribute('aria-label', L('تقريب الكاميرا', 'Zoom in'));
  $('#landingExit').setAttribute('aria-label', L('إنهاء المحاولة', 'End attempt'));
  $('#briefingSkip').setAttribute('aria-label', L('تخطّي المقدمة', 'Skip briefing'));
  $('#speedValue').textContent = `${formatArabic(speed)}×`;
  const s = $('#missionState');
  if (landingMission && !landingMission.outcome) s.textContent = landingMission.mode === 'training' ? L('تدريب الهبوط جارٍ', 'TRAINING DESCENT IN PROGRESS') : landingMission.mode === 'storm' ? L('عبور العاصفة جارٍ', 'STORM CROSSING IN PROGRESS') : L('الهبوط جارٍ · أعد إشارة LUMA-1', 'DESCENT IN PROGRESS · RESTORE LUMA-1');
  else if (landingMission?.outcome === 'landed') s.textContent = L('اكتمل الإنقاذ · الإشارة عادت', 'RESCUE COMPLETE · SIGNAL RESTORED');
  else if (landingMission?.outcome === 'crashed') s.textContent = L('فُقدت الإشارة · حاول مجددًا', 'SIGNAL LOST · TRY AGAIN');
  else s.textContent = L('منارة LUMA-1 تنتظر الإنقاذ', 'LUMA-1 beacon awaiting rescue');
  const f = $('#flightStatus');
  if (landingMission?.outcome === 'landed') f.textContent = L('أُعيد بث الإشارة', 'SIGNAL RESTORED');
  else if (landingMission?.outcome === 'crashed') f.textContent = L('فشلت المحاولة', 'ATTEMPT FAILED');
  else if (landingMission) f.textContent = L('الهبوط النهائي', 'FINAL DESCENT');
  else f.textContent = L('بانتظار الإنقاذ', 'AWAITING RESCUE');
  if (activeMission) $('#abortButton').textContent = L('إلغاء الرحلة', 'ABORT FLIGHT');
  else if (landingMission && !landingMission.outcome) $('#abortButton').textContent = L('إنهاء المحاولة', 'ABORT ATTEMPT');
  if (!activeMission && !landingMission && ['جاهز', 'READY'].includes($('#flightTime').textContent)) $('#flightTime').textContent = L('جاهز', 'READY');
  if (landingMission?.outcome === 'landed') {
    const copy = landingOutcomeCopy(landingMission);
    $('#landingResult').textContent = copy.title;
    $('#landingResultText').textContent = copy.description;
    $('#landingRetry').textContent = copy.retry;
    $('#landingTip').textContent = copy.tip;
    $('#flightStatus').textContent = copy.flightStatus;
    $('#missionState').textContent = copy.missionState;
  } else if (landingMission?.outcome === 'crashed') {
    const copy = landingOutcomeCopy(landingMission);
    $('#landingResult').textContent = copy.title;
    $('#landingResultText').textContent = copy.description;
    $('#landingRetry').textContent = copy.retry;
    $('#landingTip').textContent = copy.tip;
    $('#flightStatus').textContent = copy.flightStatus;
    $('#missionState').textContent = copy.missionState;
  }
  $('#pauseButton').setAttribute('aria-label', paused ? L('استئناف الحركة', 'Resume simulation') : L('إيقاف الحركة مؤقتاً', 'Pause simulation'));
  $('#homeView').setAttribute('aria-label', L('إعادة عرض النظام الشمسي', 'Reset solar system view'));
  $('#missionBoardClose').setAttribute('aria-label', L('إغلاق قائمة المهمات', 'Close mission board'));
  $('#landingMissionSelect').textContent = L('قائمة المهمات', 'MISSION BOARD');
  if (landingMission?.outcome === 'landed') {
    const record = flightRecords.records[landingMission.mode] || {};
    const medal = record.bestMedal || 'bronze';
    $('#landingMedal').textContent = L(medal === 'gold' ? 'ميدالية ذهبية' : medal === 'silver' ? 'ميدالية فضية' : 'ميدالية برونزية', `${medal.toUpperCase()} MEDAL`);
    $('#landingRecordLine').textContent = landingMission.isPersonalBest ? L('رقم قياسي شخصي جديد!', 'NEW PERSONAL BEST!') : L(`أفضل نتيجة لك: ${formatArabic(record.bestScore || 0)} نقطة`, `YOUR BEST: ${record.bestScore || 0} PTS`);
  } else if (landingMission?.outcome === 'crashed') {
    $('#landingMedal').hidden = true;
    $('#landingRecordLine').textContent = '';
  }
  if (!$('#missionBoard').hidden) renderMissionBoard();
}
$('#languageToggle').addEventListener('click', () => {
  currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
  try { localStorage.setItem('apollo-v-language', currentLanguage); } catch {}
  applyLanguage();
});
function playTone(frequency = 520, duration = 0.1) {
  if (!soundEnabled) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.connect(gain); gain.connect(audioContext.destination);
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.045, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
  } catch (_) { /* Web Audio is an optional enhancement. */ }
}
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
function renderMissionBoard() {
  if (!$('#missionGrid')) return;
  const entries = Object.entries(landingModes);
  $('#missionGrid').innerHTML = entries.map(([id, mode], index) => {
    const locked = id === 'storm' && !flightRecords.stormUnlocked;
    const record = flightRecords.records[id] || {};
    const best = record.bestScore ? `${formatArabic(record.bestScore)} ${L('نقطة', 'PTS')}` : L('لم تبدأ بعد', 'NOT FLOWN');
    const medal = record.bestMedal ? `<span class="mission-card-medal ${record.bestMedal}">${L(record.bestMedal === 'gold' ? 'ذهبي' : record.bestMedal === 'silver' ? 'فضي' : 'برونزي', record.bestMedal.toUpperCase())}</span>` : '';
    return `<button class="mission-option ${locked ? 'locked' : ''} ${selectedLandingMode === id ? 'selected' : ''}" type="button" data-mode="${id}" ${locked ? 'disabled aria-disabled="true"' : ''} style="--mode-index:${index}">
      <span class="mission-option-top"><span class="mission-option-icon">${locked ? '▣' : mode.icon}</span><span class="mission-option-tag">${L(...mode.badge)}</span><span class="mission-option-difficulty">${locked ? L('تُفتح بعد الإنقاذ', 'UNLOCK AFTER RESCUE') : L(...mode.difficulty)}</span></span>
      <strong>${L(...mode.name)}</strong><span class="mission-option-description">${L(...mode.description)}</span>
      <span class="mission-option-record"><span>${L('أفضل نتيجة', 'PERSONAL BEST')}</span><b>${locked ? L('أكمل إنقاذ LUMA-1', 'COMPLETE LUMA-1 RESCUE') : best}</b>${medal}</span>
      <span class="mission-option-action">${locked ? L('مقفلة', 'LOCKED') : L(id === 'training' ? 'ابدأ التدريب' : id === 'rescue' ? 'أطلق مهمة الإنقاذ' : 'ادخل العاصفة', id === 'training' ? 'START TRAINING' : id === 'rescue' ? 'LAUNCH RESCUE' : 'ENTER THE STORM')} <i>↗</i></span>
    </button>`;
  }).join('');
  const total = flightRecords.rescues;
  const personalBest = Math.max(0, ...Object.values(flightRecords.records).map(record => Number(record?.bestScore) || 0));
  $('#missionBoardStats').innerHTML = `<span><small>${L('عمليات الإنقاذ', 'RESCUES')}</small><b>${formatArabic(total)}</b></span><span><small>${L('أفضل نتيجة', 'PERSONAL BEST')}</small><b>${personalBest ? formatArabic(personalBest) : '—'}</b></span><span><small>${L('المهمة التالية', 'NEXT UNLOCK')}</small><b>${flightRecords.stormUnlocked ? L('العاصفة مفتوحة', 'STORM OPEN') : L('أنقذ LUMA-1', 'RESCUE LUMA-1')}</b></span>`;
  $('#missionBoardTitle').innerHTML = L('اختر <em>مهمتك</em>', 'CHOOSE YOUR <em>MISSION</em>');
  $('#missionBoardSubtitle').textContent = L('كل هبوط له ظروفه. تعلّم، أنقذ، ثم واجه العاصفة.', 'Every descent changes the rules. Train, rescue, then face the storm.');
}
function openMissionBoard() {
  if (activeMission || (landingMission && !landingMission.outcome)) { showToast(L('أكمل الهبوط الحالي أو ألغِه قبل اختيار مهمة أخرى.', 'Finish or abort the current descent before choosing another mission.')); return; }
  renderMissionBoard();
  $('#missionBoard').hidden = false;
  playTone(570, 0.08);
}
function closeMissionBoard() { $('#missionBoard').hidden = true; }
function saveLandingResult(mission) {
  const previous = flightRecords.records[mission.mode] || {};
  const personalBest = mission.score > (Number(previous.bestScore) || 0);
  mission.isPersonalBest = personalBest;
  const bestScore = Math.max(Number(previous.bestScore) || 0, mission.score);
  const bestMedal = bestScore >= 820 ? 'gold' : bestScore >= 610 ? 'silver' : 'bronze';
  flightRecords.records[mission.mode] = { bestScore, bestMedal, completed: Boolean(previous.completed) || mission.outcome === 'landed' };
  if (mission.mode === 'rescue' && mission.outcome === 'landed') flightRecords.rescues += 1;
  if (mission.mode === 'rescue' && mission.outcome === 'landed') flightRecords.stormUnlocked = true;
  try { localStorage.setItem(saveKey, JSON.stringify(flightRecords)); } catch {}
  $('#landingMedal').textContent = L(bestMedal === 'gold' ? 'ميدالية ذهبية' : bestMedal === 'silver' ? 'ميدالية فضية' : 'ميدالية برونزية', `${bestMedal.toUpperCase()} MEDAL`);
  $('#landingMedal').className = `landing-medal ${bestMedal}`;
  $('#landingRecordLine').textContent = L(personalBest ? 'رقم قياسي شخصي جديد!' : `أفضل نتيجة لك: ${formatArabic(bestScore)} نقطة`, personalBest ? 'NEW PERSONAL BEST!' : `YOUR BEST: ${bestScore} PTS`);
}
function getLanderHandling(mode) {
  let design = null;
  try { if (typeof calculateDesign === 'function') design = calculateDesign(); } catch {}
  const base = mode.start;
  const tankScale = design ? THREE.MathUtils.clamp(design.tank.capacity / 80000, 0.62, 1.18) : 1;
  const sliderFuel = design ? THREE.MathUtils.clamp(design.fuelPercent / 0.82, 0.45, 1.2) : 1;
  const boosterFuel = design ? 1 + THREE.MathUtils.clamp(design.boosters.propellant / 100000, 0, 0.12) : 1;
  const fuel = THREE.MathUtils.clamp(base.fuel * tankScale * sliderFuel * boosterFuel, 18, 82);
  const thrustRatio = design ? THREE.MathUtils.clamp(design.destinationTwr / 26.5, 0.68, 1.36) : 1;
  const steeringRatio = design ? THREE.MathUtils.clamp((design.stability / 46) * design.wingSpan, 0.68, 1.34) : 1;
  return { fuel, brakeAcceleration: 2.83 * thrustRatio, steeringAcceleration: 7.5 * steeringRatio, driftDamping: 0.22 + steeringRatio * 0.08, thrustRatio, steeringRatio };
}
function getWorldPosition(key) {
  const body = bodyMap[key];
  const position = new THREE.Vector3();
  body.mesh.getWorldPosition(position);
  return position;
}
function setSelection(key, openModal = true) {
  if (!planetData[key]) return;
  selected = key;
  document.querySelectorAll('.body-row').forEach(row => row.classList.toggle('selected', row.dataset.focus === key));
  const launchView = key === 'moon' && !openModal;
  $('#activeTitle').textContent = launchView ? 'اهبط بالمركبة قبل نفاد الوقود' : key === 'sun' ? 'استكشف قلب النظام الشمسي' : `استكشف ${planetData[key].name}`;
  $('#activeSummary').textContent = launchView ? 'اضبط الدفع والانحراف. الهبوط الناعم وحده يُكمل المهمة.' : key === 'sun' ? 'مصدر الضوء والطاقة؛ اضغط لقراءة ملف النجم المركزي.' : `اقترب من ${planetData[key].name} وافتح ملفه العلمي لمعرفة أسراره ومهمات ناسا المرتبطة به.`;
  $('#sceneTitle').textContent = launchView ? 'هل تهبط بأمان؟' : planetData[key].name;
  $('#sceneHint').textContent = launchView ? 'وقود محدود · جاذبية حقيقية · لمسة واحدة للنجاح' : 'افتح الملف لاستكشاف البيانات ومهمات NASA';
  if (openModal) openPlanetModal(key);
}
function openPlanetModal(key) {
  const data = planetData[key];
  $('#modalPlanet').className = `modal-planet ${key}-orb`;
  $('#modalKicker').textContent = `ملف سماوي · ${data.index}`;
  $('#modalTitle').textContent = data.name;
  $('#modalSubtitle').textContent = data.subtitle;
  $('#modalIndex').textContent = data.index;
  $('#modalDescription').textContent = data.description;
  $('#gravityValue').textContent = data.gravity;
  $('#atmosphereValue').textContent = data.atmosphere;
  $('#atmosphereNote').textContent = data.atmosphereNote;
  $('#missionValue').textContent = data.mission;
  $('#missionNote').textContent = data.missionNote;
  $('#nasaLink').href = data.url;
  $('#planetModal').hidden = false;
  playTone(680, 0.08);
}
function closeModal() { $('#planetModal').hidden = true; }
function focusOn(key) {
  const point = key === 'sun' ? new THREE.Vector3() : getWorldPosition(key);
  const distance = key === 'jupiter' ? 5.4 : key === 'sun' ? 11 : key === 'moon' ? 1.55 : 4.0;
  const direction = new THREE.Vector3(0.58, 0.48, 0.65).normalize();
  controls.target.copy(point);
  camera.position.copy(point).addScaledVector(direction, distance);
  controls.minDistance = key === 'sun' ? 4.8 : key === 'moon' ? 0.55 : 1.2;
  controls.update();
}

const homeCameraPosition = new THREE.Vector3(-0.5, 14, 28);
const homeTarget = new THREE.Vector3(2.5, 0, 0);
focusOn('moon');
document.querySelectorAll('.body-row').forEach(row => row.addEventListener('click', () => {
  const key = row.dataset.focus;
  setSelection(key, false);
  focusOn(key);
  openPlanetModal(key);
}));
$('#closeModal').addEventListener('click', closeModal);
$('#planetModal').addEventListener('click', event => { if (event.target === $('#planetModal')) closeModal(); });
window.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });

renderer.domElement.addEventListener('pointerdown', event => { pointerStart = { x: event.clientX, y: event.clientY }; });
renderer.domElement.addEventListener('pointerup', event => {
  if (!pointerStart || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5) { pointerStart = null; return; }
  pointerStart = null;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects([...clickableBodies, sun], false);
  if (hits.length) {
    const key = hits[0].object === sun ? 'sun' : hits[0].object.name;
    setSelection(key, true);
  }
});

function launchMission() {
  if (activeMission) return;
  closeModal();
  const start = getWorldPosition('earth').clone();
  const target = getWorldPosition(selectedDestination).clone();
  activeMission = { start, target, progress: 0, duration: 5 };
  rocket.group.visible = true;
  $('#launchButton').disabled = true;
  $('#abortButton').hidden = false;
  $('#missionState').textContent = L(`Apollo V في طريقها إلى ${destinationData[selectedDestination].name}`, `Apollo V en route to ${destinationData[selectedDestination].name}`);
  $('#flightStatus').textContent = L('انطلقت', 'LAUNCHED');
  $('#flightStatus').style.color = '#83e3ee';
  $('#abortButton').textContent = L('إلغاء الرحلة', 'ABORT FLIGHT');
  $('#flightTime').textContent = L('٠٠:٠٠', '00:00');
  $('.route-ship').style.right = '8px';
  playTone(390, 0.22);
  showToast(`انطلقت Apollo V — استعد للتحكم اليدوي عند الاقتراب من ${destinationData[selectedDestination].name}.`);
}
function updateLandingHud() {
  if (!landingMission) return;
  const m = landingMission;
  $('#landAltitude').textContent = formatArabic(Math.max(0, Math.ceil(m.altitude)));
  const signedVertical = `${m.verticalSpeed < 0 ? '−' : ''}${formatArabic(Math.round(Math.abs(m.verticalSpeed)))}`;
  $('#landVertical').textContent = signedVertical;
  $('#landFuel').textContent = formatArabic(Math.round(m.fuel));
  const phaseId = m.altitude > 560 ? 'approach' : m.altitude > 170 ? 'align' : 'flare';
  const phaseNames = { approach: ['الاقتراب · افحص السرعة', 'APPROACH · CHECK SPEED'], align: ['المحاذاة · صحّح الانحراف', 'ALIGN · CORRECT DRIFT'], flare: ['الهبوط النهائي · نبضات قصيرة', 'FINAL FLARE · SHORT BURNS'] };
  const guidance = {
    approach: ['استخدم دفعات قصيرة لخفض سرعة السقوط، وابدأ تصحيح اتجاهك مبكراً.', 'Use short burns to slow down; begin correcting your heading early.'],
    align: [Math.abs(m.lateral) > m.targetRadius ? 'المؤشر خارج الحلقة — وجّه نحو المركز قبل نفاد الارتفاع.' : 'أنت داخل مسار الإشارة — ركّز الآن على سرعة الهبوط.', Math.abs(m.lateral) > m.targetRadius ? 'Marker outside the ring — steer toward center before altitude runs out.' : 'You are inside the signal lane — focus on descent speed now.'],
    flare: ['السطح قريب! ثبّت الانحراف واجعل سرعة اللمس أقل من ٥٫٥ م/ث.', 'Surface close! Stabilize drift and keep touchdown below 5.5 m/s.']
  };
  $('#landingPhase').textContent = L(...phaseNames[phaseId]);
  $('#landingObjective').textContent = L(...guidance[phaseId]);
  const gust = m.windAmplitude ? Math.sin(m.elapsed * 0.86) * m.windAmplitude + Math.sin(m.elapsed * 1.9) * m.windAmplitude * 0.22 : 0;
  const condition = gust > 1.1 ? L('هبة جانبية ←', 'GUST ←') : gust < -1.1 ? L('هبة جانبية →', 'GUST →') : m.windAmplitude ? L('عاصفة متقلبة · انتبه للهبات', 'SHIFTING STORM · WATCH GUSTS') : m.mode === 'training' ? L('تدريب · منطقة واسعة', 'TRAINING · WIDE ZONE') : L('طقس هادئ · لا توجد هبات', 'CALM · NO GUSTS');
  $('#landingCondition').textContent = condition;
  $('#landingCondition').classList.toggle('gust-warning', Math.abs(gust) > 1.1);
  $('#landingHud').classList.toggle('landing-risk', m.verticalSpeed > 23 || Math.abs(m.lateral) > m.targetRadius * 1.65 || m.fuel < 12);
  $('#flightTime').textContent = `${L('٠٠:', '00:')}${formatArabic(Math.floor(m.elapsed).toString().padStart(2, '0'))}`;
  $('#landFuelBar').style.width = `${Math.max(0, m.fuel)}%`;
  $('#landFuelBar').style.background = m.fuel < 15 ? 'linear-gradient(90deg,#ff756f,#ffbf70)' : 'linear-gradient(90deg,#70e5b3,#ffcc76)';
  const marker = Math.max(4, Math.min(96, 50 + m.lateral / 5));
  $('#landMarker').style.left = `${marker}%`;
  $('#landMarker').style.borderColor = Math.abs(m.lateral) < m.targetRadius ? '#70e5b3' : '#ffbc76';
  $('#landMarker').style.background = Math.abs(m.lateral) < m.targetRadius ? '#70e5b3' : '#ffbc76';
}
function startLandingChallenge(modeId = selectedLandingMode) {
  if (activeMission || (landingMission && !landingMission.outcome)) { showToast(L('أكمل محاولة الهبوط الحالية أولاً.', 'Finish or abort the current descent first.')); return; }
  landingMission = null;
  landingCraft.visible = false;
  closeModal();
  $('#workshop').hidden = true;
  const center = getWorldPosition('moon');
  const earthCenter = getWorldPosition('earth');
  const normal = center.clone().sub(earthCenter).normalize();
  const tangent = new THREE.Vector3().crossVectors(normal, new THREE.Vector3(0, 1, 0)).normalize();
  selectedLandingMode = landingModes[modeId] ? modeId : 'rescue';
  updateLandingModeHeading(selectedLandingMode);
  const mode = landingModes[selectedLandingMode];
  const handling = getLanderHandling(mode);
  landingMission = { ...mode.start, altitude: mode.start.altitude, verticalSpeed: mode.start.verticalSpeed, lateral: mode.start.lateral, lateralSpeed: mode.start.lateralSpeed, fuel: handling.fuel, maxFuel: handling.fuel, normal, tangent, outcome: null, elapsed: 0, mode: selectedLandingMode, windAmplitude: mode.start.windAmplitude, handling, score: 0 };
  const surfaceOffset = moon.radius + landingMission.altitude * 0.00012;
  landingCraft.position.copy(center).addScaledVector(normal, surfaceOffset).addScaledVector(tangent, landingMission.lateral * 0.00012);
  landingCraft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  landingCraft.visible = true;
  rescueBeacon.group.visible = true;
  rescueBeacon.group.position.copy(center).addScaledVector(normal, moon.radius + 0.007);
  rescueBeacon.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  $('#landingCondition').textContent = L(...mode.badge);
  $('#landingPhase').textContent = L('مرحلة الاقتراب', 'APPROACH');
  rescueBeacon.signal.color.set(0xffbd72);
  rescueBeacon.signal.emissive.set(0xff8a3d);
  rescueBeacon.signal.emissiveIntensity = 1.5;
  rescueBeacon.ringMaterial.color.set(0xffbd72);
  landingInput.thrust = false;
  landingInput.steer = 0;
  $('#landingHud').hidden = false;
  $('#landingEnd').hidden = true;
  $('#landingEnd').classList.remove('fail');
  $('#landingHud').classList.remove('landing-risk');
  $('#landingMedal').hidden = false;
  $('#landingTip').textContent = L('الأسهم أو A/D للتوجيه · Space للدفع · P للإيقاف المؤقت.', 'Arrows or A/D to steer · Space to thrust · P to pause.');
  $('#landingResult').textContent = L('تم استعادة الإشارة!', 'SIGNAL RESTORED!');
  $('#landingResultText').textContent = '';
  $('#landThrust').classList.remove('pressed');
  document.querySelectorAll('[data-land-steer]').forEach(button => button.classList.remove('pressed'));
  $('#missionState').textContent = selectedLandingMode === 'training' ? L('تدريب الهبوط جارٍ', 'TRAINING DESCENT IN PROGRESS') : selectedLandingMode === 'storm' ? L('عبور العاصفة جارٍ', 'STORM CROSSING IN PROGRESS') : L('الهبوط جارٍ · أعد إشارة LUMA-1', 'DESCENT IN PROGRESS · RESTORE LUMA-1');
  $('#flightStatus').textContent = L('الهبوط النهائي', 'FINAL DESCENT');
  $('#flightStatus').style.color = '#ffc47a';
  $('#flightTime').textContent = L('٠٠:٠٠', '00:00');
  $('#launchButton').disabled = true;
  $('#abortButton').hidden = false;
  $('#abortButton').textContent = L('إنهاء المحاولة', 'ABORT ATTEMPT');
  const target = landingCraft.position.clone();
  const cameraOffset = normal.clone().multiplyScalar(0.16).addScaledVector(tangent, 0.82);
  controls.target.copy(target);
  camera.position.copy(target).add(cameraOffset);
  landingFillLight.position.copy(camera.position);
  landingFillLight.intensity = 1.2;
  controls.minDistance = 0.16;
  controls.maxDistance = 4.5;
  controls.update();
  updateLandingHud();
  playTone(620, 0.15);
  const launchMessage = selectedLandingMode === 'training' ? ['بدأ التدريب — تعرّف على حلقة الهبوط وإرشادات السرعة.', 'Training started — follow the landing ring and speed guidance.'] : selectedLandingMode === 'storm' ? ['العاصفة نشطة — راقب اتجاه الهبات وصحّح مسارك.', 'Storm active — watch gust direction and correct your line.'] : ['منارة LUMA-1 أمامك — اقترب من الحلقة الذهبية.', 'LUMA-1 beacon ahead — aim for the gold ring.'];
  showToast(L(...launchMessage));
}
function endLanding(success) {
  if (!landingMission || landingMission.outcome) return;
  landingMission.outcome = success ? 'landed' : 'crashed';
  landingInput.thrust = false;
  landingInput.steer = 0;
  landingCraft.userData.flame.visible = false;
  $('#landThrust').classList.remove('pressed');
  document.querySelectorAll('[data-land-steer]').forEach(button => button.classList.remove('pressed'));
  $('#landingEnd').hidden = false;
  $('#landingEnd').classList.toggle('fail', !success);
  let copy;
  if (success) {
    const score = Math.max(100, Math.round(1200 - Math.abs(landingMission.lateral) * 5 - Math.abs(landingMission.verticalSpeed) * 42 - Math.abs(landingMission.lateralSpeed) * 28 + landingMission.fuel * 3));
    landingMission.score = score;
    saveLandingResult(landingMission);
    rescueBeacon.signal.color.set(0x83ffc0);
    rescueBeacon.signal.emissive.set(0x22e69a);
    rescueBeacon.signal.emissiveIntensity = 2.8;
    rescueBeacon.ringMaterial.color.set(0x83ffc0);
    copy = landingOutcomeCopy(landingMission);
    $('#landingResult').textContent = copy.title;
    $('#landingResultText').textContent = copy.description;
    $('#flightStatus').textContent = copy.flightStatus;
    $('#flightStatus').style.color = '#83e3a9';
    $('#missionState').textContent = copy.missionState;
    playTone(790, 0.28);
  } else {
    $('#landingMedal').hidden = true;
    $('#landingRecordLine').textContent = '';
    copy = landingOutcomeCopy(landingMission);
    $('#landingResult').textContent = copy.title;
    $('#landingResultText').textContent = copy.description;
    $('#landingEnd').classList.add('fail');
    $('#flightStatus').textContent = copy.flightStatus;
    $('#flightStatus').style.color = '#ff957e';
    $('#missionState').textContent = copy.missionState;
    playTone(180, 0.3);
  }
  $('#landingRetry').textContent = copy.retry;
  $('#landingMissionSelect').textContent = L('قائمة المهمات', 'MISSION BOARD');
  $('#abortButton').hidden = true;
  $('#launchButton').disabled = false;
  $('#landingTip').textContent = copy.tip;
}
function updateLandingChallenge(delta) {
  const m = landingMission;
  if (!m || m.outcome || paused) return;
  const dt = delta;
  const thrusting = landingInput.thrust && m.fuel > 0;
  if (thrusting) {
    m.verticalSpeed += (1.62 - m.handling.brakeAcceleration) * dt;
    m.fuel = Math.max(0, m.fuel - 1.05 * dt);
  } else {
    m.verticalSpeed += 1.62 * dt;
  }
  m.verticalSpeed = Math.max(-7, Math.min(48, m.verticalSpeed));
  const wind = m.windAmplitude ? Math.sin(m.elapsed * 0.86) * m.windAmplitude + Math.sin(m.elapsed * 1.9) * m.windAmplitude * 0.22 : 0;
  m.lateralSpeed += (landingInput.steer * m.handling.steeringAcceleration + wind) * dt;
  m.lateralSpeed *= Math.max(0, 1 - m.handling.driftDamping * dt);
  m.lateral += m.lateralSpeed * dt;
  m.altitude -= m.verticalSpeed * dt;
  m.elapsed += dt;
  const center = getWorldPosition('moon');
  const surfaceOffset = moon.radius + Math.max(0, m.altitude) * 0.00012;
  landingCraft.position.copy(center).addScaledVector(m.normal, surfaceOffset).addScaledVector(m.tangent, m.lateral * 0.00012);
  rescueBeacon.group.position.copy(center).addScaledVector(m.normal, moon.radius + 0.007);
  rescueBeacon.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), m.normal);
  const baseRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), m.normal);
  const lean = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.max(-0.2, Math.min(0.2, m.lateralSpeed * 0.012)));
  landingCraft.quaternion.copy(baseRotation).multiply(lean);
  landingCraft.userData.flame.visible = thrusting;
  if (thrusting) landingCraft.userData.flame.scale.setScalar(0.8 + Math.random() * 0.5);
  landingCraft.userData.marker.scale.setScalar(1 + Math.sin(m.elapsed * 4) * 0.08);
  const cameraTarget = landingCraft.position.clone();
  const cameraOffset = m.normal.clone().multiplyScalar(0.16).addScaledVector(m.tangent, 0.82);
  controls.target.copy(cameraTarget);
  camera.position.copy(cameraTarget).add(cameraOffset);
  landingFillLight.position.copy(camera.position);
  updateLandingHud();
  if (m.altitude <= 0) endLanding(m.verticalSpeed >= 0 && m.verticalSpeed <= 5.5 && Math.abs(m.lateral) < m.targetRadius && Math.abs(m.lateralSpeed) < m.driftLimit);
}
function finishMission() {
  activeMission = null;
  rocket.group.visible = false;
  $('#flightTime').textContent = '٠٠:٠٥';
  $('.route-ship').style.right = 'calc(100% - 18px)';
  if (selectedDestination === 'moon') {
    startLandingChallenge();
    return;
  }
  $('#launchButton').disabled = false;
  $('#abortButton').hidden = true;
  $('#missionState').textContent = 'اكتملت الرحلة';
  $('#flightStatus').textContent = 'وصلت المركبة';
  $('#flightStatus').style.color = '#83e3a9';
  playTone(790, 0.23);
  showToast(selectedDestination === 'jupiter' ? 'وصلت المركبة إلى طبقة السحب الافتراضية. المشتري لا يملك سطحاً صلباً للهبوط.' : `وصلت المركبة إلى ${destinationData[selectedDestination].name}.`);
}
function abortMission() {
  if (!activeMission && !landingMission) return;
  activeMission = null;
  landingMission = null;
  rocket.group.visible = false;
  landingCraft.visible = false;
  landingCraft.userData.flame.visible = false;
  landingInput.thrust = false;
  landingInput.steer = 0;
  $('#landingHud').hidden = true;
  rescueBeacon.group.visible = false;
  landingFillLight.intensity = 0;
  $('#launchButton').disabled = false;
  $('#abortButton').hidden = true;
  $('#missionState').textContent = L('منارة LUMA-1 تنتظر الإنقاذ', 'LUMA-1 beacon awaiting rescue');
  $('#flightStatus').textContent = L('أُلغيت', 'ABORTED');
  $('#flightStatus').style.color = '#ff957e';
  $('#flightTime').textContent = L('جاهز', 'READY');
  $('.route-ship').style.right = '8px';
  showToast(L('أُلغيت المحاولة. يمكنك بدء الإنقاذ مجدداً.', 'Attempt aborted. You can launch the rescue again.'));
}
$('#launchButton').addEventListener('click', openWorkshop);
$('#quickPlay').addEventListener('click', openMissionBoard);
const closeMissionBriefing = () => { $('#missionBriefing').hidden = true; document.body.classList.remove('briefing-active'); };
$('#briefingLaunch').addEventListener('click', () => { closeMissionBriefing(); openMissionBoard(); });
$('#briefingExplore').addEventListener('click', closeMissionBriefing);
$('#briefingSkip').addEventListener('click', closeMissionBriefing);
$('#missionBriefing').addEventListener('click', event => { if (event.target === $('#missionBriefing')) closeMissionBriefing(); });
window.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('#missionBriefing').hidden) closeMissionBriefing(); });
$('#abortButton').addEventListener('click', abortMission);
$('#landingExit').addEventListener('click', abortMission);
$('#landingRetry').addEventListener('click', () => startLandingChallenge(selectedLandingMode));
$('#landingMissionSelect').addEventListener('click', openMissionBoard);
$('#missionBoardClose').addEventListener('click', closeMissionBoard);
$('#missionBoard').addEventListener('click', event => { if (event.target === $('#missionBoard')) closeMissionBoard(); });
$('#missionGrid').addEventListener('click', event => {
  const button = event.target.closest('[data-mode]');
  if (!button || button.disabled) return;
  selectedLandingMode = button.dataset.mode;
  closeMissionBoard();
  startLandingChallenge(selectedLandingMode);
});
window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !$('#missionBoard').hidden) closeMissionBoard();
});
$('#landThrust').addEventListener('pointerdown', event => { event.preventDefault(); landingInput.thrust = true; event.currentTarget.classList.add('pressed'); });
['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture'].forEach(type => $('#landThrust').addEventListener(type, () => { landingInput.thrust = false; $('#landThrust').classList.remove('pressed'); }));
document.querySelectorAll('[data-land-steer]').forEach(button => {
  const direction = Number(button.dataset.landSteer);
  button.addEventListener('pointerdown', event => { event.preventDefault(); landingInput.steer = direction; button.classList.add('pressed'); });
  ['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture'].forEach(type => button.addEventListener(type, () => { if (landingInput.steer === direction) landingInput.steer = 0; button.classList.remove('pressed'); }));
});
window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !$('#workshop').hidden) { closeWorkshop(); return; }
  if (!landingMission || landingMission.outcome) return;
  if (event.code === 'Space' || event.code === 'ArrowUp') { event.preventDefault(); landingInput.thrust = true; $('#landThrust').classList.add('pressed'); }
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') { event.preventDefault(); landingInput.steer = -1; document.querySelector('[data-land-steer="-1"]').classList.add('pressed'); }
  if (event.code === 'ArrowRight' || event.code === 'KeyD') { event.preventDefault(); landingInput.steer = 1; document.querySelector('[data-land-steer="1"]').classList.add('pressed'); }
  if (event.code === 'KeyP' && landingMission && !landingMission.outcome) $('#pauseButton').click();
});
window.addEventListener('keyup', event => {
  if (event.code === 'Space' || event.code === 'ArrowUp') { landingInput.thrust = false; $('#landThrust').classList.remove('pressed'); }
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') { if (landingInput.steer === -1) landingInput.steer = 0; document.querySelector('[data-land-steer="-1"]').classList.remove('pressed'); }
  if (event.code === 'ArrowRight' || event.code === 'KeyD') { if (landingInput.steer === 1) landingInput.steer = 0; document.querySelector('[data-land-steer="1"]').classList.remove('pressed'); }
  if (event.code === 'KeyP') event.preventDefault();
});
$('#pauseButton').addEventListener('click', () => {
  paused = !paused;
  $('#pauseButton').textContent = paused ? '▶' : 'Ⅱ';
  $('#pauseButton').setAttribute('aria-label', paused ? 'استئناف الحركة' : 'إيقاف الحركة مؤقتاً');
  $('#missionState').textContent = paused ? 'المحاكاة متوقفة مؤقتاً' : (landingMission && !landingMission.outcome ? 'تحكّم يدوي · مرحلة الهبوط' : activeMission ? `Apollo V في طريقها إلى ${destinationData[selectedDestination].name}` : 'مهمة القمر جاهزة');
});
$('#speedRange').addEventListener('input', event => {
  speed = [0, 0.5, 1, 2][Number(event.target.value)];
  $('#speedValue').textContent = `${formatArabic(speed)}×`;
});
$('#zoomIn').addEventListener('click', () => { camera.position.addScaledVector(camera.position.clone().sub(controls.target).normalize(), -2); controls.update(); });
$('#zoomOut').addEventListener('click', () => { camera.position.addScaledVector(camera.position.clone().sub(controls.target).normalize(), 2); controls.update(); });
$('#homeView').addEventListener('click', () => { if (landingMission) { showToast('أكمل الجولة أو أغلق نتيجة الهبوط أولاً.'); return; } closeModal(); controls.target.copy(homeTarget); camera.position.copy(homeCameraPosition); controls.minDistance = 5.5; selected = ''; setSelection('earth', false); $('#sceneTitle').textContent = 'النظام الشمسي'; controls.update(); });
$('#soundToggle').addEventListener('click', event => {
  soundEnabled = !soundEnabled;
  event.currentTarget.textContent = soundEnabled ? '♫' : '♪';
  event.currentTarget.setAttribute('aria-label', soundEnabled ? 'إيقاف الصوت' : 'تشغيل الصوت');
  if (soundEnabled) playTone(620, 0.08);
});

const resizeObserver = new ResizeObserver(() => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 700 ? 1.5 : 2));
});
resizeObserver.observe(sceneHost);

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.04);
  const simulationDelta = paused ? 0 : delta * speed;
  elapsed += simulationDelta;
  for (const key of ['earth', 'mars', 'jupiter']) {
    const body = bodyMap[key];
    const angularRate = (Math.PI * 2 / body.period) * 7.8;
    const angle = body.phase + elapsed * angularRate;
    body.pivot.position.set(Math.cos(angle) * body.orbitRadius, 0, Math.sin(angle) * body.orbitRadius);
    body.mesh.rotation.y += simulationDelta * body.rotation;
  }
  moon.mesh.rotation.y += simulationDelta * moon.rotation;
  sun.rotation.y += simulationDelta * 0.035;
  starfield.rotation.y += simulationDelta * 0.0005;
  sunHalo.material.opacity = 0.83 + Math.sin(performance.now() * 0.00065) * 0.08;
  if (activeMission && !paused) {
    activeMission.progress += delta / activeMission.duration;
    const t = Math.min(activeMission.progress, 1);
    const point = new THREE.Vector3().lerpVectors(activeMission.start, activeMission.target, t);
    point.y += Math.sin(t * Math.PI) * 3.6;
    rocket.group.position.copy(point);
    const tangent = new THREE.Vector3().subVectors(activeMission.target, activeMission.start);
    tangent.y = Math.cos(t * Math.PI) * 3.6;
    rocket.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent.normalize());
    const flicker = 0.82 + Math.random() * 0.38;
    rocket.flame.scale.setScalar(flicker);
    rocket.innerFlame.scale.setScalar(0.75 + Math.random() * 0.4);
    $('#flightTime').textContent = `٠٠:${formatArabic(Math.min(5, Math.floor(t * 5)).toString().padStart(2, '0'))}`;
    $('.route-ship').style.right = `${8 + t * 72}%`;
    if (t >= 1) finishMission();
  }
  updateLandingChallenge(delta);
  controls.update();
  renderer.render(scene, camera);
  if (previewRenderer && !$('#workshop').hidden) {
    previewRocket.rotation.y += delta * 0.22;
    if (previewFlame) previewFlame.scale.setScalar(0.84 + Math.random() * 0.2);
    if (previewInnerFlame) previewInnerFlame.scale.setScalar(0.84 + Math.random() * 0.2);
    previewControls.update();
    previewRenderer.render(previewScene, previewCamera);
  }
}
setSelection('moon', false);
animate();


// Rocket engineering workshop: educational estimates, not flight-certified calculations.
const destinationData = {
  moon: { name: 'القمر', gravity: 1.62, pressure: 0, heat: 350, requiredDv: 3.1, subtitle: 'فراغ شبه كامل · هبوط على سطح صخري', color: '#c4d2e7', solid: true },
  mars: { name: 'المريخ', gravity: 3.71, pressure: 0.006, heat: 850, requiredDv: 5.35, subtitle: 'جو رقيق · سطح صخري بارد', color: '#ff927a', solid: true },
  jupiter: { name: 'المشتري', gravity: 23.1, pressure: 10, heat: 2600, requiredDv: 9.5, subtitle: 'طبقة سحب افتراضية · لا يوجد سطح صلب', color: '#ffd195', solid: false }
};
const componentLibrary = {
  engines: [
    { id: 'chemical', name: 'كيميائي كلاسيكي', family: 'محرك', thrust: 2200, isp: 340, mass: 4.2, heat: 1400, color: '#91a4bb', note: 'قوة متوازنة · دفع ٢٫٢ ميغا نيوتن', short: '٢٫٢ MN' },
    { id: 'methane', name: 'غاز ميثان مطوّر', family: 'محرك', thrust: 3600, isp: 390, mass: 5.8, heat: 1850, color: '#79dbe8', note: 'قوي وقابل لإعادة التشغيل · ٣٫٦ ميغا نيوتن', short: '٣٫٦ MN' },
    { id: 'hydrogen', name: 'هيدروجين فائق', family: 'محرك', thrust: 3100, isp: 450, mass: 7.2, heat: 2100, color: '#7bafff', note: 'كفاءة وقود أعلى · ٤٥٠ ثانية نوعية', short: '٤٥٠ ث' },
    { id: 'nuclear', name: 'نووي حراري تجريبي', family: 'محرك', thrust: 1550, isp: 900, mass: 9.5, heat: 2450, color: '#be9cff', note: 'مدى بعيد جداً · دفع أقل وحرارة عالية', short: '٩٠٠ ث' },
    { id: 'ion', name: 'أيون كهربائي', family: 'محرك', thrust: 0.09, isp: 2400, mass: 2.1, heat: 420, color: '#81e9ce', note: 'وقود شديد الكفاءة · لا يرفع صاروخاً ثقيلاً وحده', short: '٢٤٠٠ ث' },
    { id: 'heavy', name: 'رافعة ثقيلة', family: 'محرك', thrust: 7200, isp: 355, mass: 15.5, heat: 1700, color: '#ffb56f', note: 'دفع ضخم لرفع الحمولات الكبيرة', short: '٧٫٢ MN' }
  ],
  tanks: [
    { id: 'compact', name: 'خزان مدمج', family: 'خزان', capacity: 25000, mass: 2.2, color: '#75c8d8', note: 'خفيف للرحلات القريبة', short: '٢٥ طن' },
    { id: 'standard', name: 'خزان قياسي', family: 'خزان', capacity: 50000, mass: 4.2, color: '#85d9c0', note: 'حل عملي للقمر والمريخ', short: '٥٠ طن' },
    { id: 'cryo', name: 'خزان مبرد بين كوكبي', family: 'خزان', capacity: 80000, mass: 5.5, color: '#8cb9ff', note: 'سعة كبيرة وكتلة معقولة', short: '٨٠ طن' },
    { id: 'deep', name: 'خزان مدى عميق', family: 'خزان', capacity: 90000, mass: 6.4, color: '#b897ff', note: 'مدى إضافي للمهمات البعيدة', short: '٩٠ طن' }
  ],
  boosters: [
    { id: 'none', name: 'دون معززات', family: 'معزز', thrust: 0, propellant: 0, mass: 0, count: 0, color: '#8d9bb0', note: 'كتلة أقل، لكن دفع الإقلاع أقل', short: '٠ معزز' },
    { id: 'solid', name: 'زوج معززات صلبة', family: 'معزز', thrust: 3200, propellant: 8500, mass: 3.0, count: 2, color: '#ffad76', note: 'دفعة أولى قوية عند الإقلاع', short: '٢ × صلب' },
    { id: 'liquid', name: 'زوج معززات سائلة', family: 'معزز', thrust: 4500, propellant: 12000, mass: 5.8, count: 2, color: '#8ce2df', note: 'قوة كبيرة ويمكن التحكم بها', short: '٢ × سائل' },
    { id: 'mega', name: 'معززات ثقيلة مزدوجة', family: 'معزز', thrust: 7500, propellant: 18000, mass: 9.2, count: 2, color: '#ffca70', note: 'أقصى دفع للمركبات العملاقة', short: '٢ × ثقيل' }
  ],
  fins: [
    { id: 'compact', name: 'أجنحة قصيرة', family: 'جناح', mass: 0.5, stability: 20, color: '#d5baff', note: 'خفيفة لكن ثباتها محدود', short: 'ثبات ٢٠٪' },
    { id: 'wide', name: 'أجنحة عريضة', family: 'جناح', mass: 1.2, stability: 34, color: '#e1a6ff', note: 'تعطي توازناً جيداً للصاروخ', short: 'ثبات ٣٤٪' },
    { id: 'delta', name: 'أجنحة دلتا', family: 'جناح', mass: 1.5, stability: 46, color: '#b7a1ff', note: 'ثبات أعلى مع كتلة معتدلة', short: 'ثبات ٤٦٪' },
    { id: 'grid', name: 'زعانف شبكية', family: 'جناح', mass: 1.9, stability: 52, color: '#8ad8ff', note: 'تحكم ممتاز عند الهبوط', short: 'ثبات ٥٢٪' }
  ],
  shields: [
    { id: 'light', name: 'درع حراري خفيف', family: 'درع', mass: 1.4, temp: 1000, pressure: 0.05, vacuum: 84, color: '#ff9d86', note: 'للرحلات القصيرة والجو الخفيف', short: '١٠٠٠°' },
    { id: 'ceramic', name: 'درع سيراميك', family: 'درع', mass: 2.6, temp: 1600, pressure: 0.5, vacuum: 93, color: '#ffc280', note: 'حماية حرارية وضغط متوسطين', short: '١٦٠٠°' },
    { id: 'titanium', name: 'درع تيتانيوم', family: 'درع', mass: 4.2, temp: 2400, pressure: 3, vacuum: 98, color: '#a6ccff', note: 'قوي لمهمات المريخ العميقة', short: '٣ بار' },
    { id: 'abyss', name: 'درع الأعماق المركّب', family: 'درع', mass: 8.2, temp: 4000, pressure: 12, vacuum: 99, color: '#c1a5ff', note: 'الأقوى للحرارة والضغط العاليين', short: '١٢ بار' }
  ],
  capsules: [
    { id: 'probe', name: 'مسبار علمي', family: 'حمولة', mass: 1.5, color: '#a5e5c8', note: 'حمولة خفيفة لأجهزة القياس', short: '١٫٥ طن' },
    { id: 'rover', name: 'مركبة جوّالة', family: 'حمولة', mass: 3.1, color: '#ffc47b', note: 'مركبة لاستكشاف سطح القمر أو المريخ', short: '٣٫١ طن' },
    { id: 'crew', name: 'كبسولة رواد', family: 'حمولة', mass: 6, color: '#ff9a9a', note: 'مقصورة مضغوطة للرحلات المأهولة', short: '٦ أطنان' },
    { id: 'lander', name: 'مركبة هبوط ثقيلة', family: 'حمولة', mass: 8.5, color: '#d2adff', note: 'معدات إضافية للهبوط السطحي', short: '٨٫٥ طن' }
  ]
};
const categoryLabels = { engines: 'المحركات', tanks: 'الخزانات', boosters: 'المعززات', fins: 'الأجنحة', shields: 'الدروع', capsules: 'الحمولات' };
const categoryIcons = { engines: '◉', tanks: '▤', boosters: '✦', fins: '⋈', shields: '⬡', capsules: '◇' };
let selectedDestination = 'moon';
let currentCategory = 'engines';
let rocketConfig = { engines: 'methane', tanks: 'cryo', boosters: 'none', fins: 'delta', shields: 'titanium', capsules: 'rover' };
let testPassed = false;
let previewScene;
let previewCamera;
var previewRenderer;
let previewControls;
let previewRocket;
let previewFlame;
let previewInnerFlame;
let previewResizeObserver;

const getPart = (category, id) => componentLibrary[category].find(part => part.id === id);
const targetName = (key) => destinationData[key].name;
const localized = (value, digits = 1) => Number(value).toLocaleString('ar-EG', { maximumFractionDigits: digits, minimumFractionDigits: digits });

function renderTargets() {
  $('#targetOptions').innerHTML = Object.entries(destinationData).map(([key, target]) => `
    <button class="target-choice ${key === selectedDestination ? 'active' : ''}" data-target="${key}" type="button">
      <span class="target-dot" style="--target-color:${target.color}"></span><span class="target-copy"><b>${target.name}</b><small>${localized(target.gravity, 2)} م/ث² · ${target.solid ? 'سطح صخري' : 'لا سطح صلب'}</small></span><span class="target-selected">✓</span>
    </button>`).join('');
  document.querySelectorAll('.target-choice').forEach(button => button.addEventListener('click', () => {
    selectedDestination = button.dataset.target;
    testPassed = false;
    renderTargets();
    $('#routeTarget').textContent = targetName(selectedDestination);
    $('#flightStatus').textContent = 'بانتظار التصميم';
    $('#resultTitle').textContent = 'تم تغيير الوجهة';
    $('#resultText').textContent = `الوجهة الآن ${targetName(selectedDestination)}. أعد اختبار الصاروخ مع جاذبيتها وبيئتها.`;
    $('#testResult').className = 'test-result neutral';
    $('#launchConfirmed').hidden = true;
    updateEngineering();
  }));
}

function renderCategoryTabs() {
  $('#categoryTabs').innerHTML = Object.entries(categoryLabels).map(([key, label]) => `<button class="category-tab ${key === currentCategory ? 'active' : ''}" type="button" data-category="${key}"><span>${categoryIcons[key]}</span>${label}<i>${formatArabic(componentLibrary[key].length)}</i></button>`).join('');
  document.querySelectorAll('.category-tab').forEach(button => button.addEventListener('click', () => {
    currentCategory = button.dataset.category;
    renderCategoryTabs();
    renderCatalog();
  }));
}

function renderCatalog() {
  const parts = componentLibrary[currentCategory];
  $('#catalogCount').textContent = `${formatArabic(parts.length)} قطع متاحة`;
  $('#partCatalog').innerHTML = parts.map(part => {
    const isSelected = rocketConfig[currentCategory] === part.id;
    return `<button type="button" class="part-card ${isSelected ? 'chosen' : ''}" data-part="${part.id}" style="--part-color:${part.color}">
      <span class="part-glyph">${categoryIcons[currentCategory]}</span><span class="part-title">${part.name}</span><span class="part-note">${part.note}</span><span class="part-bottom"><b>${part.short}</b><i>${isSelected ? 'مختار ✓' : 'اختيار القطعة'}</i></span></button>`;
  }).join('');
  document.querySelectorAll('.part-card').forEach(button => button.addEventListener('click', () => {
    rocketConfig[currentCategory] = button.dataset.part;
    testPassed = false;
    $('#launchConfirmed').hidden = true;
    $('#resultTitle').textContent = 'تم تعديل التصميم';
    $('#resultText').textContent = 'اختبر التكوين الجديد قبل السماح بالإطلاق.';
    $('#testResult').className = 'test-result neutral';
    renderCatalog();
    updateSelectedParts();
    updateEngineering();
    updateRocketPreview();
    playTone(550, 0.07);
  }));
}

function updateSelectedParts() {
  const summary = Object.keys(componentLibrary).map(category => {
    const part = getPart(category, rocketConfig[category]);
    return `<span class="selected-part" title="${part.name}"><i style="--part-color:${part.color}">${categoryIcons[category]}</i><b>${part.name}</b></span>`;
  });
  $('#selectedParts').innerHTML = summary.join('');
  $('#previewName').textContent = getPart('engines', rocketConfig.engines).name;
  $('#previewConfig').textContent = `${getPart('tanks', rocketConfig.tanks).name} · ${getPart('fins', rocketConfig.fins).name} · ${getPart('shields', rocketConfig.shields).name}`;
}

function calculateDesign() {
  const engine = getPart('engines', rocketConfig.engines);
  const tank = getPart('tanks', rocketConfig.tanks);
  const boosters = getPart('boosters', rocketConfig.boosters);
  const fins = getPart('fins', rocketConfig.fins);
  const shield = getPart('shields', rocketConfig.shields);
  const capsule = getPart('capsules', rocketConfig.capsules);
  const throttle = Number($('#throttleSlider').value) / 100;
  const wingSpan = Number($('#wingSlider').value) / 100;
  const fuelPercent = Number($('#fuelSlider').value) / 100;
  const fuelMass = tank.capacity * fuelPercent + boosters.propellant;
  const wingMass = fins.mass * (0.55 + wingSpan * 0.45);
  const dryMass = engine.mass + tank.mass + boosters.mass + wingMass + shield.mass + capsule.mass;
  const totalMass = dryMass + fuelMass / 1000;
  const thrust = (engine.thrust + boosters.thrust) * throttle;
  const earthTwr = thrust / (totalMass * 9.81);
  const target = destinationData[selectedDestination];
  const destinationTwr = thrust / (totalMass * target.gravity);
  const tunedIsp = engine.isp * (1 - Math.max(0, throttle - 1) * 0.0014);
  const dv = tunedIsp * 9.81 * Math.log(Math.max(1.01, totalMass / dryMass)) / 1000 * (1 - Math.max(0, wingSpan - 1) * 0.035);
  const heatNeed = target.heat + Math.max(0, throttle - 1) * engine.heat * 0.25;
  const stability = fins.stability * wingSpan;
  const checks = {
    earth: earthTwr >= 1.2,
    gravity: destinationTwr >= 1.12,
    dv: dv >= target.requiredDv,
    pressure: shield.pressure >= target.pressure,
    heat: shield.temp >= heatNeed,
    vacuum: shield.vacuum >= 90,
    stability: stability >= 25
  };
  return { engine, tank, boosters, fins, shield, capsule, throttle, wingSpan, fuelPercent, fuelMass, dryMass, totalMass, thrust, earthTwr, destinationTwr, dv, heatNeed, stability, target, checks, pass: Object.values(checks).every(Boolean) };
}

function setMeter(id, value, pass) {
  const meter = $(`#${id}Meter`);
  if (meter) meter.style.width = `${Math.max(2, Math.min(100, value))}%`;
  const check = $(`#${id}Check`);
  if (check) { check.textContent = pass ? '✓' : '×'; check.classList.toggle('pass', pass); check.classList.toggle('fail', !pass); }
}

function updateEngineering() {
  const d = calculateDesign();
  $('#massStat').textContent = localized(d.totalMass, 1);
  $('#twrStat').textContent = localized(d.destinationTwr, 2);
  $('#twrUnit').textContent = `× عند ${d.target.name}`;
  $('#deltaVStat').textContent = localized(d.dv, 1);
  $('#fuelStat').textContent = formatArabic(Math.round(d.fuelPercent * 100));
  $('#throttleOutput').textContent = `${formatArabic($('#throttleSlider').value)}٪`;
  $('#wingOutput').textContent = `${formatArabic($('#wingSlider').value)}٪`;
  $('#fuelOutput').textContent = `${formatArabic($('#fuelSlider').value)}٪`;
  setMeter('earth', Math.min(100, d.earthTwr * 34), d.checks.earth);
  setMeter('gravity', Math.min(100, d.destinationTwr * 30), d.checks.gravity);
  const shieldRatio = Math.min(d.shield.temp / d.heatNeed, d.shield.pressure / Math.max(d.target.pressure, 0.01), d.shield.vacuum / 90);
  setMeter('shield', Math.min(100, shieldRatio * 60), d.checks.pressure && d.checks.heat && d.checks.vacuum);
  setMeter('stability', Math.min(100, d.stability), d.checks.stability);
  return d;
}

function clearAssembly(group) {
  group.traverse(object => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose());
  });
  group.clear();
}

function assembleRocket(group, scale = 1) {
  clearAssembly(group);
  const engine = getPart('engines', rocketConfig.engines);
  const tank = getPart('tanks', rocketConfig.tanks);
  const booster = getPart('boosters', rocketConfig.boosters);
  const fin = getPart('fins', rocketConfig.fins);
  const shield = getPart('shields', rocketConfig.shields);
  const capsule = getPart('capsules', rocketConfig.capsules);
  const trim = new THREE.MeshStandardMaterial({ color: 0xe9eff8, metalness: 0.62, roughness: 0.32 });
  const engineMat = new THREE.MeshStandardMaterial({ color: engine.color, metalness: 0.67, roughness: 0.26 });
  const bodyMat = new THREE.MeshStandardMaterial({ color: tank.color, metalness: 0.54, roughness: 0.36 });
  const shieldMat = new THREE.MeshStandardMaterial({ color: shield.color, metalness: 0.4, roughness: 0.28 });
  const finMat = new THREE.MeshStandardMaterial({ color: fin.color, metalness: 0.55, roughness: 0.3, side: THREE.DoubleSide });
  const capsuleMat = new THREE.MeshStandardMaterial({ color: capsule.color, metalness: 0.3, roughness: 0.32 });
  const boosterMat = new THREE.MeshStandardMaterial({ color: booster.color, metalness: 0.55, roughness: 0.35 });
  const span = Number($('#wingSlider').value) / 100;
  const tankHeight = 1.22 + tank.capacity / 360000;
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.25, tankHeight, 24), bodyMat);
  core.position.y = 0;
  group.add(core);
  for (const y of [-0.38, 0, 0.38]) {
    const seam = new THREE.Mesh(new THREE.TorusGeometry(0.238, 0.018, 7, 24), trim);
    seam.rotation.x = Math.PI / 2;
    seam.position.y = y;
    group.add(seam);
  }
  const shieldBand = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.12, 24), shieldMat);
  shieldBand.position.y = -0.2;
  group.add(shieldBand);
  const capsuleShell = new THREE.Mesh(new THREE.ConeGeometry(0.23, 0.5, 24), capsuleMat);
  capsuleShell.position.y = tankHeight / 2 + 0.25;
  group.add(capsuleShell);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.115, 0.24, 18), trim);
  nose.position.y = tankHeight / 2 + 0.57;
  group.add(nose);
  const window = new THREE.Mesh(new THREE.SphereGeometry(0.068, 16, 12), new THREE.MeshStandardMaterial({ color: 0x8be9ff, emissive: 0x1678aa, emissiveIntensity: 1.5, metalness: 0.1, roughness: 0.16 }));
  window.position.set(0, tankHeight / 2 + 0.23, 0.205);
  group.add(window);
  const nozzleRadius = Math.max(0.17, Math.min(0.38, 0.16 + engine.thrust / 18000));
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(nozzleRadius * 0.72, nozzleRadius, 0.34, 20), engineMat);
  nozzle.position.y = -tankHeight / 2 - 0.2;
  group.add(nozzle);
  const exhaust = new THREE.Mesh(new THREE.ConeGeometry(nozzleRadius * 0.74, 0.76, 18), new THREE.MeshBasicMaterial({ color: 0xff9c4c, transparent: true, opacity: 0.88 }));
  exhaust.position.y = -tankHeight / 2 - 0.68;
  exhaust.rotation.z = Math.PI;
  group.add(exhaust);
  const innerExhaust = new THREE.Mesh(new THREE.ConeGeometry(nozzleRadius * 0.4, 0.48, 14), new THREE.MeshBasicMaterial({ color: 0xffefad, transparent: true, opacity: 0.96 }));
  innerExhaust.position.y = -tankHeight / 2 - 0.55;
  innerExhaust.rotation.z = Math.PI;
  group.add(innerExhaust);
  const finDistance = 0.22 + span * 0.15;
  for (let i = 0; i < 3; i += 1) {
    const angle = i * Math.PI * 2 / 3;
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.36, 0.34 * span), finMat);
    wing.position.set(Math.sin(angle) * finDistance, -tankHeight * 0.4, Math.cos(angle) * finDistance);
    wing.rotation.y = angle;
    group.add(wing);
  }
  if (booster.count) {
    for (const side of [-1, 1]) {
      const boosterBody = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.13, tankHeight * 0.96, 18), boosterMat);
      boosterBody.position.set(side * 0.42, -0.03, 0);
      group.add(boosterBody);
      const boosterNose = new THREE.Mesh(new THREE.ConeGeometry(0.115, 0.28, 16), boosterMat);
      boosterNose.position.set(side * 0.42, tankHeight * 0.54, 0);
      group.add(boosterNose);
      const boosterEngine = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.105, 0.18, 14), engineMat);
      boosterEngine.position.set(side * 0.42, -tankHeight * 0.52, 0);
      group.add(boosterEngine);
    }
  }
  group.scale.setScalar(scale);
  return { flame: exhaust, innerFlame: innerExhaust };
}

function updateRocketPreview() {
  if (!previewScene || !previewRocket) return;
  const meshes = assembleRocket(previewRocket, 1.15);
  previewFlame = meshes.flame;
  previewInnerFlame = meshes.innerFlame;
  previewRocket.rotation.y = 0.36;
  const missionMeshes = assembleRocket(rocket.group, 0.72);
  rocket.flame = missionMeshes.flame;
  rocket.innerFlame = missionMeshes.innerFlame;
  rocket.group.visible = false;
  $('#previewName').textContent = getPart('engines', rocketConfig.engines).name;
}

function initRocketPreview() {
  const host = $('#rocketPreview');
  previewScene = new THREE.Scene();
  previewScene.background = new THREE.Color(0x09111f);
  previewCamera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  previewCamera.position.set(3.8, 2.4, 6.2);
  previewScene.add(new THREE.HemisphereLight(0x9dbbdf, 0x151126, 1.25));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
  keyLight.position.set(4, 6, 5);
  previewScene.add(keyLight);
  const rimLight = new THREE.PointLight(0x65d8ff, 18, 12);
  rimLight.position.set(-3, 1, -3);
  previewScene.add(rimLight);
  previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  previewRenderer.outputColorSpace = THREE.SRGBColorSpace;
  previewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  previewRenderer.setSize(360, 220);
  host.appendChild(previewRenderer.domElement);
  previewRocket = new THREE.Group();
  previewScene.add(previewRocket);
  previewControls = new OrbitControls(previewCamera, previewRenderer.domElement);
  previewControls.enableDamping = true;
  previewControls.dampingFactor = 0.08;
  previewControls.enablePan = false;
  previewControls.minDistance = 4;
  previewControls.maxDistance = 11;
  previewControls.target.set(0, 0, 0);
  previewResizeObserver = new ResizeObserver(() => resizePreview());
  previewResizeObserver.observe(host);
  resizePreview();
  updateRocketPreview();
}

function resizePreview() {
  if (!previewRenderer || !previewCamera) return;
  const host = $('#rocketPreview');
  const width = Math.max(220, host.clientWidth || 360);
  const height = Math.max(150, host.clientHeight || 210);
  previewCamera.aspect = width / height;
  previewCamera.updateProjectionMatrix();
  previewRenderer.setSize(width, height);
}

function openWorkshop() {
  if (activeMission || (landingMission && !landingMission.outcome)) { showToast('انتظر حتى تنتهي المهمة الحالية أو ألغها أولاً.'); return; }
  landingMission = null;
  landingCraft.visible = false;
  $('#landingHud').hidden = true;
  $('#workshop').hidden = false;
  resizePreview();
  updateEngineering();
  playTone(570, 0.08);
}
function closeWorkshop() { $('#workshop').hidden = true; }
function invalidateTest() {
  testPassed = false;
  $('#launchConfirmed').hidden = true;
  $('#testResult').className = 'test-result neutral';
  $('#resultTitle').textContent = 'تعديل جديد — يلزم إعادة الاختبار';
  $('#resultText').textContent = 'تغيّر تكوين المركبة. شغّل فحص التحمل مرة أخرى قبل الإطلاق.';
}

function runStressTest() {
  const button = $('#testButton');
  const result = $('#testResult');
  const first = calculateDesign();
  button.disabled = true;
  result.className = 'test-result testing';
  $('#resultTitle').textContent = 'جاري اختبار المحركات والدرع…';
  $('#resultText').textContent = 'نقيس قوة الإقلاع والوقود والضغط وحرارة الوجهة.';
  $('.preview-card').classList.add('stress-testing');
  setTimeout(() => {
    const d = updateEngineering();
    const issues = [];
    if (!d.checks.earth) issues.push('الدفع لا يكفي للإقلاع من الأرض');
    if (!d.checks.gravity) issues.push(`الدفع لا يتغلب بهامش كافٍ على جاذبية ${d.target.name}`);
    if (!d.checks.dv) issues.push(`الوقود لا يوفّر ميزانية المسار المطلوبة (${localized(d.target.requiredDv, 1)} كم/ث)`);
    if (!d.checks.pressure) issues.push(`الدرع يتحمل ${localized(d.shield.pressure, 2)} بار فقط والاختبار يحتاج ${localized(d.target.pressure, 2)} بار`);
    if (!d.checks.heat) issues.push(`الدرع يتحمل ${localized(d.shield.temp, 0)}° فقط والوجهة تحتاج نحو ${localized(d.heatNeed, 0)}°`);
    if (!d.checks.vacuum) issues.push('الختم لا يحافظ على الضغط الداخلي في فراغ الفضاء');
    if (!d.checks.stability) issues.push('الأجنحة قصيرة؛ زد امتدادها أو اختر نوعاً أكثر ثباتاً');
    $('.preview-card').classList.remove('stress-testing');
    button.disabled = false;
    if (d.pass) {
      testPassed = true;
      result.className = 'test-result pass';
      $('#resultTitle').textContent = 'نجح اختبار التحمل — المركبة جاهزة';
      $('#resultText').textContent = `نسبة الدفع إلى الوزن عند ${d.target.name}: ${localized(d.destinationTwr, 2)}× · ميزانية السرعة: ${localized(d.dv, 1)} كم/ث. ${d.target.solid ? 'يمكن المتابعة إلى الإطلاق.' : 'هذه رحلة إلى السحب فقط، فالمشتري ليس له سطح صلب.'}`;
      $('#launchConfirmed').hidden = false;
      $('#flightStatus').textContent = 'اجتاز الاختبار';
      $('#flightStatus').style.color = '#83e3a9';
      playTone(790, 0.2);
    } else {
      testPassed = false;
      result.className = 'test-result fail';
      $('#resultTitle').textContent = 'خطر — لا تطلق الصاروخ بعد';
      $('#resultText').textContent = issues.slice(0, 3).join(' · ');
      $('#launchConfirmed').hidden = true;
      $('#flightStatus').textContent = 'يحتاج تعديلاً';
      $('#flightStatus').style.color = '#ff957e';
      playTone(245, 0.2);
    }
  }, 1500);
}

function initWorkshop() {
  renderTargets();
  renderCategoryTabs();
  renderCatalog();
  updateSelectedParts();
  initRocketPreview();
  updateEngineering();
  $('#closeWorkshop').addEventListener('click', closeWorkshop);
  $('#workshop').addEventListener('click', event => { if (event.target === $('#workshop')) closeWorkshop(); });
  $('#testButton').addEventListener('click', runStressTest);
  $('#launchConfirmed').addEventListener('click', () => {
    if (!testPassed) return;
    closeWorkshop();
    launchMission();
  });
  ['throttleSlider', 'wingSlider', 'fuelSlider'].forEach(id => $(`#${id}`).addEventListener('input', () => {
    invalidateTest();
    updateEngineering();
    updateRocketPreview();
  }));
  window.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('#workshop').hidden) closeWorkshop(); });
}
initWorkshop();
applyLanguage();
