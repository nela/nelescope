/*
 * taken from https://discourse.threejs.org/t/round-edged-box-3/1481
 */
import * as THREE from 'three';

export function RoundEdgedBox(
	width: number | undefined,
	height: number | undefined,
	depth: number | undefined,
	radius: number | undefined,
	widthSegments: number | undefined,
	heightSegments: number | undefined,
	depthSegments: number | undefined,
	radiusSegments: number | undefined
) {
	const w = width || 1;
	const h = height || 1;
	const d = depth || 1;
	const minimum = Math.min(Math.min(w, h), d);

	let r = radius || minimum * 0.25;
	r = r > minimum * 0.5 ? minimum * 0.5 : r;

	const wSegs = widthSegments ? Math.floor(widthSegments) : 1;
	const hSegs = heightSegments ? Math.floor(heightSegments) : 1;
	const dSegs = depthSegments ? Math.floor(depthSegments) : 1;
	const rSegs = radiusSegments ? Math.floor(radiusSegments) : 1;

	const fullGeometry = new THREE.BufferGeometry();

	let fullPosition: number[] = [];
	let fullUvs: number[] = [];
	let fullIndex: number[] = [];
	let fullIndexStart = 0;

	let groupStart = 0;

	bendedPlane(w, h, r, wSegs, hSegs, rSegs, d * 0.5, 'y', 0, 0);
	bendedPlane(w, h, r, wSegs, hSegs, rSegs, d * 0.5, 'y', Math.PI, 1);
	bendedPlane(d, h, r, dSegs, hSegs, rSegs, w * 0.5, 'y', Math.PI * 0.5, 2);
	bendedPlane(d, h, r, dSegs, hSegs, rSegs, w * 0.5, 'y', Math.PI * -0.5, 3);
	bendedPlane(w, d, r, wSegs, dSegs, rSegs, h * 0.5, 'x', Math.PI * -0.5, 4);
	bendedPlane(w, d, r, wSegs, dSegs, rSegs, h * 0.5, 'x', Math.PI * 0.5, 5);

	fullGeometry.setAttribute(
		'position',
		new THREE.BufferAttribute(new Float32Array(fullPosition), 3)
	);
	fullGeometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(fullUvs), 2));
	fullGeometry.setIndex(fullIndex);

	fullGeometry.computeVertexNormals();

	return fullGeometry;

	function bendedPlane(
		width: number,
		height: number,
		radius: number,
		widthSegments: number,
		heightSegments: number,
		smoothness: number,
		offset: number,
		axis: string,
		angle: number,
		materialIndex: number
	) {
		const halfWidth = width * 0.5;
		const halfHeight = height * 0.5;
		const widthChunk = width / (widthSegments + smoothness * 2);
		const heightChunk = height / (heightSegments + smoothness * 2);

		const planeGeometry = new THREE.PlaneGeometry(
			width,
			height,
			widthSegments + smoothness * 2,
			heightSegments + smoothness * 2
		);

		const v = new THREE.Vector3(); // current vertex
		const cv = new THREE.Vector3(); // control vertex for bending
		const cd = new THREE.Vector3(); // vector for distance
		const position = planeGeometry.attributes.position;
		const uv = planeGeometry.attributes.uv;
		const widthShrinkLimit = widthChunk * smoothness;
		const widthShrinkRatio = radius / widthShrinkLimit;
		const heightShrinkLimit = heightChunk * smoothness;
		const heightShrinkRatio = radius / heightShrinkLimit;
		const widthInflateRatio = (halfWidth - radius) / (halfWidth - widthShrinkLimit);
		const heightInflateRatio = (halfHeight - radius) / (halfHeight - heightShrinkLimit);

		for (let i = 0; i < position.count; i++) {
			v.fromBufferAttribute(position, i);
			if (Math.abs(v.x) >= halfWidth - widthShrinkLimit) {
				v.setX((halfWidth - (halfWidth - Math.abs(v.x)) * widthShrinkRatio) * Math.sign(v.x));
			} else {
				v.x *= widthInflateRatio;
			} // lr
			if (Math.abs(v.y) >= halfHeight - heightShrinkLimit) {
				v.setY((halfHeight - (halfHeight - Math.abs(v.y)) * heightShrinkRatio) * Math.sign(v.y));
			} else {
				v.y *= heightInflateRatio;
			} // tb

			//re-calculation of uvs
			uv.setXY(i, (v.x - -halfWidth) / width, 1 - (halfHeight - v.y) / height);

			// bending
			let widthExceeds = Math.abs(v.x) >= halfWidth - radius;
			let heightExceeds = Math.abs(v.y) >= halfHeight - radius;
			if (widthExceeds || heightExceeds) {
				cv.set(
					widthExceeds ? (halfWidth - radius) * Math.sign(v.x) : v.x,
					heightExceeds ? (halfHeight - radius) * Math.sign(v.y) : v.y,
					-radius
				);
				cd.subVectors(v, cv).normalize();
				v.copy(cv).addScaledVector(cd, radius);
			}

			position.setXYZ(i, v.x, v.y, v.z);
		}

		planeGeometry.translate(0, 0, offset);
		switch (axis) {
			case 'y':
				planeGeometry.rotateY(angle);
				break;
			case 'x':
				planeGeometry.rotateX(angle);
		}

		// merge positions
		position.array.forEach((p) => fullPosition.push(p));

		// merge uvs
		uv.array.forEach((u) => fullUvs.push(u));

		// merge indices
		planeGeometry.index!.array.forEach((a) => fullIndex.push(a + fullIndexStart));
		fullIndexStart += position.count;

		// set the groups
		fullGeometry.addGroup(groupStart, planeGeometry.index!.count, materialIndex);
		groupStart += planeGeometry.index!.count;
	}
}
