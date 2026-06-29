const state = {
  hunger: 80,
  thirst: 75,
  selectedMovie: 0,
  cameraX: 0,
  cameraY: 0,
  pendingOrders: [],
  drag: null,
  placingItem: false,
  roomItems: [],
  roomFriends: [],
};

const movies = [
  {
    title: "Yıldız Savaşçıları: Gece",
    genre: "Bilim Kurgu",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    title: "Gülümseme Partisi",
    genre: "Komedi",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    title: "Gece Yolculuğu",
    genre: "Dram",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
];

const hungerBar = document.getElementById("hungerBar");
const thirstBar = document.getElementById("thirstBar");
const hungerValue = document.getElementById("hungerValue");
const thirstValue = document.getElementById("thirstValue");
const movieList = document.getElementById("movieList");
const playButton = document.getElementById("playButton");
const modal = document.getElementById("movieModal");
const modalTitle = document.getElementById("modalTitle");
const closeModal = document.getElementById("closeModal");
const moviePlayer = document.getElementById("moviePlayer");
const toast = document.getElementById("toast");
const orderList = document.getElementById("orderList");
const roomScene = document.querySelector(".room-scene");
const exploreButtons = document.querySelectorAll("[data-dir]");
const itemSelect = document.getElementById("itemSelect");
const placeModeButton = document.getElementById("placeModeButton");
const clearItemsButton = document.getElementById("clearItemsButton");
const roomItemsList = document.getElementById("roomItems");
const friendInput = document.getElementById("friendInput");
const addFriendButton = document.getElementById("addFriendButton");
const friendList = document.getElementById("friendList");
const placementHint = document.getElementById("placementHint");
const joinModal = document.getElementById("joinModal");
const joinBtn = document.getElementById("joinBtn");
const joinName = document.getElementById("joinName");
const joinRoom = document.getElementById("joinRoom");

let ws = null;

function connectWs(roomId, name) {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${protocol}//${location.host}/ws`;
  ws = new WebSocket(url);
  ws.addEventListener("open", () => {
    ws.send(JSON.stringify({ type: "join", room: roomId, name }));
    state.roomId = roomId;
    state.userName = name;
    joinModal.classList.add("hidden");
    showToast(`Odaya katıldın: ${roomId}`);
  });

  ws.addEventListener("message", (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg.type === "init") {
        state.roomItems = msg.items || [];
        state.roomFriends = msg.users || [];
        renderRoomItems();
        renderRoomObjects();
        renderFriends();
      }
      if (msg.type === "presence") {
        state.roomFriends = msg.users || [];
        renderFriends();
      }
      if (msg.type === "item_placed") {
        const item = msg.item;
        if (!state.roomItems.find((i) => i.id === item.id)) {
          state.roomItems.push(item);
          renderRoomItems();
          renderRoomObjects();
        }
      }
      if (msg.type === "item_removed") {
        state.roomItems = state.roomItems.filter((i) => i.id !== msg.id);
        renderRoomItems();
        renderRoomObjects();
      }
    } catch (e) {
      console.error(e);
    }
  });
}

function updateBars() {
  hungerBar.style.width = `${state.hunger}%`;
  thirstBar.style.width = `${state.thirst}%`;
  hungerValue.textContent = `${state.hunger}%`;
  thirstValue.textContent = `${state.thirst}%`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.add("hidden"), 2200);
}

function setCameraTransform() {
  roomScene.style.transform =
    `translate(${state.cameraX}px, ${state.cameraY}px)`;
}

function moveCamera(dx, dy) {
  state.cameraX += dx;
  state.cameraY += dy;
  setCameraTransform();
}

function renderOrders() {
  if (state.pendingOrders.length === 0) {
    orderList.innerHTML = '<div class="order-empty">Henüz sipariş yok.</div>';
    return;
  }

  orderList.innerHTML = "";
  state.pendingOrders.forEach((order) => {
    const minutes = Math.floor(order.remaining / 60);
    const seconds = order.remaining % 60;
    const item = document.createElement("div");
    item.className = "order-item";
    item.innerHTML = `<span>${order.label}</span><small>${minutes}:${
      seconds.toString().padStart(2, "0")
    }</small>`;
    orderList.appendChild(item);
  });
}

