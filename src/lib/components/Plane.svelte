<script lang="ts">
	import { T } from "@threlte/core";
</script>

<!-- <T.Mesh position={[0, 100, 0]} rotation={[-Math.PI / 2, 0 , 0]}> -->
<T.Mesh position={[0, 10, 0]} rotation={[-Math.PI/2, 0, 0]}>
  <T.PlaneGeometry args={[10000, 10000]} />
  <T.MeshBasicMaterial color={'#ffffff'} opacity={0.5} transparent={true} />
</T.Mesh>
