<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import type { TransitionConfig } from 'svelte/transition';

	import { cubicOut } from 'svelte/easing';

	import { preloadHomeGames } from '$lib/features/games/library';

	import '../app.css';

	const ROUTE_TRANSITION_MS = 260;
	const ROUTE_TRANSITION_OFFSET_REM = 0.85;
	const ROUTE_TRANSITION_START_SCALE = 0.992;

	let { children } = $props();

	onMount(() => {
		void preloadHomeGames();
	});

	function routeEnter(_node: Element): TransitionConfig {
		return {
			duration: ROUTE_TRANSITION_MS,
			easing: cubicOut,
			css: (t, u) => {
				const y = u * ROUTE_TRANSITION_OFFSET_REM;
				const scale = ROUTE_TRANSITION_START_SCALE + (1 - ROUTE_TRANSITION_START_SCALE) * t;

				return `opacity: ${t}; transform: translate3d(0, ${y}rem, 0) scale(${scale});`;
			}
		};
	}
</script>

<svelte:head>
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1, maximum-scale=2, user-scalable=0, viewport-fit=cover"
	/>
</svelte:head>

<div class="app-shell h-screen w-screen overflow-hidden bg-black text-white">
	{#key page.url.pathname}
		<div class="route-layer" in:routeEnter>
			{@render children()}
		</div>
	{/key}
</div>

<style>
	.app-shell {
		position: relative;
	}

	.route-layer {
		position: absolute;
		inset: 0;
		overflow: hidden;
		transform-origin: center;
		will-change: opacity, transform;
	}
</style>
