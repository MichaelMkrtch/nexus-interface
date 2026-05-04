<script lang="ts">
	import type { CarouselAPI } from '$components/ui/carousel/context';
	import type { Game } from '$lib/features/games/types';

	import { tick } from 'svelte';

	import * as Carousel from '$components/ui/carousel';

	import Card from './Card.svelte';

	const TITLE_FADE_IN_MS = 100;

	interface CardCarouselProps {
		games: Game[];
		focusedIndex: number;
	}

	let { games, focusedIndex }: CardCarouselProps = $props();

	let api = $state<CarouselAPI>();
	let displayedTitleIndex = $state(0);
	let isTitleVisible = $state(true);
	let shouldAnimateTitle = $state(true);
	let lastHandledIndex = 0;

	$effect(() => {
		if (!api) return;

		const next = focusedIndex;
		if (next === lastHandledIndex) {
			tick().then(() => {
				api?.scrollTo(next);
			});
			return;
		}

		lastHandledIndex = next;
		shouldAnimateTitle = false;
		isTitleVisible = false;

		tick().then(() => {
			api?.scrollTo(next);
		});

		let titleAnimationFrame: number | undefined;
		const titleTimeout = window.setTimeout(() => {
			displayedTitleIndex = next;
			titleAnimationFrame = window.requestAnimationFrame(() => {
				shouldAnimateTitle = true;
				isTitleVisible = true;
			});
		}, TITLE_FADE_IN_MS);

		return () => {
			window.clearTimeout(titleTimeout);
			if (titleAnimationFrame !== undefined) {
				window.cancelAnimationFrame(titleAnimationFrame);
			}
		};
	});
</script>

<Carousel.Root
	setApi={(emblaApi) => (api = emblaApi)}
	opts={{
		startIndex: 0,
		slidesToScroll: 1,
		skipSnaps: false,
		containScroll: false,
		align: 'start',
		duration: 20
	}}
>
	<Carousel.Content>
		{#each games as game, i (game.id)}
			{@const isActive = focusedIndex === i}
			{@const isLeftOfActive = focusedIndex - i === 1}
			{@const isRightOfActive = focusedIndex - i === -1}
			<Carousel.Item
				class={[
					'basis-33 transition-[margin-left,margin-right] duration-200 ease-out',
					isLeftOfActive && 'mr-7',
					isRightOfActive && 'ml-7'
				]}
			>
				<div class="flex size-44 items-start justify-center">
					<Card {game} {isActive} />
				</div>
			</Carousel.Item>
		{/each}

		<!-- End spacer -->
		<!-- Allows end cards to reach active position -->
		<!-- <div aria-hidden="true" class="h-px shrink-0 basis-[calc(100vw-19.25rem)]"></div> -->
	</Carousel.Content>

	<div
		class={[
			'pointer-events-none absolute top-34 left-91 ease-[cubic-bezier(0.16,1,0.3,1)]',
			shouldAnimateTitle && 'duration-100ms transition-opacity',
			isTitleVisible ? 'opacity-100' : 'opacity-0'
		]}
	>
		<h2 class="text-2xl font-semibold text-white">
			{games[displayedTitleIndex]?.title}
		</h2>
	</div>
</Carousel.Root>
