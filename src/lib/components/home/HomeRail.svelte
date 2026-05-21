<script lang="ts">
	import type { Game } from '$lib/features/games/types';
	import type { HomeSection } from '$lib/features/home/home-navigation.svelte';

	import { untrack } from 'svelte';

	import { HOME_SECTIONS } from '$lib/features/home/home-navigation.svelte';
	import {
		HOME_RAIL_CARD_SIZE_REM,
		HOME_RAIL_ITEM_LIMIT,
		HOME_RAIL_LIBRARY_TITLE
	} from '$lib/features/home/home-rail';

	import Card from './Card.svelte';
	import LibraryCard from './LibraryCard.svelte';

	const CAROUSEL_INSET_REM = 11;
	const ACTIONS_INSET_REM = 5;
	const TOP_BLEED_REM = 9;
	const CARD_SIZE_REM = HOME_RAIL_CARD_SIZE_REM;
	const RESTING_CARD_SCALE = 0.625;
	const COMPACT_ADVANCE_REM = 8.4;
	const ACTIVE_GAP_BOOST_REM = 2.75;
	const DETAIL_EXIT_LIFT_REM = -17;
	const DETAIL_EXIT_FADE_MS = 160;
	const TITLE_OFFSET_REM = 1;
	const TITLE_DEFAULT_TOP_REM = 10;
	const TITLE_DETAIL_TOP_REM = 3.5;
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

	const visibleGames = $derived(games.slice(0, HOME_RAIL_ITEM_LIMIT));
	const visibleFocusedIndex = $derived(getVisibleFocusedIndex());
	const libraryCardIndex = $derived(visibleGames.length);

	let displayedTitleIndex = $state(untrack(() => getVisibleFocusedIndex()));
	let highlightedIndex = $state(untrack(() => getVisibleFocusedIndex()));
	let highlightedSection = $state(untrack(() => activeSection));
	let isTitleVisible = $state(true);
	let lastHandledIndex = untrack(() => getVisibleFocusedIndex());
	let lastHandledSection = untrack(() => activeSection);

	function getVisibleFocusedIndex() {
		const visibleItemCount = Math.min(games.length, HOME_RAIL_ITEM_LIMIT) + 1;
		if (visibleItemCount <= 0) return 0;

		return Math.max(0, Math.min(focusedIndex, visibleItemCount - 1));
	}

	function getDisplayedTitle() {
		if (displayedTitleIndex === libraryCardIndex) return HOME_RAIL_LIBRARY_TITLE;

		return visibleGames[displayedTitleIndex]?.title;
	}

	function getSectionInsetRem(section: HomeSection) {
		return section === HOME_SECTIONS.carousel ? CAROUSEL_INSET_REM : ACTIONS_INSET_REM;
	}

	function isDetailSection(section: HomeSection) {
		return section !== HOME_SECTIONS.carousel;
	}

	function getTitleLeftRem(section: HomeSection) {
		const anchoredCardWidthRem = isDetailSection(section)
			? CARD_SIZE_REM * RESTING_CARD_SCALE
			: CARD_SIZE_REM;

		return getSectionInsetRem(section) + anchoredCardWidthRem + TITLE_OFFSET_REM;
	}

	function getTitleTopRem(section: HomeSection) {
		const sectionTop = isDetailSection(section) ? TITLE_DETAIL_TOP_REM : TITLE_DEFAULT_TOP_REM;

		return TOP_BLEED_REM + sectionTop;
	}

	function getHiddenCardOffsetCompensationRem(section: HomeSection, index: number) {
		if (!isDetailSection(section) || index === visibleFocusedIndex) return 0;

		return CAROUSEL_INSET_REM - ACTIONS_INSET_REM;
	}

	function getCardOffsetRem(index: number, section: HomeSection) {
		const distanceFromSelected = index - visibleFocusedIndex;
		if (distanceFromSelected === 0) return 0;

		const direction = Math.sign(distanceFromSelected);
		const compactOffset = distanceFromSelected * COMPACT_ADVANCE_REM;

		return (
			compactOffset +
			direction * ACTIVE_GAP_BOOST_REM +
			getHiddenCardOffsetCompensationRem(section, index)
		);
	}

	$effect(() => {
		const indexChanged = visibleFocusedIndex !== lastHandledIndex;
		const sectionChanged = activeSection !== lastHandledSection;
		if (!indexChanged && !sectionChanged) return;

		lastHandledIndex = visibleFocusedIndex;
		lastHandledSection = activeSection;
		isTitleVisible = false;
		displayedTitleIndex = visibleFocusedIndex;
		highlightedIndex = -1;
		highlightedSection = activeSection;

		const timeout = window.setTimeout(() => {
			highlightedIndex = visibleFocusedIndex;
			isTitleVisible = true;
		}, SCALE_LEAD_MS);

		return () => {
			window.clearTimeout(timeout);
		};
	});
