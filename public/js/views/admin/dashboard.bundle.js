// public/js/core/modals.js
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}
function initModalHandlers() {
  document.querySelectorAll("[data-open-modal]").forEach((button) => {
    button.addEventListener("click", function(e) {
      e.preventDefault();
      const modalId = this.getAttribute("data-open-modal");
      openModal(modalId);
    });
  });
  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", function(e) {
      e.preventDefault();
      const modalId = this.getAttribute("data-close-modal");
      closeModal(modalId);
    });
  });
  document.querySelectorAll(".popup").forEach((modal) => {
    modal.addEventListener("click", function(e) {
      if (e.target === this) {
        e.preventDefault();
        this.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
  });
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      document.querySelectorAll(".popup.active").forEach((modal) => {
        modal.classList.remove("active");
        document.body.style.overflow = "";
      });
    }
  });
}
function closeAddHallModal(event) {
  if (event) event.preventDefault();
  closeModal("addHallModal");
}
function closeAddMovieModal(event) {
  if (event) event.preventDefault();
  closeModal("addMovieModal");
}
function closeEditMovieModal(event) {
  if (event) event.preventDefault();
  closeModal("editMovieModal");
}
function closeAddSessionModal(event) {
  if (event) event.preventDefault();
  closeModal("addSessionModal");
}
function closeEditSessionModal(event) {
  if (event) event.preventDefault();
  closeModal("editSessionModal");
}
function closeDeleteHallModal(event) {
  if (event) event.preventDefault();
  closeModal("deleteHallModal");
}
function closeDeleteMovieModal(event) {
  if (event) event.preventDefault();
  closeModal("deleteMovieModal");
}
function closeDeleteSessionModal(event) {
  if (event) event.preventDefault();
  closeModal("deleteSessionModal");
}
function closeAllModals(event) {
  if (event) event.preventDefault();
  document.querySelectorAll(".popup.active").forEach((modal) => {
    modal.classList.remove("active");
  });
  document.body.style.overflow = "";
}

