<script lang="ts">
	import Ellipsis from '@lucide/svelte/icons/ellipsis';

	interface IconActionButtonProps {
		label: string;
		isFocused?: boolean;
		onPress?: () => void;
		onConfirm?: () => void;
	}

	let { label, isFocused = false, onPress, onConfirm }: IconActionButtonProps = $props();
</script>

<div class={['icon-action-shell', isFocused && 'is-focused']}>
	{#if isFocused}
		<span class="icon-action-border selection-gradient-border"></span>
	{/if}

	<button
		class={['icon-action-button', isFocused && 'selection-highlight-sweep']}
		type="button"
		tabindex="-1"
		aria-label={label}
		aria-current={isFocused ? 'true' : undefined}
		onpointerdown={onPress}
		onclick={onConfirm}
	>
		<Ellipsis aria-hidden="true" />
	</button>
</div>

<style>
	.icon-action-shell {
		--icon-action-gap: 5px;
		--icon-action-border-width: 3px;
		--selection-gradient-border-radius: 9999px;
		--selection-gradient-border-width: var(--icon-action-border-width);

		position: relative;
		display: inline-flex;
		padding: var(--icon-action-gap);
	}

	.icon-action-button {
		position: relative;
		z-index: 10;
		display: grid;
		width: 70px;
		height: 70px;
		place-items: center;
		border-radius: 9999px;
		background: #80808040;
		color: white;
		transition:
			background-color 150ms ease,
			color 150ms ease;
	}

	.icon-action-button :global(svg) {
		width: 34px;
		height: 34px;
		stroke-width: 2.5;
	}

	.icon-action-shell.is-focused .icon-action-button {
		background: #fff;
		color: #282828;
		outline: none;
	}

	.icon-action-border {
		z-index: 0;
	}
</style>