</script>

<div
	class="home-rail"
	style:--home-rail-detail-exit-fade={`${DETAIL_EXIT_FADE_MS}ms`}
	style:--home-rail-top-bleed={`${TOP_BLEED_REM}rem`}
	style:--home-rail-title-enter={`${TITLE_ENTER_MS}ms`}
	style:--home-rail-title-enter-offset={`${TITLE_ENTER_OFFSET_REM}rem`}
>
	<div class="home-rail-viewport" data-section={activeSection}>
		<div
			class="home-rail-stage"
			style:transform={`translate3d(${getSectionInsetRem(activeSection)}rem, 0, 0)`}
		>
			{#each visibleGames as game, index (game.id)}
				{@const isSelected = visibleFocusedIndex === index}
				{@const isHighlighted = highlightedIndex === index}
				{@const isCarouselFocused = highlightedSection === HOME_SECTIONS.carousel}
				{@const isDetailFocused = isDetailSection(activeSection)}
				{@const isHiddenInDetail = !isSelected && isDetailFocused}
				<div
					class={[
						'home-rail-item',
						isSelected && 'is-selected',
						isHighlighted && 'is-highlighted',
						isHiddenInDetail && 'is-hidden-in-detail'
					]}
					style:--home-rail-x={`${getCardOffsetRem(index, activeSection)}rem`}
					style:--home-rail-y={isHiddenInDetail ? `${DETAIL_EXIT_LIFT_REM}rem` : '0rem'}
					data-selected-card={isSelected}
				>
					<Card
						{index}
						{game}
						isActive={isSelected && !isDetailFocused}
						isResting={isSelected && isDetailFocused}
						isFocused={isHighlighted && isCarouselFocused}
						align={isDetailFocused ? 'start' : 'center'}
						onPress={onCardPress}
					/>
				</div>
			{/each}

			<div
				class={[
					'home-rail-item',
					visibleFocusedIndex === libraryCardIndex && 'is-selected',
					highlightedIndex === libraryCardIndex && 'is-highlighted',
					visibleFocusedIndex !== libraryCardIndex &&
						isDetailSection(activeSection) &&
						'is-hidden-in-detail'
				]}
				style:--home-rail-x={`${getCardOffsetRem(libraryCardIndex, activeSection)}rem`}
				style:--home-rail-y={visibleFocusedIndex !== libraryCardIndex &&
				isDetailSection(activeSection)
					? `${DETAIL_EXIT_LIFT_REM}rem`
					: '0rem'}
				data-selected-card={visibleFocusedIndex === libraryCardIndex}
			>
				<LibraryCard
					index={libraryCardIndex}
					isActive={visibleFocusedIndex === libraryCardIndex && !isDetailSection(activeSection)}
					isResting={visibleFocusedIndex === libraryCardIndex && isDetailSection(activeSection)}
					isFocused={highlightedIndex === libraryCardIndex &&
						highlightedSection === HOME_SECTIONS.carousel}
					align={isDetailSection(activeSection) ? 'start' : 'center'}
					onPress={onCardPress}
				/>
			</div>
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
					<h2 class="text-2xl font-medium text-white">
						{getDisplayedTitle()}
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
		margin-top: calc(-1 * var(--home-rail-top-bleed));
		padding-top: var(--home-rail-top-bleed);
	}

	.home-rail-viewport {
		position: relative;
		overflow: hidden;
		margin-top: calc(-1 * var(--home-rail-top-bleed));
		padding-top: calc(var(--home-rail-top-bleed) + 0.5rem);
	}

	.home-rail-stage {
		position: relative;
		height: 14rem;
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
			opacity var(--home-rail-detail-exit-fade) ease;
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
