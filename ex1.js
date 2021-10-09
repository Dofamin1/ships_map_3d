const stats = initStats();

const SPACE_KEY = 'Space';
let isPointLightMoveEnabled = false;

let time = new Date() * 0.00125;

const {scene, camera, renderer} = {
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000),
    renderer: new THREE.WebGLRenderer()
};

const {planeGeometry, planeMaterial} = {
    planeGeometry: new THREE.PlaneGeometry(40, 30, 1, 1),
    planeMaterial: new THREE.MeshLambertMaterial({color: 0xffffff, 'opacity': 0.6}),
};

const {directionalLight, pointLight} = {
    directionalLight: new THREE.DirectionalLight(0xe30909, 4),
    pointLight: new THREE.PointLight(0xffff00, 0.8)
};

const {directionalLightHelper, pointLightHelper} = {
    directionalLightHelper: new THREE.DirectionalLightHelper(directionalLight, 10),
    pointLightHelper: new THREE.PointLightHelper(pointLight, 2)
};

const plane = new THREE.Mesh(planeGeometry, planeMaterial);

const gui = new dat.GUI();

const controls = new function() {
    this.x = 0;
    this.y = 0;
    this.z = 0
};

document.addEventListener('keypress', (e) => {
    if (e.code === SPACE_KEY) {
        isPointLightMoveEnabled = !isPointLightMoveEnabled;
    }
});

(function () {
    configureRenderer(renderer);
    configurePlane(plane);
    configureCamera(camera);
    configureDirectionalLight(directionalLight);
    configurePointLight(pointLight);

    const geometry = generateGeometry();
    const material = generateMaterial();
    const meshes = generateMeshes(geometry, material);

    scene.add(plane);

    scene.add(directionalLight);
    scene.add(directionalLight.target);
    scene.add(directionalLightHelper);

    scene.add(pointLight);
    scene.add(pointLightHelper);

    gui.add(controls, 'x', -20, 20);
    gui.add(controls, 'y', -20, 20);
    gui.add(controls, 'z', -20, 20);

    addMeshesToScene(meshes, scene);

    $("#WebGL-output").append(renderer.domElement);

    render(material);
})();

function render() {
    stats.update();

    requestAnimationFrame(render);

    updateDirectionalLight(directionalLight, directionalLightHelper);

    if (isPointLightMoveEnabled) {
        time += .035;

        updatePointLightPosition(pointLight, pointLightHelper, time, false);
    } else {
        updatePointLightPosition(pointLight, pointLightHelper, time, true);
    }

    renderer.render(scene, camera);
}

function updateDirectionalLight(directionalLight, helper) {
    directionalLight.position.x = controls.x;
    directionalLight.position.y = controls.y;
    directionalLight.position.z = controls.z;

    helper.position.x = controls.x;
    helper.position.y = controls.y;
    helper.position.z = controls.z;

    directionalLight.target.updateMatrixWorld();
    helper.update();
}

function updatePointLightPosition(pointLight, helper, time, isStopped) {
    if (isStopped) {
        return;
    }

    pointLight.position.x = -Math.cos(time) * 20;
    pointLight.position.z = -Math.sin(time) * 20;

    helper.position.x = -Math.cos(time) * 20;
    helper.position.z = -Math.sin(time) * 20;

    helper.update();
}

function initStats() {
    const stats = new Stats();

    stats.setMode(0); // 0: fps, 1: ms

    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';

    $("#Stats-output").append(stats.domElement);

    return stats;
}

function configureRenderer(renderer) {
    renderer.setClearColorHex(0xEEEEEE, 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMapEnabled = true;
}

function configurePlane(plane) {
    plane.receiveShadow = true;
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.x = 0;
    plane.position.y = 0;
    plane.position.z = 0;
}

function configureCamera(camera) {
    camera.position.x = -50;
    camera.position.y = 20;
    camera.position.z = 0;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
}

function configureDirectionalLight(directionalLight) {
    directionalLight.position.set(10, 10, 10);
    directionalLight.target.position.set(10, 10, 10);
    directionalLight.castShadow = true;
}

function configurePointLight(pointLight) {
    pointLight.position.set(-100, 10);
}

function generateGeometry() {
    return [new THREE.ParametricGeometry((u, v) => {
            u *= Math.PI * 2;

            const {x, y, z} = {
                x: v * Math.sqrt(1 - v) * Math.cos(u),
                y: v * Math.sqrt(1 - v) * Math.sin(u),
                z: v
            };

            return new THREE.Vector3(x, y, z);
        }
        , 25
        , 25)
        , new THREE.ParametricGeometry((u, v) => {
                u *= 2 * Math.PI;
                v *= Math.PI / 6;

                const {x, y, z} = {
                    x: v * Math.sqrt(1 - v) * Math.cos(u) * 2,
                    y: v * Math.sqrt(1 - v) * Math.sin(u) * 2,
                    z: v
                };

                return new THREE.Vector3(x, y, z);
            }
            , 25
            , 25)
    ];
}

function generateMaterial() {
    return material = new THREE.MeshPhongMaterial({
        color: Math.random() * 0xffffff,
        shading: THREE.FlatShading,
        wireframe: false
    })
}

function generateMeshes(geometries, material) {
    const meshes = [];

    geometries.forEach((geometry) => {
        meshes.push(getMesh(geometry, material));
    });

    configureMesh1(meshes[0]);
    configureMesh2(meshes[1]);

    return meshes;
}

function getMesh(geometry, material) {
    return new THREE.Mesh(geometry, material);
}

function configureMesh1(mesh) {
    mesh.rotation.x = 1 / 2 * Math.PI;
    mesh.rotation.y = Math.PI;
    mesh.rotation.z = 2 * Math.PI;

    mesh.position.x = -15;
    mesh.position.y = 5;
    mesh.position.z = -5;

    mesh.scale.set(4, 4, 4);
}

function configureMesh2(mesh) {
    mesh.rotation.x = 1 / 2 * Math.PI;
    mesh.rotation.y = 2 * Math.PI;
    mesh.rotation.z = 2 * Math.PI;

    mesh.position.x = -15;
    mesh.position.y = 5;
    mesh.position.z = -5;

    mesh.scale.set(7, 7, 7);
}

function addMeshesToScene(meshes, scene) {
    meshes.forEach((mesh) => scene.add(mesh));
}
