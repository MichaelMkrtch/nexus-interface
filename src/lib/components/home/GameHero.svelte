<script lang="ts">
	import type { TransitionConfig } from 'svelte/transition';

	import { cubicOut, quadOut } from 'svelte/easing';

	import type { Game } from '$lib/features/games/types';

	interface GameHeroProps {
		games: Game[];
		focusedIndex: number;
	}

	const HERO_SETTLE_DELAY_MS = 275;
	const HERO_DRIFT_PX = 5;
	const HERO_START_SCALE = 0.996;
	const HERO_START_OPACITY = 0.05;

	let { games, focusedIndex }: GameHeroProps = $props();

	let heroGameIndex = $state(0);
	let heroDirection = $state(1);
	const heroGame = $derived(games[heroGameIndex]);

	$effect(() => {
		if (focusedIndex === heroGameIndex) return;

		const nextGameIndex = focusedIndex;
		const nextDirection = Math.sign(nextGameIndex - heroGameIndex) || heroDirection;
		const timeout = window.setTimeout(() => {
			heroDirection = nextDirection;
			heroGameIndex = nextGameIndex;
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
			duration: 500,
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

{#if heroGame}
	{#key heroGame.id}
		<div class="absolute inset-0" in:heroIn out:heroOut>
			<img src={heroGame.hero} alt="" class="size-full object-cover" draggable="false" />
		</div>
	{/key}
{/if}
