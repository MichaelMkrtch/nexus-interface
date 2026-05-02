<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1, maximum-scale=2, user-scalable=0, viewport-fit=cover"
	/>
</svelte:head>

<div class="app-root bg-black">
	{@render children()}
</div>
