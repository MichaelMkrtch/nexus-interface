<script lang="ts">
	import { onMount } from 'svelte';
	import X from '@lucide/svelte/icons/x';

	import {
		listSquareGridArtworkOptions,
		type SteamGridDbArtworkOption
	} from '$lib/features/games/artwork';
	import type { Game } from '$lib/features/games/types';
	import { INPUT_ACTIONS, INPUT_PHASES, type InputEvent } from '$lib/input/contracts';

	interface CoverArtPickerProps {
		game: Game;
		onSelect?: (url: string) => void;
		onClose?: () => void;
	}

	type PickerState = 'loading' | 'ready' | 'empty' | 'error';

	const coverPreloadCache: Record<string, Promise<void> | undefined> = Object.create(null);

	let { game, onSelect, onClose }: CoverArtPickerProps = $props();
	let pickerState = $state<PickerState>('loading');
	let options = $state<SteamGridDbArtworkOption[]>([]);
	let error = $state('');
	let focusedOptionIndex = $state(0);
	let isSelecting = $state(false);
	let gridElement: HTMLDivElement | undefined = $state();
	let isMounted = false;
	let selectRequestId = 0;

	onMount(() => {
		isMounted = true;
		void loadOptions();

		return () => {
			isMounted = false;
			selectRequestId += 1;
		};
	});

	async function loadOptions() {
		pickerState = 'loading';
		error = '';
		options = [];

		const result = await listSquareGridArtworkOptions(game.id);
		if (!result.ok) {
			pickerState = 'error';
			error = result.error;
			return;
		}

		options = result.options;
		focusedOptionIndex = 0;
		pickerState = options.length > 0 ? 'ready' : 'empty';
	}

	async function handleSelect(option: SteamGridDbArtworkOption) {
		if (isSelecting) return;

		const requestId = selectRequestId + 1;
		selectRequestId = requestId;
		isSelecting = true;
		try {
			await preloadCover(option.url);
			if (!isMounted || requestId !== selectRequestId) return;

			onSelect?.(option.url);
		} finally {
			if (isMounted && requestId === selectRequestId) {
				isSelecting = false;
			}
		}
	}

	export function handleInput(event: InputEvent) {
		if (event.phase === INPUT_PHASES.release) return true;

		if (event.action === INPUT_ACTIONS.cancel) {
			selectRequestId += 1;
			onClose?.();
			return true;
		}

		if (isSelecting) return true;

		if (pickerState !== 'ready' || options.length === 0) return true;

		if (event.action === INPUT_ACTIONS.confirm) {
			const selectedOption = options[focusedOptionIndex];
			if (selectedOption) handleSelect(selectedOption);
			return true;
		}

		if (event.action === INPUT_ACTIONS.moveLeft) {
			moveFocus(-1);
			return true;
		}

		if (event.action === INPUT_ACTIONS.moveRight) {
			moveFocus(1);
			return true;
		}

		if (event.action === INPUT_ACTIONS.moveUp) {
			moveFocus(-getGridColumnCount());
			return true;
		}

		if (event.action === INPUT_ACTIONS.moveDown) {
			moveFocus(getGridColumnCount());
			return true;
		}

		return true;
	}

	function moveFocus(delta: number) {
		focusedOptionIndex = clampOptionIndex(focusedOptionIndex + delta);
	}

	function clampOptionIndex(index: number) {
		return Math.max(0, Math.min(index, options.length - 1));
	}

	function getGridColumnCount() {
		if (!gridElement) return 4;

		const columnTemplate = window.getComputedStyle(gridElement).gridTemplateColumns;
		const columnCount = columnTemplate.split(' ').filter(Boolean).length;
		return Math.max(1, columnCount || 4);
	}

	$effect(() => {
		if (pickerState !== 'ready') return;

		const optionIndex = focusedOptionIndex;
		const animationFrame = window.requestAnimationFrame(() => {
			const buttons = gridElement?.querySelectorAll<HTMLButtonElement>('.cover-picker-option');
			buttons?.[optionIndex]?.focus({ preventScroll: true });
		});

		return () => {
			window.cancelAnimationFrame(animationFrame);
		};
	});

	$effect(() => {
		if (pickerState !== 'ready') return;

		for (const index of getWarmOptionIndices(focusedOptionIndex)) {
			void preloadCover(options[index]?.url);
		}
	});

	function getWarmOptionIndices(index: number) {
		return [index, index + 1, index - 1].filter(
			(candidate) => candidate >= 0 && candidate < options.length
		);
	}

	function preloadCover(src: string | undefined) {
		if (!src) return Promise.resolve();

		const cachedPreload = coverPreloadCache[src];
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

			resolve();
		});

		coverPreloadCache[src] = preload;
		return preload;
	}
