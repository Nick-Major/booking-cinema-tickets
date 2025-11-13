// public/js/modules/halls.js
var HallsManager = class {
  constructor() {
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
  // НОВЫЙ МЕТОД: Обновление всех секций
  updateAllSections(deletedHallId) {
    this.updateHallConfigurationSection(deletedHallId);
    this.updatePriceConfigurationSection(deletedHallId);
    this.updateSalesManagementSection(deletedHallId);
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
    alert(message);
  }
};
var halls_default = HallsManager;

// public/js/core/api-client.js
var ApiClient = class {
  async request(url, options = {}) {
    const config = {
      headers: {
        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content,
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...options.headers
      },
      ...options
    };
    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
  get(url) {
    return this.request(url);
  }
  post(url, data) {
    return this.request(url, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
  put(url, data) {
    return this.request(url, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }
  delete(url) {
    return this.request(url, {
      method: "DELETE"
    });
  }
};
var api_client_default = new ApiClient();

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

// public/js/views/admin/dashboard.js
function initAccordeon() {
  const headers = document.querySelectorAll(".conf-step__header");
  console.log(`Found ${headers.length} accordeon headers`);
  headers.forEach((header, index) => {
    console.log(`Header ${index}:`, header.className);
    if (header.hasAttribute("data-accordeon-initialized")) {
      return;
    }
    header.setAttribute("data-accordeon-initialized", "true");
    header.addEventListener("click", () => {
      console.log(`Accordeon header ${index} clicked`);
      header.classList.toggle("conf-step__header_closed");
      header.classList.toggle("conf-step__header_opened");
    });
  });
}
function initConfigurationHandlers() {
  initHallConfigurationHandlers();
  initPriceConfigurationHandlers();
  initRadioHandlers();
}
function initHallConfigurationHandlers() {
  console.log("Hall configuration handlers initialized");
}
function initPriceConfigurationHandlers() {
  console.log("Price configuration handlers initialized");
}
function initRadioHandlers() {
  console.log("Radio handlers initialized");
}
function resetSessions() {
  console.log("Reset sessions called");
  alert("\u0424\u0443\u043D\u043A\u0446\u0438\u044F resetSessions \u0432\u044B\u0437\u0432\u0430\u043D\u0430");
}
function openEditMovieModal(movieId) {
  console.log("Open edit movie modal for:", movieId);
  alert(`\u041E\u0442\u043A\u0440\u044B\u0442\u0438\u0435 \u043C\u043E\u0434\u0430\u043B\u043A\u0438 \u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0444\u0438\u043B\u044C\u043C\u0430 ID: ${movieId}`);
}
document.addEventListener("DOMContentLoaded", function() {
  console.log("Admin panel initializing...");
  try {
    const notifications = new notifications_default();
    const hallsManager = new halls_default();
    initAccordeon();
    initModalHandlers();
    initConfigurationHandlers();
    console.log("Admin panel initialized successfully!");
  } catch (error) {
    console.error("Error during admin panel initialization:", error);
  }
  async function updateSession(sessionId, data) {
    try {
      const result = await api_client_default.put(`/admin/sessions/${sessionId}`, data);
      if (result.success) {
        alert("\u0421\u0435\u0430\u043D\u0441 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D \u0443\u0441\u043F\u0435\u0448\u043D\u043E!");
        location.reload();
      }
    } catch (error) {
      console.error("Error updating session:", error);
      alert("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0441\u0435\u0430\u043D\u0441\u0430");
    }
  }
  function loadHallConfiguration2(hallId) {
    window.location.href = `/admin/halls/${hallId}/configuration`;
  }
  function loadPriceConfiguration2(hallId) {
    window.location.href = `/admin/halls/${hallId}/prices`;
  }
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("active");
    }
  }
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("active");
    }
  }
  function initModalHandlers() {
    document.querySelectorAll("[data-open-modal]").forEach((button) => {
      button.addEventListener("click", function() {
        const modalId = this.getAttribute("data-open-modal");
        openModal(modalId);
      });
    });
    document.querySelectorAll("[data-close-modal]").forEach((button) => {
      button.addEventListener("click", function() {
        const modalId = this.getAttribute("data-close-modal");
        closeModal(modalId);
      });
    });
    document.querySelectorAll(".popup").forEach((modal) => {
      modal.addEventListener("click", function(e) {
        if (e.target === this) {
          this.classList.remove("active");
        }
      });
    });
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape") {
        document.querySelectorAll(".popup.active").forEach((modal) => {
          modal.classList.remove("active");
        });
      }
    });
  }
  function closeAddHallModal() {
    closeModal("addHallModal");
  }
  function closeAddMovieModal() {
    closeModal("addMovieModal");
  }
  function closeEditMovieModal() {
    closeModal("editMovieModal");
  }
  function closeAddSessionModal() {
    closeModal("addSessionModal");
  }
  function closeEditSessionModal() {
    closeModal("editSessionModal");
  }
  function closeDeleteHallModal() {
    closeModal("deleteHallModal");
  }
  function closeDeleteMovieModal() {
    closeModal("deleteMovieModal");
  }
  function closeDeleteSessionModal() {
    closeModal("deleteSessionModal");
  }
  function closeAllModals() {
    document.querySelectorAll(".popup.active").forEach((modal) => {
      modal.classList.remove("active");
    });
  }
  window.addEventListener("error", function(e) {
    console.error("Global error caught:", e.error);
    console.error("Error message:", e.message);
    console.error("Error stack:", e.error?.stack);
    window.lastError = e.error;
  });
  window.addEventListener("unhandledrejection", function(e) {
    console.error("Unhandled promise rejection:", e.reason);
    window.lastError = e.reason;
  });
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    console.log("Fetch called:", args[0], args[1]);
    return originalFetch.apply(this, args).then((response) => {
      console.log("Fetch response:", response.status, response.url);
      return response;
    }).catch((error) => {
      console.error("Fetch error:", error);
      throw error;
    });
  };
  initModalHandlers();
  window.closeAddHallModal = closeAddHallModal;
  window.closeAddMovieModal = closeAddMovieModal;
  window.closeEditMovieModal = closeEditMovieModal;
  window.closeAddSessionModal = closeAddSessionModal;
  window.closeEditSessionModal = closeEditSessionModal;
  window.closeDeleteHallModal = closeDeleteHallModal;
  window.closeDeleteMovieModal = closeDeleteMovieModal;
  window.closeDeleteSessionModal = closeDeleteSessionModal;
  window.closeAllModals = closeAllModals;
  window.updateSession = updateSession;
  window.loadHallConfiguration = loadHallConfiguration2;
  window.loadPriceConfiguration = loadPriceConfiguration2;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.resetSessions = resetSessions;
  window.openEditMovieModal = openEditMovieModal;
});
