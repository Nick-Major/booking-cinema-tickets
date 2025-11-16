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
function openCreateScheduleModal(hallId, date) {
  console.log("Opening schedule modal for hall:", hallId, "date:", date);
  openModal("hallScheduleModal");
}
function openEditMovieModal(movieId) {
  console.log("Edit movie modal called for:", movieId);
  window.notifications.show("\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0444\u0438\u043B\u044C\u043C\u0430 \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u043E\u0442\u043A\u043B\u044E\u0447\u0435\u043D\u043E", "info");
}
function loadPriceConfiguration2(hallId) {
  console.log("Load price config:", hallId);
}
function toggleInactiveMovies(show) {
  console.log("Toggle inactive movies:", show);
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
function updateSession() {
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
  } catch (error) {
    console.error("\u{1F4A5} Error:", error);
  }
  window.openCreateScheduleModal = openCreateScheduleModal;
  window.openEditMovieModal = openEditMovieModal;
  window.loadHallConfiguration = loadHallConfiguration2;
  window.loadPriceConfiguration = loadPriceConfiguration2;
  window.toggleInactiveMovies = toggleInactiveMovies;
  window.openAddSessionModal = openAddSessionModal;
  window.changeTimelineDate = changeTimelineDate;
  window.resetSessions = resetSessions;
  window.updateSession = updateSession;
  window.openModal = openModal;
  window.closeModal = closeModal;
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
});
