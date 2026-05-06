<script lang="ts">
	import type { CarouselAPI } from '$components/ui/carousel/context';
	import type { Game } from '$lib/features/games/types';
	import type { HomeFocusArea } from '$lib/features/home/home-navigation.svelte';

	import { tick } from 'svelte';

	import * as Carousel from '$components/ui/carousel';

	import Card from './Card.svelte';

	const TITLE_FADE_IN_DELAY_MS = 40;
	const REGION_SETTLE_TIMEOUT_MS = 220;
	const TITLE_SETTLE_TIMEOUT_MS = 360;
	const TITLE_OFFSET_PX = 16;
	const TITLE_DEFAULT_TOP_PX = 136;
	const TITLE_DETAIL_TOP_OFFSET_PX = 24;

	interface CardCarouselProps {
		games: Game[];
		focusedIndex: number;
		focusArea: HomeFocusArea;
	}

	let { games, focusedIndex, focusArea }: CardCarouselProps = $props();

	let api = $state<CarouselAPI>();
	let carouselRoot = $state<HTMLDivElement | null>(null);
	let displayedTitleIndex = $state(0);
	let isTitleVisible = $state(false);
	let shouldAnimateTitle = $state(false);
	let titleLeft = $state(0);
	let titleTop = $state(TITLE_DEFAULT_TOP_PX);
	let lastHandledIndex = 0;
	let lastHandledFocusArea: HomeFocusArea = 'carousel';
	let settledFocusedIndex = $state(0);
	let settledFocusArea = $state<HomeFocusArea>('carousel');

	function updateTitlePosition() {
		if (!carouselRoot) return;

		const selectedCard = carouselRoot.querySelector<HTMLElement>('[data-selected-card="true"]');
		if (!selectedCard) return;

		const selectedCover =
			selectedCard.querySelector<HTMLElement>('[data-game-cover]') ?? selectedCard;
		const carouselRect = carouselRoot.getBoundingClientRect();
		const coverRect = selectedCover.getBoundingClientRect();

		titleLeft = coverRect.right - carouselRect.left + TITLE_OFFSET_PX;
		titleTop =
			focusArea === 'play'
				? coverRect.top - carouselRect.top + TITLE_DETAIL_TOP_OFFSET_PX
				: TITLE_DEFAULT_TOP_PX;
	}

	function waitForCarouselSettle() {
		return new Promise<void>((resolve) => {
			if (!api) {
				resolve();
				return;
			}

			let settled = false;
			const timeout = window.setTimeout(finish, TITLE_SETTLE_TIMEOUT_MS);

			function finish() {
				if (settled) return;
				settled = true;
				window.clearTimeout(timeout);
				api?.off('settle', finish);
				resolve();
			}

			api.on('settle', finish);
		});
	}

	function wait(durationMs: number) {
		return new Promise((resolve) => window.setTimeout(resolve, durationMs));
	}

	$effect(() => {
		if (!api) return;

		const next = focusedIndex;
		const nextFocusArea = focusArea;
		const indexChanged = next !== lastHandledIndex;
		const focusAreaChanged = nextFocusArea !== lastHandledFocusArea;
		const shouldWaitForScroll = indexChanged && nextFocusArea === 'carousel';
		const shouldWaitForRegion = focusAreaChanged && !shouldWaitForScroll;
		let titleAnimationFrame: number | undefined;
		let isCancelled = false;

		if (!indexChanged && !focusAreaChanged) {
			tick().then(() => {
				api?.scrollTo(next);
				if (!isTitleVisible) {
					displayedTitleIndex = next;
					titleAnimationFrame = window.requestAnimationFrame(() => {
						updateTitlePosition();
						shouldAnimateTitle = true;
						isTitleVisible = true;
					});
				}
			});
			return () => {
				isCancelled = true;
				if (titleAnimationFrame !== undefined) {
					window.cancelAnimationFrame(titleAnimationFrame);
				}
			};
		}

		lastHandledIndex = next;
		lastHandledFocusArea = nextFocusArea;

		if (nextFocusArea === 'carousel' && (indexChanged || focusAreaChanged)) {
			settledFocusArea = nextFocusArea;
			settledFocusedIndex = -1;
		} else {
			settledFocusArea = nextFocusArea;
			settledFocusedIndex = next;
		}

		shouldAnimateTitle = false;
		isTitleVisible = false;

		tick().then(async () => {
			api?.scrollTo(next);

			if (shouldWaitForScroll) {
				await waitForCarouselSettle();
			} else if (shouldWaitForRegion) {
				await wait(REGION_SETTLE_TIMEOUT_MS);
			} else {
				await wait(TITLE_FADE_IN_DELAY_MS);
			}

			if (isCancelled) return;

			settledFocusedIndex = next;
			settledFocusArea = nextFocusArea;
			displayedTitleIndex = next;
			titleAnimationFrame = window.requestAnimationFrame(() => {
				updateTitlePosition();
				shouldAnimateTitle = true;
				isTitleVisible = true;
			});
		});

		return () => {
			isCancelled = true;
			if (titleAnimationFrame !== undefined) {
				window.cancelAnimationFrame(titleAnimationFrame);
			}
		};
	});
</script>

<Carousel.Root
	bind:ref={carouselRoot}
	setApi={(emblaApi) => (api = emblaApi)}
	opts={{
		startIndex: 0,
		slidesToScroll: 1,
		skipSnaps: false,
		containScroll: false,
		align: 'start',
		duration: 14
	}}
>
	<Carousel.Content
		class={[
			'pt-3 transition-[margin-inline-start] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
			focusArea === 'play' ? 'ms-20' : 'ms-44'
		]}
	>
		{#each games as game, i (game.id)}
			{@const isSelected = focusedIndex === i}
			{@const isCarouselFocused = focusArea === 'carousel'}
			{@const isPlayFocused = focusArea === 'play'}
			{@const isSettledFocusedCard =
				settledFocusedIndex === i && settledFocusArea === 'carousel'}
			{@const isFocusedCard = isSelected && isCarouselFocused}
			{@const isDetailCard = isSelected && isPlayFocused}
			{@const isHiddenInDetail = !isSelected && isPlayFocused}
			<Carousel.Item
				class={[
					'basis-33 transition-[margin-left,margin-right] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
					isFocusedCard && 'mx-[24px]',
					isDetailCard && 'mx-0',
					!isSelected && '-mx-[8px]'
				]}
			>
				<div
					class={[
						'flex size-44 items-start transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
						isDetailCard ? 'justify-start' : 'justify-center',
						isHiddenInDetail && 'pointer-events-none -translate-y-36 opacity-0',
						!isHiddenInDetail && 'translate-y-0 opacity-100'
					]}
					data-selected-card={isSelected}
				>
					<Card
						{game}
						isActive={isFocusedCard}
						isFocused={isSettledFocusedCard}
						align={isDetailCard ? 'start' : 'center'}
					/>
				</div>
			</Carousel.Item>
		{/each}

		<!-- End spacer -->
		<!-- Allows end cards to reach active position -->
		<div aria-hidden="true" class="h-px shrink-0 basis-[calc(100vw-19.25rem)]"></div>
	</Carousel.Content>

	<div
		class={[
			'pointer-events-none absolute fade-in',
			shouldAnimateTitle && 'transition-opacity duration-150',
			isTitleVisible ? 'opacity-100' : 'opacity-0'
		]}
		style:left={`${titleLeft}px`}
		style:top={`${titleTop}px`}
	>
		<h2 class="text-2xl font-semibold text-white">
			{games[displayedTitleIndex]?.title}
		</h2>
	</div>
</Carousel.Root>