</script>

<div
	class="cover-picker-screen"
	role="dialog"
	aria-modal="true"
	aria-labelledby="cover-picker-title"
>
	<div class="cover-picker-header">
		<div>
			<p class="cover-picker-kicker">SteamGridDB</p>
			<h2 id="cover-picker-title" class="cover-picker-title">{game.title}</h2>
		</div>

		<button
			class="cover-picker-close"
			type="button"
			aria-label="Close cover picker"
			onclick={onClose}
		>
			<X aria-hidden="true" />
		</button>
	</div>

	{#if pickerState === 'loading'}
		<div class="cover-picker-state" aria-live="polite">Loading cover options.</div>
	{:else if pickerState === 'error'}
		<div class="cover-picker-state" role="alert">{error}</div>
	{:else if pickerState === 'empty'}
		<div class="cover-picker-state">No covers found.</div>
	{:else}
		<div class="cover-picker-grid" bind:this={gridElement}>
			{#each options as option, index (option.id)}
				<button
					class={['cover-picker-option', focusedOptionIndex === index && 'is-focused']}
					type="button"
					aria-label={`Use cover option ${index + 1} for ${game.title}`}
					aria-current={focusedOptionIndex === index ? 'true' : undefined}
					disabled={isSelecting}
					onclick={() => handleSelect(option)}
				>
					<img
						src={option.thumbnailUrl ?? option.url}
						alt={`Cover option ${index + 1} for ${game.title}`}
						class="cover-picker-image"
						loading="lazy"
						decoding="async"
						draggable="false"
					/>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.cover-picker-screen {
		position: absolute;
		inset: 0;
		z-index: 80;
		display: flex;
		flex-direction: column;
		gap: 2.25rem;
		padding: 5rem 6rem;
		background: linear-gradient(90deg, rgb(0 0 0 / 0.82), rgb(0 0 0 / 0.52)), rgb(8 10 14 / 0.9);
		backdrop-filter: blur(26px);
		animation: cover-picker-enter 180ms ease-out both;
	}

	.cover-picker-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 2rem;
	}

	.cover-picker-kicker {
		color: rgb(255 255 255 / 0.58);
		font-size: 0.9rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.cover-picker-title {
		margin-top: 0.35rem;
		color: white;
		font-size: 3.25rem;
		font-weight: 800;
		line-height: 1;
	}

	.cover-picker-close {
		display: grid;
		width: 3.5rem;
		height: 3.5rem;
		place-items: center;
		border-radius: 9999px;
		background: rgb(255 255 255 / 0.12);
		color: white;
	}

	.cover-picker-close :global(svg) {
		width: 1.6rem;
		height: 1.6rem;
	}

	.cover-picker-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
		gap: 1.15rem;
		overflow: auto;
		padding: 0.25rem 0.25rem 2rem;
		scrollbar-width: thin;
	}

	.cover-picker-option {
		aspect-ratio: 1;
		overflow: hidden;
		border: 2px solid rgb(255 255 255 / 0.1);
		border-radius: 0.65rem;
		background: rgb(255 255 255 / 0.08);
		transition:
			border-color 130ms ease,
			transform 130ms ease;
	}

	.cover-picker-option:disabled {
		cursor: default;
	}

	.cover-picker-option:focus-visible {
		outline: 3px solid rgb(255 255 255 / 0.9);
		outline-offset: 4px;
	}

	.cover-picker-option.is-focused {
		border-color: rgb(255 255 255 / 0.82);
		box-shadow: 0 0 0 4px rgb(255 255 255 / 0.16);
		transform: translate3d(0, -0.16rem, 0);
	}

	.cover-picker-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.cover-picker-state {
		display: grid;
		min-height: 16rem;
		place-items: center;
		color: rgb(255 255 255 / 0.72);
		font-size: 1.2rem;
	}

	@keyframes cover-picker-enter {
		from {
			opacity: 0;
		}

		to {
			opacity: 1;
		}
	}
</style>
