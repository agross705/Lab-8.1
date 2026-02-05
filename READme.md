# Module 327 | Mod 8 | Lab 8.1: An AI Coding Challenge

## Table of contents

- [Overview](#overview)
  - [The challenge](#the-challenge)
  - [Screenshot](#screenshot)
  - [Links](#links)
- [My process](#my-process)
  - [Built with](#built-with)
  - [Reflections](#reflections)
  - [What I learned](#what-i-learned)
  - [Continued development](#continued-development)
  - [Useful resources](#useful-resources)
- [Author](#author)
- [Acknowledgments](#acknowledgments)


## Overview

~ Scenario ~
You are tasked with building a browser-based Flashcards Study App in 2 hours. You know HTML/CSS/JS, but some features (modals, animations, keyboard accessibility, data persistence) may be time-consuming. You will leverage AI coding assistants (GitHub Copilot, Windsurf, Cursor) to move faster while actively reviewing and refining AI output. AI can be inconsistent, so you must understand and fix the code it generates.

~ Instructions ~
Using the information provided in this lab, build a Flashcards web app. The app should be a single-page app, with no build tools required. Your app should be able to create, edit, delete decks and cards, and study the cards in a deck. The app should be responsive and accessible.

This task is open-ended, so you are free to implement the app in any way you see fit. However, you should use the information provided in this lab to help you build the app.

At this stage, building an app like this within the time constraint is not feasible. You should use AI assistants to help you build the app. Throughout this process, you should be actively reviewing and refining the AI-generated code. AI-generated code is not always correct, nor is it always the best way to implement a feature. You should be critical of the code and improve it as needed.

The expectation is not to build a fully functional app. You should explore the capabilities, and pitfalls, of using AI to build a web app quickly. As you continue to learn, you will build more complex applications. It is important to understand the capabilities and limitations of AI-assisted development before using it in more complex scenarios.

### The challenge

~ Requirements ~
- App supports multiple decks. Each deck has cards with front/back text.
- Create, edit, delete decks and cards.
- Study mode: flip cards, next/previous, shuffle.
- Search/filter within a deck by keyword.
- Persist data using LocalStorage (decks, cards, last active deck).
- Responsive layout; basic accessibility (labels, focus, keyboard navigation).
- Clean, readable UI.

~ Stretch Goals (optional) ~
- Import/export deck JSON.
- Spaced repetition (simple “Again/Good/Easy” intervals).
- Keyboard shortcuts (ArrowLeft/Right, Space to flip, Enter to submit).
- Progress and stats per deck.

### Screenshot

### Links

- Assignment URL: https://ps-lms.vercel.app/curriculum/se/327/lab-1
- Live Site URL: https://github.com/agross705/Lab-8.1.git

## My process

- Starter Setup
- Base UI & Layout
- Deck CRUD (Create/Read/Update/Delete)
- Card CRUD + Flip Animation
- Study Mode + Navigation
- Persistence & Search
- QA & Polish

### Built with

- VS Code with GitHub Copilot (primary). Optional: Windsurf or Cursor.
- Browser devtools.
- No frameworks required. Optional libraries allowed. Avoid large UI frameworks.

### Reflections

~ Where AI saved time. ~ Commit: a705094
- Creating the basic HTML & CSS skeletons for a quick view of what the project could potentually look like.

~ At least one AI bug you identified and how you fixed it. ~ Commit: bb56d62
- Context failure - fixed by giving very detailed prompt of issue & fix suggestion.

~ A code snippet you refactored for clarity. ~ Commit: 6fcfcf6
- deckListEl.innerHTML = decks.map(d => {
				return `
					<li class="deck-item" data-id="${d.id}">
						<a href="#" class="deck-link">${escapeHtml(d.name)}</a>
						<span class="card-count">${d.cards.length} cards</span>
						<div class

~ One accessibility improvement you added. ~ Commit: 217eb96
- Visual Design - High-contrast colors, clear fonts, and descriptive alt text for images. 

~ What prompt changes improved AI output. ~ Commit: dac2dd3
- Change the edit and delete buttons on the flashcards to always be readable
- I can't see the text on the edit and delete buttons for the flashcards because of the color of the text. Can you change the color contrast between the text and the background color for the buttons?

### What I learned

- Used additional code that is never used
- Missing accessibility names
- Changes need to be very clear and detailed for results
- I despise using AI with the fury of a thousand suns!!!

### Continued development

### Useful resources

## Author

- GitHub Copilot Chat
- GitHub | agross705 | https://github.com/agross705

## Acknowledgments
