const state = {
  hunger: 80,
  thirst: 75,
  selectedMovie: 0,
};

const movies = [
  { title: 'Yıldız Savaşçıları: Gece', genre: 'Bilim Kurgu', video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { title: 'Gülümseme Partisi', genre: 'Komedi', video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { title: 'Gece Yolculuğu', genre: 'Dram', video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
];

const hungerBar = document.getElementById('hungerBar');
const thirstBar = document.getElementById('thirstBar');
const hungerValue = document.getElementById('hungerValue');
const thirstValue = document.getElementById('thirstValue');
const movieList = document.getElementById('movieList');
const playButton = document.getElementById('playButton');
const modal = document.getElementById('movieModal');
const modalTitle = document.getElementById('modalTitle');
const closeModal = document.getElementById('closeModal');
const moviePlayer = document.getElementById('moviePlayer');
const toast = document.getElementById('toast');

function updateBars() {
  hungerBar.style.width = `${state.hunger}%`;
  thirstBar.style.width = `${state.thirst}%`;
  hungerValue.textContent = `${state.hunger}%`;
  thirstValue.textContent = `${state.thirst}%`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.add('hidden'), 1800);
}

function renderMovies() {
  movieList.innerHTML = '';
  movies.forEach((movie, index) => {
    const item = document.createElement('button');
    item.className = `movie-option ${index === state.selectedMovie ? 'active' : ''}`;
    item.innerHTML = `<span>${movie.title}</span><small>${movie.genre}</small>`;
    item.addEventListener('click', () => {
      state.selectedMovie = index;
      renderMovies();
      showToast(`${movie.title} seçildi`);
    });
    movieList.appendChild(item);
  });
}

function openMovie() {
  const movie = movies[state.selectedMovie];
  modalTitle.textContent = movie.title;
  moviePlayer.src = movie.video;
  moviePlayer.load();
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeMovie() {
  moviePlayer.pause();
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function handleOrder(type) {
  if (type === 'pizza' || type === 'burger') {
    state.hunger = Math.min(100, state.hunger + 18);
    showToast('Yemek siparişi geldi!');
  }
  if (type === 'water' || type === 'cola') {
    state.thirst = Math.min(100, state.thirst + 18);
    showToast('İçecek siparişi geldi!');
  }
  updateBars();
}

setInterval(() => {
  state.hunger = Math.max(0, state.hunger - 2);
  state.thirst = Math.max(0, state.thirst - 3);
  updateBars();
}, 5000);

document.querySelectorAll('[data-order]').forEach((button) => {
  button.addEventListener('click', () => handleOrder(button.dataset.order));
});

playButton.addEventListener('click', openMovie);
closeModal.addEventListener('click', closeMovie);
modal.addEventListener('click', (event) => {
  if (event.target === modal) closeMovie();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMovie();
});

renderMovies();
updateBars();
