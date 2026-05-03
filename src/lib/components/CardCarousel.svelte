<script lang="ts">
	import type { Game } from '$lib/features/games/types';
	import type { CarouselAPI } from './ui/carousel/context.ts';

	import Card from './Card.svelte';
	import * as Carousel from './ui/carousel/index.ts';

	interface CardCarouselProps {
		games: Game[];
		current: number;
		onCurrentChange?: (index: number) => void;
	}

	let { games, current = $bindable(0), onCurrentChange }: CardCarouselProps = $props();

	let api = $state<CarouselAPI>();

	const itemCount = $derived(games.length);

	function setCurrent(index: number) {
		const next = Math.max(0, Math.min(index, itemCount - 1));

		current = next;
		onCurrentChange?.(next);
		api?.scrollTo(next);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!api) return;

		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			setCurrent(current - 1);
		}

		if (event.key === 'ArrowRight') {
			event.preventDefault();
			setCurrent(current + 1);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

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
			{@const isActive = current === i}
			{@const isLeftOfActive = current - i === 1}
			{@const isRightOfActive = current - i === -1}
			<Carousel.Item
				class={[
					'basis-33 transition-[margin] duration-200 ease-out',
					isLeftOfActive && 'mr-7',
					isRightOfActive && 'ml-7'
				]}
			>
				<div class="flex size-44 items-start justify-center">
					<Card {game} {isActive} />
				</div>
			</Carousel.Item>
		{/each}

		<div aria-hidden="true" class="h-px shrink-0 basis-[calc(100vw-19.25rem)]"></div>
	</Carousel.Content>
</Carousel.Root>
