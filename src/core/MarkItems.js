// MarkItems.js
// This file contains the MarkItems class, which is used to mark items in a transcription.

/**
 * function to convert milliseconds to a formatted string 'minutes:seconds.milliseconds'
 */
function formatTime(time) {
	if (typeof time !== 'number' || isNaN(time)) return '';
	const minutes = Math.floor(time / 60000);
	const seconds = Math.floor((time % 60000) / 1000);
	const milliseconds = time % 1000;
	return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

/**
 * class to represent an item in the transcription
 */
class Item {
	static maxNo = 0;

	// Color options for ITM and BND items
	col_highlight = 'red';
	col_background = 'white';
	col_text = 'black';

	/**
	 * function to initialize an Item instance with default values.
	 */
	init(no, type, label) {
		this.no = no;
		this.label = label;
		this.type = type;
		this.disabled = false;
		this.activated = false;
		
		this.starttime = new Date().valueOf();
		this.timestamps = [];
		this.playbackTimestamps = [];
		this.spanId = null;
	}

	/**
	 * function to update the display of the item in the DOM, including color and tooltip.
	 */
	displayItem() {
		const span = document.getElementById(this.getSpanId());
		
		// timestamps
		span.title = '';
		if (this.isActivated()) {
			const timestamps = this.getTimestamps();
			const editTime = timestamps.editTime[0];
			const playTime = timestamps.playbackTime[0];
			const titleText = `Bearbeitungszeit: ${formatTime(editTime)}\nAbspielzeit: ${formatTime(playTime)}`;
			span.title = titleText;
		}
		
		// set text color according to activation status 
		if (this.getType() === 'ITM') {
			if (this.isActivated()) {
				span.style.color = this.col_highlight;
			} else {
				span.style.color = this.col_text;
			}
		} else if (this.getType() === 'BND') {
			span.style.fontWeight = 'bold';
			if (this.isActivated()) {
				span.style.color = this.col_text;
			} else {
				span.style.color = this.col_background;
			}
		}
	}

	// Activates the item
	activate() {
		this.activated = true;
	}
	
	// Deactivates the item
	deactivate() {
		this.activated = false;
	}
	
	// Returns whether the item is activated
	isActivated() {
		return (this.activated);
	}
	
	/**
	 * function to toggle the activation state of the item and updates timestamps.
	 */
	toggleActivated() {
		if (this.isActivated()) {
			this.deactivate();
			this.timestamps.pop();
			this.playbackTimestamps.pop();
		} else {
			this.activate();
			this.timestamps.push(new Date().valueOf() - this.starttime);
			const audioPlayer = window.audioPlayer;
			if (audioPlayer) {
				this.playbackTimestamps.push(Math.floor(audioPlayer.currentTime * 1000));
			}
		}
	}
	
	// Disables the item
	disable() {
		this.disabled = true;
	}
	
	// Enables the item
	enable() {
		this.disabled = false;
	}
	
	// Returns whether the item is disabled
	isDisabled() {
		return this.disabled;
	}
	
	// Returns the item number
	getNo() {
		return (this.no);
	}
	
	// Returns the timestamps for edit and playback
	getTimestamps() {
		return {
			editTime: this.timestamps,
			playbackTime: this.playbackTimestamps
		};
	}
	
	// Returns the label of the item
	getLabel() {
		return (this.label)
	}
	
	// Returns the type of the item
	getType() {
		return (this.type);
	}
	
	// Returns the span ID associated with the item
	getSpanId() {
		return (this.spanId);
	}
	
	// Sets the span ID for the item
	setSpanId(spanId) {
		this.spanId = spanId;
	}
}

/**
 * class to represent the MarkItems instance
 */
class MarkItems {
	allowedTypes = ['ITEMS', 'BOUNDARIES', 'BOTH'];
	selectMany = false;
	disabledItems = [];
	type = this.allowedTypes[0];
	items = [];
	caretPos = 0;

	/**
	 * function to initialize the MarkItems instance with a type and a list of items.
	 */
	init(type, items) {
		this.items = [];
		if (type !== 'ITEMS' && type !== 'BOUNDARIES' && type !== 'BOTH') {
			return;
		}
		this.type = type;

		let tmpItems = [];
		if (Array.isArray(items)) {
			tmpItems = items;
		} else {
			tmpItems = items.match(/<ITM\s+[^>]+>|[^\s]+/g) || [];
		}

		let itemNo = 0;
		for (let j = 0; j < tmpItems.length; j++) {
			const currentToken = tmpItems[j];

			// If current token is a boundary
			if (currentToken === '|') {
				if (this.type === 'BOUNDARIES' || this.type === 'BOTH') {
					const boundaryItem = new Item();
					boundaryItem.init(itemNo++, 'BND', currentToken);
					boundaryItem.activate();
					this.items.push(boundaryItem);
				}
				continue; // Move to the next token
			}

			// If current token is an item
			if (this.type === 'ITEMS' || this.type === 'BOTH') {
				const itmItem = new Item();

				// If it's a <ITM ...> tag
				if (/^<ITM\s+[^>]+>$/.test(currentToken)) {
					const label = currentToken.replace(/^<ITM\s+/, '').replace(/>$/, '');
					itmItem.init(itemNo++, 'ITM', label);
					itmItem.activate();
				} else {
					// regular word
					itmItem.init(itemNo++, 'ITM', currentToken);
				}
				this.items.push(itmItem);
			}

			if (j < tmpItems.length - 1) {
				const nextToken = tmpItems[j + 1];
				// Insert a boundary if the next token is not already an explicit boundary.
				if (nextToken !== '|' && (this.type === 'BOUNDARIES' || this.type === 'BOTH')) {
					const autoBoundary = new Item();
					autoBoundary.init(itemNo++, 'BND', '|');
					this.items.push(autoBoundary);
				}
			}
		}
	}

	/**
	 * function to generate the HTML elements for all items and append them to the parent.
	 */
	generateElement(parent) {
		parent.innerHTML = '';
		parent.style.border = 'thin solid black';
		parent.style.padding = '5px';
		parent.style.textAlign = 'left';
		parent.style.lineHeight = '1.6';
		parent.style.overflowWrap = 'break-word';
		parent.style.whiteSpace = 'normal';

		for (let i = 0; i < this.items.length; i++) {
			const item = this.items[i];
			
			const span = document.createElement('span');
			span.id = 'spix' + ('00000' + i).substr(-6);
			
			let displayLabel = item.getLabel();
			// If the label matches the format <ITM xxx>, extract only 'xxx'
			if (/^<ITM\s+[^>]+>$/.test(displayLabel)) {
				displayLabel = displayLabel.replace(/^<ITM\s+/, '').replace(/>$/, '');
			}
			span.appendChild(document.createTextNode(displayLabel));

			span.style.display = 'inline';
			span.style.margin = '0';
			span.style.padding = '0';
			span.style.whiteSpace = 'nowrap';

			// link the model and the view
			item.setSpanId(span.id);
			
			// enable or disable clicks on span
			if (item.isDisabled()) {
				span.disabled = true;
			} else {
				span.onclick = this.setValue.bind(this);
			}

			// then show the new Item
			parent.appendChild(span);
			parent.appendChild(document.createTextNode(' '));
			item.displayItem();
		}
	}

	/**
	 * function to return a list of all items with their activation status and timestamps.
	 */
	getValues() {
		const values = [];
		for (let i = 0; i < this.items.length; i++) {
			const item = this.items[i];
			const value = {};
			
			value.idx = item.getNo();
			value.type = item.getType();
			if (item.isActivated()) {
				value.activated = 'ACTIVATED';
			} else {
				value.activated = 'UNMARKED';
			};
			value.label = item.getLabel();
			value.timestamps = item.getTimestamps();
			
			values.push(value);
		}
		return (values);
	}

	/**
	 * function to return the transcription as plain text, with activated items in <ITM ...>.
	 */
	getText() {
		let text = ''
		for (let i = 0; i < this.items.length; i++) {
			const item = this.items[i];
			if (item.type === 'ITM') {
				if (item.isActivated()) {
					text = text + '<ITM ' + item.getLabel() + '>';
				} else {
					text = text + ' ' + item.getLabel();
				}
			} else if (item.type === 'BND') {
				if (item.isActivated()) {
					text = text + item.getLabel();
				}
			}
			text = text + ' ';
		}
		return (text.trim().replace(/  +/g, ' '));
	}

	// Always returns true (can be extended for completeness checks)
	checkCompleteness() {
		return(true);
	}
	
	/**
	 * function to handle click events on item spans, toggles activation, and updates display.
	 */
	setValue(event) {
		const span = event.target;
		
		for (let i = 0; i < this.items.length; i++) {
			if (this.items[i].getSpanId() == span.id) {
				const item = this.items[i];
				if (!item.isDisabled()) {
					const audioFileName = requirePairedAudio();
					if (!audioFileName) return;
					item.toggleActivated();
					item.displayItem();
					setAnnotationAudioFileName(audioFileName);
				}
				this.caretPos = i;
				break;
			}
		}
	}
		
	// Returns the current caret position
	getCaretPos() {
		return this.caretPos;
	}
	
	/**
	 * function to disable all items whose indices are in the disabledItems list.
	 */
	setDisabledItems(disabledItems) {
		if (Array.isArray(disabledItems) && this.items.length >= disabledItems.length) {
			for (let i = 0; i < disabledItems.length; i++) {
				if (disabledItems[i] > 0 && disabledItems[i] < this.items.length) {
					const spanId = this.items[i].getSpanId();
					const spanElem = document.getElementById(spanId);
					spanElem.disabled = true;
				}
			}
		}
	}
}