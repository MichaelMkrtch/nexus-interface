<script lang="ts">
	import type { Game } from '$lib/features/games/types';

	interface CardProps {
		game: Game;
		isActive?: boolean;
	}

	let { game, isActive = false }: CardProps = $props();
</script>

<div class="relative flex size-44 items-start justify-center p-1.25">
	{#if isActive}
		<div class="active-card-border pointer-events-none absolute rounded-[28px]"></div>
	{/if}

	<button
		class={[
			isActive ? 'scale-100' : 'scale-[0.74]',
			'relative z-10 block size-full origin-top overflow-hidden rounded-[24px] bg-linear-to-br from-red-500 to-yellow-200 p-0 transition-transform duration-200 ease-out'
		]}
		aria-label={game.title}
	>
		<img src={game.cover} alt={game.title} class="size-full object-cover" draggable="false" />
	</button>
</div>

<style>
	@property --active-card-border-angle {
		syntax: '<angle>';
		inherits: false;
		initial-value: 0deg;
	}

	.active-card-border {
		--active-card-border-angle: 0deg;

		z-index: 0;
		padding: 3px;
		background: conic-gradient(
			from var(--active-card-border-angle),
			oklch(81.1% 0.111 293.571),
			oklch(83.7% 0.128 66.29),
			oklch(81.1% 0.111 293.571)
		);
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		animation:
			active-card-border-in 150ms ease-out 190ms both,
			active-card-border-spin 8000ms linear 180ms infinite;
	}

	@keyframes active-card-border-in {
		from {
			inset: 4px;
			opacity: 0;
		}

		to {
			inset: 0;
			opacity: 1;
		}
	}

	@keyframes active-card-border-spin {
		to {
			--active-card-border-angle: 360deg;
		}
	}
</style>
