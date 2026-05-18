<script lang="ts">
	import GameHero from '$components/home/GameHero.svelte';
	import Header from '$components/home/Header.svelte';
	import HomeRail from '$components/home/HomeRail.svelte';
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

	<div class="home-overview">
		<div
			class={[
				'home-overview-header',
				navigation.activeSection === HOME_SECTIONS.actions && 'is-hidden-in-detail'
			]}
		>
			<Header />
		</div>

		<div class="home-overview-rail">
			<HomeRail
				games={mockGames}
				focusedIndex={navigation.focusedGameIndex}
				activeSection={navigation.activeSection}
				onCardPress={navigation.focusGame}
			/>
		</div>

		<section class="home-actions">
			<PlayButton
				isFocused={navigation.activeSection === HOME_SECTIONS.actions &&
					navigation.focusedActionIndex === 0}
				onPress={handlePlayButtonPress}
				onConfirm={handlePlayGame}
			/>
		</section>
	</div>
</main>

<style>
	.home-overview {
		--home-header-space: 6rem;

		position: relative;
		width: 100%;
		height: 100%;
		padding-top: var(--home-header-space);
		overflow: hidden;
	}

	.home-overview-header {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 20;
		pointer-events: none;
		transition:
			transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
			opacity 220ms ease;
		transform: translate3d(0, 0, 0);
		will-change: transform, opacity;
	}

	.home-overview-header.is-hidden-in-detail {
		opacity: 0;
		transform: translate3d(0, -9rem, 0);
	}

	.home-overview-rail {
		position: relative;
		z-index: 10;
	}

	.home-actions {
		position: absolute;
		left: 11rem;
		bottom: 11rem;
		z-index: 30;
	}
</style>
