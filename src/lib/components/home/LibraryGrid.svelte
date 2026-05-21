<script lang="ts">
	import { onMount } from 'svelte';

	import type { Game } from '$lib/features/games/types';

	import {
		HOME_LIBRARY_GRID_COLUMN_COUNT,
		HOME_LIBRARY_GRID_VISIBLE_ROW_COUNT,
		HOME_RAIL_LIBRARY_TITLE
	} from '$lib/features/home/home-rail';

	import MissingArtwork from './MissingArtwork.svelte';

	interface LibraryGridProps {
		games: Game[];
		focusedIndex: number;
		isGridFocused?: boolean;
		onCardPress?: (index: number) => void;
	}

	let { games, focusedIndex, isGridFocused = true, onCardPress }: LibraryGridProps = $props();
	let gridElement: HTMLDivElement | undefined = $state();
	let measuredRowHeight = $state(0);
	let scrollRowOffset = $state(0);

	const totalRowCount = $derived(Math.ceil(games.length / HOME_LIBRARY_GRID_COLUMN_COUNT));
	const focusedRow = $derived(Math.floor(focusedIndex / HOME_LIBRARY_GRID_COLUMN_COUNT));
	const maxScrollRowOffset = $derived(
		Math.max(0, totalRowCount - HOME_LIBRARY_GRID_VISIBLE_ROW_COUNT)
	);
	const contentTranslateY = $derived(
		`translate3d(0, -${scrollRowOffset * measuredRowHeight}px, 0)`
	);

	$effect(() => {
		if (!isGridFocused) {
			if (scrollRowOffset !== 0) {
				scrollRowOffset = 0;
			}
			return;
		}

		const firstVisibleRow = scrollRowOffset;
		const lastVisibleRow = firstVisibleRow + HOME_LIBRARY_GRID_VISIBLE_ROW_COUNT - 1;
		let nextScrollRowOffset = scrollRowOffset;

		if (focusedRow > lastVisibleRow) {
			nextScrollRowOffset = focusedRow - HOME_LIBRARY_GRID_VISIBLE_ROW_COUNT + 1;
		} else if (focusedRow < firstVisibleRow) {
			nextScrollRowOffset = focusedRow;
		}

		nextScrollRowOffset = Math.max(0, Math.min(nextScrollRowOffset, maxScrollRowOffset));

		if (scrollRowOffset !== nextScrollRowOffset) {
			scrollRowOffset = nextScrollRowOffset;
		}
	});

	function handlePointerDown(index: number) {
		onCardPress?.(index);
	}

	function updateMeasuredRowHeight() {
		if (!gridElement) return;

		const firstCard = gridElement.querySelector<HTMLElement>('[data-library-grid-card-frame]');
		if (!firstCard) return;

		const gridContent = gridElement.querySelector<HTMLElement>('.library-grid-content');
		if (!gridContent) return;

		const { rowGap } = getComputedStyle(gridContent);
		const parsedRowGap = Number.parseFloat(rowGap);
		const nextRowHeight =
			firstCard.getBoundingClientRect().height + (Number.isNaN(parsedRowGap) ? 0 : parsedRowGap);

		if (measuredRowHeight !== nextRowHeight) {
			measuredRowHeight = nextRowHeight;
		}
	}

	onMount(() => {
		updateMeasuredRowHeight();

		if (!gridElement) return;

		if (typeof ResizeObserver === 'undefined') return;

		const resizeObserver = new ResizeObserver(updateMeasuredRowHeight);
		resizeObserver.observe(gridElement);

		return () => resizeObserver.disconnect();
	});
</script>

<div
	bind:this={gridElement}
	class={['library-grid', isGridFocused ? 'is-grid-focused' : 'is-grid-preview']}
	role="grid"
	aria-label={HOME_RAIL_LIBRARY_TITLE}
	style:--library-grid-column-count={HOME_LIBRARY_GRID_COLUMN_COUNT}
	style:--library-grid-visible-row-count={HOME_LIBRARY_GRID_VISIBLE_ROW_COUNT}
	style:--library-grid-scroll-row-offset={scrollRowOffset}
