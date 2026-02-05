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
			deckListEl.innerHTML = decks.map(d => {
				return `
					<li class="deck-item" data-id="${d.id}">
						<a href="#" class="deck-link">${escapeHtml(d.name)}</a>
						<span class="card-count">${d.cards.length} cards</span>
						<div class="deck-actions" aria-hidden="true">
							<button class="btn btn-secondary edit-deck" data-action="edit" data-id="${d.id}">Edit</button>
							<button class="btn btn-secondary delete-deck" data-action="delete" data-id="${d.id}">Delete</button>
						</div>
					</li>
				`;
			}).join('');
		}

		function escapeHtml(str) {
			return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[s]));
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
			if (!deck || !deck.cards.length) {
				cardsContainer.innerHTML = '<p class="text-muted">No cards in this deck yet.</p>';
				return;
			}
			cardsContainer.innerHTML = deck.cards.map(card => {
				return `
					<article class="card">
						<div class="card-inner">
							<div class="card-front"><p>${escapeHtml(card.front)}</p></div>
							<div class="card-back"><p>${escapeHtml(card.back)}</p></div>
						</div>
					</article>
				`;
			}).join('');
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

		// initial render
		renderDeckList();
		selectDeck(decks[0].id);

		// expose for debugging
		window.appDecks = { decks, addDeck, updateDeck, deleteDeck, addCardToDeck, selectDeck };
	})();


