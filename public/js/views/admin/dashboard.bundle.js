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

// public/js/views/admin/dashboard.js
function openCreateScheduleModal(hallId, date) {
  console.log("Opening schedule modal for hall:", hallId, "date:", date);
  openModal("hallScheduleModal");
}
function openEditMovieModal(movieId) {
  console.log("Edit movie modal called for:", movieId);
  alert("\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0444\u0438\u043B\u044C\u043C\u0430 \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u043E\u0442\u043A\u043B\u044E\u0447\u0435\u043D\u043E");
}
function loadHallConfiguration(hallId) {
  console.log("Load hall config:", hallId);
}
function loadPriceConfiguration(hallId) {
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
  } catch (error) {
    console.error("\u{1F4A5} Error:", error);
  }
  window.openCreateScheduleModal = openCreateScheduleModal;
  window.openEditMovieModal = openEditMovieModal;
  window.loadHallConfiguration = loadHallConfiguration;
  window.loadPriceConfiguration = loadPriceConfiguration;
  window.toggleInactiveMovies = toggleInactiveMovies;
  window.openAddSessionModal = openAddSessionModal;
  window.changeTimelineDate = changeTimelineDate;
  window.resetSessions = resetSessions;
  window.updateSession = updateSession;
  window.openModal = openModal;
  window.closeModal = closeModal;
});
