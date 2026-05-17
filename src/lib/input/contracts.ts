export const INPUT_SOURCES = {
	keyboard: 'keyboard',
	webGamepad: 'web-gamepad',
	native: 'native'
} as const;

export type InputSource = (typeof INPUT_SOURCES)[keyof typeof INPUT_SOURCES];

export const INPUT_ACTIONS = {
	moveLeft: 'move-left',
	moveRight: 'move-right',
	moveUp: 'move-up',
	moveDown: 'move-down',
	confirm: 'confirm',
	cancel: 'cancel',
	options: 'options',
	shoulderLeft: 'shoulder-left',
	shoulderRight: 'shoulder-right'
} as const;

export type InputAction = (typeof INPUT_ACTIONS)[keyof typeof INPUT_ACTIONS];

export type InputEvent = {
	action: InputAction;
	source: InputSource;
	at: number;
	repeat: boolean;
};

export type InputDispatch = (event: InputEvent) => void;
export type InputListener = (event: InputEvent) => void;
export type InputUnsubscribe = () => void;

export type InputAdapter = {
	id: string;
	start: (dispatch: InputDispatch) => InputUnsubscribe;
};
