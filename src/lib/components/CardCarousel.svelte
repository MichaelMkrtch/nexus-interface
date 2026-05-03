<script lang="ts">
	import type { CarouselAPI } from './ui/carousel/context.ts';

	import Card from './Card.svelte';
	import * as Carousel from './ui/carousel/index.ts';

	let api = $state<CarouselAPI>();

	const itemCount = 20;
	let current = $state(0);

	function setCurrent(index: number) {
		const next = Math.max(0, Math.min(index, itemCount - 1));

		current = next;
		api?.scrollTo(next);

		console.log({
			next,
			snaps: api?.scrollSnapList().length,
			canNext: api?.canScrollNext(),
			selected: api?.selectedScrollSnap()
		});
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
		align: 'start',
		duration: 20
	}}
>
	<Carousel.Content>
		{#each Array(itemCount) as _, i (i)}
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
					<Card {isActive} />
				</div>
			</Carousel.Item>
		{/each}
	</Carousel.Content>
</Carousel.Root>
