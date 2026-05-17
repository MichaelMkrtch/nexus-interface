<script lang="ts">
	import CardCarousel from '$components/home/CardCarousel.svelte';
	import GameHero from '$components/home/GameHero.svelte';
	import Header from '$components/home/Header.svelte';
	import PlayButton from '$components/home/PlayButton.svelte';
	import { mockGames } from '$lib/features/games/mock-games';
	import { createHomeInputHandler } from '$lib/features/home/home-input';
	import { createHomeNavigation } from '$lib/features/home/home-navigation.svelte';
	import { createKeyboardInputAdapter } from '$lib/input/adapters/keyboard';
	import { createWebGamepadInputAdapter } from '$lib/input/adapters/web-gamepad';
	import { createInputRuntime } from '$lib/input/runtime';

	let playButtonRef = $state<HTMLButtonElement | null>(null);

	const navigation = createHomeNavigation({
		gameCount: mockGames.length,
		onFocusCarousel: () => playButtonRef?.blur(),
		onFocusPlay: () => playButtonRef?.focus(),
		onConfirmPlay: () => playButtonRef?.click()
	});
	const handleHomeInput = createHomeInputHandler({ navigation });
	const inputRuntime = createInputRuntime({
		adapters: [createKeyboardInputAdapter(), createWebGamepadInputAdapter()]
	});

	$effect(() => {
		return inputRuntime.subscribe(handleHomeInput);
	});

	$effect(() => {
		const handleFocusIn = (event: FocusEvent) => {
			navigation.syncFocusFromElement(event.target, playButtonRef);
		};

		const handlePointerDown = (event: PointerEvent) => {
			navigation.syncPointerTarget(event.target, playButtonRef);
		};

		window.addEventListener('focusin', handleFocusIn);
		window.addEventListener('pointerdown', handlePointerDown);

		return () => {
			window.removeEventListener('focusin', handleFocusIn);
			window.removeEventListener('pointerdown', handlePointerDown);
		};
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
			focusArea={navigation.focusArea}
		/>

		<section class="absolute bottom-44 ml-44">
			<PlayButton bind:ref={playButtonRef} />
		</section>
	</div>
</main>
