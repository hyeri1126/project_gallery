// lenis Setup -> smooth scroll
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
    lenis.raf(time*1000);
});
gsap.ticker.lagSmoothing(0); // three.js와 애니메이션 싱크를 맞추기 위해 사용용


// Scene Setup
const scene = new THREE.Scene(); // Scene은 three.js의 3D 공간, 3D 객체들(mesh, light, camera)을 담는 컨테이너 역할
scene.background = new THREE.Color(0xfefdfd); 

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)

const renderer = new THREE.WebGLRenderer({
    antialias: true, // 3D 객체의 가장자리를 부드럽게 처리리
    alpha: true // 투명 배경 허용
})

renderer.setClearColor(0xffffff, 1); // 배경색 설정(흰색, 투명도 1)
renderer.setSize(window.innerWidth, window.innerHeight); // 렌더러 크기를 윈도우 크기로 설정
renderer.setPixelRatio(window.devicePixelRatio); // 기기의 픽셀 비율에 맞에 설정
renderer.shadowMap.enabled = true; // 그림자 활성화 -> 입체감 있고 사실적
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // PCFSoft 알고리즘을 사용하여 부드러운 그림자 설정
renderer.physicallyCorrectLights = true; // 더 사실적인 렌더링링
renderer.toneMapping = THREE.ACESFilmicToneMapping; // ACES Filmic 톤매핑 적용
renderer.toneMappingExposure = 2.5; // 톤매핑 노출값 설정(밝기 조절) -> 더 좋은 색상 표현현
document.querySelector(".model").appendChild(renderer.domElement);

// light setup
const ambientLight = new THREE.AmbientLight(0xffffff, 3); 
scene.add(ambientLight);

// main light -> 주로 빛과 그림자를 만드는 광원 
const mainLight = new THREE.DirectionalLight(0xffffff,1);
mainLight.position.set(5, 10, 7.5); // 조명 위치:오른쪽으로 5만큼, 위로 10만큼, 앞으로 7.5만큼 -> 오른쪽 위에서 비춤춤
scene.add(mainLight);

// main light가 만든 그림자를 부분적으로 비춤, 너무 어두운 부분을 보완
const fillLight = new THREE.DirectionalLight(0xffffff, 3);
fillLight.position.set(-5, 0, -5);// 왼쪽 아래에서 비춤춤
scene.add(fillLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2);
hemiLight.position.set(0, 25, 0);
scene.add(hemiLight);

// animation function
// function basicAnimate(){
//     renderer.render(scene, camera)
//     requestAnimationFrame(basicAnimate);
// }
// basicAnimate();

// load 3d model
let model;
const loader = new THREE.GLTFLoader();

loader.load(
    "../assets/josta.glb",
    function(gltf){
        model = gltf.scene;
        // 모델 재질 설정
        model.traverse((node) => {
          if (node.isMesh) {
            if (node.material) {
              node.material.metalness = 0.3;
              node.material.roughness = 0.4;
              node.material.envMapIntensity = 1.5;
            }
            // 그림자 설정
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        // 모델 위치 중앙 정렬
        const box = new THREE.Box3().setFromObject(model); // 모델을 정확히 감싸는 직육면체 생성
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        scene.add(model);

        // 카메라 위치 설정
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z); // 직육면체의 너비/높이/깊이 중 가장 큰 값이 maxDim이 됨.
        camera.position.z = maxDim * 1.5; // 카메라가 모델로부터 충분히 멀어져서 전체가 보이게됨됨

        // 애니메이션 준비 
        model.scale.set(0, 0, 0); // 초기 크기 0
        playInitialAnimation();  // 초기 애니메이션 시작
        // cancelAnimationFrame(basicAnimate); // 기존 애니메이션 취소
        animate(); // 새로운 애니메이션 시작 
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    function (error) {
        console.error("An error happened:", error);
    }

);

const floatAmplitude = 0.2;
const floatSpeed = 1.5;
const rotationSpeed = 0.3;
let isFloating = true;
let currentScroll = 0;

const stickyHeight = window.innerHeight;
const scannerSection = document.querySelector(".scanner");
const scannerPosition = scannerSection.offsetTop;

// animtaion 구현
function playInitialAnimation() {
    if(model){
        gsap.to(model.scale,{
            x:1,
            y:1,
            z:1,
            duration:1,
            ease:"power2.out",
        });
    }
}


window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

lenis.on("scroll", (e) => {
    currentScroll = e.scroll;
  });
  

// 전체 애니메이션 loop
function animate(){
    if(model){
        if(isFloating){
            const floatOffset = Math.sin(Date.now()*0.001 * floatSpeed) * floatAmplitude;
            model.position.y = floatOffset;
        }
        const scrollProgress = Math.min(currentScroll / scannerPosition, 1);

        // 상하로 회전하는 애니메이션
        if (scrollProgress < 1) {
            model.rotation.x = scrollProgress * Math.PI * 2;
        }
      
        // 회전속도 조절
        if (scrollProgress < 1) {
            model.rotation.y += 0.001 * rotationSpeed;
        }
    }

  
    

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}