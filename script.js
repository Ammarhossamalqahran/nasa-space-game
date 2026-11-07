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
  moon: { name: 'القمر', subtitle: 'رفيق الأرض الصخري في الفضاء', index: '٠٠', gravity: '١٫٦٢', atmosphere: 'إكسوسفير رقيق جداً', atmosphereNote: 'ليس له غلاف جوي كثيف', mission: 'أبولو · أرتيمس', missionNote: 'أعادت أبولو رواداً إلى السطح؛ وتواصل أرتيمس استكشاف القمر.', description: 'القمر تابع الأرض الطبيعي، ويبعد عنها في المتوسط نحو ٣٨٤ ألف كيلومتر. لا يحميه هواء كثيف، لذلك بقيت فوهات الاصطدام على سطحه محفوظة لمليارات السنين. تبلغ جاذبيته نحو سدس جاذبية الأرض.', url: 'https://science.nasa.gov/moon/' },
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

const raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 1;
const pointer = new THREE.Vector2();
let pointerStart = null;
let selected = 'earth';
let paused = false;
let speed = 1;
let elapsed = 0;
let activeMission = null;
let toastTimer;
let soundEnabled = true;
let audioContext;
const clock = new THREE.Clock();

function formatArabic(number) { return String(number).replace(/[0-9]/g, digit => '٠١٢٣٤٥٦٧٨٩'[digit]); }
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
  $('#activeTitle').textContent = key === 'sun' ? 'استكشف قلب النظام الشمسي' : `استكشف ${planetData[key].name}`;
  $('#activeSummary').textContent = key === 'sun' ? 'مصدر الضوء والطاقة؛ اضغط لقراءة ملف النجم المركزي.' : `اقترب من ${planetData[key].name} وافتح ملفه العلمي لمعرفة أسراره ومهمات ناسا المرتبطة به.`;
  $('#sceneTitle').textContent = planetData[key].name;
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
  const distance = key === 'jupiter' ? 5.4 : key === 'sun' ? 11 : key === 'moon' ? 2.6 : 4.0;
  const direction = new THREE.Vector3(0.58, 0.48, 0.65).normalize();
  controls.target.copy(point);
  camera.position.copy(point).addScaledVector(direction, distance);
  controls.minDistance = key === 'sun' ? 4.8 : 1.2;
  controls.update();
}

const homeCameraPosition = new THREE.Vector3(-0.5, 14, 28);
const homeTarget = new THREE.Vector3(2.5, 0, 0);
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
  const target = getWorldPosition('mars').clone();
  activeMission = { start, target, progress: 0, duration: 13 };
  rocket.group.visible = true;
  $('#launchButton').disabled = true;
  $('#abortButton').hidden = false;
  $('#missionState').textContent = 'المركبة في طريقها إلى المريخ';
  $('#flightStatus').textContent = 'انطلقت';
  $('#flightStatus').style.color = '#83e3ee';
  $('#flightTime').textContent = '٠٠:٠٠';
  $('.route-ship').style.right = '8px';
  playTone(390, 0.22);
  showToast('انطلقت المركبة! تابع مسارها بين الأرض والمريخ.');
}
function finishMission() {
  activeMission = null;
  rocket.group.visible = false;
  $('#launchButton').disabled = false;
  $('#abortButton').hidden = true;
  $('#missionState').textContent = 'اكتملت المهمة بنجاح';
  $('#flightStatus').textContent = 'اكتملت';
  $('#flightStatus').style.color = '#83e3a9';
  $('#flightTime').textContent = '٠٠:١٣';
  $('.route-ship').style.right = 'calc(100% - 18px)';
  playTone(790, 0.23);
  showToast('وصلت المركبة إلى المريخ بنجاح. افتح ملف المريخ لمعرفة المزيد.');
}
function abortMission() {
  if (!activeMission) return;
  activeMission = null;
  rocket.group.visible = false;
  $('#launchButton').disabled = false;
  $('#abortButton').hidden = true;
  $('#missionState').textContent = 'جاهزون للاستكشاف';
  $('#flightStatus').textContent = 'أُلغيت';
  $('#flightStatus').style.color = '#ff957e';
  $('#flightTime').textContent = 'جاهز';
  $('.route-ship').style.right = '8px';
  showToast('تم إلغاء الرحلة. يمكنك الإطلاق مجدداً في أي وقت.');
}
$('#launchButton').addEventListener('click', launchMission);
$('#abortButton').addEventListener('click', abortMission);
$('#pauseButton').addEventListener('click', () => {
  paused = !paused;
  $('#pauseButton').textContent = paused ? '▶' : 'Ⅱ';
  $('#pauseButton').setAttribute('aria-label', paused ? 'استئناف الحركة' : 'إيقاف الحركة مؤقتاً');
  $('#missionState').textContent = paused ? 'المحاكاة متوقفة مؤقتاً' : (activeMission ? 'المركبة في طريقها إلى المريخ' : 'جاهزون للاستكشاف');
});
$('#speedRange').addEventListener('input', event => {
  speed = [0, 0.5, 1, 2][Number(event.target.value)];
  $('#speedValue').textContent = `${formatArabic(speed)}×`;
});
$('#zoomIn').addEventListener('click', () => { camera.position.addScaledVector(camera.position.clone().sub(controls.target).normalize(), -2); controls.update(); });
$('#zoomOut').addEventListener('click', () => { camera.position.addScaledVector(camera.position.clone().sub(controls.target).normalize(), 2); controls.update(); });
$('#homeView').addEventListener('click', () => { closeModal(); controls.target.copy(homeTarget); camera.position.copy(homeCameraPosition); controls.minDistance = 5.5; selected = ''; setSelection('earth', false); $('#sceneTitle').textContent = 'النظام الشمسي'; controls.update(); });
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
    $('#flightTime').textContent = `٠٠:${formatArabic(Math.min(13, Math.floor(t * 13)).toString().padStart(2, '0'))}`;
    $('.route-ship').style.right = `${8 + t * 72}%`;
    if (t >= 1) finishMission();
  }
  controls.update();
  renderer.render(scene, camera);
}
setSelection('earth', false);
animate();
