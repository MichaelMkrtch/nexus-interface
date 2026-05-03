<script lang="ts">
	import type { TransitionConfig } from 'svelte/transition';

	import { cubicOut, quadOut } from 'svelte/easing';

	import CardCarousel from '$components/CardCarousel.svelte';
	import Header from '$components/Header.svelte';
	import { mockGames } from '$lib/features/games/mock-games';

	const HERO_SETTLE_DELAY_MS = 250;
	const HERO_DRIFT_PX = 4;
	const HERO_START_SCALE = 0.995;
	const HERO_START_OPACITY = 0.1;

	let currentGameIndex = $state(0);
	let settledGameIndex = $state(0);
	let heroDirection = $state(1);
	const activeGame = $derived(mockGames[settledGameIndex]);

	$effect(() => {
		if (currentGameIndex === settledGameIndex) return;

		const nextGameIndex = currentGameIndex;
		const nextDirection = Math.sign(nextGameIndex - settledGameIndex) || heroDirection;
		const timeout = window.setTimeout(() => {
			heroDirection = nextDirection;
			settledGameIndex = nextGameIndex;
		}, HERO_SETTLE_DELAY_MS);

		return () => {
			window.clearTimeout(timeout);
		};
	});

	function heroIn(_node: Element): TransitionConfig {
		return {
			duration: 475,
			easing: cubicOut,
			css: (t) => {
				const x = -heroDirection * HERO_DRIFT_PX * (1 - t);
				const scale = HERO_START_SCALE + (1 - HERO_START_SCALE) * t;
				const opacity = HERO_START_OPACITY + (1 - HERO_START_OPACITY) * t;

				return `opacity: ${opacity}; transform: translate3d(${x}px, 0, 0) scale(${scale});`;
			}
		};
	}

	function heroOut(_node: Element): TransitionConfig {
		return {
			duration: 350,
			easing: quadOut,
			css: (t) => {
				const x = heroDirection * HERO_DRIFT_PX * (1 - t);
				const scale = HERO_START_SCALE + (1 - HERO_START_SCALE) * t;
				const opacity = HERO_START_OPACITY + (1 - HERO_START_OPACITY) * t;

				return `opacity: ${opacity}; transform: translate3d(${x}px, 0, 0) scale(${scale});`;
			}
		};
	}
</script>

<main class="relative size-full overflow-hidden">
	{#if activeGame}
		{#key activeGame.id}
			<div class="absolute inset-0" in:heroIn out:heroOut>
				<img src={activeGame.hero} alt="" class="size-full object-cover" draggable="false" />
			</div>
		{/key}
	{/if}

	<!-- <div
		class="pointer-events-none absolute inset-0 bg-linear-to-r from-black/80 via-black/35 to-black/10"
	></div> -->
	<!-- <div
		class="pointer-events-none absolute inset-0 bg-linear-to-t from-black via-transparent to-black/35"
	></div> -->

	<!-- Margin-restricted UI -->
	<div class="relative px-20 py-10">
		<Header />
	</div>
	<!-- {#if activeGame}
		{#key activeGame.id}
			<section class="relative px-20 pt-16" in:fade={{ duration: 220, delay: 120 }}>
				<h2 class="max-w-3xl text-5xl font-semibold tracking-normal text-white">
					{activeGame.title}
				</h2>
				<button class="mt-8 rounded-full bg-white px-8 py-3 text-lg font-semibold text-black">
					Play
				</button>
			</section>
		{/key}
	{/if} -->

	<!-- Fullscreen UI -->
	<div class="relative mt-16 w-full overflow-hidden">
		<CardCarousel games={mockGames} bind:current={currentGameIndex} />
	</div>
</main>
