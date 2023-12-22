import type { Box3 } from 'three';

export const getScalingRatio = (parent: Box3, target: Box3): number => {
	const parentBounds = {
		x: Math.abs(parent.max.x - parent.min.x),
		y: Math.abs(parent.max.y - parent.min.y),
		z: Math.abs(parent.max.z - parent.min.z)
	};

	const targetBounds = {
		x: Math.abs(target.max.x - target.min.x),
		y: Math.abs(target.max.y - target.min.y),
		z: Math.abs(target.max.z - target.min.z)
	};

	return Math.min(
		parentBounds.x / targetBounds.x,
		parentBounds.y / targetBounds.y,
		parentBounds.z / targetBounds.z
	);
};
