	// Accessibility Utilities
	(function() {
		/**
		 * Create an accessible empty state element
		 * @param {string} icon - Emoji or icon character
		 * @param {string} title - Main title text
		 * @param {string} description - Descriptive text
		 * @param {HTMLElement|null} action - Optional action button/element
		 * @returns {HTMLElement} Empty state container
		 */
		function createEmptyState(icon, title, description, action = null) {
			const container = document.createElement('div');
			container.className = 'empty-state';
			container.setAttribute('role', 'status');

			const iconEl = document.createElement('div');
			iconEl.className = 'empty-state-icon';
			iconEl.setAttribute('aria-hidden', 'true');
			iconEl.textContent = icon;

			const titleEl = document.createElement('h3');
			titleEl.className = 'empty-state-title';
			titleEl.textContent = title;

			const descEl = document.createElement('p');
			descEl.className = 'empty-state-description';
			descEl.textContent = description;

			container.appendChild(iconEl);
			container.appendChild(titleEl);
			container.appendChild(descEl);

			if (action) {
				const actionWrapper = document.createElement('div');
				actionWrapper.className = 'empty-state-action';
				actionWrapper.appendChild(action);
				container.appendChild(actionWrapper);
			}

			return container;
		}

		/**
		 * Announce a message to screen readers
		 * @param {string} message - Message to announce
		 * @param {string} priority - 'polite' or 'assertive'
		 */
		function announceToScreenReader(message, priority = 'polite') {
			const announcement = document.createElement('div');
			announcement.setAttribute('role', 'status');
			announcement.setAttribute('aria-live', priority);
			announcement.setAttribute('aria-atomic', 'true');
			announcement.style.position = 'absolute';
			announcement.style.left = '-10000px';
			announcement.textContent = message;
			document.body.appendChild(announcement);
			setTimeout(() => announcement.remove(), 1000);
		}

		window.a11y = { createEmptyState, announceToScreenReader };
	})();

	// Accessible Modal Component
