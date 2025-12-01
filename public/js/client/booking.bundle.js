// public/js/client/booking.js
var BookingSystem = class {
  constructor() {
    this.selectedSeats = /* @__PURE__ */ new Map();
    this.init();
  }
  init() {
    this.setupEventListeners();
    this.setupFormSubmission();
    this.addNotificationStyles();
  }
  addNotificationStyles() {
    if (!document.getElementById("notification-styles")) {
      const style = document.createElement("style");
      style.id = "notification-styles";
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
                
                .simple-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    margin-bottom: 10px;
                    border-radius: 5px;
                    color: white;
                    z-index: 10000;
                    max-width: 300px;
                    animation: slideInRight 0.3s ease;
                    font-family: 'Roboto', sans-serif;
                    font-size: 14px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    cursor: pointer;
                }
                
                .simple-notification-success {
                    background-color: #28a745;
                }
                
                .simple-notification-error {
                    background-color: #dc3545;
                }
                
                .simple-notification-warning {
                    background-color: #ffc107;
                    color: #212529;
                }
                
                .simple-notification-info {
                    background-color: #17a2b8;
                }
            `;
      document.head.appendChild(style);
    }
  }
  setupEventListeners() {
    document.addEventListener("click", (e) => {
      const seatElement = e.target.closest(".buying-scheme__chair");
      if (seatElement) {
        if (seatElement.classList.contains("buying-scheme__chair_taken") || seatElement.classList.contains("buying-scheme__chair_disabled")) {
          return;
        }
        this.handleSeatSelection(seatElement);
      }
    });
  }
  handleSeatSelection(seatElement) {
    const seatId = seatElement.dataset.seatId;
    const row = seatElement.dataset.row;
    const seatNumber = seatElement.dataset.seat;
    const price = parseFloat(seatElement.dataset.price) || 400;
    if (this.selectedSeats.has(seatId)) {
      this.selectedSeats.delete(seatId);
      seatElement.classList.remove("buying-scheme__chair_selected");
      this.showNotification(`\u041C\u0435\u0441\u0442\u043E \u043E\u0442\u043C\u0435\u043D\u0435\u043D\u043E: \u0420\u044F\u0434 ${row}, \u041C\u0435\u0441\u0442\u043E ${seatNumber}`, "info", 2e3);
    } else {
      this.selectedSeats.set(seatId, { id: seatId, row, seat: seatNumber, price });
      seatElement.classList.add("buying-scheme__chair_selected");
      this.showNotification(`\u0412\u044B\u0431\u0440\u0430\u043D\u043E: \u0420\u044F\u0434 ${row}, \u041C\u0435\u0441\u0442\u043E ${seatNumber}`, "success", 2e3);
    }
    this.updateSelectionSummary();
  }
  updateSelectionSummary() {
    const selectedCount = document.getElementById("selectedCount");
    const totalPrice = document.getElementById("totalPrice");
    const bookButton = document.getElementById("bookButton");
    const seatIdsInput = document.getElementById("seatIdsInput");
    const guestInfo = document.getElementById("guestInfo");
    const total = Array.from(this.selectedSeats.values()).reduce((sum, seat) => sum + seat.price, 0);
    if (selectedCount) selectedCount.textContent = this.selectedSeats.size;
    if (totalPrice) totalPrice.textContent = total.toFixed(2);
    if (guestInfo) {
      const isLoggedIn = document.querySelector('input[name="user_id"]') !== null;
      if (!isLoggedIn && this.selectedSeats.size > 0) {
        guestInfo.classList.add("visible");
      } else {
        guestInfo.classList.remove("visible");
      }
    }
    if (bookButton) {
      bookButton.disabled = this.selectedSeats.size === 0;
      bookButton.textContent = this.selectedSeats.size > 0 ? `\u0417\u0430\u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u0442\u044C ${this.selectedSeats.size} \u043C\u0435\u0441\u0442` : "\u0417\u0430\u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u0442\u044C";
    }
    if (seatIdsInput) {
      seatIdsInput.value = JSON.stringify(Array.from(this.selectedSeats.keys()));
    }
  }
  setupFormSubmission() {
    const form = document.getElementById("bookingForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        this.handleFormSubmission(e);
      });
    }
  }
  async handleFormSubmission(e) {
    e.preventDefault();
    if (this.selectedSeats.size === 0) {
      this.showNotification("\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u043D\u043E \u043C\u0435\u0441\u0442\u043E", "warning", 3e3);
      return;
    }
    const form = e.target;
    const bookButton = document.getElementById("bookButton");
    const formData = new FormData();
    formData.append("movie_session_id", document.querySelector('input[name="movie_session_id"]').value);
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
    formData.append("_token", csrfToken);
    const seatIds = Array.from(this.selectedSeats.keys());
    seatIds.forEach((seatId) => {
      formData.append("seat_ids[]", seatId);
    });
    const userIdInput = document.querySelector('input[name="user_id"]');
    if (userIdInput && userIdInput.value) {
      formData.append("user_id", userIdInput.value);
    }
    const guestNameInput = document.getElementById("guest_name");
    const guestEmailInput = document.getElementById("guest_email");
    const guestPhoneInput = document.getElementById("guest_phone");
    if (guestNameInput && guestNameInput.value) {
      formData.append("guest_name", guestNameInput.value);
    }
    if (guestEmailInput && guestEmailInput.value) {
      formData.append("guest_email", guestEmailInput.value);
    }
    if (guestPhoneInput && guestPhoneInput.value) {
      formData.append("guest_phone", guestPhoneInput.value);
    }
    const originalText = bookButton.textContent;
    bookButton.textContent = "\u0411\u0440\u043E\u043D\u0438\u0440\u0443\u0435\u043C...";
    bookButton.disabled = true;
    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Accept": "application/json"
        }
      });
      const result = await response.json();
      if (result.success) {
        this.showNotification(result.message, "success", 3e3);
        setTimeout(() => {
          window.location.href = result.redirect_url;
        }, 1500);
      } else {
        this.showNotification(result.message, "error", 5e3);
        bookButton.textContent = originalText;
        bookButton.disabled = false;
        if (result.unavailable_seats) {
          this.resetUnavailableSeats(result.unavailable_seats);
        }
      }
    } catch (error) {
      console.error("Booking error:", error);
      this.showNotification("\u041F\u0440\u043E\u0438\u0437\u043E\u0448\u043B\u0430 \u043E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0438", "error", 5e3);
      bookButton.textContent = originalText;
      bookButton.disabled = false;
    }
  }
  resetUnavailableSeats(unavailableSeats) {
    unavailableSeats.forEach((seatInfo) => {
      const seatElement = document.querySelector(`[data-seat-id="${seatInfo.seat_id}"]`);
      if (seatElement) {
        this.selectedSeats.delete(seatInfo.seat_id);
        seatElement.classList.remove("buying-scheme__chair_selected");
      }
    });
    this.updateSelectionSummary();
  }
  showNotification(message, type = "info", duration = 3e3) {
    const notification = document.createElement("div");
    notification.className = `simple-notification simple-notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
    notification.addEventListener("click", () => {
      notification.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    });
    return notification;
  }
};
document.addEventListener("DOMContentLoaded", () => {
  window.bookingSystem = new BookingSystem();
});
