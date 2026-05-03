<script lang="ts">
	interface CardProps {
		isActive?: boolean;
	}

	let { isActive = false }: CardProps = $props();
</script>

<div class="relative flex size-44 items-start justify-center p-1.75">
	{#if isActive}
		<div class="active-card-border pointer-events-none absolute rounded-[28px]"></div>
	{/if}

	<button
		class={[
			isActive ? 'scale-100' : 'scale-[0.74]',
			'relative z-10 block size-full origin-top overflow-hidden rounded-[21px] bg-linear-to-br from-red-500 to-yellow-200 p-0 transition-transform duration-200 ease-out'
		]}
	>
		Persona 5
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
		overflow: hidden;
		background: conic-gradient(from var(--active-card-border-angle), #4f46e5, #fef08a, #4f46e5);
		animation:
			active-card-border-in 150ms ease-out 190ms both,
			active-card-border-spin 8000ms linear 180ms infinite;
	}

	.active-card-border::after {
		content: '';
		position: absolute;
		inset: 4px;
		border-radius: 24px;
		background: black;
	}

	@keyframes active-card-border-in {
		from {
			inset: 5px;
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
