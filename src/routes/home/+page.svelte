<script lang="ts">
	import { onMount } from 'svelte';

	import CoverActionMenu from '$components/home/CoverActionMenu.svelte';
	import CoverArtPicker from '$components/home/CoverArtPicker.svelte';
	import GameHero from '$components/home/GameHero.svelte';
	import Header from '$components/home/Header.svelte';
	import HomeRail from '$components/home/HomeRail.svelte';
	import IconActionButton from '$components/home/IconActionButton.svelte';
	import PlayButton from '$components/home/PlayButton.svelte';
	import {
		pickLocalImageArtworkOverride,
		setSteamGridDbArtworkOverride,
		type ArtworkOverrideKind,
		type SetArtworkOverrideResult,
		type SteamGridDbArtworkOption
	} from '$lib/features/games/artwork';
	import {
		launchHomeGame,
		loadHomeGames,
		type LibraryScanProgressRecord
	} from '$lib/features/games/library';
	import type { Game } from '$lib/features/games/types';
	import { createHomeInputHandler } from '$lib/features/home/home-input';
	import { createHomeNavigation, HOME_SECTIONS } from '$lib/features/home/home-navigation.svelte';
	import { createKeyboardInputAdapter } from '$lib/input/adapters/keyboard';
	import { createWebGamepadInputAdapter } from '$lib/input/adapters/web-gamepad';
	import { INPUT_ACTIONS, type InputEvent } from '$lib/input/contracts';
	import { createInputSurfaceStack } from '$lib/input/focus-stack';
	import { createInputRuntime } from '$lib/input/runtime';

	type LibraryState = 'loading' | 'ready' | 'empty' | 'error';

	let games = $state<Game[]>([]);
	let libraryState = $state<LibraryState>('loading');
	let libraryError = $state('');
	let launchError = $state('');
	let libraryProgress = $state<LibraryScanProgressRecord | null>(null);
	let isLibraryLoadSlow = $state(false);
	let isCoverActionMenuOpen = $state(false);
	let focusedCoverActionMenuOptionIndex = $state(0);
	let isCoverPickerOpen = $state(false);
	let coverPicker = $state<{ handleInput: (event: InputEvent) => boolean }>();

	const ACTION_INDEX = {
		play: 0,
		coverOptions: 1
	} as const;
	const COVER_ACTION_MENU_INDEX = {
		updateCover: 0,
		updateBackground: 1
	} as const;
	const COVER_ACTION_MENU_OPTION_COUNT = 2;

	async function handlePlayGame() {
		const activeGame = games[navigation.focusedGameIndex];
		if (!activeGame?.launchable) return;

		launchError = '';
		const result = await launchHomeGame(activeGame.id);
		if (!result.ok) {
			launchError = result.error;
		}
	}

	function handlePlayButtonPress() {
		launchError = '';
		navigation.focusAction(ACTION_INDEX.play);
	}

	function handleCoverOptionsPress() {
		launchError = '';
		navigation.focusAction(ACTION_INDEX.coverOptions);
	}

	function openCoverActionMenu() {
		launchError = '';
		navigation.focusAction(ACTION_INDEX.coverOptions);
		focusedCoverActionMenuOptionIndex = COVER_ACTION_MENU_INDEX.updateCover;
		isCoverActionMenuOpen = true;
		inputSurfaceStack.push({
			id: 'cover-action-menu',
			handleInput: handleCoverActionMenuInput
		});
	}

	function closeCoverActionMenu() {
		isCoverActionMenuOpen = false;
		inputSurfaceStack.remove('cover-action-menu');
		navigation.focusAction(ACTION_INDEX.coverOptions);
	}

	function openCoverPicker() {
		launchError = '';
		if (isCoverActionMenuOpen) {
			closeCoverActionMenu();
		}
		isCoverPickerOpen = true;
		inputSurfaceStack.push({
			id: 'cover-picker',
			handleInput: handleCoverPickerInput,
			shouldRepeatInput: shouldRepeatCoverPickerInput
		});
	}

	function closeCoverPicker() {
		isCoverPickerOpen = false;
		coverPicker = undefined;
		inputSurfaceStack.remove('cover-picker');
	}

	async function handleCoverSelect(option: SteamGridDbArtworkOption) {
		const activeGame = games[navigation.focusedGameIndex];
		if (!activeGame) return;

		const result = await setSteamGridDbArtworkOverride({
			gameId: activeGame.id,
			kind: 'cover',
			imageUrl: option.url,
			imageId: option.id,
			originalFileName: getArtworkFileName(option.url)
		});
		if (!applyArtworkOverrideResult(result)) return;

		closeCoverPicker();
	}

	async function handleCoverUpload() {
		const result = await pickLocalOverrideForActiveGame('cover');
		if (!result?.ok) return;

		closeCoverPicker();
	}

	async function handleBackgroundUpload() {
		const result = await pickLocalOverrideForActiveGame('background');
		if (!result?.ok) return;

		closeCoverActionMenu();
	}

	async function pickLocalOverrideForActiveGame(kind: ArtworkOverrideKind) {
		const activeGame = games[navigation.focusedGameIndex];
		if (!activeGame) return;

		const result = await pickLocalImageArtworkOverride(activeGame.id, kind);
		applyArtworkOverrideResult(result);
		return result;
	}

	function applyArtworkOverrideResult(result: SetArtworkOverrideResult) {
		if (!result.ok) {
			if (result.reason !== 'cancelled') {
				launchError = result.error;
			}
			return false;
		}

		const { gameId, kind, imageUrl } = result.override;
		games = games.map((game) => {
			if (game.id !== gameId) return game;

			if (kind === 'cover') {
				return { ...game, cover: imageUrl };
			}

			return { ...game, hero: imageUrl };
		});
		launchError = '';
		return true;
	}

	function handleGameCardPress(index: number) {
		launchError = '';
		navigation.focusGame(index);
	}

	const navigation = createHomeNavigation({
		gameCount: () => games.length,
		actionCount: 2,
		onConfirmAction: (actionIndex) => {
			if (actionIndex === ACTION_INDEX.play) {
				void handlePlayGame();
			} else if (actionIndex === ACTION_INDEX.coverOptions) {
				openCoverActionMenu();
			}
		}
	});
	const handleHomeInput = createHomeInputHandler({ navigation });
	const inputSurfaceStack = createInputSurfaceStack({
		id: 'home',
		handleInput: handleHomeSurfaceInput,
		shouldRepeatInput: shouldRepeatHomeInput
	});
	const inputRuntime = createInputRuntime({
		adapters: [createKeyboardInputAdapter(), createWebGamepadInputAdapter()]
	});

	function handleHomeSurfaceInput(event: InputEvent) {
		if (event.action === INPUT_ACTIONS.cancel) {
			if (navigation.activeSection === HOME_SECTIONS.actions) {
				launchError = '';
				navigation.focusGame(navigation.focusedGameIndex);
			}
			return;
		}

		if (launchError && event.action !== INPUT_ACTIONS.confirm) {
			launchError = '';
		}

		handleHomeInput(event);
	}

	function handleCoverPickerInput(event: InputEvent) {
		if (coverPicker?.handleInput(event)) return;

		if (event.action === INPUT_ACTIONS.cancel) {
			closeCoverPicker();
		}
	}

	function handleCoverActionMenuInput(event: InputEvent) {
		if (event.action === INPUT_ACTIONS.cancel) {
			closeCoverActionMenu();
			return;
		}

		if (event.action === INPUT_ACTIONS.moveUp) {
			moveCoverActionMenuFocus(-1);
			return;
		}

		if (event.action === INPUT_ACTIONS.moveDown) {
			moveCoverActionMenuFocus(1);
			return;
		}

		if (event.action === INPUT_ACTIONS.confirm) {
			if (focusedCoverActionMenuOptionIndex === COVER_ACTION_MENU_INDEX.updateCover) {
				openCoverPicker();
			} else if (focusedCoverActionMenuOptionIndex === COVER_ACTION_MENU_INDEX.updateBackground) {
				void handleBackgroundUpload();
			}
		}
	}

	function moveCoverActionMenuFocus(delta: number) {
		focusedCoverActionMenuOptionIndex = Math.max(
			0,
			Math.min(focusedCoverActionMenuOptionIndex + delta, COVER_ACTION_MENU_OPTION_COUNT - 1)
		);
	}

	function shouldRepeatHomeInput(event: InputEvent) {
		return (
			navigation.activeSection === HOME_SECTIONS.carousel &&
			(event.action === INPUT_ACTIONS.moveLeft || event.action === INPUT_ACTIONS.moveRight)
		);
	}

	function shouldRepeatCoverPickerInput() {
		return true;
	}

	function dispatchHomeInput(event: InputEvent) {
		inputSurfaceStack.dispatch(event);
	}

	$effect(() => {
		return inputRuntime.subscribe(dispatchHomeInput);
	});

	onMount(() => {
		void loadGames();
	});

	async function loadGames() {
		libraryState = 'loading';
		libraryError = '';
		launchError = '';
		libraryProgress = null;
		isLibraryLoadSlow = false;
		const slowLoadTimer = window.setTimeout(() => {
			isLibraryLoadSlow = true;
		}, 6000);

		try {
			const nextGames = await loadHomeGames({
				onScanProgress(progress) {
					libraryProgress = progress;
				}
			});
			games = nextGames;
			libraryState = nextGames.length > 0 ? 'ready' : 'empty';
		} catch (error) {
			libraryState = 'error';
			libraryError =
				error instanceof Error ? error.message : 'Failed to load the local game library.';
		} finally {
			window.clearTimeout(slowLoadTimer);
		}
	}

	function getLibraryLoadingCopy() {
		return (
			libraryProgress?.message ?? 'Inspecting local launcher data and installed game locations.'
		);
	}

	function getLibraryLoadingMeta() {
		if (
			!libraryProgress ||
			libraryProgress.current === undefined ||
			libraryProgress.total === undefined
		) {
			return '';
		}

		if (libraryProgress.total === 0) {
			return 'No entries discovered in this step yet.';
		}

		return `${libraryProgress.current} of ${libraryProgress.total}`;
	}

	function getArtworkFileName(url: string) {
		try {
			return new URL(url).pathname.split('/').filter(Boolean).at(-1);
		} catch {
			return undefined;
		}
	}
