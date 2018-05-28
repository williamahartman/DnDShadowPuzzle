const canvas = document.getElementById("puzzle");
var pedestal, light, renderer, roomScene, camera, controls;

init();
animate();

function init() {
    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight - 200);
    renderer.setClearColor(0x5e685e);
    renderer.toneMapping = THREE.Uncharted2ToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.autoClearColor = false;

    window.addEventListener('resize', onWindowResize, false)

    // Scenes
    roomScene = new THREE.Scene();
    carvingScene = new THREE.Scene();
    stuffScene = new THREE.Scene();

    // Loader
    var jsonObjectLoader = new THREE.AssimpJSONLoader();

    // Camera
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(20, 20, 20);
    camera.near = 0.1;
    camera.far = 1000;
    roomScene.add(camera);
    carvingScene.add(camera);
    stuffScene.add(camera);

    // Controls
    controls = new THREE.OrbitControls(camera, canvas);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.maxPolarAngle = 3 * Math.PI / 4;

    // Ambient Light
    var ambient = new THREE.PointLight(0xffffff, 0.4);
    camera.add(ambient);

    // Light
    light = new THREE.PointLight(0xffffff, 1, 0, 2);
    light.intensity = 1;
    light.castShadow = true;
    light.position.set(3, -4.5, 3);
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 40;
    light.shadow.bias = -0.01;
    roomScene.add(light);

    //"Solution" Light in caving scene
    solutionLight = light.clone();
    solutionLight.position.set(5.43, -4.5, 5.43);
    carvingScene.add(solutionLight);

    // Shape
    jsonObjectLoader.load('dodec.json', function (object) {
        //Primary Shape
        var shapeGeom = object.children[0].geometry;
        var shapeMat = new THREE.MeshPhongMaterial({
            color: 0xadadad,
            specular: 0xffffff,
            shadowSide: THREE.FrontSide,
        });
        shape = new THREE.Mesh(shapeGeom, shapeMat);
        shape.name = 'shape';
        shape.scale.multiplyScalar(0.15);
        shape.position.set(0, -2, 0);
        shape.rotation.set(0, 2.95, 0);
        shape.castShadow = true;
        roomScene.add(shape);
        stuffScene.add(shape.clone());

        //"Solution" Shape in carving scene
        var shape2Mat = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            shadowSide: THREE.FrontSide,
        });
        shape2 = new THREE.Mesh(shapeGeom, shape2Mat);
        shape2.scale.multiplyScalar(0.15);
        shape2.position.set(0, -2, 0);
        shape2.rotation.set(1.71, 2.95, 2.41);
        shape2.castShadow = true;

        carvingScene.add(shape2);
    });

    // Pedestal
    boxMat = new THREE.MeshPhongMaterial({
        color: 'gray',
    });
    var boxGeom = new THREE.BoxGeometry(0.5, 1.5, 0.5);
    box = new THREE.Mesh(boxGeom, boxMat);
    box.position.set(0, -5.25, 0);

    var keyGeom = new THREE.SphereGeometry(0.35, 10, 10);
    var keyMat = new THREE.MeshBasicMaterial({
        color: 'white',
    });
    key = new THREE.Mesh(keyGeom, keyMat);
    key.name = "key";
    key.position.set(0, -4.25, 0);

    pedestal = new THREE.Group();
    pedestal.add(box);
    pedestal.add(key);
    stuffScene.add(pedestal);

    // Room
    jsonObjectLoader.load('temple.json', function (object) {
        roomGeom = object.children[0].geometry;
        roomMat = new THREE.MeshPhongMaterial({
            color: 0x5e5446,
            shininess: 15,
            normalScale: new THREE.Vector2(0.8, 0.8),
            shadowSide: THREE.DoubleSide,
        });
        var room = new THREE.Mesh(roomGeom, roomMat);
        room.receiveShadow = true;
        room.castShadow = true;
        room.scale.multiplyScalar(0.025);
        room.rotation.x = Math.PI / 2;
        room.rotation.y = Math.PI;
        room.rotation.z = 5 * Math.PI / 4;
        roomScene.add(room);

        var roomFrontMat = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.35,
            side: THREE.BackSide,
        });
        var roomFront = new THREE.Mesh(roomGeom, roomFrontMat);
        roomFront.scale.multiplyScalar(0.025);
        roomFront.rotation.x = Math.PI / 2;
        roomFront.rotation.y = Math.PI;
        roomFront.rotation.z = 5 * Math.PI / 4;
        roomScene.add(roomFront);

        //"Solution" wall on carvingScene
        carveMat = new THREE.ShadowMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1,
        });
        var carvings = new THREE.Mesh(roomGeom, carveMat);
        carvings.receiveShadow = true;
        carvings.scale.multiplyScalar(0.025);
        carvings.rotation.x = Math.PI / 2;
        carvings.rotation.y = Math.PI;
        carvings.rotation.z = 5 * Math.PI / 4;
        carvings.onBeforeRender = function () {
            renderer.context.depthFunc(renderer.context.ALWAYS);
        };
        carvingScene.add(carvings);
    });

    onWindowResize();
    setLightPosition(10);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.clear(true, true, true);
    renderer.context.depthFunc(renderer.context.LESS);
    renderer.render(roomScene, camera);
    renderer.render(carvingScene, camera);
    renderer.context.depthFunc(renderer.context.LESS);
    renderer.render(stuffScene, camera);

    checkSuccess();
}

