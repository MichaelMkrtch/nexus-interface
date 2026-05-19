<script lang="ts">
	import type { Game } from '$lib/features/games/types';

	import MissingArtwork from './MissingArtwork.svelte';

	interface CardProps {
		index: number;
		game: Game;
		isActive?: boolean;
		isFocused?: boolean;
		align?: 'center' | 'start';
		onPress?: (index: number) => void;
	}

	let {
		index,
		game,
		isActive = false,
		isFocused = false,
		align = 'center',
		onPress
	}: CardProps = $props();

	function handlePointerDown() {
		onPress?.(index);
	}
</script>

<div
	class={[
		'game-card',
		isActive && 'is-active',
		isFocused && 'is-focused',
		align === 'start' && 'align-start'
	]}
>
	{#if isFocused}
		<div class="active-card-border selection-gradient-border"></div>
	{/if}

	<button
		class={['game-card-button', isFocused && 'selection-highlight-sweep']}
		type="button"
		tabindex="-1"
		aria-label={game.title}
		data-game-cover
		onpointerdown={handlePointerDown}
	>
		{#if game.cover}
			<img src={game.cover} alt={game.title} class="size-full object-cover" draggable="false" />
		{:else}
			<MissingArtwork title={game.title} />
		{/if}
	</button>
</div>

<style>
	.game-card {
		--game-card-size: 11rem;
		--game-card-frame-padding: 5px;
		--game-card-border-width: 3px;
		--game-card-border-radius: 28px;
		--game-card-cover-radius: 24px;
		--game-card-border-reveal-end: 0;
		--game-card-inactive-scale: 0.625;
		--game-card-focus-ease: cubic-bezier(0.37, 0, 0.63, 1);
		--selection-gradient-border-inset: var(--game-card-border-reveal-end);
		--selection-gradient-border-radius: var(--game-card-border-radius);
		--selection-gradient-border-width: var(--game-card-border-width);

		position: relative;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		width: var(--game-card-size);
		height: var(--game-card-size);
		padding: var(--game-card-frame-padding);
	}

	.game-card-button {
		position: relative;
		z-index: 10;
		display: block;
		width: 100%;
		height: 100%;
		padding: 0;
		overflow: hidden;
		border-radius: var(--game-card-cover-radius);
		transform-origin: 50% 10%;
		transform: scale(var(--game-card-inactive-scale));
		transition: transform 100ms var(--game-card-focus-ease);
		will-change: transform;
	}

	.game-card.align-start .game-card-button {
		transform-origin: 0 0;
	}

	.game-card.is-active .game-card-button {
		transform: scale(1);
	}

	.active-card-border {
		z-index: 0;
	}
</style>