</script>

<main class="relative size-full overflow-hidden">
	{#if games.length > 0}
		<GameHero {games} focusedIndex={navigation.focusedGameIndex} />
	{/if}

	<div class="home-overview">
		<div
			class={[
				'home-overview-header',
				navigation.activeSection === HOME_SECTIONS.actions && 'is-hidden-in-detail'
			]}
		>
			<Header />
		</div>

		{#if libraryState === 'ready'}
			<div class="home-overview-rail">
				<HomeRail
					{games}
					focusedIndex={navigation.focusedGameIndex}
					activeSection={navigation.activeSection}
					onCardPress={handleGameCardPress}
				/>
			</div>

			<section class="home-actions">
				<PlayButton
					label={games[navigation.focusedGameIndex]?.launchable ? 'Play Game' : 'Unavailable'}
					isFocused={navigation.activeSection === HOME_SECTIONS.actions &&
						navigation.focusedActionIndex === ACTION_INDEX.play}
					onPress={handlePlayButtonPress}
					onConfirm={handlePlayGame}
				/>
				<div class="home-cover-action">
					<IconActionButton
						label="Game cover options"
						isFocused={navigation.activeSection === HOME_SECTIONS.actions &&
							navigation.focusedActionIndex === ACTION_INDEX.coverOptions}
						onPress={handleCoverOptionsPress}
						onConfirm={openCoverActionMenu}
					/>

					{#if isCoverActionMenuOpen}
						<CoverActionMenu
							focusedOptionIndex={focusedCoverActionMenuOptionIndex}
							onUpdateCover={openCoverPicker}
							onUpdateBackground={handleBackgroundUpload}
						/>
					{/if}
				</div>
			</section>

			{#if isCoverPickerOpen && games[navigation.focusedGameIndex]}
				<CoverArtPicker
					bind:this={coverPicker}
					game={games[navigation.focusedGameIndex]}
					onClose={closeCoverPicker}
					onSelect={handleCoverSelect}
					onUploadLocal={handleCoverUpload}
				/>
			{/if}

			{#if launchError}
				<p class="home-launch-error" role="alert" aria-live="assertive">{launchError}</p>
			{/if}
		{:else}
			<section class="home-library-state">
				<h2 class="home-library-state-title">
					{libraryState === 'loading'
						? 'Loading your local library'
						: libraryState === 'empty'
							? 'No local games found'
							: 'Library unavailable'}
				</h2>
				<p class="home-library-state-copy">
					{libraryState === 'loading'
						? getLibraryLoadingCopy()
						: libraryState === 'empty'
							? 'No installed games were discovered yet. Steam local discovery is the first source wired into the shell.'
							: libraryError}
				</p>

				{#if libraryState === 'loading' && getLibraryLoadingMeta()}
					<p class="home-library-state-meta">{getLibraryLoadingMeta()}</p>
				{/if}

				{#if libraryState === 'loading' && isLibraryLoadSlow}
					<p class="home-library-state-hint">
						This is taking longer than usual. Large libraries can take extra time while the shell
						inspects manifests and executable paths.
					</p>
				{/if}
			</section>
		{/if}
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
		--home-action-gap: 1rem;

		position: absolute;
		left: 11rem;
		bottom: 11rem;
		z-index: 30;
		display: flex;
		align-items: center;
		gap: var(--home-action-gap);
	}

	.home-cover-action {
		--cover-action-menu-top: 5px;
		--cover-action-menu-gap: var(--home-action-gap);
		--cover-action-menu-inline-offset: 5px;

		position: relative;
	}

	.home-library-state {
		position: absolute;
		top: 50%;
		left: 50%;
		max-width: 34rem;
		padding: 2rem 2.5rem;
		border: 1px solid rgb(255 255 255 / 0.08);
		border-radius: 2rem;
		background:
			linear-gradient(145deg, rgb(255 255 255 / 0.08), rgb(255 255 255 / 0.02)), rgb(0 0 0 / 0.35);
		backdrop-filter: blur(18px);
		transform: translate3d(-50%, -50%, 0);
		text-align: center;
	}

	.home-library-state-title {
		font-size: 2rem;
		font-weight: 700;
		line-height: 1.1;
	}

	.home-library-state-copy {
		margin-top: 0.75rem;
		color: rgb(255 255 255 / 0.72);
		font-size: 1rem;
		line-height: 1.6;
	}

	.home-library-state-meta {
		margin-top: 1rem;
		color: rgb(255 255 255 / 0.56);
		font-size: 0.9rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.home-library-state-hint {
		margin-top: 1rem;
		color: rgb(255 255 255 / 0.62);
		font-size: 0.95rem;
		line-height: 1.55;
	}

	.home-launch-error {
		position: absolute;
		left: 11rem;
		bottom: 7.5rem;
		max-width: 28rem;
		color: rgb(255 205 205 / 0.92);
		font-size: 0.95rem;
		line-height: 1.5;
		text-shadow: 0 0.05rem 0.8rem rgb(0 0 0 / 0.35);
		z-index: 30;
	}
</style>
