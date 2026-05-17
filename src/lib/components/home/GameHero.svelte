<script module lang="ts">
	const heroPreloadCache: Record<string, Promise<void> | undefined> = Object.create(null);

	export function resetHeroPreloadCache() {
		for (const key of Object.keys(heroPreloadCache)) {
			delete heroPreloadCache[key];
		}
	}

	export function preloadHero(src: string | undefined) {
		if (!src) return Promise.resolve();

		const cachedPreload = heroPreloadCache[src];
		if (cachedPreload) return cachedPreload;

		const preload = new Promise<void>((resolve) => {
			const image = new Image();
			image.decoding = 'async';
			image.src = src;

			if (typeof image.decode === 'function') {
				void image
					.decode()
					.catch(() => undefined)
					.finally(resolve);
				return;
			}

			image.addEventListener('load', () => resolve(), { once: true });
			image.addEventListener('error', () => resolve(), { once: true });
		});

		heroPreloadCache[src] = preload;
		return preload;
	}
</script>

<script lang="ts">
	import type { TransitionConfig } from 'svelte/transition';

	import { cubicOut, quadOut } from 'svelte/easing';
	import { untrack } from 'svelte';

	import type { Game } from '$lib/features/games/types';

	interface GameHeroProps {
		games: Game[];
		focusedIndex: number;
	}

	const HERO_SETTLE_DELAY_MS = 275;
	const HERO_DRIFT_PX = 5;
	const HERO_START_SCALE = 0.996;
	const HERO_START_OPACITY = 0.05;
	const HERO_WARMUP_NEIGHBOR_DISTANCE = 1;
	const HERO_IDLE_WARMUP_DELAY_MS = 64;

	let { games, focusedIndex }: GameHeroProps = $props();

	let heroGameIndex = $state(untrack(() => focusedIndex));
	let heroDirection = $state(1);
	const heroGame = $derived(games[heroGameIndex]);

	function getWarmHeroIndices() {
		const candidates = [heroGameIndex, focusedIndex];
		const immediateIndices: number[] = [];

		for (
			let offset = -HERO_WARMUP_NEIGHBOR_DISTANCE;
			offset <= HERO_WARMUP_NEIGHBOR_DISTANCE;
			offset += 1
		) {
			candidates.push(focusedIndex + offset);
		}

		for (const candidate of candidates) {
			if (candidate < 0 || candidate >= games.length) continue;
			if (immediateIndices.includes(candidate)) continue;
			immediateIndices.push(candidate);
		}

		return immediateIndices;
	}

	$effect(() => {
		const immediateIndices = getWarmHeroIndices();
		for (const index of immediateIndices) {
			void preloadHero(games[index]?.hero);
		}

		const timeout = window.setTimeout(() => {
			for (const [index, game] of games.entries()) {
				if (immediateIndices.includes(index)) continue;
				void preloadHero(game.hero);
			}
		}, HERO_IDLE_WARMUP_DELAY_MS);

		return () => {
			window.clearTimeout(timeout);
		};
	});

	$effect(() => {
		if (focusedIndex === heroGameIndex) return;

		const nextGameIndex = focusedIndex;
		const nextDirection = Math.sign(nextGameIndex - heroGameIndex) || heroDirection;
		let animationFrame = 0;
		let cancelled = false;
		const timeout = window.setTimeout(async () => {
			await preloadHero(games[nextGameIndex]?.hero);
			if (cancelled) return;
			animationFrame = window.requestAnimationFrame(() => {
				if (cancelled) return;
				heroDirection = nextDirection;
				heroGameIndex = nextGameIndex;
			});
		}, HERO_SETTLE_DELAY_MS);

		return () => {
			cancelled = true;
			window.clearTimeout(timeout);
			window.cancelAnimationFrame(animationFrame);
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
		<div class="game-hero-layer absolute inset-0" in:heroIn out:heroOut>
			<img
				src={heroGame.hero}
				alt=""
				class="game-hero-image size-full object-cover"
				decoding="async"
				draggable="false"
			/>
		</div>
	{/key}
{/if}

<div class="hero-legibility-gradient pointer-events-none absolute inset-0"></div>

<style>
	.game-hero-layer {
		contain: paint;
		backface-visibility: hidden;
		transform: translate3d(0, 0, 0);
		will-change: transform, opacity;
	}

	.game-hero-image {
		backface-visibility: hidden;
		transform: translate3d(0, 0, 0);
		will-change: transform, opacity;
	}

	.hero-legibility-gradient {
		background: linear-gradient(
			to right,
			hsla(0, 0%, 0%, 0.41) 0%,
			hsla(0, 0%, 0%, 0.405) 0.5%,
			hsla(0, 0%, 0%, 0.39) 1.8%,
			hsla(0, 0%, 0%, 0.367) 4.1%,
			hsla(0, 0%, 0%, 0.338) 7.2%,
			hsla(0, 0%, 0%, 0.304) 11.3%,
			hsla(0, 0%, 0%, 0.266) 16.2%,
			hsla(0, 0%, 0%, 0.225) 22%,
			hsla(0, 0%, 0%, 0.185) 28.7%,
			hsla(0, 0%, 0%, 0.144) 36.3%,
			hsla(0, 0%, 0%, 0.106) 44.7%,
			hsla(0, 0%, 0%, 0.072) 54.1%,
			hsla(0, 0%, 0%, 0.043) 64.3%,
			hsla(0, 0%, 0%, 0.02) 75.3%,
			hsla(0, 0%, 0%, 0.005) 87.2%,
			hsla(0, 0%, 0%, 0) 100%
		);
	}
</style>
