import * as THREE from 'https://cdn.skypack.dev/three@0.133.1';

const pickPosition = { x: 0, y: 0 };

class PickHelper {
  constructor(renderer) {
    this.raycaster = new THREE.Raycaster();
    this.pickedObject = null;
    this.pickedObjectSavedColor = 0;
    this.canvas = renderer.domElement;

    this.setPickPosition = this.setPickPosition.bind(this);
    this.clearPickPosition = this.clearPickPosition.bind(this);
    this.getCanvasRelativePosition = this.getCanvasRelativePosition.bind(this);

    window.addEventListener('mousemove', this.setPickPosition);
    window.addEventListener('mouseout', this.clearPickPosition);
    window.addEventListener('mouseleave', this.clearPickPosition);

    window.addEventListener('touchstart', (event) => {
      // prevent the window from scrolling
      event.preventDefault();
      this.setPickPosition(event.touches[0]);
    }, {passive: false});
    
    window.addEventListener('touchmove', (event) => {
      this.setPickPosition(event.touches[0]);
    });
    
    window.addEventListener('touchend', this.clearPickPosition);
  }
  pick(scene, camera) {
    // restore the color if there is a picked object
    if (this.pickedObject) {
      this.pickedObject.material.color.setHex(this.pickedObjectSavedColor);
      this.pickedObject.material.label.style.display = 'none';
      this.pickedObject = undefined;
    }
 
    // cast a ray through the frustum
    this.raycaster.setFromCamera(pickPosition, camera);
    // get the list of objects the ray intersected
    const intersectedObjects = this.raycaster.intersectObjects(scene.children)
      .filter(({object}) => object.material && object.material.name == 'submarine');
      
    if (intersectedObjects.length) {
      // pick the first object. It's the closest one
      this.pickedObject = intersectedObjects[0].object;
      this.pickedObject.material.label.style.display = 'block';
      // save its color
      this.pickedObjectSavedColor = this.pickedObject.material.color.getHex();
      // set its emissive color to flashing red/yellow
      this.pickedObject.material.color.setHex(0xFF0000);
    }
  }

  getCanvasRelativePosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * this.canvas.width  / rect.width,
      y: (event.clientY - rect.top ) * this.canvas.height / rect.height,
    };
  }
   
  setPickPosition(event) {
    const pos = this.getCanvasRelativePosition(event);
    pickPosition.x = (pos.x / this.canvas.width ) *  2 - 1;
    pickPosition.y = (pos.y / this.canvas.height) * -2 + 1;
  }

  clearPickPosition() {
    pickPosition.x = -100000;
    pickPosition.y = -100000;
  }
}

export default PickHelper;