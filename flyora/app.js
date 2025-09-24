import { gsap } from 'https://cdn.skypack.dev/gsap';
import * as THREE from 'https://cdn.skypack.dev/three@0.129.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';

// Detect mobile
const isMobile = window.innerWidth <= 768;

// Set up camera (slightly wider FOV for mobile so model fits)
const camera = new THREE.PerspectiveCamera(
    isMobile ? 16 : 12,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 0, 14);

// Create scene
const scene = new THREE.Scene();
let planeModel;
let mixer;

// Renderer setup
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('container3D').appendChild(renderer.domElement);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 1.1));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(300, 400, 200);
scene.add(dirLight);

// Load a plane model and animate
const loader = new GLTFLoader();
const planeCandidates = [
    'img/stylized_ww1_plane.glb',
    // 'img/wwii_cartoon_plane_free.glb',
    // 'img/sukhoi_su-75.glb',
    // 'img/c17__transport_aircraft.glb',
    // 'img/cargo_aircraft.glb',
];

function loadPlaneModel(index = 0) {
    if (index >= planeCandidates.length) return;
    loader.load(
        planeCandidates[index],
        (gltf) => {
            planeModel = gltf.scene;
            scene.add(planeModel);

            // ✅ Correct bounding box calculation
            const box = new THREE.Box3().setFromObject(planeModel);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z) || 1;

            // ✅ Scale factor (mobile vs desktop)
            let scaleFactor = 2 / maxDim;
            scaleFactor *= isMobile ? 1.0 : 3.5; // Slightly bigger on mobile
            planeModel.scale.setScalar(scaleFactor);

            // ✅ Adjust initial position for mobile
            if (isMobile) {
                planeModel.position.set(-8, 0, 6); // closer to camera and slightly left
            } else {
                planeModel.position.set(-12, 0, 0);
            }

            planeModel.rotation.set(0.05, Math.PI * 0.5, 0.05);

            // Play animation if available
            if (gltf.animations && gltf.animations.length) {
                mixer = new THREE.AnimationMixer(planeModel);
                mixer.clipAction(gltf.animations[0]).play();
            }

            // Glide-in animation from left
            gsap.to(planeModel.position, {
                x: 0,
                duration: 3.2,
                ease: 'power2.out',
                delay: 0.2,
            });

            gsap.to(planeModel.rotation, {
                y: Math.PI * 0.0,
                x: 0.02,
                z: -0.02,
                duration: 3.2,
                ease: 'power2.out',
                delay: 0.2,
            });
        },
        undefined,
        () => loadPlaneModel(index + 1)
    );
}

loadPlaneModel();

// Scroll-driven descent
function onScroll() {
    if (!planeModel) return;

    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || window.pageYOffset;
    const maxScroll = doc.scrollHeight - doc.clientHeight || 1;
    const progress = Math.min(1, Math.max(0, scrollTop / maxScroll));

    // Split into 6 equal sections
    let targetX = 0;
    const section = 1 / 6;
    if (progress < section) {
        targetX = -2 * (progress / section);
    } else if (progress < 2 * section) {
        targetX = -2 + 4 * ((progress - section) / section);
    } else if (progress < 3 * section) {
        targetX = 2 - 4 * ((progress - 2 * section) / section);
    } else if (progress < 4 * section) {
        targetX = -2 + 4 * ((progress - 3 * section) / section);
    } else if (progress < 5 * section) {
        targetX = 2 - 4 * ((progress - 4 * section) / section);
    } else {
        targetX = -2 + 2 * ((progress - 5 * section) / section);
    }

    const targetY = -progress * 0.5;
    const targetZ = -progress * 2;
    const targetRotX = 0.02 + progress * 0.15;

    gsap.to(planeModel.position, { 
        x: targetX, 
        y: targetY, 
        z: targetZ, 
        duration: 0.5, 
        ease: 'power1.out' 
    });

    gsap.to(planeModel.rotation, { 
        x: targetRotX, 
        duration: 0.5, 
        ease: 'power1.out' 
    });
}

// Animation loop
function tick() {
    requestAnimationFrame(tick);
    if (mixer) mixer.update(0.02);
    renderer.render(scene, camera);
}
tick();

// Events
window.addEventListener('scroll', onScroll);
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.fov = window.innerWidth <= 768 ? 16 : 12; // update FOV on resize
    camera.updateProjectionMatrix();
});

// Logo track duplication
const track = document.getElementById('logosTrack');
const logos = [...track.children];
logos.forEach(logo => {
    const clone = logo.cloneNode(true);
    track.appendChild(clone);
});

// Menu toggle
document.querySelector('.menu-toggle').addEventListener('click', () => {
    document.querySelector('header nav').classList.toggle('show');
});

// Slider for services
document.addEventListener('DOMContentLoaded', function () {
    const sliderContainer = document.querySelector('.slider-container');
    const slider = document.querySelector('.slider');
    const slides = document.querySelectorAll('.service-slide');
    const dotsContainer = document.querySelector('.dots-container');

    let currentIndex = 0;
    const totalSlides = slides.length;
    let autoPlayInterval;
    let isScrolling = false;

    function createDots() {
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            dot.addEventListener('click', () => {
                goToSlide(i);
                resetAutoPlay();
            });
            dotsContainer.appendChild(dot);
        }
    }

    function updateDots() {
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }

    function goToSlide(index) {
        if (isScrolling) return;
        isScrolling = true;
        currentIndex = (index + totalSlides) % totalSlides;
        slider.style.transform = `translateY(-${currentIndex * 100}%)`;
        updateDots();
        setTimeout(() => isScrolling = false, 800);
    }

    function startAutoPlay() {
        autoPlayInterval = setInterval(() => {
            goToSlide(currentIndex + 1);
        }, 2000);
    }

    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    }

    sliderContainer.addEventListener('wheel', (event) => {
        event.preventDefault();
        if (isScrolling) return;
        if (event.deltaY > 0) goToSlide(currentIndex + 1);
        else goToSlide(currentIndex - 1);
        resetAutoPlay();
    });

    createDots();
    goToSlide(0);
    startAutoPlay();
});

// Slider for "What We Do"
document.addEventListener('DOMContentLoaded', function () {
    const sliderContainer = document.querySelector('.what-we-do-container');
    const slider = document.querySelector('#wwdSlider');
    const slides = document.querySelectorAll('.wwd-slide');
    const dotsContainer = document.querySelector('.wwd-dots-container');

    let currentIndex = 0;
    const totalSlides = slides.length;
    let autoPlayInterval;
    let isScrolling = false;

    function createDots() {
        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('div');
            dot.classList.add('wwd-dot');
            dot.addEventListener('click', () => {
                goToSlide(i);
                resetAutoPlay();
            });
            dotsContainer.appendChild(dot);
        }
    }

    function updateDots() {
        const dots = document.querySelectorAll('.wwd-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }

    function goToSlide(index) {
        if (isScrolling) return;
        isScrolling = true;
        currentIndex = (index + totalSlides) % totalSlides;
        slider.style.transform = `translateY(-${currentIndex * 100}%)`;
        updateDots();
        setTimeout(() => isScrolling = false, 800);
    }

    function startAutoPlay() {
        autoPlayInterval = setInterval(() => {
            goToSlide(currentIndex + 1);
        }, 2000);
    }

    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    }

    sliderContainer.addEventListener('wheel', (event) => {
        event.preventDefault();
        if (isScrolling) return;
        if (event.deltaY > 0) goToSlide(currentIndex + 1);
        else goToSlide(currentIndex - 1);
        resetAutoPlay();
    });

    createDots();
    goToSlide(0);
    startAutoPlay();
});
