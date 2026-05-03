<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	function handlePress() {
		goto(resolve('/home'));
	}
</script>

<main>
	<div class="flex items-center justify-center font-medium">Log in page</div>
	<button onclick={handlePress}>Go Home</button>
</main>
