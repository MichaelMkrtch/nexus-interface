<script lang="ts">
	import type { Game } from '$lib/features/games/types';

	import MissingArtwork from './MissingArtwork.svelte';

	interface CardProps {
		index: number;
		game: Game;
		isActive?: boolean;
		isFocused?: boolean;
		isResting?: boolean;
		align?: 'center' | 'start';
		onPress?: (index: number) => void;
	}

	let {
		index,
		game,
		isActive = false,
		isFocused = false,
		isResting = false,
		align = 'center',
		onPress
	}: CardProps = $props();

	function handlePointerDown() {
		onPress?.(index);
	}
</script>

<div
	class={[
		'artwork-card-frame',
		'game-card',
		isActive && 'is-active',
		isResting && 'is-resting',
		isFocused && 'is-focused',
		align === 'start' && 'align-start'
	]}
>
	{#if isFocused}
		<div class="active-card-border selection-gradient-border"></div>
	{/if}

	<button
		class={['artwork-card-surface', 'game-card-button', isFocused && 'selection-highlight-sweep']}
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
		--artwork-card-size: 13rem;
		--artwork-card-frame-padding: 5px;
		--artwork-card-border-width: 3px;
		--artwork-card-border-radius: 28px;
		--artwork-card-cover-radius: 24px;
		--artwork-card-border-reveal-end: 0;
		--artwork-card-inactive-scale: 0.625;
		--artwork-card-focus-ease: cubic-bezier(0.37, 0, 0.63, 1);
	}

	.active-card-border {
		z-index: 0;
	}

	.game-card.is-resting .game-card-button {
		transform: scale(var(--artwork-card-inactive-scale));
	}
</style>
