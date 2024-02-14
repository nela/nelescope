<script lang="ts">
  import * as THREE from 'three';
  import { FontLoader } from 'three/addons/loaders/FontLoader.js';
  import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

  const text = 'Nemanja Lakicevic';

  let bevelEnabled = true,
				font = undefined,
				fontName = 'optimer', // helvetiker, optimer, gentilis, droid sans, droid serif
				fontWeight = 'bold'; // normal bold

  const height = 20,
				size = 70,
				hover = 30,
				curveSegments = 4,
				bevelThickness = 2,
				bevelSize = 1.5;

  /* const createText = () => {
    // const floader = new FontLoader().
    const textGeo = new TextGeometry(text, {
					font: font,
					size: size,
					height: height,
					curveSegments: curveSegments,
					bevelThickness: bevelThickness,
					bevelSize: bevelSize,
					bevelEnabled: bevelEnabled
				});

				textGeo.computeBoundingBox();
				const centerOffset = - 0.5 * (textGeo.boundingBox!.max.x - textGeo.boundingBox!.min.x );

        const materials = [
					new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } ), // front
					new THREE.MeshPhongMaterial( { color: 0xffffff } ) // side
				];

				const textMesh1 = new THREE.Mesh( textGeo, materials );
  } */
</script>
