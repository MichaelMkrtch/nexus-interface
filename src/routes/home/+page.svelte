<script>
	import CardCarousel from '$components/CardCarousel.svelte';
	import Header from '$components/Header.svelte';
</script>

<main class="relative size-full overflow-hidden">
	<!-- Margin-restricted UI -->
	<div class="relative px-20 py-10">
		<Header />
	</div>

	<!-- Fullscreen UI -->
	<div class="w-full overflow-hidden">
		<CardCarousel />
	</div>
</main>
