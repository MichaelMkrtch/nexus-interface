<script lang="ts">
	import { tick } from 'svelte';

	import type { CarouselAPI } from '$components/ui/carousel/context';
	import type { Game } from '$lib/features/games/types';

	import * as Carousel from '$components/ui/carousel';

	import Card from './Card.svelte';

	interface CardCarouselProps {
		games: Game[];
		current: number;
	}

	let { games, current }: CardCarouselProps = $props();

	let api = $state<CarouselAPI>();

	$effect(() => {
		if (!api) return;

		const next = current;
		tick().then(() => {
			api?.scrollTo(next);
		});
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
		duration: 32
	}}
>
	<Carousel.Content>
		{#each games as game, i (game.id)}
			{@const isActive = current === i}
			{@const isLeftOfActive = current - i === 1}
			{@const isRightOfActive = current - i === -1}
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

		<div aria-hidden="true" class="h-px shrink-0 basis-[calc(100vw-19.25rem)]"></div>
	</Carousel.Content>
</Carousel.Root>
