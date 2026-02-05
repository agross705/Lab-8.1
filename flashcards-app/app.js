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

