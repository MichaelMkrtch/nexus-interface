<script lang="ts">
	import type { Game } from '$lib/features/games/types';
	import type { HomeSection } from '$lib/features/home/home-navigation.svelte';

	import { untrack } from 'svelte';

	import { HOME_SECTIONS } from '$lib/features/home/home-navigation.svelte';

	import Card from './Card.svelte';

	const CAROUSEL_INSET_REM = 11;
	const ACTIONS_INSET_REM = 5;
	const CARD_SIZE_REM = 11;
	const COMPACT_ADVANCE_REM = 7.15;
	const ACTIVE_GAP_BOOST_REM = 2.3;
	const TITLE_OFFSET_REM = 1;
	const TITLE_DEFAULT_TOP_REM = 8.5;
	const TITLE_DETAIL_TOP_REM = 2.25;
	const SCALE_LEAD_MS = 90;
	const TITLE_ENTER_MS = 200;
	const TITLE_ENTER_OFFSET_REM = 0.35;

	interface HomeRailProps {
		games: Game[];
		focusedIndex: number;
		activeSection: HomeSection;
		onCardPress?: (index: number) => void;
	}

	let { games, focusedIndex, activeSection, onCardPress }: HomeRailProps = $props();

	let displayedTitleIndex = $state(untrack(() => focusedIndex));
	let highlightedIndex = $state(untrack(() => focusedIndex));
	let highlightedSection = $state(untrack(() => activeSection));
	let isTitleVisible = $state(true);
	let lastHandledIndex = untrack(() => focusedIndex);
	let lastHandledSection = untrack(() => activeSection);

	function getSectionInsetRem(section: HomeSection) {
		return section === HOME_SECTIONS.actions ? ACTIONS_INSET_REM : CAROUSEL_INSET_REM;
	}

	function getTitleLeftRem(section: HomeSection) {
		return getSectionInsetRem(section) + CARD_SIZE_REM + TITLE_OFFSET_REM;
	}

	function getTitleTopRem(section: HomeSection) {
		return section === HOME_SECTIONS.actions ? TITLE_DETAIL_TOP_REM : TITLE_DEFAULT_TOP_REM;
	}

	function getCardOffsetRem(index: number) {
		const distanceFromSelected = index - focusedIndex;
		if (distanceFromSelected === 0) return 0;

		const direction = Math.sign(distanceFromSelected);
		const compactOffset = distanceFromSelected * COMPACT_ADVANCE_REM;

		return compactOffset + direction * ACTIVE_GAP_BOOST_REM;
	}

	$effect(() => {
		const indexChanged = focusedIndex !== lastHandledIndex;
		const sectionChanged = activeSection !== lastHandledSection;
		if (!indexChanged && !sectionChanged) return;

		lastHandledIndex = focusedIndex;
		lastHandledSection = activeSection;
		isTitleVisible = false;
		displayedTitleIndex = focusedIndex;
		highlightedIndex = -1;
		highlightedSection = activeSection;

		const timeout = window.setTimeout(() => {
			highlightedIndex = focusedIndex;
			isTitleVisible = true;
		}, SCALE_LEAD_MS);

		return () => {
			window.clearTimeout(timeout);
		};
	});
</script>

<div
	class="home-rail"
	style:--home-rail-title-enter={`${TITLE_ENTER_MS}ms`}
	style:--home-rail-title-enter-offset={`${TITLE_ENTER_OFFSET_REM}rem`}
>
	<div class="home-rail-viewport" data-section={activeSection}>
		<div
			class="home-rail-stage"
			style:transform={`translate3d(${getSectionInsetRem(activeSection)}rem, 0, 0)`}
		>
			{#each games as game, index (game.id)}
				{@const isSelected = focusedIndex === index}
				{@const isHighlighted = highlightedIndex === index}
				{@const isCarouselFocused = highlightedSection === HOME_SECTIONS.carousel}
				{@const isActionFocused = activeSection === HOME_SECTIONS.actions}
				{@const isHiddenInDetail = !isSelected && isActionFocused}
				<div
					class={[
						'home-rail-item',
						isSelected && 'is-selected',
						isHighlighted && 'is-highlighted',
						isHiddenInDetail && 'is-hidden-in-detail'
					]}
					style:--home-rail-x={`${getCardOffsetRem(index)}rem`}
					style:--home-rail-y={isHiddenInDetail ? '-9rem' : '0rem'}
					data-selected-card={isSelected}
				>
					<Card
						{index}
						{game}
						isActive={isSelected}
						isFocused={isHighlighted && isCarouselFocused}
						align={isActionFocused ? 'start' : 'center'}
						onPress={onCardPress}
					/>
				</div>
			{/each}
		</div>
	</div>

	<div
		class="home-rail-title-shell"
		style:left="0px"
		style:top="0px"
		style:transform={`translate3d(${getTitleLeftRem(activeSection)}rem, ${getTitleTopRem(activeSection)}rem, 0)`}
	>
		{#if isTitleVisible}
			{#key displayedTitleIndex}
				<div class="home-rail-title">
					<h2 class="text-2xl font-semibold text-white">
						{games[displayedTitleIndex]?.title}
					</h2>
				</div>
			{/key}
		{/if}
	</div>
</div>

<style>
	.home-rail {
		position: relative;
		overflow: hidden;
		contain: layout paint;
		isolation: isolate;
	}

	.home-rail-viewport {
		position: relative;
		overflow: hidden;
		padding-top: 0.5rem;
	}

	.home-rail-stage {
		position: relative;
		height: 12rem;
		will-change: transform;
		transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
		transform: translate3d(0, 0, 0);
	}

	.home-rail-item {
		position: absolute;
		inset-inline-start: 0;
		inset-block-start: 0;
		contain: paint;
		backface-visibility: hidden;
		will-change: transform, opacity;
		transition:
			transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
			opacity 220ms ease;
		transform: translate3d(var(--home-rail-x), var(--home-rail-y), 0);
		z-index: 1;
	}

	.home-rail-item.is-selected {
		z-index: 3;
	}

	.home-rail-item.is-hidden-in-detail {
		pointer-events: none;
		opacity: 0;
	}

	.home-rail-title-shell {
		position: absolute;
		pointer-events: none;
		will-change: transform;
		transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.home-rail-title {
		animation: home-rail-title-enter var(--home-rail-title-enter) cubic-bezier(0.22, 1, 0.36, 1)
			both;
	}

	@keyframes home-rail-title-enter {
		from {
			opacity: 0;
			transform: translate3d(0, var(--home-rail-title-enter-offset), 0);
		}

		to {
			opacity: 1;
			transform: translate3d(0, 0, 0);
		}
	}
</style>
