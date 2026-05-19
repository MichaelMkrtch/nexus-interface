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
	<button
		class="icon-action-button"
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
	@property --icon-action-border-angle {
		syntax: '<angle>';
		inherits: false;
		initial-value: 0deg;
	}

	.icon-action-shell {
		--icon-action-gap: 5px;
		--icon-action-border-width: 3px;
		--icon-action-border-angle: 0deg;

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

	.icon-action-shell.is-focused::before {
		content: '';
		position: absolute;
		z-index: 0;
		inset: 0;
		border-radius: 9999px;
		padding: var(--icon-action-border-width);
		background: conic-gradient(
			from var(--icon-action-border-angle),
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
		animation: icon-action-border-spin 4000ms linear infinite;
	}

	@keyframes icon-action-border-spin {
		to {
			--icon-action-border-angle: 360deg;
		}
	}
</style>
