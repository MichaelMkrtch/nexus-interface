import type { InputEvent } from '$lib/input/contracts';
import type { createHomeNavigation } from './home-navigation.svelte';

import { INPUT_ACTIONS } from '$lib/input/contracts';

type HomeNavigation = ReturnType<typeof createHomeNavigation>;

type HomeInputHandlerOptions = {
	navigation: HomeNavigation;
};

export function createHomeInputHandler({ navigation }: HomeInputHandlerOptions) {
	return (event: InputEvent) => {
		switch (event.action) {
			case INPUT_ACTIONS.moveLeft:
				navigation.handleDirection('left');
				break;
			case INPUT_ACTIONS.moveRight:
				navigation.handleDirection('right');
				break;
			case INPUT_ACTIONS.moveUp:
				navigation.handleDirection('up');
				break;
			case INPUT_ACTIONS.moveDown:
				navigation.handleDirection('down');
				break;
			case INPUT_ACTIONS.confirm:
				navigation.confirm();
				break;
		}
	};
}
