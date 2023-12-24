<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { useCursor, type IntersectionEvent, interactivity } from '@threlte/extras';
	import * as THREE from 'three';
	import { getScalingRatio } from '../utils';
	import { spring } from 'svelte/motion';
	import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
	import githubMarkWhite from '../../../assets/github-mark-white.svg?raw';
	import { RoundEdgedBox } from './box';

	interface Transform {
		translate: { x: number; y: number; z: number };
		rotate: { x: number; y: number; z: number };
	}

	export let width = 4;
	export let height = 4;
	export let depth = 4;
	export let radius = 0.25;
	export let radiusSegments = 8;
	export let heightSegments = 8;
	export let widthSegments = 8;
	export let depthSegments = 8;

	const { onPointerEnter, onPointerLeave } = useCursor();
	/* const roundedEdgesVertex = `
    vec3 signs = sign(position);
    vec3 box = boxSize - vec3(radius);
    box = vec3(max(0.0, box.x), max(0.0, box.y), max(0.0, box.z));
    vec3 p = signs * box;

    transformed = signs * box + normalize(position) * radius;

    // re-compute normals for correct shadows and reflections
    objectNormal = all(equal(p, transformed)) ? normal : normalize(position);
    transformedNormal = normalize(normalMatrix * objectNormal);

    vNormal = transformedNormal;
    // transformed = signs * subBox + normalize(position) * radius
  ` */
	const boopVertex = `
    vec3 pos = transformed;
    float x = pos.x * cos(boop.y) + pos.z * sin(boop.y);
    float y = pos.x * sin(boop.x) * sin(boop.y) + pos.y * cos(boop.x) - pos.z * sin(boop.x) * cos(boop.y);
    float z = -pos.x * cos(boop.x) * sin(boop.y) + pos.y * sin(boop.x) + pos.z * cos(boop.x) * cos(boop.y);
    transformed = vec3(x, y, z);
    // vPosition = vec3(x, y, z);
  `;

	let timeout: NodeJS.Timeout;
	let blocked = false;
	const boop = spring({ x: 0, y: 0 }, { stiffness: 0.1, damping: 0.1 });
	let coords = { x: 0, y: 0 };

	const boopShader = (uniformBoop: THREE.IUniform<any>) => (shader: THREE.Shader) => {
		shader.uniforms.boop = uniformBoop;
		shader.vertexShader =
			`
        uniform vec2 boop;
      ` + shader.vertexShader;
		shader.vertexShader = shader.vertexShader.replace(
			'#include <begin_vertex>',
			['#include <begin_vertex>', boopVertex].join('\n')
		);
	};
	const tloader = new THREE.TextureLoader();
	// const displacement = tloader.load('src/assets/metal_046b/Metal046B_4K-JPG_Displacement.jpg')
	const baseMap = tloader.load('src/assets/metal_046b/Metal046B_4K-JPG_Color.jpg');
	const metalnessMap = tloader.load('src/assets/metal_046b/Metal046B_4K-JPG_Metalness.jpg');
	const normalMap = tloader.load('src/assets/metal_046b/Metal046B_4K-JPG_NormalGL.jpg');
	const roughnessMap = tloader.load('src/assets/metal_046b/Metal046B_4K-JPG_Roughness.jpg');

	const createBox = (): THREE.Mesh => {
		const geometry = RoundEdgedBox(
			width,
			height,
			depth,
			radius,
			widthSegments,
			heightSegments,
			depthSegments,
			radiusSegments
		);
		// const geometry = new RoundedBoxGeometry(4, 4, 4, 9, 0.25);
		// const geometry = new THREE.BoxGeometry(4, 4, 4, 9, 9, 9);
		geometry.computeBoundingBox();
		const material = new THREE.MeshStandardMaterial({
			map: baseMap,
			roughnessMap: roughnessMap,
			normalMap: normalMap,
			metalnessMap: metalnessMap,
			metalness: 1.0,
			// displacementMap: displacement,
			// displacementScale: 0.05,
			// displacementBias: -0.06,
			userData: {
				boop: { value: $boop }
			}
		});
		material.onBeforeCompile = boopShader(material.userData.boop);

		const mesh = new THREE.Mesh(geometry, material);
		mesh.customDepthMaterial = new THREE.MeshDepthMaterial({
			depthPacking: THREE.RGBADepthPacking,
			alphaTest: 0.5,
			depthTest: true,
			depthWrite: true,
			onBeforeCompile: boopShader(material.userData.boop)
		});

		mesh.castShadow = true;
		mesh.receiveShadow = true;
		return mesh;
	};

	const createSvg = (path: string, transform: Transform, parent: THREE.Mesh) => {
		const group = new THREE.Group();
		group.userData = {
			boop: { value: $boop }
		};

		new SVGLoader()
			.parse(path)
			.paths.flatMap((path) =>
				SVGLoader.createShapes(path).map((shape) => {
					const material = new THREE.MeshPhongMaterial({
						// wireframe: true,
						color: '#fafafa',
						shininess: 100,
						reflectivity: 1,
						specular: '#fafafa'
					});
					material.onBeforeCompile = boopShader(parent.material.userData.boop);

					const geometry = new THREE.ExtrudeGeometry(shape, {
						steps: 12,
						depth: width * Math.PI,
						bevelThickness: width,
						bevelSize: width / 2,
						bevelOffset: 0.8,
						bevelSegments: 6
					});

					geometry.computeBoundingBox();
					const ratio = parent
						? getScalingRatio(parent.geometry.boundingBox!, geometry.boundingBox!) * 0.7
						: 1;
					geometry.scale(ratio, ratio, ratio);
					geometry.center();
					geometry.rotateX(transform.rotate.x);
					geometry.rotateY(transform.rotate.y);
					geometry.rotateZ(transform.rotate.z);
					geometry.translate(transform.translate.x, transform.translate.y, transform.translate.z);

					const mesh = new THREE.Mesh(geometry, material);
					mesh.customDepthMaterial = new THREE.MeshDepthMaterial({
						alphaTest: 0.5,
						depthPacking: THREE.RGBADepthPacking,
						depthWrite: true,
						depthTest: true,
						onBeforeCompile: boopShader(parent.material.userData.boop)
					});
					mesh.position.fromArray(parent.position.toArray());
					mesh.castShadow = true;
					mesh.receiveShadow = true;
					return mesh;
				})
			)
			.forEach((mesh) => group.add(mesh));

		return group;
	};

	const onEnter = (_: IntersectionEvent<MouseEvent>) => {
		onPointerEnter();
	};

	const onMove = (e: IntersectionEvent<MouseEvent>) => {
		if (blocked) return;

		boop.set({
			x: (-1 * (e.point.y - box.position.y)) / height /* * 0.3 */,
			y: (e.point.x - box.position.x) / width /* * 0.3 */
		});
	};

	const onLeave = (_: IntersectionEvent<MouseEvent>) => {
		boop.set({ x: 0, y: 0 });
		coords = { x: 0, y: 0 };
		blocked = true;
		onPointerLeave();
	};

	const transforms: Transform[] = [
		{
			// front
			translate: { x: 0, y: 0, z: width / 2 },
			rotate: { x: 0, y: 0, z: Math.PI }
		},
		{
			// left
			translate: { x: -width / 2, y: 0, z: 0 },
			rotate: { x: 0, y: Math.PI / 2, z: Math.PI }
		},
		{
			// right
			translate: { x: width / 2, y: 0, z: 0 },
			rotate: { x: 0, y: -Math.PI / 2, z: Math.PI }
		},
		{
			// back
			translate: { x: 0, y: 0, z: -width / 2 },
			rotate: { x: 0, y: 0, z: Math.PI }
		},
		{
			// top
			translate: { x: 0, y: height / 2, z: 0 },
			rotate: { x: Math.PI / 2, y: 0, z: Math.PI }
		},
		{
			// bottom
			translate: { x: 0, y: -height / 2, z: 0 },
			rotate: { x: -Math.PI / 2, y: 0, z: Math.PI }
		}
	];
	let box = createBox();
	const svgs = new THREE.Group();
	transforms.map((t) => svgs.add(createSvg(githubMarkWhite, t, box)));

	$: if (blocked) {
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			blocked = false;
		}, 250);
	}

	interactivity();

	useTask(() => {
		box.material.userData.boop.value = $boop;
	});
</script>

<T is={box} on:pointerenter={onEnter} on:pointerleave={onLeave} on:pointermove={onMove} />
<T is={svgs} />