>
	<div class="library-grid-viewport">
		<div class="library-grid-content" style:transform={contentTranslateY}>
			{#each games as game, index (game.id)}
				{@const isFocused = isGridFocused && focusedIndex === index}
				<div
					class={[
						'artwork-card-frame',
						'library-grid-card',
						isFocused && 'is-active',
						isFocused && 'is-focused'
					]}
					role="gridcell"
					style:--library-grid-index={index}
					data-library-grid-card-frame
				>
					{#if isFocused}
						<div class="library-grid-card-border selection-gradient-border"></div>
					{/if}

					<button
						class={[
							'artwork-card-surface',
							'library-grid-card-button',
							isFocused && 'selection-highlight-sweep'
						]}
						type="button"
						tabindex="-1"
						aria-label={game.title}
						data-library-grid-card
						onpointerdown={() => handlePointerDown(index)}
					>
						{#if game.cover}
							<img
								src={game.cover}
								alt={game.title}
								class="library-grid-card-image"
								draggable="false"
							/>
						{:else}
							<MissingArtwork title={game.title} />
						{/if}
					</button>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.library-grid {
		--library-grid-width: min(90vw, 112rem);
		--library-grid-gap: 0.25rem;
		--library-grid-card-size: min(
			20rem,
			calc(
				(
						var(--library-grid-width) -
							((var(--library-grid-column-count) - 1) * var(--library-grid-gap))
					) /
					var(--library-grid-column-count)
			)
		);
		--library-grid-focused-top: 18.25rem;
		--library-grid-preview-top: calc(
			var(--library-grid-focused-top) + var(--library-grid-card-size)
		);
		--library-grid-peek-size: 4.5rem;

		position: absolute;
		top: var(--library-grid-preview-top);
		left: 50%;
		z-index: 25;
		width: var(--library-grid-width);
		animation: library-grid-enter 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
		transform: translate3d(-50%, 0, 0);
		transition: top 180ms cubic-bezier(0.22, 1, 0.36, 1);
		will-change: top;
	}

	.library-grid.is-grid-focused {
		top: var(--library-grid-focused-top);
	}

	.library-grid-viewport {
		height: calc(
			(var(--library-grid-card-size) * var(--library-grid-visible-row-count)) +
				(var(--library-grid-gap) * (var(--library-grid-visible-row-count) - 1)) +
				var(--library-grid-peek-size)
		);
		overflow: hidden;
		contain: layout paint;
	}

	.library-grid-content {
		display: grid;
		grid-template-columns: repeat(var(--library-grid-column-count), var(--library-grid-card-size));
		gap: var(--library-grid-gap);
		justify-content: center;
		transition: transform 160ms cubic-bezier(0.22, 1, 0.36, 1);
		will-change: transform;
	}

	.library-grid-card {
		--artwork-card-size: var(--library-grid-card-size);
		--artwork-card-frame-padding: 5px;
		--artwork-card-border-width: 3px;
		--artwork-card-border-radius: 0;
		--artwork-card-cover-radius: 0;
		--artwork-card-border-reveal-end: 0;
		--artwork-card-inactive-scale: 1;
		--artwork-card-focus-ease: cubic-bezier(0.37, 0, 0.63, 1);

		opacity: 0;
		animation: library-grid-card-enter 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: min(calc(var(--library-grid-index) * 18ms), 180ms);
	}

	.library-grid-card-border {
		z-index: 0;
	}

	.library-grid-card-button {
		background: rgb(255 255 255 / 0.035);
	}

	.library-grid-card-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		user-select: none;
	}

	@keyframes library-grid-enter {
		from {
			opacity: 0;
			transform: translate3d(-50%, 1.25rem, 0);
		}

		to {
			opacity: 1;
			transform: translate3d(-50%, 0, 0);
		}
	}

	@keyframes library-grid-card-enter {
		from {
			opacity: 0;
			transform: translate3d(0, 0.75rem, 0);
		}

		to {
			opacity: 1;
			transform: translate3d(0, 0, 0);
		}
	}
</style>
