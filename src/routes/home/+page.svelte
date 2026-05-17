<script lang="ts">
	import CardCarousel from '$components/home/CardCarousel.svelte';
	import GameHero from '$components/home/GameHero.svelte';
	import Header from '$components/home/Header.svelte';
	import PlayButton from '$components/home/PlayButton.svelte';
	import { mockGames } from '$lib/features/games/mock-games';
	import { createHomeInputHandler } from '$lib/features/home/home-input';
	import { createHomeNavigation, HOME_SECTIONS } from '$lib/features/home/home-navigation.svelte';
	import { createKeyboardInputAdapter } from '$lib/input/adapters/keyboard';
	import { createWebGamepadInputAdapter } from '$lib/input/adapters/web-gamepad';
	import { createInputRuntime } from '$lib/input/runtime';

	function handlePlayGame() {
		// Launch wiring is not implemented yet.
	}

	function handlePlayButtonPress() {
		navigation.focusAction(0);
	}

	const navigation = createHomeNavigation({
		gameCount: mockGames.length,
		onConfirmAction: (actionIndex) => {
			if (actionIndex === 0) {
				handlePlayGame();
			}
		}
	});
	const handleHomeInput = createHomeInputHandler({ navigation });
	const inputRuntime = createInputRuntime({
		adapters: [createKeyboardInputAdapter(), createWebGamepadInputAdapter()]
	});

	$effect(() => {
		return inputRuntime.subscribe(handleHomeInput);
	});
</script>

<main class="relative size-full overflow-hidden">
	<GameHero games={mockGames} focusedIndex={navigation.focusedGameIndex} />

	<Header />

	<!-- Fullscreen UI -->
	<div class="w-full overflow-hidden">
		<CardCarousel
			games={mockGames}
			focusedIndex={navigation.focusedGameIndex}
			activeSection={navigation.activeSection}
			onCardPress={navigation.focusGame}
		/>

		<section class="absolute bottom-44 ml-44">
			<PlayButton
				isFocused={navigation.activeSection === HOME_SECTIONS.actions &&
					navigation.focusedActionIndex === 0}
				onPress={handlePlayButtonPress}
				onConfirm={handlePlayGame}
			/>
		</section>
	</div>
</main>