function tickOrders() {
  state.pendingOrders = state.pendingOrders
    .map((order) => ({
      ...order,
      remaining: Math.max(0, Math.ceil((order.readyAt - Date.now()) / 1000)),
    }))
    .filter((order) => order.remaining > 0);
  renderOrders();
}

function renderMovies() {
  movieList.innerHTML = "";
  movies.forEach((movie, index) => {
    const item = document.createElement("button");
    item.className = `movie-option ${
      index === state.selectedMovie ? "active" : ""
    }`;
    item.innerHTML = `<span>${movie.title}</span><small>${movie.genre}</small>`;
    item.addEventListener("click", () => {
      state.selectedMovie = index;
      renderMovies();
      showToast(`${movie.title} seçildi`);
    });
    movieList.appendChild(item);
  });
}

function renderRoomItems() {
  roomItemsList.innerHTML = "";

  if (state.roomItems.length === 0) {
    roomItemsList.innerHTML = '<div class="order-empty">Henüz nesne yok.</div>';
    return;
  }

  state.roomItems.forEach((item) => {
    const chip = document.createElement("button");
    chip.className = "pill";
    chip.textContent = item.label;
    chip.addEventListener("click", () => {
      state.roomItems = state.roomItems.filter((entry) => entry.id !== item.id);
      renderRoomItems();
      renderRoomObjects();
      showToast(`${item.label} kaldırıldı`);
    });
    roomItemsList.appendChild(chip);
  });
}

function renderRoomObjects() {
  roomScene.querySelectorAll(".room-object").forEach((element) =>
    element.remove()
  );

  state.roomItems.forEach((item) => {
    const element = document.createElement("div");
    element.className = `room-object ${item.kind}`;
    element.dataset.id = item.id;
    element.style.left = `${item.x}%`;
    element.style.top = `${item.y}%`;
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      if (state.placingItem) return;
      state.roomItems = state.roomItems.filter((entry) => entry.id !== item.id);
      renderRoomItems();
      renderRoomObjects();
      showToast(`${item.label} kaldırıldı`);
      if (ws && state.roomId) {
        try { ws.send(JSON.stringify({ type: "remove_item", room: state.roomId, id: item.id })); } catch (e) {}
      }
    });
    roomScene.appendChild(element);
  });
}

function renderFriends() {
  friendList.innerHTML = "";

  if (state.roomFriends.length === 0) {
    friendList.innerHTML = '<div class="order-empty">Henüz arkadaş yok.</div>';
    return;
  }

  state.roomFriends.forEach((friend) => {
    const chip = document.createElement("div");
    chip.className = "pill";
    chip.textContent = friend;
    friendList.appendChild(chip);
  });
}

function setPlaceMode(active) {
  state.placingItem = active;
  placeModeButton.classList.toggle("active", active);
  placeModeButton.textContent = active ? "İptal et" : "Nesne ekle";
  roomScene.classList.toggle("placing", active);
  placementHint.classList.toggle("hidden", !active);
}

function addRoomItem() {
  const kind = itemSelect.value;
  const labels = {
    lamp: "Lamba",
    plant: "Bitki",
    table: "Masa",
    chair: "Koltuk",
    poster: "Poster",
  };

  const item = {
    id: Date.now(),
    kind,
    label: labels[kind],
    x: 50,
    y: 50,
  };

  state.roomItems.push(item);
  renderRoomItems();
  renderRoomObjects();
  showToast(`${item.label} eklendi`);
}

function addFriend() {
  const name = friendInput.value.trim();
  if (!name) return;

  state.roomFriends.push(name);
  friendInput.value = "";
  renderFriends();
  showToast(`${name} arkadaş listesine eklendi`);
}

