
let toystory,
    mesh,
    mixer;

let clock = new THREE.Clock();
let mainURL = 'https://intra.letsee.io/3D-model/fbx/';

const loadingManager = new THREE.LoadingManager();
loadingManager.onProgress = (item, loaded, total) => console.log(item, loaded, total);

/**
 * Initialize 3D world
 */
function initWorld() {

  initScene();
  proceedModel();
}

/**
 * Initialize Scene
 */
function initScene() {

  // 1. Add lights
  let ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  ambientLight.position.set(0, 0, 0);
  scene.add(ambientLight);

  let dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
  dirLight.position.set(0, 10, 10);
  dirLight.castShadow = false;
  dirLight.shadow.mapSize = new THREE.Vector2(512, 512);
  scene.add(dirLight);

  let pmremGenerator = new THREE.PMREMGenerator( renderer );
  pmremGenerator.compileEquirectangularShader();

  // 2. Set background for scene as image
  new THREE.RGBELoader()
  .setDataType( THREE.UnsignedByteType )
  .setPath( './assets/textures/' )
  .load( 'royal_esplanade_1k.hdr', function ( texture ) {

    let envMap = pmremGenerator.fromEquirectangular( texture ).texture;

    // scene.background = envMap;
    scene.environment = envMap;

    texture.dispose();
    pmremGenerator.dispose();

  });

  // 3. Set light effects for renderer
  renderer.outputEncoding          = THREE.sRGBEncoding;
  renderer.physicallyCorrectLights = true;
  renderer.setPixelRatio( window.devicePixelRatio );

}

/**
 * Proceed model.
 */
function proceedModel() {
  letsee.addTarget('https://developer.letsee.io/api-tm/target-manager/target-uid/6051de97b30426a32a7be172').then(entity => {
    toystory = entity;

    // 1. Load model
    loadModel()
    .then(model => {
      console.warn(`Model ${model.name} loaded completed!`);

      // 2.Add mesh into entity
      toystory.add(model);

      // 3. Add entity to scene
      scene.add(toystory);

      if (model) {
        //  Do something
      }
    });

    // Render all
    renderAll().then(() => {});
  });
}

/**
 * Render the whole thing.
 * @returns {Promise<void>}
 */
const renderAll = async function() {
  requestAnimationFrame(renderAll);

  let d = clock.getDelta();
  if ( mixer ) mixer.update(d);

  camera = letsee.threeRenderer().getDeviceCamera();
  await letsee.threeRenderer().update();

  renderer.render(scene, camera);
};

/**
 * Load glTF model.
 */
function loadModel() {
  return new Promise((resolve) => {

    let fbxLoader = new THREE.FBXLoader();
    fbxLoader.load( mainURL + 'Hood/Hood1.fbx' , function( obj ) {

      if (obj.animations.length) {
        mixer = new THREE.AnimationMixer( obj );
        let action = mixer.clipAction( obj.animations[ 0 ] );
        action.play();
      }

      obj.scale.setScalar(10);
      obj.position.set(0, 0, -300);
      obj.name = 'Hood';

      resolve(obj);
    }, onProgress, onError);
  })
}

/**
 * Show the progress of loading model
 * @param xhr
 */
function onProgress(xhr) {
  if (xhr.lengthComputable) {
    const percentComplete = xhr.loaded / xhr.total * 100;
    console.warn(Math.round(percentComplete) + '%');
  }
}

/**
 * Show error if loading error.
 * @param e
 */
function onError(e) {
  console.error(e);
}