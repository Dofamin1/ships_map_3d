import * as THREE from 'https://cdn.skypack.dev/three@0.133.1';
import Stats from 'https://cdn.skypack.dev/three/examples/jsm/libs/stats.module.js';

import { FirstPersonControls } from 'https://cdn.skypack.dev/three/examples/jsm/controls/FirstPersonControls.js';
import { ImprovedNoise } from 'https://cdn.skypack.dev/three/examples/jsm/math/ImprovedNoise.js';
import { OBJLoader } from 'https://cdn.skypack.dev/three/examples/jsm/loaders/OBJLoader.js';
import PickHelper from './PickHelper.js';

let container, stats;
let camera, controls, scene, renderer, pickHelper;
let mesh, texture;

const worldWidth = 512, worldDepth = 512;
const clock = new THREE.Clock();
const SUBMARINES_DATA = [
    { x: 1000, y: 1000, z: 1000, direction: Math.PI / 2, size: 1 },
    { x: 1500, y: 800, z: -2000, direction: Math.PI / 4, size: 2  },
    { x: 500, y: 1800, z: 4000, direction: Math.PI / 6, size: 3  },
    { x: -2500, y: 1000, z: 4000, direction: Math.PI * 1.5, size: 1  },
    { x: 3500, y: 1000, z: -1000, direction: Math.PI * 2, size: 2  }
];

init();
animate();

function init() {

    container = document.getElementById( 'WebGL-output' );

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 50000 );

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0x5dc7fc, 0.0001 );
    scene.background = new THREE.Color( 0x5dc7fc );

    const data = generateHeight( worldWidth, worldDepth );

    camera.position.set( -1000, 1000, -1400 );
    camera.lookAt( 100, 1010, 2300 );

    const geometry = new THREE.PlaneGeometry( 15000, 15000, worldWidth - 1, worldDepth - 1 );
    geometry.rotateX( - Math.PI / 2 );

    const vertices = geometry.attributes.position.array;

    for ( let i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {

        vertices[ j + 1 ] = data[ i ] * 5;

    }

    texture = new THREE.CanvasTexture( generateTexture( data, worldWidth, worldDepth ) );
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { map: texture, color: 0x1376ad } ) );
    scene.add( mesh );

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    controls = new FirstPersonControls( camera, renderer.domElement );
    controls.movementSpeed = 850;
    controls.lookSpeed = 0.1;

    SUBMARINES_DATA.forEach(sub => addSubmarine({ x: sub.x, y: sub.y, z: sub.z, direction: sub.direction, size: sub.size }));

    stats = new Stats();
    container.appendChild( stats.dom );

    window.addEventListener('resize', onWindowResize );

    pickHelper = new PickHelper(renderer);
}

function addSubmarine({ x, y, z, direction, size }) {
    const objLoader = new OBJLoader();
    objLoader.load('/models/submarine/uploads_files_989493_submarine.obj', (root) => {
        const verticalArrowHelper = new THREE.ArrowHelper( new THREE.Vector3( x, y, z ), new THREE.Vector3( x, 0, z), 20000, 0x48ff00, 0, 0 );
        const directionArrowHelper = new THREE.ArrowHelper( new THREE.Vector3( x, y, z ), new THREE.Vector3( x, y, z), 1400, 0xeb4034 );
        directionArrowHelper.rotateY(direction);
        directionArrowHelper.rotateX(Math.PI / 2);
        scene.add( verticalArrowHelper );
        scene.add( directionArrowHelper );

        const material = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.4, name: 'submarine' });
        root.traverse(node => node.material = material);
        scene.add(root);

        root.scale.set( 20 * size, 20 * size, 20 * size );
        root.position.set(x, y, z);
        root.rotateY(direction);
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    controls.handleResize();
}

function generateHeight( width, height ) {

    let seed = Math.PI / 4;
    window.Math.random = function () {

        const x = Math.sin( seed ++ ) * 10000;
        return x - Math.floor( x );

    };

    const size = width * height, data = new Uint8Array( size );
    const perlin = new ImprovedNoise(), z = Math.random() * 100;

    let quality = 1;

    for ( let j = 0; j < 4; j ++ ) {

        for ( let i = 0; i < size; i ++ ) {

            const x = i % width, y = ~ ~ ( i / width );
            data[ i ] += Math.abs( perlin.noise( x / quality, y / quality, z ) * quality * 1.75 );

        }

        quality *= 5;

    }

    return data;

}

function generateTexture( data, width, height ) {
    let context, image, imageData, shade;

    const vector3 = new THREE.Vector3( 0, 0, 0 );
    const canvas = document.createElement( 'canvas' );

    const sun = new THREE.Vector3( 1, 1, 1 );
    sun.normalize();

    canvas.width = width;
    canvas.height = height;

    context = canvas.getContext( '2d' );
    context.fillRect( 0, 0, width, height );

    image = context.getImageData( 0, 0, canvas.width, canvas.height );
    imageData = image.data;

    for ( let i = 0, j = 0, l = imageData.length; i < l; i += 4, j ++ ) {
        vector3.x = data[ j - 2 ] - data[ j + 2 ];
        vector3.y = 2;
        vector3.z = data[ j - width * 2 ] - data[ j + width * 2 ];
        vector3.normalize();

        shade = vector3.dot( sun );

        imageData[ i ] = ( 96 + shade * 128 ) * ( 0.5 + data[ j ] * 0.007 );
        imageData[ i + 1 ] = ( 32 + shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );
        imageData[ i + 2 ] = ( shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );
    }

    context.putImageData( image, 0, 0 );

    const canvasScaled = document.createElement( 'canvas' );
    canvasScaled.width = width * 4;
    canvasScaled.height = height * 4;

    context = canvasScaled.getContext( '2d' );
    context.scale( 4, 4 );
    context.drawImage( canvas, 0, 0 );
    image = context.getImageData( 0, 0, canvasScaled.width, canvasScaled.height );
    imageData = image.data;

    for ( let i = 0, l = imageData.length; i < l; i += 4 ) {
        const v = ~ ~ ( Math.random() * 5 );
        imageData[ i ] += v;
        imageData[ i + 1 ] += v;
        imageData[ i + 2 ] += v;
    }

    context.putImageData( image, 0, 0 );

    return canvasScaled;
}

function animate() {
    requestAnimationFrame( animate );

    render();
    stats.update();
}

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

function render() {
    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }

    pickHelper.pick(scene, camera);

    controls.update( clock.getDelta() );
    renderer.render( scene, camera );
}