function onWindowResize(event) {
    var width = window.innerWidth;
    var height = window.innerHeight - 200;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function setLightPosition(t) {
    light.position.x = t;
    light.position.z = t;
    pedestal.position.x = t;
    pedestal.position.z = t;
}

function setShapeXRot(x) {
    mainShape = roomScene.getObjectByName('shape');
    stuffShape = stuffScene.getObjectByName('shape');

    if(mainShape && stuffShape) {
        shapeRot = mainShape.rotation.clone();
        mainShape.rotation.set(x, shapeRot.y, shapeRot.z);
        stuffShape.rotation.set(x, shapeRot.y, shapeRot.z);
    }
}

function setShapeZRot(z) {
    mainShape = roomScene.getObjectByName('shape');
    stuffShape = stuffScene.getObjectByName('shape');

    if(mainShape && stuffShape) {
        shapeRot = mainShape.rotation.clone();
        mainShape.rotation.set(shapeRot.x, shapeRot.y, z);
        stuffShape.rotation.set(shapeRot.x, shapeRot.y, z);
    }
}

function toggleLight() {
    if (light.castShadow) {
        light.intensity = 0.5;
        light.position.set(0, -4.5, 0);
        renderer.setClearColor(0x000000)
    } else {
        light.intensity = 1;
        light.position.set(
            pedestal.position.x,
            -4.5,
            pedestal.position.z
        );
        renderer.setClearColor(0x5e685e);
    }
    light.castShadow = !light.castShadow;
    key = stuffScene.getObjectByName("key");
    key.visible = !key.visible;
}

function checkSuccess() {
    lightGood = false;
    xGood = false;
    zGood = false;


    lightDelta = Math.abs(5.43 - light.position.x);
    if (lightDelta <= 0.05) {
        console.log("Light's good, dude!");
        lightGood = true;
    }

    var shape = roomScene.getObjectByName('shape');
    if (shape) {
        xDelta = Math.abs(1.71 - shape.rotation.x);
        if (xDelta <= 0.05) {
            console.log("X rotation is good, dude!");
            xGood = true;
        }

        zDelta = Math.abs(2.41 - shape.rotation.z);
        if (zDelta <= 0.05) {
            console.log("Z rotation is good, dude!");
            zGood = true;
        }
    }

    if (lightGood && xGood && zGood) {
        alert("The shadows from the dodecahedron align with carvings on the walls. The locked door at the back of the room slides open.")
    }
}
