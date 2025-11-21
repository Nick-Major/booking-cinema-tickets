// public/js/client/booking.js
var SimpleNotification = class {
  static show(message, type = "info", duration = 3e3) {
    const notification = document.createElement("div");
    notification.className = `simple-notification simple-notification-${type}`;
    notification.innerHTML = message;
    notification.style.cssText = `
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
        `;
    const colors = {
      success: "#28a745",
      error: "#dc3545",
      warning: "#ffc107",
      info: "#17a2b8"
    };
    notification.style.backgroundColor = colors[type] || colors.info;
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
var BookingSystem = class {
  constructor() {
    this.selectedSeats = [];
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
            `;
      document.head.appendChild(style);
    }
  }
  setupEventListeners() {
    document.querySelectorAll(".buying-scheme__chair").forEach((seat) => {
      seat.addEventListener("click", () => {
        this.handleSeatSelection(seat);
      });
    });
  }
  handleSeatSelection(seatElement) {
    const seatId = seatElement.dataset.seatId;
    const row = seatElement.dataset.row;
    const seatNumber = seatElement.dataset.seat;
    const price = parseFloat(seatElement.dataset.price);
    if (seatElement.classList.contains("buying-scheme__chair_disabled") || seatElement.classList.contains("buying-scheme__chair_taken")) {
      return;
    }
    if (seatElement.classList.contains("buying-scheme__chair_selected")) {
      seatElement.classList.remove("buying-scheme__chair_selected");
      this.selectedSeats = this.selectedSeats.filter((s) => s.id !== seatId);
      SimpleNotification.show("\u041C\u0435\u0441\u0442\u043E \u043E\u0442\u043C\u0435\u043D\u0435\u043D\u043E", "info", 2e3);
    } else {
      if (this.selectedSeats.length >= 1) {
        SimpleNotification.show("\u041C\u043E\u0436\u043D\u043E \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u0434\u043D\u043E \u043C\u0435\u0441\u0442\u043E \u0437\u0430 \u0440\u0430\u0437", "warning", 3e3);
        return;
      }
      seatElement.classList.add("buying-scheme__chair_selected");
      this.selectedSeats.push({ id: seatId, row, seat: seatNumber, price });
      SimpleNotification.show(`\u0412\u044B\u0431\u0440\u0430\u043D\u043E: \u0420\u044F\u0434 ${row}, \u041C\u0435\u0441\u0442\u043E ${seatNumber}`, "success", 2e3);
    }
    this.updateSelectionSummary();
  }
  updateSelectionSummary() {
    const selectedCount = document.getElementById("selectedCount");
    const totalPrice = document.getElementById("totalPrice");
    const bookButton = document.getElementById("bookButton");
    const seatIdInput = document.getElementById("selectedSeatId");
    selectedCount.textContent = this.selectedSeats.length;
    totalPrice.textContent = this.selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
    if (this.selectedSeats.length > 0) {
      bookButton.disabled = false;
      seatIdInput.value = this.selectedSeats[0].id;
    } else {
      bookButton.disabled = true;
      seatIdInput.value = "";
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
    const form = e.target;
    const formData = new FormData(form);
    const bookButton = document.getElementById("bookButton");
    const originalText = bookButton.textContent;
    bookButton.textContent = "\u0411\u0440\u043E\u043D\u0438\u0440\u0443\u0435\u043C...";
    bookButton.disabled = true;
    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-TOKEN": document.querySelector('input[name="_token"]').value
        }
      });
      const result = await response.json();
      if (result.success) {
        SimpleNotification.show(result.message, "success", 3e3);
        setTimeout(() => {
          window.location.href = result.redirect_url;
        }, 1500);
      } else {
        SimpleNotification.show(result.message, "error", 5e3);
        bookButton.textContent = originalText;
        bookButton.disabled = false;
      }
    } catch (error) {
      console.error("Booking error:", error);
      SimpleNotification.show("\u041F\u0440\u043E\u0438\u0437\u043E\u0448\u043B\u0430 \u043E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0438", "error", 5e3);
      bookButton.textContent = originalText;
      bookButton.disabled = false;
    }
  }
};
document.addEventListener("DOMContentLoaded", () => {
  new BookingSystem();
});
