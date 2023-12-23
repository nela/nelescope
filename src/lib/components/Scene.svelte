<script lang="ts">
	import { T } from '@threlte/core';
	import Cube from './cube/Cube.svelte';
	import { OrbitControls } from '@threlte/extras';

  const aspect = window.innerWidth / window.innerHeight;
</script>

<T.PerspectiveCamera makeDefault position={[0, -5, 10]} fov={45} {aspect} near={0.1} far={1000}>
	<OrbitControls target.y={1.5} enableZoom={false} enableDamping autoRotateSpeed={0.5} />
</T.PerspectiveCamera>

<T.DirectionalLight castShadow intensity={0.8} position={[12, 12, 10]} />
<T.AmbientLight intensity={0.2} />

<T.AxesHelper args={[2]}></T.AxesHelper>

<Cube />
