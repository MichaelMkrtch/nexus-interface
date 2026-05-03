<script lang="ts">
	import CardCarousel from '$components/home/CardCarousel.svelte';
	import GameHero from '$components/home/GameHero.svelte';
	import Header from '$components/home/Header.svelte';
	import { mockGames } from '$lib/features/games/mock-games';

	let focusedGameIndex = $state(0);

	function focusGame(index: number) {
		focusedGameIndex = Math.max(0, Math.min(index, mockGames.length - 1));
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			focusGame(focusedGameIndex - 1);
		}

		if (event.key === 'ArrowRight') {
			event.preventDefault();
			focusGame(focusedGameIndex + 1);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<main class="relative size-full overflow-hidden">
	<GameHero games={mockGames} focusedIndex={focusedGameIndex} />

	<Header />

	<!-- Fullscreen UI -->
	<div class="relative w-full overflow-hidden">
		<CardCarousel games={mockGames} current={focusedGameIndex} />
	</div>
</main>