// public/js/modules/halls.js
var HallsManager = class {
  constructor(notificationSystem) {
    this.notificationSystem = notificationSystem;
    this.init();
  }
  init() {
    this.bindEvents();
  }
  bindEvents() {
    document.addEventListener("click", (e) => {
      if (e.target.hasAttribute("data-delete-hall")) {
        e.preventDefault();
        const hallId = e.target.getAttribute("data-delete-hall");
        const hallName = e.target.getAttribute("data-hall-name");
        this.openDeleteModal(hallId, hallName);
      }
    });
    const deleteHallForm = document.querySelector("#deleteHallModal form");
    if (deleteHallForm) {
      deleteHallForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const hallId = deleteHallForm.querySelector('input[name="hall_id"]').value;
        const hallName = deleteHallForm.querySelector("#hallNameToDelete").textContent;
        const csrfToken = deleteHallForm.querySelector('input[name="_token"]').value;
        this.confirmDelete(hallId, hallName, csrfToken);
      });
    }
  }
  openDeleteModal(hallId, hallName) {
    const modal = document.getElementById("deleteHallModal");
    if (!modal) {
      console.error("Delete hall modal not found");
      return;
    }
    modal.querySelector('input[name="hall_id"]').value = hallId;
    modal.querySelector("#hallNameToDelete").textContent = hallName;
    modal.classList.add("active");
  }
  closeDeleteModal() {
    const modal = document.getElementById("deleteHallModal");
    if (modal) {
      modal.classList.remove("active");
    }
  }
  async confirmDelete(hallId, hallName, csrfToken) {
    try {
      console.log("Starting hall deletion:", { hallId, hallName });
      const response = await fetch(`/admin/halls/${hallId}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-TOKEN": csrfToken,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });
      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);
      if (data.success) {
        this.closeDeleteModal();
        this.removeHallFromList(hallId);
        this.updateAllSections(hallId);
        this.showNotification("\u0417\u0430\u043B \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D", "success");
      } else {
        this.showNotification("\u041E\u0448\u0438\u0431\u043A\u0430: " + data.message, "error");
      }
    } catch (error) {
      console.error("Error deleting hall:", error);
      this.showNotification("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u0437\u0430\u043B\u0430", "error");
    }
  }
  removeHallFromList(hallId) {
    const hallElement = document.querySelector(`[data-hall-id="${hallId}"]`);
    if (hallElement) {
      hallElement.remove();
    }
  }
  // Обновление всех секций
  updateAllSections(deletedHallId) {
    this.updateHallConfigurationSection(deletedHallId);
    this.updatePriceConfigurationSection(deletedHallId);
    this.updateSalesManagementSection(deletedHallId);
    this.updateSessionsSection(deletedHallId);
    this.checkAndHideSections();
  }
  updateHallConfigurationSection(deletedHallId) {
    const hallSelector = document.querySelector("#hallSelector");
    if (!hallSelector) return;
    const hallRadio = hallSelector.querySelector(`input[value="${deletedHallId}"]`);
    if (hallRadio) {
      hallRadio.closest("li").remove();
    }
    const firstRadio = hallSelector.querySelector('input[type="radio"]');
    if (firstRadio) {
      firstRadio.checked = true;
      const hallId = firstRadio.value;
      if (typeof loadHallConfiguration === "function") {
        loadHallConfiguration(hallId);
      }
    }
  }
  updatePriceConfigurationSection(deletedHallId) {
    const priceSelector = document.querySelector('ul.conf-step__selectors-box input[name="prices-hall"]');
    if (!priceSelector) return;
    const priceContainer = priceSelector.closest("ul.conf-step__selectors-box");
    const priceRadio = priceContainer.querySelector(`input[value="${deletedHallId}"]`);
    if (priceRadio) {
      priceRadio.closest("li").remove();
    }
    const firstRadio = priceContainer.querySelector('input[type="radio"]');
    if (firstRadio) {
      firstRadio.checked = true;
      const hallId = firstRadio.value;
      if (typeof loadPriceConfiguration === "function") {
        loadPriceConfiguration(hallId);
      }
    }
  }
  updateSalesManagementSection(deletedHallId) {
    const salesList = document.querySelector(".conf-step__sales-list");
    if (!salesList) return;
    const salesItem = salesList.querySelector(`[data-toggle-sales="${deletedHallId}"]`);
    if (salesItem) {
      salesItem.closest("li").remove();
    }
  }
  // Обновление секции сеансов
  updateSessionsSection(deletedHallId) {
    const sessionsSection = document.getElementById("sessionsSection");
    if (!sessionsSection) {
      console.log("Sessions section not found");
      return;
    }
    console.log("Looking for hall timeline with hall-id:", deletedHallId);
    const hallTimeline = sessionsSection.querySelector(`.conf-step__timeline-hall[data-hall-id="${deletedHallId}"]`);
    if (hallTimeline) {
      console.log("Removing hall timeline:", hallTimeline);
      hallTimeline.remove();
    } else {
      console.log("Hall timeline not found for hall:", deletedHallId);
    }
    this.updateMoviesList(deletedHallId);
  }
  // Обновление списка фильмов
  updateMoviesList(deletedHallId) {
    const moviesList = document.getElementById("moviesList");
    if (!moviesList) return;
    const movies = moviesList.querySelectorAll(".conf-step__movie");
    movies.forEach((movie) => {
      const movieId = movie.getAttribute("data-movie-id");
      const remainingSessions = document.querySelectorAll(`.session-block[data-movie-id="${movieId}"]`);
      if (remainingSessions.length === 0) {
        movie.remove();
      }
    });
    const remainingMovies = moviesList.querySelectorAll(".conf-step__movie");
    if (remainingMovies.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "conf-step__empty-movies";
      emptyMessage.textContent = "\u041D\u0435\u0442 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u043D\u044B\u0445 \u0444\u0438\u043B\u044C\u043C\u043E\u0432";
      moviesList.appendChild(emptyMessage);
    }
  }
  checkAndHideSections() {
    const hallsList = document.querySelector(".conf-step__list");
    const hasHalls = hallsList && hallsList.children.length > 0;
    const dependentSections = [
      "#hallConfigurationSection",
      "#priceConfigurationSection",
      "#sessionsSection",
      "#salesManagementSection"
    ];
    dependentSections.forEach((selector) => {
      const section = document.querySelector(selector);
      if (section) {
        section.style.display = hasHalls ? "block" : "none";
      }
    });
    if (!hasHalls) {
      this.showNoHallsMessage();
    }
  }
  showNoHallsMessage() {
    console.log("No halls remaining");
  }
  showNotification(message, type = "info") {
    if (this.notificationSystem) {
      this.notificationSystem.show(message, type);
    } else {
      console.log(`[${type}] ${message}`);
    }
  }
};
async function loadHallConfiguration(hallId) {
  try {
    const response = await fetch(`/admin/halls/${hallId}/configuration`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const html = await response.text();
    const container = document.getElementById("hallConfiguration");
    if (container) {
      container.innerHTML = html;
      if (window.notifications) {
        window.notifications.show("\u041A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044F \u0437\u0430\u043B\u0430 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u0430", "success");
      }
    }
  } catch (error) {
    console.error("Error loading hall configuration:", error);
    if (window.notifications) {
      window.notifications.show("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435 \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0438 \u0437\u0430\u043B\u0430", "error");
    }
  }
}
async function loadPriceConfiguration(hallId) {
  try {
    const response = await fetch(`/admin/halls/${hallId}/prices`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const html = await response.text();
    const container = document.getElementById("priceConfiguration");
    if (container) {
      container.innerHTML = html;
      if (window.notifications) {
        window.notifications.show("\u041A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044F \u0446\u0435\u043D \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u0430", "success");
      }
    }
  } catch (error) {
    console.error("Error loading price configuration:", error);
    if (window.notifications) {
      window.notifications.show("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435 \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0438 \u0446\u0435\u043D", "error");
    }
  }
}
var halls_default = HallsManager;

// public/js/core/notifications.js
var NotificationSystem = class {
  constructor() {
    this.container = this.createContainer();
    this.init();
  }
  createContainer() {
    let container = document.getElementById("notifications-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "notifications-container";
      container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
      document.body.appendChild(container);
    }
    return container;
  }
  init() {
    this.convertBladeNotifications();
  }
  convertBladeNotifications() {
    const existingNotifications = document.querySelectorAll('.conf-step__wrapper[style*="background"]');
    existingNotifications.forEach((bladeNotification) => {
      let type = "info";
      if (bladeNotification.style.background.includes("#d4edda")) type = "success";
      if (bladeNotification.style.background.includes("#f8d7da")) type = "error";
      const message = bladeNotification.textContent.trim();
      this.show(message, type);
      bladeNotification.remove();
    });
  }
  show(message, type = "info", duration = 5e3) {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
            background: ${this.getBackgroundColor(type)};
            border: 1px solid ${this.getBorderColor(type)};
            color: ${this.getTextColor(type)};
            padding: 15px 20px;
            margin-bottom: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            cursor: pointer;
            animation: slideInRight 0.3s ease;
            position: relative;
            max-width: 350px;
        `;
    notification.innerHTML = `
            ${message}
            <span style="
                position: absolute;
                top: 5px;
                right: 10px;
                cursor: pointer;
                font-size: 18px;
                font-weight: bold;
                opacity: 0.7;
            ">\xD7</span>
        `;
    this.container.appendChild(notification);
    const closeBtn = notification.querySelector("span");
    const closeHandler = () => this.remove(notification);
    closeBtn.addEventListener("click", closeHandler);
    notification.addEventListener("click", closeHandler);
    if (duration > 0) {
      setTimeout(() => this.remove(notification), duration);
    }
    return notification;
  }
  remove(notification) {
    notification.style.animation = "slideOutRight 0.3s ease";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }
  getBackgroundColor(type) {
    const colors = {
      success: "#d4edda",
      error: "#f8d7da",
      info: "#d1ecf1",
      warning: "#fff3cd"
    };
    return colors[type] || colors.info;
  }
  getBorderColor(type) {
    const colors = {
      success: "#c3e6cb",
      error: "#f5c6cb",
      info: "#bee5eb",
      warning: "#ffeaa7"
    };
    return colors[type] || colors.info;
  }
  getTextColor(type) {
    const colors = {
      success: "#155724",
      error: "#721c24",
      info: "#0c5460",
      warning: "#856404"
    };
    return colors[type] || colors.info;
  }
};
var style = document.createElement("style");
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
var notifications_default = NotificationSystem;

// public/js/modules/accordeon.js
function initAccordeon() {
  const headers = document.querySelectorAll(".conf-step__header");
  headers.forEach((header) => {
    if (header.hasAttribute("data-accordeon-initialized")) {
      return;
    }
    header.setAttribute("data-accordeon-initialized", "true");
    header.addEventListener("click", () => {
      header.classList.toggle("conf-step__header_closed");
      header.classList.toggle("conf-step__header_opened");
    });
  });
}
function toggleAccordeonSection(header) {
  if (header) {
    header.classList.toggle("conf-step__header_closed");
    header.classList.toggle("conf-step__header_opened");
  }
}
function openAccordeonSection(header) {
  if (header) {
    header.classList.remove("conf-step__header_closed");
    header.classList.add("conf-step__header_opened");
  }
}
function closeAccordeonSection(header) {
  if (header) {
    header.classList.add("conf-step__header_closed");
    header.classList.remove("conf-step__header_opened");
  }
}
function closeAllAccordeonSections() {
  const headers = document.querySelectorAll(".conf-step__header");
  headers.forEach((header) => {
    header.classList.add("conf-step__header_closed");
    header.classList.remove("conf-step__header_opened");
  });
}
function openAllAccordeonSections() {
  const headers = document.querySelectorAll(".conf-step__header");
  headers.forEach((header) => {
    header.classList.remove("conf-step__header_closed");
    header.classList.add("conf-step__header_opened");
  });
}

// public/js/views/admin/hall-configuration.js
function showSafeNotification(message, type = "info") {
  if (window.notifications && typeof window.notifications.show === "function") {
    try {
      window.notifications.show(message, type);
    } catch (notificationError) {
      console.error("Notification system error:", notificationError);
      alert(message);
    }
  } else {
    console.log(`[${type}] ${message}`);
    alert(message);
  }
}
async function generateHallLayout(hallId) {
  try {
    const rowsInput = document.querySelector(`.hall-configuration[data-hall-id="${hallId}"] .rows-input`);
    const seatsInput = document.querySelector(`.hall-configuration[data-hall-id="${hallId}"] .seats-input`);
    if (!rowsInput || !seatsInput) {
      throw new Error("\u041F\u043E\u043B\u044F \u0432\u0432\u043E\u0434\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B");
    }
    const rows = parseInt(rowsInput.value);
    const seatsPerRow = parseInt(seatsInput.value);
    if (!rows || !seatsPerRow || rows < 1 || seatsPerRow < 1) {
      throw new Error("\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u0434\u043B\u044F \u0440\u044F\u0434\u043E\u0432 \u0438 \u043C\u0435\u0441\u0442");
    }
    const response = await fetch(`/admin/halls/${hallId}/generate-layout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content
      },
      body: JSON.stringify({
        rows,
        seats_per_row: seatsPerRow
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    const container = document.getElementById("hallLayout-" + hallId);
    if (container) {
      container.innerHTML = html;
      showSafeNotification("\u0421\u0445\u0435\u043C\u0430 \u0437\u0430\u043B\u0430 \u0441\u0433\u0435\u043D\u0435\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u0430", "success");
    } else {
      throw new Error("\u041A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440 \u0434\u043B\u044F \u0441\u0445\u0435\u043C\u044B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
    }
  } catch (error) {
    console.error("Error generating layout:", error);
    showSafeNotification("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 \u0441\u0445\u0435\u043C\u044B: " + error.message, "error");
  }
}
function changeSeatType(element) {
  const currentType = element.getAttribute("data-type");
  const types = ["regular", "vip", "blocked"];
  const currentIndex = types.indexOf(currentType);
  const nextType = types[(currentIndex + 1) % types.length];
  element.setAttribute("data-type", nextType);
  element.className = `conf-step__chair ${getSeatClass(nextType)}`;
}
function getSeatClass(type) {
  switch (type) {
    case "regular":
      return "conf-step__chair_standart";
    case "vip":
      return "conf-step__chair_vip";
    case "blocked":
      return "conf-step__chair_disabled";
    default:
      return "conf-step__chair_standart";
  }
}
function openResetHallConfigurationModal(hallId, hallName) {
  const modal = document.getElementById("resetHallConfigurationModal");
  if (!modal) {
    console.error("Reset hall configuration modal not found");
    showSafeNotification("\u041C\u043E\u0434\u0430\u043B\u044C\u043D\u043E\u0435 \u043E\u043A\u043D\u043E \u0441\u0431\u0440\u043E\u0441\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E", "error");
    return;
  }
  modal.querySelector('input[name="hall_id"]').value = hallId;
  modal.querySelector("#hallNameToReset").textContent = hallName;
  modal.classList.add("active");
}
function closeResetHallConfigurationModal() {
  const modal = document.getElementById("resetHallConfigurationModal");
  if (modal) {
    modal.classList.remove("active");
  }
}
async function resetHallConfiguration(hallId) {
  try {
    console.log("Resetting configuration for hall:", hallId);
    const response = await fetch(`/admin/halls/${hallId}/reset-configuration`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content,
        "Accept": "application/json"
      }
    });
    const result = await response.json();
    if (result.success) {
      showSafeNotification(result.message, "success");
      const container = document.getElementById("hallLayout-" + hallId);
      if (container) {
        container.innerHTML = '<div class="conf-step__empty-track"><p>\u0421\u0445\u0435\u043C\u0430 \u0437\u0430\u043B\u0430 \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u0430. \u0421\u0433\u0435\u043D\u0435\u0440\u0438\u0440\u0443\u0439\u0442\u0435 \u043D\u043E\u0432\u0443\u044E \u0441\u0445\u0435\u043C\u0443.</p></div>';
      }
      const rowsInput = document.querySelector(`.hall-configuration[data-hall-id="${hallId}"] .rows-input`);
      const seatsInput = document.querySelector(`.hall-configuration[data-hall-id="${hallId}"] .seats-input`);
      if (rowsInput) rowsInput.value = "";
      if (seatsInput) seatsInput.value = "";
      closeResetHallConfigurationModal();
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Error resetting hall configuration:", error);
    showSafeNotification("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u0431\u0440\u043E\u0441\u0435 \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0438: " + error.message, "error");
  }
}
async function saveHallConfiguration(hallId) {
  try {
    const seats = [];
    const hallContainer = document.getElementById("hallLayout-" + hallId);
    if (!hallContainer) {
      throw new Error("\u041A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440 \u0441\u0445\u0435\u043C\u044B \u0437\u0430\u043B\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
    }
    hallContainer.querySelectorAll(".conf-step__chair").forEach((seat) => {
      const row = seat.getAttribute("data-row");
      const seatNum = seat.getAttribute("data-seat");
      const type = seat.getAttribute("data-type");
      if (row && seatNum && !isNaN(row) && !isNaN(seatNum)) {
        seats.push({
          row: parseInt(row),
          seat: parseInt(seatNum),
          type
        });
      }
    });
    console.log("Saving configuration for hall:", hallId, "Valid seats:", seats);
    if (seats.length === 0) {
      throw new Error("\u041D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0445 \u043C\u0435\u0441\u0442 \u0434\u043B\u044F \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F");
    }
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
    const response = await fetch(`/admin/halls/${hallId}/save-configuration`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": csrfToken,
        "Accept": "application/json"
      },
      body: JSON.stringify({ seats })
    });
    const responseText = await response.text();
    console.log("Response status:", response.status, "Response:", responseText);
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      throw new Error(`\u0421\u0435\u0440\u0432\u0435\u0440 \u0432\u0435\u0440\u043D\u0443\u043B \u043D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u043E\u0442\u0432\u0435\u0442: ${responseText.substring(0, 100)}...`);
    }
    if (result.success) {
      showSafeNotification("\u041A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044F \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E!", "success");
    } else {
      throw new Error(result.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0438");
    }
  } catch (error) {
    console.error("Error saving configuration:", error);
    showSafeNotification("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0438 \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0438: " + error.message, "error");
  }
}
document.addEventListener("DOMContentLoaded", function() {
  const resetForm = document.getElementById("resetHallConfigurationForm");
  if (resetForm) {
    resetForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const hallId = this.querySelector('input[name="hall_id"]').value;
      resetHallConfiguration(hallId);
    });
  }
});

// public/js/modules/pricing.js
async function savePrices(hallId) {
  try {
    console.log("Saving prices for hall:", hallId);
    const regularPriceInput = document.querySelector(`.price-configuration[data-hall-id="${hallId}"] .regular-price-input`);
    const vipPriceInput = document.querySelector(`.price-configuration[data-hall-id="${hallId}"] .vip-price-input`);
    if (!regularPriceInput || !vipPriceInput) {
      throw new Error("\u041F\u043E\u043B\u044F \u0432\u0432\u043E\u0434\u0430 \u0446\u0435\u043D \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B");
    }
    const regularPrice = parseFloat(regularPriceInput.value);
    const vipPrice = parseFloat(vipPriceInput.value);
    if (isNaN(regularPrice) || isNaN(vipPrice) || regularPrice < 0 || vipPrice < 0) {
      throw new Error("\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u0446\u0435\u043D");
    }
    const response = await fetch(`/admin/halls/${hallId}/update-prices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content,
        "Accept": "application/json"
      },
      body: JSON.stringify({
        regular_price: regularPrice,
        vip_price: vipPrice
      })
    });
    const result = await response.json();
    if (result.success) {
      if (window.notifications && typeof window.notifications.show === "function") {
        window.notifications.show("\u0426\u0435\u043D\u044B \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u044B \u0443\u0441\u043F\u0435\u0448\u043D\u043E!", "success");
      } else {
        console.log("\u0426\u0435\u043D\u044B \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u044B \u0443\u0441\u043F\u0435\u0448\u043D\u043E!");
        alert("\u0426\u0435\u043D\u044B \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u044B \u0443\u0441\u043F\u0435\u0448\u043D\u043E!");
      }
    } else {
      throw new Error(result.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0446\u0435\u043D");
    }
  } catch (error) {
    console.error("Error updating prices:", error);
    if (window.notifications && typeof window.notifications.show === "function") {
      window.notifications.show("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0446\u0435\u043D: " + error.message, "error");
    } else {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0446\u0435\u043D:", error.message);
      alert("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0446\u0435\u043D: " + error.message);
    }
  }
}
async function resetPrices(hallId) {
  try {
    const regularPriceInput = document.querySelector(`.price-configuration[data-hall-id="${hallId}"] .regular-price-input`);
    const vipPriceInput = document.querySelector(`.price-configuration[data-hall-id="${hallId}"] .vip-price-input`);
    if (!regularPriceInput || !vipPriceInput) {
      throw new Error("\u041F\u043E\u043B\u044F \u0432\u0432\u043E\u0434\u0430 \u0446\u0435\u043D \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B");
    }
    const baseRegularPrice = 350;
    const baseVipPrice = 500;
    regularPriceInput.value = baseRegularPrice.toFixed(2);
    vipPriceInput.value = baseVipPrice.toFixed(2);
    const response = await fetch(`/admin/halls/${hallId}/update-prices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content,
        "Accept": "application/json"
      },
      body: JSON.stringify({
        regular_price: baseRegularPrice,
        vip_price: baseVipPrice
      })
    });
    const result = await response.json();
    if (result.success) {
      if (window.notifications && typeof window.notifications.show === "function") {
        window.notifications.show("\u0426\u0435\u043D\u044B \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u044B \u0434\u043E \u0431\u0430\u0437\u043E\u0432\u044B\u0445 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0439 \u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B", "success");
      } else {
        console.log("\u0426\u0435\u043D\u044B \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u044B \u0434\u043E \u0431\u0430\u0437\u043E\u0432\u044B\u0445 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0439 \u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B");
        alert("\u0426\u0435\u043D\u044B \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u044B \u0434\u043E \u0431\u0430\u0437\u043E\u0432\u044B\u0445 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0439 \u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B");
      }
    } else {
      throw new Error(result.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u0431\u0440\u043E\u0441\u0435 \u0446\u0435\u043D");
    }
  } catch (error) {
    console.error("Error resetting prices:", error);
    if (window.notifications && typeof window.notifications.show === "function") {
      window.notifications.show("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u0431\u0440\u043E\u0441\u0435 \u0446\u0435\u043D: " + error.message, "error");
    } else {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u0431\u0440\u043E\u0441\u0435 \u0446\u0435\u043D:", error.message);
      alert("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u0431\u0440\u043E\u0441\u0435 \u0446\u0435\u043D: " + error.message);
    }
  }
}

// public/js/modules/movies.js
function openDeleteMovieModal(movieId, movieName) {
  document.getElementById("movieIdToDelete").value = movieId;
  document.getElementById("movieNameToDelete").textContent = `"${movieName}"`;
  openModal("deleteMovieModal");
}
async function addMovie(form) {
  try {
    const formData = new FormData(form);
    const response = await fetch(form.action, {
      method: "POST",
      headers: {
        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content,
        "X-Requested-With": "XMLHttpRequest"
      },
      body: formData
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.success) {
      if (window.notifications) {
        window.notifications.show("\u0424\u0438\u043B\u044C\u043C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D!", "success");
      }
      closeModal("addMovieModal");
      form.reset();
      const posterPreview = document.getElementById("posterPreview");
      if (posterPreview) {
        posterPreview.innerHTML = '<span style="color: #63536C;">\u041F\u043E\u0441\u0442\u0435\u0440</span>';
      }
      setTimeout(() => {
        location.reload();
      }, 1e3);
    } else {
      throw new Error(result.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0438 \u0444\u0438\u043B\u044C\u043C\u0430");
    }
  } catch (error) {
    console.error("Error adding movie:", error);
    if (window.notifications && typeof window.notifications.show === "function") {
      window.notifications.show("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0438 \u0444\u0438\u043B\u044C\u043C\u0430: " + error.message, "error");
    } else {
      alert("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0438 \u0444\u0438\u043B\u044C\u043C\u0430: " + error.message);
    }
  }
}
async function confirmMovieDeletion(event) {
  if (event) event.preventDefault();
  const movieId = document.getElementById("movieIdToDelete").value;
  try {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
    const response = await fetch(`/admin/movies/${movieId}`, {
      method: "DELETE",
      headers: {
        "X-CSRF-TOKEN": csrfToken,
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json"
      }
    });
    const result = await response.json();
    if (result.success) {
      closeModal("deleteMovieModal");
      const movieElement = document.querySelector(`[data-movie-id="${movieId}"]`);
      if (movieElement) {
        movieElement.remove();
      }
      if (window.notifications && typeof window.notifications.show === "function") {
        window.notifications.show(result.message, "success");
      }
      const moviesList = document.getElementById("moviesList");
      const remainingMovies = moviesList.querySelectorAll(".conf-step__movie");
      if (remainingMovies.length === 0) {
        moviesList.innerHTML = '<div class="conf-step__empty-movies">\u041D\u0435\u0442 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u043D\u044B\u0445 \u0444\u0438\u043B\u044C\u043C\u043E\u0432</div>';
      }
    } else {
      throw new Error(result.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u0444\u0438\u043B\u044C\u043C\u0430");
    }
  } catch (error) {
    console.error("Error deleting movie:", error);
    closeModal("deleteMovieModal");
    if (window.notifications && typeof window.notifications.show === "function") {
      window.notifications.show("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u0444\u0438\u043B\u044C\u043C\u0430: " + error.message, "error");
    } else {
      alert("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u0444\u0438\u043B\u044C\u043C\u0430: " + error.message);
    }
  }
}
function previewMoviePoster(input) {
  let previewId = "posterPreview";
  if (input.closest("#editMovieModal")) {
    previewId = "edit_poster_preview";
  }
  const preview = document.getElementById(previewId);
  if (!preview) {
    console.error("Preview container not found:", previewId);
    return;
  }
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.innerHTML = `<img src="${e.target.result}" style="max-width:200px; max-height:300px; object-fit:cover; border-radius:5px;">`;
    };
    reader.readAsDataURL(input.files[0]);
  } else {
    preview.innerHTML = "";
  }
}
function initMovies() {
  const addMovieForm = document.getElementById("addMovieForm");
  if (addMovieForm) {
    addMovieForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      await addMovie(this);
    });
  }
  const posterInput = document.querySelector('#addMovieModal input[name="movie_poster"]');
  if (posterInput) {
    posterInput.addEventListener("change", function(e) {
      previewMoviePoster(this);
    });
  }
  const editPosterInput = document.querySelector('#editMovieModal input[name="movie_poster"]');
  if (editPosterInput) {
    editPosterInput.addEventListener("change", function(e) {
      previewMoviePoster(this);
    });
  }
  const editMovieForm = document.getElementById("editMovieForm");
  if (editMovieForm) {
    editMovieForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      await updateMovie(this);
    });
  }
  document.addEventListener("click", function(e) {
    if (e.target.hasAttribute("data-delete-movie")) {
      e.preventDefault();
      const movieId = e.target.getAttribute("data-delete-movie");
      const movieName = e.target.getAttribute("data-movie-name");
      openDeleteMovieModal(movieId, movieName);
    }
  });
  const deleteMovieForm = document.getElementById("deleteMovieForm");
  if (deleteMovieForm) {
    deleteMovieForm.addEventListener("submit", function(e) {
      confirmMovieDeletion(e);
    });
  }
}
async function updateMovie(form) {
  try {
    const formData = new FormData(form);
    const movieId = formData.get("movie_id");
    const response = await fetch(`/admin/movies/${movieId}`, {
      method: "POST",
      // Laravel требует POST для форм с _method=PUT
      headers: {
        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content
      },
      body: formData
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.success) {
      if (window.notifications) {
        window.notifications.show("\u0424\u0438\u043B\u044C\u043C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D!", "success");
      }
      closeModal("editMovieModal");
      setTimeout(() => location.reload(), 1e3);
    } else {
      throw new Error(result.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0444\u0438\u043B\u044C\u043C\u0430");
    }
  } catch (error) {
    console.error("Error updating movie:", error);
    if (window.notifications && typeof window.notifications.show === "function") {
      window.notifications.show("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0444\u0438\u043B\u044C\u043C\u0430: " + error.message, "error");
    } else {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0444\u0438\u043B\u044C\u043C\u0430:", error.message);
      alert("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0444\u0438\u043B\u044C\u043C\u0430: " + error.message);
    }
  }
}
function toggleInactiveMovies(show) {
  const inactiveMovies = document.querySelectorAll(".conf-step__movie-inactive");
  inactiveMovies.forEach((movie) => {
    movie.style.display = show ? "block" : "none";
  });
}
function initMovieFilter() {
  const filterCheckbox = document.getElementById("showInactiveMovies");
  if (filterCheckbox) {
    toggleInactiveMovies(filterCheckbox.checked);
    filterCheckbox.addEventListener("change", function() {
      toggleInactiveMovies(this.checked);
    });
  }
}
async function toggleMovieActive(movieId) {
  try {
    const response = await fetch(`/admin/movies/${movieId}/toggle-active`, {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content")
      }
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error toggling movie active:", error);
    throw error;
  }
}
async function fetchMovies() {
  try {
    const response = await fetch("/admin/movies");
    if (!response.ok) throw new Error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0444\u0438\u043B\u044C\u043C\u043E\u0432");
    return await response.json();
  } catch (error) {
    console.error("Error fetching movies:", error);
    throw error;
  }
}

// public/js/modules/schedules.js
function formatDateForDisplay(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}
async function createSchedule(form) {
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435...";
    const formData = new FormData(form);
    const response = await fetch(form.action, {
      method: "POST",
      headers: {
        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content,
        "Accept": "application/json"
      },
      body: formData
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    if (result.success) {
      if (window.notifications) {
        window.notifications.show(result.message, "success");
      }
      closeModal("hallScheduleModal");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      throw new Error(result.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F");
    }
  } catch (error) {
    console.error("Error creating schedule:", error);
    if (window.notifications) {
      window.notifications.show("\u041E\u0448\u0438\u0431\u043A\u0430: " + error.message, "error");
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}
async function updateSchedule(form) {
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435...";
    const formData = new FormData(form);
    const response = await fetch(form.action, {
      method: "POST",
      headers: {
        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content,
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        start_time: formData.get("start_time"),
        end_time: formData.get("end_time"),
        _method: "PUT"
      })
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    if (result.success) {
      window.notifications.show("\u0420\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E!", "success");
      closeModal("editScheduleModal");
      setTimeout(() => window.location.reload(), 1e3);
    } else {
      throw new Error(result.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F");
    }
  } catch (error) {
    console.error("Error updating schedule:", error);
    window.notifications.show("\u041E\u0448\u0438\u0431\u043A\u0430: " + error.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}
function openEditScheduleModal(scheduleId) {
  fetch(`/admin/hall-schedules/${scheduleId}/edit`).then((response) => response.json()).then((schedule) => {
    console.log("Loading schedule data:", schedule);
    document.getElementById("edit_hall_schedule_id").value = schedule.id;
    document.getElementById("edit_hall_id").value = schedule.cinema_hall_id;
    document.getElementById("edit_schedule_date").value = schedule.date;
    document.getElementById("edit_modal_hall_name").textContent = schedule.hall_name;
    document.getElementById("edit_modal_schedule_date").textContent = formatDateForDisplay(schedule.date);
    document.getElementById("edit_start_time").value = schedule.start_time.substring(0, 5);
    document.getElementById("edit_end_time").value = schedule.end_time.substring(0, 5);
    document.getElementById("editScheduleForm").action = `/admin/hall-schedules/${scheduleId}`;
    openModal("editScheduleModal");
  }).catch((error) => {
    console.error("Error loading schedule:", error);
    window.notifications.show("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435 \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F: " + error.message, "error");
  });
}
function openDeleteScheduleModal(scheduleId, hallId, hallName, currentDate) {
  document.getElementById("scheduleIdToDelete").value = scheduleId;
  document.getElementById("currentScheduleDate").value = currentDate;
  document.getElementById("scheduleHallName").textContent = hallName;
  document.getElementById("scheduleDate").textContent = new Date(currentDate).toLocaleDateString("ru-RU");
  openModal("deleteScheduleModal");
}
function openCreateScheduleModal(hallId, date, hallName = "") {
  document.getElementById("hall_id").value = hallId;
  document.getElementById("schedule_date").value = date;
  document.getElementById("modal_hall_name").textContent = hallName;
  document.getElementById("modal_schedule_date").textContent = new Date(date).toLocaleDateString("ru-RU");
  openModal("hallScheduleModal");
}
function initSchedules() {
  const editScheduleForm = document.getElementById("editScheduleForm");
  if (editScheduleForm) {
    editScheduleForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      await updateSchedule(this);
    });
  }
  const hallScheduleForm = document.getElementById("hallScheduleForm");
  if (hallScheduleForm) {
    hallScheduleForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      await createSchedule(this);
    });
  }
  const deleteScheduleForm = document.getElementById("deleteScheduleForm");
  if (deleteScheduleForm) {
    deleteScheduleForm.addEventListener("submit", async function(e) {
      e.preventDefault();
    });
  }
}

// public/js/modules/sessions.js
async function loadScheduleInfo(hallId, date) {
  try {
    const response = await fetch(`/admin/halls/${hallId}/schedule-info?date=${date}`);
    if (!response.ok) throw new Error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F");
    const data = await response.json();
    return data.success ? data : null;
  } catch (error) {
    console.error("Error loading schedule info:", error);
    return null;
  }
}
function updateScheduleHint() {
  const hallSelect = document.getElementById("cinema_hall_id");
  const dateInput = document.getElementById("session_date");
  const scheduleHint = document.getElementById("scheduleHint");
  const allowedTimeRange = document.getElementById("allowedTimeRange");
  if (!hallSelect || !dateInput || !scheduleHint || !allowedTimeRange) return;
  const hallId = hallSelect.value;
  const date = dateInput.value;
  if (hallId && date) {
    loadScheduleInfo(hallId, date).then((data) => {
      if (data && data.schedule) {
        let timeRange = `${data.schedule.start_time} - ${data.schedule.end_time}`;
        if (data.schedule.overnight) {
          timeRange += " \u{1F319} (\u043D\u043E\u0447\u043D\u043E\u0439 \u0440\u0435\u0436\u0438\u043C)";
        }
        allowedTimeRange.textContent = timeRange;
        scheduleHint.style.display = "block";
      } else {
        scheduleHint.style.display = "none";
      }
    });
  } else {
    scheduleHint.style.display = "none";
  }
}
function openDeleteSessionModal(sessionId, movieTitle, hallName, sessionTime) {
  console.log("\u{1F3AF} openDeleteSessionModal \u0432\u044B\u0437\u0432\u0430\u043D\u0430 \u0441 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0430\u043C\u0438:", {
    sessionId,
    movieTitle,
    hallName,
    sessionTime
  });
  closeModal("editSessionModal");
  console.log("\u2705 \u041C\u043E\u0434\u0430\u043B\u044C\u043D\u043E\u0435 \u043E\u043A\u043D\u043E \u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0437\u0430\u043A\u0440\u044B\u0442\u043E");
  document.getElementById("sessionIdToDelete").value = sessionId;
  document.getElementById("sessionMovieNameToDelete").textContent = movieTitle;
  document.getElementById("sessionHallNameToDelete").textContent = hallName;
  document.getElementById("sessionTimeToDelete").textContent = sessionTime;
  openModal("deleteSessionModal");
  console.log("\u2705 \u041C\u043E\u0434\u0430\u043B\u044C\u043D\u043E\u0435 \u043E\u043A\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u043E\u0442\u043A\u0440\u044B\u0442\u043E");
  setTimeout(() => {
    const modal = document.getElementById("deleteSessionModal");
    if (modal) {
      const computedStyle = window.getComputedStyle(modal);
      console.log("\u{1F50D} \u0424\u0438\u043D\u0430\u043B\u044C\u043D\u044B\u0435 \u0441\u0442\u0438\u043B\u0438 \u043C\u043E\u0434\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u043E\u043A\u043D\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F:", {
        display: computedStyle.display,
        zIndex: computedStyle.zIndex,
        opacity: computedStyle.opacity,
        visibility: computedStyle.visibility
      });
    }
  }, 100);
}
async function deleteMovieSession(sessionId) {
  try {
    const response = await fetch(`/admin/sessions/${sessionId}`, {
      method: "DELETE",
      headers: {
        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content"),
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();
    if (data.success) {
      if (window.notifications) {
        window.notifications.show("\u0421\u0435\u0430\u043D\u0441 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D", "success");
      }
      closeModal("deleteSessionModal");
      closeModal("editSessionModal");
      setTimeout(() => {
        location.reload();
      }, 1500);
    } else {
      throw new Error(data.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u0441\u0435\u0430\u043D\u0441\u0430");
    }
  } catch (error) {
    console.error("Error deleting session:", error);
    if (window.notifications) {
      window.notifications.show("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u0441\u0435\u0430\u043D\u0441\u0430: " + error.message, "error");
    }
  }
}
function initSessionFormHandlers() {
  console.log("\u{1F3AF} \u0418\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0447\u0438\u043A\u043E\u0432 \u0444\u043E\u0440\u043C\u044B \u0441\u0435\u0430\u043D\u0441\u0430...");
  document.querySelectorAll('[data-open-modal="addSessionModal"]').forEach((button) => {
    button.addEventListener("click", function(e) {
      console.log('\u{1F3AF} \u041A\u043D\u043E\u043F\u043A\u0430 "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0441\u0435\u0430\u043D\u0441" \u043D\u0430\u0436\u0430\u0442\u0430');
      openModal("addSessionModal");
      setTimeout(updateScheduleHint, 100);
    });
  });
  const hallSelect = document.getElementById("cinema_hall_id");
  const dateInput = document.getElementById("session_date");
  if (hallSelect) {
    hallSelect.addEventListener("change", updateScheduleHint);
  }
  if (dateInput) {
    dateInput.addEventListener("change", updateScheduleHint);
  }
  const addSessionForm = document.getElementById("addSessionForm");
  if (addSessionForm) {
    console.log("\u2705 \u0424\u043E\u0440\u043C\u0430 addSessionForm \u043D\u0430\u0439\u0434\u0435\u043D\u0430");
    addSessionForm.addEventListener("submit", async function(e) {
      console.log("\u{1F3AF} \u041E\u0442\u043F\u0440\u0430\u0432\u043A\u0430 \u0444\u043E\u0440\u043C\u044B \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0447\u0435\u043D\u0430");
      e.preventDefault();
      const formData = new FormData(this);
      try {
        const response = await fetch("/admin/sessions", {
          method: "POST",
          body: formData,
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Accept": "application/json",
            "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content
          }
        });
        const result = await response.json();
        if (result.success) {
          console.log("\u2705 \u0421\u0435\u0430\u043D\u0441 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D");
          closeModal("addSessionModal");
          if (window.notifications) {
            window.notifications.show(result.message, "success");
          }
          this.reset();
          setTimeout(() => {
            window.location.reload();
          }, 1e3);
        } else {
          console.log("\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0441\u0435\u0430\u043D\u0441\u0430:", result.message);
          if (window.notifications) {
            window.notifications.show(result.message, "error");
          }
        }
      } catch (error) {
        console.error("\u{1F4A5} \u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0442\u0438:", error);
        if (window.notifications) {
          window.notifications.show("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0442\u0438 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0441\u0435\u0430\u043D\u0441\u0430", "error");
        }
      }
    });
  } else {
    console.log("\u274C \u0424\u043E\u0440\u043C\u0430 addSessionForm \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430");
  }
  const editSessionForm = document.getElementById("editSessionForm");
  if (editSessionForm) {
    console.log("\u2705 \u0424\u043E\u0440\u043C\u0430 editSessionForm \u043D\u0430\u0439\u0434\u0435\u043D\u0430");
    editSessionForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      await updateSession(this);
    });
  } else {
    console.log("\u274C \u0424\u043E\u0440\u043C\u0430 editSessionForm \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430");
  }
  const deleteSessionForm = document.getElementById("deleteSessionForm");
  if (deleteSessionForm) {
    console.log("\u2705 \u0424\u043E\u0440\u043C\u0430 deleteSessionForm \u043D\u0430\u0439\u0434\u0435\u043D\u0430");
    deleteSessionForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      console.log("\u{1F3AF} \u0424\u043E\u0440\u043C\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0441\u0435\u0430\u043D\u0441\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0430");
      const sessionId = document.getElementById("sessionIdToDelete").value;
      console.log("\u{1F3AF} ID \u0441\u0435\u0430\u043D\u0441\u0430 \u0434\u043B\u044F \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F:", sessionId);
      await deleteMovieSession(sessionId);
    });
  } else {
    console.log("\u274C \u0424\u043E\u0440\u043C\u0430 deleteSessionForm \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430");
  }
}
function openEditSessionModal(sessionId) {
  console.log("\u{1F3AF} \u041E\u0442\u043A\u0440\u044B\u0442\u0438\u0435 \u043C\u043E\u0434\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u043E\u043A\u043D\u0430 \u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0441\u0435\u0430\u043D\u0441\u0430:", sessionId);
  fetch(`/admin/sessions/${sessionId}/edit`).then((response) => response.json()).then((session) => {
    console.log("\u0414\u0430\u043D\u043D\u044B\u0435 \u0441\u0435\u0430\u043D\u0441\u0430 \u0434\u043B\u044F \u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F:", session);
    document.getElementById("edit_session_id").value = session.id;
    document.getElementById("edit_current_movie").textContent = session.movie.title;
    document.getElementById("edit_current_hall").textContent = session.cinema_hall.hall_name;
    document.getElementById("edit_current_time").textContent = new Date(session.session_start).toLocaleString("ru-RU");
    document.getElementById("edit_movie_id").value = session.movie_id;
    document.getElementById("edit_cinema_hall_id").value = session.cinema_hall_id;
    const sessionStart = new Date(session.session_start);
    document.getElementById("edit_session_date").value = sessionStart.toISOString().split("T")[0];
    document.getElementById("edit_session_time").value = sessionStart.toTimeString().slice(0, 5);
    document.getElementById("edit_is_actual").checked = session.is_actual;
    document.getElementById("editSessionForm").action = `/admin/sessions/${sessionId}`;
    openModal("editSessionModal");
  }).catch((error) => {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435 \u0434\u0430\u043D\u043D\u044B\u0445 \u0441\u0435\u0430\u043D\u0441\u0430:", error);
    if (window.notifications) {
      window.notifications.show("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435 \u0434\u0430\u043D\u043D\u044B\u0445 \u0441\u0435\u0430\u043D\u0441\u0430", "error");
    }
  });
}
async function updateSession(form) {
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435...";
    const formData = new FormData(form);
    const response = await fetch(form.action, {
      method: "POST",
      headers: {
        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content,
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        movie_id: formData.get("movie_id"),
        cinema_hall_id: formData.get("cinema_hall_id"),
        session_date: formData.get("session_date"),
        session_time: formData.get("session_time"),
        is_actual: formData.get("is_actual") === "1",
        _method: "PUT"
      })
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    if (result.success) {
      window.notifications.show("\u0421\u0435\u0430\u043D\u0441 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D!", "success");
      closeModal("editSessionModal");
      setTimeout(() => window.location.reload(), 1e3);
    } else {
      throw new Error(result.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0441\u0435\u0430\u043D\u0441\u0430");
    }
  } catch (error) {
    console.error("Error updating session:", error);
    window.notifications.show("\u041E\u0448\u0438\u0431\u043A\u0430: " + error.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// public/js/modules/sales.js
var SalesManager = class {
  constructor(notificationSystem) {
    this.notifications = notificationSystem;
    this.init();
  }
  init() {
    this.bindEvents();
    console.log("\u2705 SalesManager initialized");
  }
  bindEvents() {
    document.addEventListener("click", (e) => {
      if (e.target.hasAttribute("data-toggle-sales")) {
        e.preventDefault();
        this.handleToggleSales(e.target);
      }
    });
  }
  async handleToggleSales(button) {
    const hallId = button.getAttribute("data-toggle-sales");
    const isActive = button.getAttribute("data-is-active") === "true";
    try {
      await this.toggleHallSales(hallId, isActive, button);
    } catch (error) {
      console.error("Error toggling sales:", error);
      this.showNotification("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0438 \u0441\u0442\u0430\u0442\u0443\u0441\u0430 \u043F\u0440\u043E\u0434\u0430\u0436", "error");
    }
  }
  async toggleHallSales(hallId, currentStatus, button) {
    const response = await fetch("/admin/toggle-sales", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content")
      },
      body: JSON.stringify({
        hall_id: hallId,
        action: currentStatus ? "deactivate" : "activate"
      })
    });
    const data = await response.json();
    if (data.success) {
      this.updateUI(button, data.is_active);
      this.showNotification(data.message, "success");
    } else {
      this.showNotification(data.message, "error");
    }
  }
  updateUI(button, isActive) {
    button.setAttribute("data-is-active", isActive);
    button.textContent = isActive ? "\u041F\u0440\u0438\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u043F\u0440\u043E\u0434\u0430\u0436\u0443 \u0431\u0438\u043B\u0435\u0442\u043E\u0432" : "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0440\u043E\u0434\u0430\u0436\u0443 \u0431\u0438\u043B\u0435\u0442\u043E\u0432";
    button.classList.toggle("conf-step__button-warning", isActive);
    button.classList.toggle("conf-step__button-accent", !isActive);
    const listItem = button.closest("li");
    const statusSpan = listItem.querySelector(".sales-status");
    if (statusSpan) {
      statusSpan.textContent = isActive ? "\u041F\u0440\u043E\u0434\u0430\u0436\u0438 \u043E\u0442\u043A\u0440\u044B\u0442\u044B" : "\u041F\u0440\u043E\u0434\u0430\u0436\u0438 \u043F\u0440\u0438\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u044B";
      statusSpan.className = "sales-status " + (isActive ? "active" : "inactive");
    }
  }
  showNotification(message, type = "info") {
    if (this.notifications && typeof this.notifications.show === "function") {
      this.notifications.show(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }
  // Метод для принудительного обновления статуса (может пригодиться)
  updateSalesStatus(hallId, isActive) {
    const button = document.querySelector(`[data-toggle-sales="${hallId}"]`);
    if (button) {
      this.updateUI(button, isActive);
    }
  }
  // Метод для массового управления (может пригодиться в будущем)
  bulkToggleSales(action) {
    const buttons = document.querySelectorAll("[data-toggle-sales]");
    buttons.forEach((button) => {
      const isActive = button.getAttribute("data-is-active") === "true";
      if (action === "activate" && !isActive || action === "deactivate" && isActive) {
        this.handleToggleSales(button);
      }
    });
  }
};
var sales_default = SalesManager;

// public/js/views/admin/dashboard.js
async function loadHallConfiguration2(hallId) {
  try {
    console.log("Loading hall configuration for:", hallId);
    const response = await fetch(`/admin/halls/${hallId}/configuration`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const html = await response.text();
    const container = document.getElementById("hallConfiguration");
    if (container) {
      container.innerHTML = html;
      console.log("Hall configuration loaded successfully");
    }
  } catch (error) {
    console.error("Error loading hall configuration:", error);
    if (window.notifications) {
      window.notifications.show("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435 \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0438 \u0437\u0430\u043B\u0430", "error");
    }
  }
}
async function loadPriceConfiguration2(hallId) {
  try {
    console.log("Loading price configuration for:", hallId);
    const response = await fetch(`/admin/halls/${hallId}/prices`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const html = await response.text();
    const container = document.getElementById("priceConfiguration");
    if (container) {
      container.innerHTML = html;
      console.log("Price configuration loaded successfully");
    }
  } catch (error) {
    console.error("Error loading price configuration:", error);
    if (window.notifications) {
      window.notifications.show("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435 \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0438 \u0446\u0435\u043D", "error");
    }
  }
}
async function openEditMovieModal(movieId) {
  try {
    console.log("Opening edit movie modal for:", movieId);
    const response = await fetch(`/admin/movies/${movieId}/edit`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const movie = await response.json();
    console.log("Loaded movie data:", movie);
    document.getElementById("edit_movie_id").value = movie.id;
    document.getElementById("edit_title").value = movie.title;
    document.getElementById("edit_movie_description").value = movie.movie_description || "";
    document.getElementById("edit_movie_duration").value = movie.movie_duration;
    document.getElementById("edit_country").value = movie.country || "";
    document.getElementById("edit_is_active").checked = movie.is_active;
    const currentPosterElement = document.getElementById("edit_current_poster");
    if (movie.movie_poster) {
      currentPosterElement.textContent = `\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u043F\u043E\u0441\u0442\u0435\u0440: ${movie.movie_poster}`;
      currentPosterElement.style.display = "block";
    } else {
      currentPosterElement.textContent = "";
      currentPosterElement.style.display = "none";
    }
    document.getElementById("edit_poster_preview").innerHTML = "";
    console.log("Opening edit movie modal...");
    openModal("editMovieModal");
  } catch (error) {
    console.error("Error opening edit movie modal:", error);
    if (window.notifications && typeof window.notifications.show === "function") {
      window.notifications.show("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435 \u0434\u0430\u043D\u043D\u044B\u0445 \u0444\u0438\u043B\u044C\u043C\u0430", "error");
    } else {
      alert("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435 \u0434\u0430\u043D\u043D\u044B\u0445 \u0444\u0438\u043B\u044C\u043C\u0430: " + error.message);
    }
  }
}
function openAddSessionModal() {
  console.log("Open add session modal");
  openModal("addSessionModal");
}
function changeTimelineDate(date) {
  console.log("Change timeline date:", date);
  window.location.href = `/admin/dashboard?date=${date}`;
}
function resetSessions() {
  console.log("Reset sessions");
}
function updateSession2() {
  console.log("Update sessions");
}
document.addEventListener("DOMContentLoaded", function() {
  console.log("\u{1F680} Admin panel initializing (minimal version)...");
  try {
    initModalHandlers();
    console.log("\u2705 Modal handlers initialized");
    window.notifications = new notifications_default();
    console.log("\u2705 NotificationSystem initialized");
    window.hallsManager = new halls_default(window.notifications);
    console.log("\u2705 HallsManager initialized");
    window.salesManager = new sales_default(window.notifications);
    console.log("\u2705 SalesManager initialized");
    initMovies();
    initMovieFilter();
    console.log("\u2705 Movies module initialized");
    initSchedules();
    console.log("\u2705 Schedules module initialized");
    initSessionFormHandlers();
    console.log("\u2705 Session form handlers initialized");
    initAccordeon();
    console.log("\u2705 Accordeon initialized");
  } catch (error) {
    console.error("\u{1F4A5} Error:", error);
  }
  window.openEditMovieModal = openEditMovieModal;
  window.loadHallConfiguration = loadHallConfiguration2;
  window.loadPriceConfiguration = loadPriceConfiguration2;
  window.openAddSessionModal = openAddSessionModal;
  window.changeTimelineDate = changeTimelineDate;
  window.resetSessions = resetSessions;
  window.updateSession = updateSession2;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.initAccordeon = initAccordeon;
  window.toggleAccordeonSection = toggleAccordeonSection;
  window.openAccordeonSection = openAccordeonSection;
  window.closeAccordeonSection = closeAccordeonSection;
  window.closeAllAccordeonSections = closeAllAccordeonSections;
  window.openAllAccordeonSections = openAllAccordeonSections;
  window.closeAddHallModal = closeAddHallModal;
  window.closeAddMovieModal = closeAddMovieModal;
  window.closeAddSessionModal = closeAddSessionModal;
  window.closeEditSessionModal = closeEditSessionModal;
  window.closeEditMovieModal = closeEditMovieModal;
  window.closeDeleteHallModal = closeDeleteHallModal;
  window.closeDeleteMovieModal = closeDeleteMovieModal;
  window.closeDeleteSessionModal = closeDeleteSessionModal;
  window.closeAllModals = closeAllModals;
  window.generateHallLayout = generateHallLayout;
  window.changeSeatType = changeSeatType;
  window.openResetHallConfigurationModal = openResetHallConfigurationModal;
  window.closeResetHallConfigurationModal = closeResetHallConfigurationModal;
  window.resetHallConfiguration = resetHallConfiguration;
  window.saveHallConfiguration = saveHallConfiguration;
  window.savePrices = savePrices;
  window.resetPrices = resetPrices;
  window.toggleInactiveMovies = toggleInactiveMovies;
  window.initMovieFilter = initMovieFilter;
  window.toggleMovieActive = toggleMovieActive;
  window.fetchMovies = fetchMovies;
  window.previewMoviePoster = previewMoviePoster;
  window.openCreateScheduleModal = openCreateScheduleModal;
  window.openEditScheduleModal = openEditScheduleModal;
  window.openDeleteScheduleModal = openDeleteScheduleModal;
  window.openEditSessionModal = openEditSessionModal;
  window.openDeleteSessionModal = openDeleteSessionModal;
});