function openMovie() {
  const movie = movies[state.selectedMovie];
  modalTitle.textContent = movie.title;
  moviePlayer.src = movie.video;
  moviePlayer.load();
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeMovie() {
  moviePlayer.pause();
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

function handleOrder(type) {
  const labels = {
    pizza: "Pizza",
    burger: "Burger",
    water: "Su",
    cola: "Kola",
  };

  const label = labels[type];
  const order = {
    id: Date.now(),
    label,
    type,
    remaining: 120,
    readyAt: Date.now() + 120000,
  };

  state.pendingOrders.push(order);
  renderOrders();
  showToast(`${label} siparişi verildi. 2 dakika sonra gelecek.`);

  window.setTimeout(() => {
    if (type === "pizza" || type === "burger") {
      state.hunger = Math.min(100, state.hunger + 18);
    }
    if (type === "water" || type === "cola") {
      state.thirst = Math.min(100, state.thirst + 18);
    }

    state.pendingOrders = state.pendingOrders.filter((item) =>
      item.id !== order.id
    );
    renderOrders();
    updateBars();
    showToast(`${label} teslim edildi!`);
  }, 120000);
}

setInterval(() => {
  state.hunger = Math.max(0, state.hunger - 2);
  state.thirst = Math.max(0, state.thirst - 3);
  updateBars();
}, 5000);

setInterval(tickOrders, 1000);

document.querySelectorAll("[data-order]").forEach((button) => {
  button.addEventListener("click", () => handleOrder(button.dataset.order));
});

playButton.addEventListener("click", openMovie);
closeModal.addEventListener("click", closeMovie);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeMovie();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMovie();
});

roomScene.addEventListener("pointerdown", (event) => {
  if (state.placingItem) return;

  state.drag = {
    startX: event.clientX,
    startY: event.clientY,
    initialX: state.cameraX,
    initialY: state.cameraY,
  };
  roomScene.classList.add("dragging");
  roomScene.setPointerCapture(event.pointerId);
});

roomScene.addEventListener("pointermove", (event) => {
  if (!state.drag) return;
  const dx = event.clientX - state.drag.startX;
  const dy = event.clientY - state.drag.startY;
  state.cameraX = state.drag.initialX + dx;
  state.cameraY = state.drag.initialY + dy;
  setCameraTransform();
});

const stopDragging = (event) => {
  if (!state.drag) return;
  roomScene.classList.remove("dragging");
  state.drag = null;
  roomScene.releasePointerCapture(event.pointerId);
};

roomScene.addEventListener("pointerup", stopDragging);
roomScene.addEventListener("pointerleave", stopDragging);
roomScene.addEventListener("pointercancel", stopDragging);
roomScene.addEventListener("click", (event) => {
  if (!state.placingItem) return;

  const rect = roomScene.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  const item = {
    id: Date.now(),
    kind: itemSelect.value,
    label: {
      lamp: "Lamba",
      plant: "Bitki",
      table: "Masa",
      chair: "Koltuk",
      poster: "Poster",
    }[itemSelect.value],
    x: Math.max(8, Math.min(92, x)),
    y: Math.max(10, Math.min(90, y)),
  };

  state.roomItems.push(item);
  renderRoomItems();
  renderRoomObjects();
  showToast(`${item.label} odada yerleştirildi`);
  if (ws && state.roomId) {
    try { ws.send(JSON.stringify({ type: "place_item", room: state.roomId, item })); } catch (e) {}
  }
});

exploreButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.dir;
    if (action === "up") moveCamera(0, 40);
    if (action === "down") moveCamera(0, -40);
    if (action === "left") moveCamera(40, 0);
    if (action === "right") moveCamera(-40, 0);
    if (action === "reset") {
      state.cameraX = 0;
      state.cameraY = 0;
      setCameraTransform();
    }
  });
});

placeModeButton.addEventListener("click", () => {
  setPlaceMode(!state.placingItem);
});

clearItemsButton.addEventListener("click", () => {
  state.roomItems = [];
  renderRoomItems();
  renderRoomObjects();
  showToast("Oda temizlendi");
});

addFriendButton.addEventListener("click", addFriend);
friendInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addFriend();
  }
});

joinBtn.addEventListener("click", () => {
  const name = (joinName.value || "").trim() || `Guest${Math.floor(Math.random()*900)+100}`;
  const room = (joinRoom.value || "").trim() || "lobby";
  connectWs(room, name);
});

joinName.addEventListener("keydown", (e) => { if (e.key === 'Enter') joinBtn.click(); });
joinRoom.addEventListener("keydown", (e) => { if (e.key === 'Enter') joinBtn.click(); });

renderMovies();
renderOrders();
renderRoomItems();
renderRoomObjects();
renderFriends();
updateBars();
setPlaceMode(false);