(() => {
	const openBtn = document.getElementById('open-modal-btn');
	const modal = document.getElementById('modal');
	const closeBtn = document.getElementById('modal-close-btn');
	const overlay = modal && modal.querySelector('.modal-overlay');
	let lastFocused = null;

	if (!modal || !openBtn) return;

	const focusableSelectors = [
		'a[href]', 'area[href]', 'input:not([disabled])', 'select:not([disabled])',
		'textarea:not([disabled])', 'button:not([disabled])', 'iframe', 'object', 'embed',
		'[contenteditable]', '[tabindex]:not([tabindex="-1"])'
	].join(',');

	function getFocusableElements(container) {
		return Array.from(container.querySelectorAll(focusableSelectors)).filter(el => el.offsetParent !== null || el === document.activeElement);
	}

	function openModal() {
		lastFocused = document.activeElement;
		modal.classList.remove('hidden');
		modal.setAttribute('aria-hidden', 'false');
		document.body.style.overflow = 'hidden';

		// Move modal to end of body to ensure it's top-level for screen readers
		document.body.appendChild(modal);

		const focusables = getFocusableElements(modal);
		if (focusables.length) {
			focusables[0].focus();
		} else {
			// fallback to panel
			const panel = modal.querySelector('.modal-panel');
			panel && panel.setAttribute('tabindex', '-1');
			panel && panel.focus();
		}

		document.addEventListener('keydown', handleKeyDown);
		document.addEventListener('focus', enforceFocus, true);
	}

	function closeModal() {
		modal.classList.add('hidden');
		modal.setAttribute('aria-hidden', 'true');
		document.body.style.overflow = '';
		document.removeEventListener('keydown', handleKeyDown);
		document.removeEventListener('focus', enforceFocus, true);
		if (lastFocused && typeof lastFocused.focus === 'function') {
			lastFocused.focus();
		}
	}

	function handleKeyDown(e) {
		if (e.key === 'Escape') {
			e.preventDefault();
			closeModal();
			return;
		}

		if (e.key === 'Tab') {
			// focus trap
			const focusables = getFocusableElements(modal);
			if (!focusables.length) {
				e.preventDefault();
				return;
			}

			const first = focusables[0];
			const last = focusables[focusables.length - 1];

			if (e.shiftKey) {
				if (document.activeElement === first || document.activeElement === modal) {
					e.preventDefault();
					last.focus();
				}
			} else {
				if (document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		}
	}

	function enforceFocus(e) {
		if (!modal.contains(e.target)) {
			e.stopPropagation();
			const focusables = getFocusableElements(modal);
			if (focusables.length) focusables[0].focus();
		}
	}

	openBtn.addEventListener('click', (e) => {
		e.preventDefault();
		openModal();
	});

	closeBtn.addEventListener('click', (e) => {
		e.preventDefault();
		closeModal();
	});

	overlay && overlay.addEventListener('click', () => closeModal());

	// Close if focus moves outside and click outside
	modal.addEventListener('click', (e) => {
		if (e.target === modal) closeModal();
	});

	// Expose for debugging if needed
	window.appModal = { open: openModal, close: closeModal };
})();

	// Deck CRUD (in-memory) and UI wiring
	(function() {
		const deckListEl = document.querySelector('.deck-list');
		const addDeckBtn = document.querySelector('.add-deck-btn');
		const deckTitleEl = document.querySelector('.deck-header h2');
		const deckStatsEl = document.querySelector('.deck-stats');
		const cardsContainer = document.querySelector('.cards-container');

		if (!deckListEl || !addDeckBtn || !deckTitleEl || !deckStatsEl || !cardsContainer) return;

		let nextId = 4;
		let selectedDeckId = null;

		const decks = [
			{ 
				id: 1, 
				name: 'Biology 101', 
				cards: [
					{ front: 'What is photosynthesis?', back: 'Process by which plants convert light into chemical energy.' },
					{ front: 'What is mitochondria?', back: 'The powerhouse of the cell; produces ATP for energy.' },
					{ front: 'What is DNA?', back: 'Deoxyribonucleic acid; carries genetic instructions for life.' }
				], 
				createdAt: Date.now(), 
				updatedAt: Date.now() 
			},
			{ 
				id: 2, 
				name: 'Spanish Vocab', 
				cards: [
					{ front: 'Hello', back: 'Hola' },
					{ front: 'Thank you', back: 'Gracias' },
					{ front: 'Goodbye', back: 'Adiós' }
				], 
				createdAt: Date.now(), 
				updatedAt: Date.now() 
			},
			{ 
				id: 3, 
				name: 'Math Formulas', 
				cards: [
					{ front: 'Pythagorean theorem', back: 'a² + b² = c²' },
					{ front: 'Area of a circle', back: 'πr²' },
					{ front: 'Quadratic formula', back: 'x = (-b ± √(b² - 4ac)) / 2a' }
				], 
				createdAt: Date.now(), 
				updatedAt: Date.now() 
			}
		];

		function renderDeckList() {
			deckListEl.replaceChildren();
			decks.forEach(d => {
				const li = document.createElement('li');
				li.className = 'deck-item';
				li.dataset.id = d.id;

				const link = document.createElement('a');
				link.href = '#';
				link.className = 'deck-link';
				link.textContent = d.name;

				const count = document.createElement('span');
				count.className = 'card-count';
				count.textContent = `${d.cards.length} cards`;

				const actions = document.createElement('div');
				actions.className = 'deck-actions';
				actions.setAttribute('aria-hidden', 'true');

				const editBtn = document.createElement('button');
				editBtn.className = 'btn btn-secondary edit-deck';
				editBtn.dataset.action = 'edit';
				editBtn.dataset.id = d.id;
				editBtn.textContent = 'Edit';

				const deleteBtn = document.createElement('button');
				deleteBtn.className = 'btn btn-secondary delete-deck';
				deleteBtn.dataset.action = 'delete';
				deleteBtn.dataset.id = d.id;
				deleteBtn.textContent = 'Delete';

				actions.appendChild(editBtn);
				actions.appendChild(deleteBtn);

				li.appendChild(link);
				li.appendChild(count);
				li.appendChild(actions);

				deckListEl.appendChild(li);
			});
		}

		function selectDeck(id) {
			const deck = decks.find(d => d.id === Number(id));
			selectedDeckId = deck ? deck.id : null;
			if (!deck) {
				deckTitleEl.textContent = 'No deck selected';
				deckStatsEl.textContent = '';
				renderCards(null);
				return;
			}
			deckTitleEl.textContent = deck.name;
			deckStatsEl.textContent = `${deck.cards.length} cards • Last updated: ${timeAgo(deck.updatedAt)}`;
			renderCards(deck);
			// highlight selected
			Array.from(deckListEl.querySelectorAll('.deck-item')).forEach(li => li.classList.toggle('selected', Number(li.dataset.id) === deck.id));
		}

		function timeAgo(ts) {
			if (!ts) return 'unknown';
			const s = Math.floor((Date.now() - ts)/1000);
			if (s < 60) return `${s}s ago`;
			const m = Math.floor(s/60);
			if (m < 60) return `${m}m ago`;
			const h = Math.floor(m/60);
			if (h < 24) return `${h}h ago`;
			const d = Math.floor(h/24);
			return `${d}d ago`;
		}

		function renderCards(deck) {
			cardsContainer.replaceChildren();
			if (!deck || !deck.cards.length) {
				const emptyEl = window.a11y.createEmptyState(
					'📝',
					'No flashcards yet',
					'Double-click the deck name or use the Edit button to add cards to this deck.',
					null
				);
				cardsContainer.appendChild(emptyEl);
				return;
			}
			deck.cards.forEach((card, idx) => {
				const article = document.createElement('article');
				article.className = 'card';
				article.dataset.cardIndex = idx;
				article.dataset.deckId = deck.id;

				const inner = document.createElement('div');
				inner.className = 'card-inner';

				const front = document.createElement('div');
				front.className = 'card-front';
				const frontP = document.createElement('p');
				frontP.textContent = card.front;
				front.appendChild(frontP);

				const back = document.createElement('div');
				back.className = 'card-back';
				const backP = document.createElement('p');
				backP.textContent = card.back;
				back.appendChild(backP);

				// Add overlay with action buttons
				const overlay = document.createElement('div');
				overlay.className = 'card-overlay';

				const editBtn = document.createElement('button');
				editBtn.className = 'card-action-btn';
				editBtn.dataset.action = 'edit-card';
				editBtn.setAttribute('aria-label', `Edit card: ${card.front}`);
				editBtn.textContent = 'Edit';

				const deleteBtn = document.createElement('button');
				deleteBtn.className = 'card-action-btn';
				deleteBtn.dataset.action = 'delete-card';
				deleteBtn.setAttribute('aria-label', `Delete card: ${card.front}`);
				deleteBtn.textContent = 'Delete';

				overlay.appendChild(editBtn);
				overlay.appendChild(deleteBtn);

				inner.appendChild(front);
				inner.appendChild(back);

				article.appendChild(inner);
				article.appendChild(overlay);

				cardsContainer.appendChild(article);
			});
		}

		function addDeck(name) {
			const d = { id: nextId++, name: name || `Untitled deck ${nextId}`, cards: [], createdAt: Date.now(), updatedAt: Date.now() };
			decks.push(d);
			renderDeckList();
			selectDeck(d.id);
		}

		function updateDeck(id, name) {
			const deck = decks.find(d => d.id === Number(id));
			if (!deck) return;
			deck.name = name;
			deck.updatedAt = Date.now();
			renderDeckList();
			selectDeck(deck.id);
		}

		function deleteDeck(id) {
			const idx = decks.findIndex(d => d.id === Number(id));
			if (idx === -1) return;
			decks.splice(idx,1);
			renderDeckList();
			if (selectedDeckId === Number(id)) {
				selectDeck(decks.length ? decks[0].id : null);
			}
		}

		function addCardToDeck(deckId, front, back) {
			const deck = decks.find(d => d.id === Number(deckId));
			if (!deck) return;
			deck.cards.push({ front: front || '', back: back || '' });
			deck.updatedAt = Date.now();
			if (selectedDeckId === deck.id) renderCards(deck);
			renderDeckList();
		}

		function editCard(deckId, cardIndex, front, back) {
			const deck = decks.find(d => d.id === Number(deckId));
			if (!deck || !deck.cards[cardIndex]) return;
			deck.cards[cardIndex].front = front;
			deck.cards[cardIndex].back = back;
			deck.updatedAt = Date.now();
			if (selectedDeckId === deck.id) renderCards(deck);
			renderDeckList();
		}

		function deleteCard(deckId, cardIndex) {
			const deck = decks.find(d => d.id === Number(deckId));
			if (!deck || !deck.cards[cardIndex]) return;
			deck.cards.splice(cardIndex, 1);
			deck.updatedAt = Date.now();
			if (selectedDeckId === deck.id) renderCards(deck);
			renderDeckList();
		}

		// Event wiring
		addDeckBtn.addEventListener('click', (e) => {
			e.preventDefault();
			const name = prompt('Enter deck name:', 'New Deck');
			if (name) addDeck(name.trim());
		});

		deckListEl.addEventListener('click', (e) => {
			const li = e.target.closest('.deck-item');
			if (!li) return;
			const id = li.dataset.id;
			if (e.target.closest('[data-action="edit"]')) {
				const newName = prompt('Rename deck:', decks.find(d=>d.id===Number(id)).name);
				if (newName) updateDeck(id, newName.trim());
				return;
			}
			if (e.target.closest('[data-action="delete"]')) {
				if (confirm('Delete this deck?')) deleteDeck(id);
				return;
			}
			// normal select
			selectDeck(id);
		});

		// quick card add via double-click on header
		deckTitleEl.addEventListener('dblclick', () => {
			if (!selectedDeckId) return alert('Select a deck first');
			const front = prompt('Card front:');
			if (front === null) return;
			const back = prompt('Card back:');
			if (back === null) return;
			addCardToDeck(selectedDeckId, front, back);
			selectDeck(selectedDeckId);
		});

		// Card flip toggle on click
		cardsContainer.addEventListener('click', (e) => {
			const card = e.target.closest('.card');
			if (!card) return;
			// Don't toggle if clicking action buttons
			if (e.target.closest('[data-action]')) return;
			card.classList.toggle('is-flipped');
		});

		// Delegated card action handlers
		cardsContainer.addEventListener('click', (e) => {
			const btn = e.target.closest('[data-action]');
			if (!btn) return;

			const card = btn.closest('.card');
			if (!card) return;

			const deckId = card.dataset.deckId;
			const cardIndex = card.dataset.cardIndex;
			const action = btn.dataset.action;

			if (action === 'edit-card') {
				const deck = decks.find(d => d.id === Number(deckId));
				if (!deck || !deck.cards[cardIndex]) return;
				const oldCard = deck.cards[cardIndex];
				const newFront = prompt('Edit card front:', oldCard.front);
				if (newFront === null) return;
				const newBack = prompt('Edit card back:', oldCard.back);
				if (newBack === null) return;
				editCard(deckId, cardIndex, newFront.trim(), newBack.trim());
				selectDeck(deckId);
				card.classList.remove('is-flipped');
			} else if (action === 'delete-card') {
				if (confirm('Delete this card?')) {
					deleteCard(deckId, cardIndex);
				}
			}
		});

		// initial render
		renderDeckList();
		selectDeck(decks[0].id);

		// expose for debugging
		window.appDecks = { decks, addDeck, updateDeck, deleteDeck, addCardToDeck, selectDeck };
	})();

	// Debounced Search Implementation
	(function() {
		const searchInput = document.getElementById('search-input');
		const searchCount = document.getElementById('search-count');
		const cardsContainer = document.querySelector('.cards-container');

		if (!searchInput || !searchCount || !cardsContainer) return;

		let searchTimeout = null;
		let currentDeck = null;

		/**
		 * Debounced search handler (300ms delay)
		 */
		function performSearch(query) {
			if (!currentDeck) return;

			const trimmed = query.toLowerCase().trim();

			if (!trimmed) {
				// No search - show all cards
				renderAllCards(currentDeck);
				searchCount.textContent = '';
				return;
			}

			// Filter cards based on front or back matching
			const matchedCards = currentDeck.cards.filter(card =>
				card.front.toLowerCase().includes(trimmed) ||
				card.back.toLowerCase().includes(trimmed)
			);

			renderFilteredCards(currentDeck, matchedCards);
			searchCount.textContent = `${matchedCards.length} of ${currentDeck.cards.length} match`;
		}

		/**
		 * Render all cards for the current deck
		 */
		function renderAllCards(deck) {
			cardsContainer.replaceChildren();
			if (!deck || !deck.cards.length) {
				const emptyEl = window.a11y.createEmptyState(
					'📝',
					'No flashcards yet',
					'Double-click the deck name or use the Edit button to add cards to this deck.',
					null
				);
				cardsContainer.appendChild(emptyEl);
				return;
			}
			deck.cards.forEach((card, idx) => createCardElement(card, idx, deck.id));
		}

		/**
		 * Render only matched cards
		 */
		function renderFilteredCards(deck, matchedCards) {
			cardsContainer.replaceChildren();
			if (!matchedCards.length) {
				const emptyEl = window.a11y.createEmptyState(
					'🔍',
					'No cards match',
					`Try searching with different keywords.`,
					null
				);
				cardsContainer.appendChild(emptyEl);
				window.a11y.announceToScreenReader(`No cards match your search in "${deck.name}"`);
				return;
			}
			matchedCards.forEach((card, idx) => {
				// Find original index to preserve card operations
				const originalIdx = deck.cards.indexOf(card);
				createCardElement(card, originalIdx, deck.id);
			});
			window.a11y.announceToScreenReader(`Found ${matchedCards.length} card${matchedCards.length !== 1 ? 's' : ''}`);
		}

		/**
		 * Create and append a card element
		 */
		function createCardElement(card, idx, deckId) {
			const article = document.createElement('article');
			article.className = 'card';
			article.dataset.cardIndex = idx;
			article.dataset.deckId = deckId;
			article.setAttribute('aria-label', `Card ${idx + 1}: ${card.front}`);

			const inner = document.createElement('div');
			inner.className = 'card-inner';

			const front = document.createElement('div');
			front.className = 'card-front';
			const frontP = document.createElement('p');
			frontP.textContent = card.front;
			front.appendChild(frontP);

			const back = document.createElement('div');
			back.className = 'card-back';
			const backP = document.createElement('p');
			backP.textContent = card.back;
			back.appendChild(backP);

			const overlay = document.createElement('div');
			overlay.className = 'card-overlay';

			const editBtn = document.createElement('button');
			editBtn.className = 'card-action-btn';
			editBtn.dataset.action = 'edit-card';
			editBtn.setAttribute('aria-label', `Edit card: ${card.front}`);
			editBtn.textContent = 'Edit';

			const deleteBtn = document.createElement('button');
			deleteBtn.className = 'card-action-btn';
			deleteBtn.dataset.action = 'delete-card';
			deleteBtn.setAttribute('aria-label', `Delete card: ${card.front}`);
			deleteBtn.textContent = 'Delete';

			overlay.appendChild(editBtn);
			overlay.appendChild(deleteBtn);

			inner.appendChild(front);
			inner.appendChild(back);

			article.appendChild(inner);
			article.appendChild(overlay);

			cardsContainer.appendChild(article);
		}

		// Search input handler with debounce
		searchInput.addEventListener('input', (e) => {
			clearTimeout(searchTimeout);
			const query = e.target.value;
			searchTimeout = setTimeout(() => {
				performSearch(query);
			}, 300);
		});

		// Update search when deck changes
		const originalSelectDeck = window.appDecks.selectDeck;
		window.appDecks.selectDeck = function(id) {
			originalSelectDeck.call(this, id);
			currentDeck = window.appDecks.decks.find(d => d.id === Number(id));
			searchInput.value = '';
			searchCount.textContent = '';
		};

		// Update on card add/edit/delete
		const originalRenderCards = window.appDecks.renderCards;
		if (originalRenderCards) {
			window.appDecks.renderCards = function(deck) {
				currentDeck = deck;
				searchInput.value = '';
				searchCount.textContent = '';
				renderAllCards(deck);
			};
		}
	})();
	(function() {
		const studyMode = document.getElementById('study-mode');
		const studyDeckTitle = document.getElementById('study-deck-title');
		const studyCard = document.getElementById('study-card');
		const studyCardText = document.getElementById('study-card-text');
		const studyCardAnswer = document.getElementById('study-card-answer');
		const studyCardNum = document.getElementById('study-card-num');
		const studyCardTotal = document.getElementById('study-card-total');
		const exitStudyBtn = document.getElementById('exit-study-btn');
		const prevBtn = document.getElementById('study-prev-btn');
		const nextBtn = document.getElementById('study-next-btn');
		const actionButtons = document.querySelector('.action-buttons');

		if (!studyMode || !actionButtons) return;

		let currentDeckId = null;
		let currentCardIndex = 0;
		let studyKeyHandler = null;

		function enterStudyMode(deckId) {
			const deck = window.appDecks.decks.find(d => d.id === Number(deckId));
			if (!deck || !deck.cards.length) {
				alert('No cards in this deck to study.');
				return;
			}

			currentDeckId = deckId;
			currentCardIndex = 0;

			// Show study mode, hide main content
			studyMode.classList.remove('hidden');
			document.body.style.overflow = 'hidden';

			// Update UI
			studyDeckTitle.textContent = `Study: ${deck.name}`;
			studyCardTotal.textContent = deck.cards.length;
			renderStudyCard();

			// Set up keyboard handler
			studyKeyHandler = (e) => handleStudyKeypress(e);
			document.addEventListener('keydown', studyKeyHandler);
		}

		function exitStudyMode() {
			studyMode.classList.add('hidden');
			document.body.style.overflow = '';
			currentDeckId = null;
			currentCardIndex = 0;

			// Clean up keyboard handler
			if (studyKeyHandler) {
				document.removeEventListener('keydown', studyKeyHandler);
				studyKeyHandler = null;
			}
		}

		function renderStudyCard() {
			const deck = window.appDecks.decks.find(d => d.id === currentDeckId);
			if (!deck || !deck.cards[currentCardIndex]) return;

			const card = deck.cards[currentCardIndex];
			studyCardNum.textContent = currentCardIndex + 1;
			studyCardText.textContent = card.front;
			studyCardAnswer.textContent = card.back;
			studyCard.classList.remove('is-flipped');

			// Update button states
			prevBtn.disabled = currentCardIndex === 0;
			nextBtn.disabled = currentCardIndex === deck.cards.length - 1;
		}

		function goToPreviousCard() {
			if (currentCardIndex > 0) {
				currentCardIndex--;
				renderStudyCard();
			}
		}

		function goToNextCard() {
			const deck = window.appDecks.decks.find(d => d.id === currentDeckId);
			if (deck && currentCardIndex < deck.cards.length - 1) {
				currentCardIndex++;
				renderStudyCard();
			}
		}

		function handleStudyKeypress(e) {
			if (e.key === 'Escape') {
				e.preventDefault();
				exitStudyMode();
			} else if (e.key === ' ') {
				e.preventDefault();
				studyCard.classList.toggle('is-flipped');
			} else if (e.key === 'ArrowLeft') {
				e.preventDefault();
				goToPreviousCard();
			} else if (e.key === 'ArrowRight') {
				e.preventDefault();
				goToNextCard();
			}
		}

		// Wire Study Deck button
		actionButtons.addEventListener('click', (e) => {
			if (e.target.textContent === 'Study Deck') {
				e.preventDefault();
				if (window.appDecks) {
					const selectedDeckId = window.appDecks.decks.find(d => 
						d.name === document.querySelector('.deck-header h2').textContent
					)?.id;
					if (selectedDeckId) enterStudyMode(selectedDeckId);
				}
			}
		});

		// Study mode controls
		exitStudyBtn.addEventListener('click', (e) => {
			e.preventDefault();
			exitStudyMode();
		});

		prevBtn.addEventListener('click', (e) => {
			e.preventDefault();
			goToPreviousCard();
		});

		nextBtn.addEventListener('click', (e) => {
			e.preventDefault();
			goToNextCard();
		});

		// Click to flip card in study mode
		studyCard.addEventListener('click', () => {
			studyCard.classList.toggle('is-flipped');
		});

		// Expose for debugging
		window.appStudyMode = { enterStudyMode, exitStudyMode };
	})();


