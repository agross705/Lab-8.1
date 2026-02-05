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
			{ id: 1, name: 'Biology 101', cards: [], createdAt: Date.now(), updatedAt: Date.now() },
			{ id: 2, name: 'Spanish Vocab', cards: [], createdAt: Date.now(), updatedAt: Date.now() },
			{ id: 3, name: 'Math Formulas', cards: [], createdAt: Date.now(), updatedAt: Date.now() }
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
				const emptyMsg = document.createElement('p');
				emptyMsg.className = 'text-muted';
				emptyMsg.textContent = 'No cards in this deck yet.';
				cardsContainer.appendChild(emptyMsg);
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
				editBtn.textContent = 'Edit';

				const deleteBtn = document.createElement('button');
				deleteBtn.className = 'card-action-btn';
				deleteBtn.dataset.action = 'delete-card';
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


