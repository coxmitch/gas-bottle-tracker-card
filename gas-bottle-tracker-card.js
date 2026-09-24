class GasBottleTracker extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    this.config = {
      title: "Gas Bottle",

      remaining_entity:
        "sensor.remaining_percentage",

      days_entity:
        "sensor.estimated_days_remaining",

      age_entity:
        "sensor.current_bottle_age",

      next_change_entity:
        "sensor.estimated_next_change",

      lifespan_entity:
        "sensor.average_bottle_lifespan",

      spare_entity:
        "sensor.spare_bottles",

      bottle_size_entity:
        "sensor.bottle_size",

      ...config,
    };
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  get hass() {
    return this._hass;
  }

  getCardSize() {
    return 8;
  }

  state(entity) {
    return this._hass?.states?.[entity];
  }

  value(entity, fallback = "--") {
    const state = this.state(entity);

    return state
      ? state.state
      : fallback;
  }

  getStatus(remaining) {
    if (remaining === "--") {
      return {
        text: "UNKNOWN",
        className: "unknown",
        colour:
          "var(--secondary-text-color)",
      };
    }

    const value = Number(remaining);

    if (value <= 0) {
      return {
        text: "OVERDUE",
        className: "danger",
        colour: "#f44336",
      };
    }

    if (value <= 10) {
      return {
        text: "CRITICAL",
        className: "danger",
        colour: "#f44336",
      };
    }

    if (value <= 25) {
      return {
        text: "LOW",
        className: "warning",
        colour: "#ff9800",
      };
    }

    return {
      text: "GOOD",
      className: "good",
      colour: "#4caf50",
    };
  }

  async callService(
    domain,
    service,
    data = {}
  ) {
    await this._hass.callService(
      domain,
      service,
      data
    );
  }

  async addSpare() {
    await this.callService(
      "gas_bottle_tracker",
      "add_spare"
    );
  }

  async removeSpare() {
    await this.callService(
      "gas_bottle_tracker",
      "remove_spare"
    );
  }

  showNewBottleDialog() {
    const today = new Date()
      .toISOString()
      .split("T")[0];

    const overlay =
      document.createElement("div");

    overlay.className = "overlay";

    overlay.innerHTML = `
      <div class="dialog">

        <h2>New Gas Bottle</h2>

        <label>
          Change Date

          <input
            type="date"
            id="change-date"
            value="${today}"
          >
        </label>

        <label class="checkbox">

          <input
            type="checkbox"
            id="used-spare"
          >

          <span>
            Used a spare bottle
          </span>

        </label>

        <div class="dialog-buttons">

          <button id="cancel">
            Cancel
          </button>

          <button
            id="confirm"
            class="confirm"
          >
            Install Bottle
          </button>

        </div>

      </div>
    `;

    this.shadowRoot.appendChild(
      overlay
    );

    overlay
      .querySelector("#cancel")
      .addEventListener(
        "click",
        () => {
          overlay.remove();
        }
      );

    overlay
      .querySelector("#confirm")
      .addEventListener(
        "click",
        async () => {
          const changeDate =
            overlay.querySelector(
              "#change-date"
            ).value;

          const usedSpare =
            overlay.querySelector(
              "#used-spare"
            ).checked;

          await this.callService(
            "gas_bottle_tracker",
            "new_bottle",
            {
              change_date:
                changeDate,

              used_spare:
                usedSpare,
            }
          );

          overlay.remove();
        }
      );
  }

  render() {
    if (
      !this._hass ||
      !this.config
    ) {
      return;
    }

    const remaining =
      this.value(
        this.config
          .remaining_entity
      );

    const days =
      this.value(
        this.config
          .days_entity
      );

    const age =
      this.value(
        this.config
          .age_entity
      );

    const nextChange =
      this.value(
        this.config
          .next_change_entity
      );

    const lifespan =
      this.value(
        this.config
          .lifespan_entity
      );

    const spare =
      this.value(
        this.config
          .spare_entity
      );

    const bottleSize =
      this.value(
        this.config
          .bottle_size_entity
      );

    const status =
      this.getStatus(
        remaining
      );

    const percentage =
      Number(remaining);

    const safePercentage =
      Number.isFinite(
        percentage
      )
        ? Math.max(
            0,
            Math.min(
              100,
              percentage
            )
          )
        : 0;

    this.shadowRoot.innerHTML = `
      <style>

        :host {
          display: block;
        }

        ha-card {
          padding: 20px;
          overflow: hidden;
        }

        /* =========================
           HEADER
           ========================= */

        .header {
          display: flex;

          justify-content:
            space-between;

          align-items: center;

          margin-bottom: 10px;
        }

        .title {
          font-size: 22px;
          font-weight: 600;
        }

        .status {
          padding:
            6px 12px;

          border-radius:
            20px;

          font-size: 12px;

          font-weight: 700;
        }

        .good {
          background:
            rgba(
              76,
              175,
              80,
              0.18
            );

          color: #4caf50;
        }

        .warning {
          background:
            rgba(
              255,
              152,
              0,
              0.18
            );

          color: #ff9800;
        }

        .danger {
          background:
            rgba(
              244,
              67,
              54,
              0.18
            );

          color: #f44336;
        }

        .unknown {
          background:
            var(
              --secondary-background-color
            );

          color:
            var(
              --secondary-text-color
            );
        }

        /* =========================
           BOTTLE
           ========================= */

        .bottle-section {
          display: flex;

          justify-content:
            center;

          align-items: center;

          width: 100%;

          padding:
            10px 0 8px;
        }

        .bottle-wrapper {
          position: relative;

          width: 150px;

          height: 270px;

          margin: 0 auto;

          flex:
            0 0 150px;
        }

        /* Valve */

        .bottle-valve {
          position: absolute;

          top: 4px;

          left: 50%;

          transform:
            translateX(-50%);

          width: 56px;

          height: 12px;

          border-radius: 5px;

          background:
            var(
              --primary-text-color
            );

          z-index: 5;
        }

        /* Neck */

        .bottle-neck {
          position: absolute;

          top: 0;

          left: 50%;

          transform:
            translateX(-50%);

          width: 42px;

          height: 45px;

          box-sizing:
            border-box;

          border:
            4px solid
            var(
              --primary-text-color
            );

          border-bottom:
            none;

          border-radius:
            10px 10px 0 0;

          background:
            var(
              --card-background-color
            );

          z-index: 3;
        }

        /* Main cylinder */

        .bottle-body {
          position: absolute;

          top: 35px;

          left: 15px;

          width: 120px;

          height: 235px;

          box-sizing:
            border-box;

          overflow: hidden;

          border:
            4px solid
            var(
              --primary-text-color
            );

          border-radius:
            32px 32px 24px 24px;

          background:
            rgba(
              128,
              128,
              128,
              0.10
            );

          box-shadow:
            inset 0 0 12px
            rgba(
              0,
              0,
              0,
              0.25
            );

          z-index: 2;
        }

        /* Gas fill */

        .gas-fill {
          position: absolute;

          left: 0;

          right: 0;

          bottom: 0;

          height:
            ${safePercentage}%;

          background:
            ${status.colour};

          opacity: 0.75;

          transition:
            height 0.8s ease,
            background 0.4s ease;

          animation:
            gas-pulse
            4s ease-in-out
            infinite;
        }

        /* Gas level line */

        .gas-line {
          position: absolute;

          left: 0;

          right: 0;

          bottom:
            ${safePercentage}%;

          height: 3px;

          transform:
            translateY(50%);

          background:
            ${status.colour};

          box-shadow:
            0 0 8px
            ${status.colour};

          transition:
            bottom 0.8s ease,
            background 0.4s ease;

          z-index: 3;
        }

        /* Bottle base */

        .bottle-base {
          position: absolute;

          bottom: 0;

          left: 25px;

          width: 100px;

          height: 18px;

          box-sizing:
            border-box;

          border:
            4px solid
            var(
              --primary-text-color
            );

          border-top:
            none;

          border-radius:
            0 0 10px 10px;

          z-index: 3;
        }

        /* =========================
           DAYS
           ========================= */

        .days {
          text-align: center;

          font-size: 48px;

          font-weight: 700;

          line-height: 1;
        }

        .days-label {
          text-align: center;

          font-size: 13px;

          opacity: 0.7;

          margin-top: 5px;
        }

        /* =========================
           DETAILS
           ========================= */

        .details {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 10px;

          margin-top: 20px;
        }

        .detail {
          padding: 12px;

          border-radius: 12px;

          background:
            var(
              --secondary-background-color
            );
        }

        .label {
          font-size: 12px;

          opacity: 0.65;
        }

        .value {
          font-size: 17px;

          font-weight: 600;

          margin-top: 4px;
        }

        /* =========================
           SPARES
           ========================= */

        .spares {
          display: flex;

          justify-content:
            space-between;

          align-items: center;

          margin-top: 18px;

          padding: 12px;

          border-radius: 12px;

          background:
            var(
              --secondary-background-color
            );
        }

        .spare-buttons {
          display: flex;

          gap: 8px;
        }

        button {
          border: none;

          border-radius: 10px;

          padding:
            9px 14px;

          cursor: pointer;

          background:
            var(
              --primary-color
            );

          color:
            var(
              --text-primary-color
            );

          font-size: 18px;
        }

        button:active {
          transform:
            scale(0.95);
        }

        .new-bottle {
          width: 100%;

          margin-top: 15px;

          padding: 13px;

          font-size: 16px;

          font-weight: 600;
        }

        /* =========================
           NEW BOTTLE DIALOG
           ========================= */

        .overlay {
          position: fixed;

          inset: 0;

          background:
            rgba(
              0,
              0,
              0,
              0.55
            );

          display: flex;

          align-items: center;

          justify-content: center;

          z-index: 9999;
        }

        .dialog {
          width:
            min(
              400px,
              90vw
            );

          background:
            var(
              --card-background-color
            );

          color:
            var(
              --primary-text-color
            );

          border-radius: 18px;

          padding: 22px;

          box-shadow:
            0 10px 40px
            rgba(
              0,
              0,
              0,
              0.4
            );
        }

        .dialog h2 {
          margin-top: 0;
        }

        .dialog label {
          display: block;

          margin: 18px 0;
        }

        .dialog input[type="date"] {
          display: block;

          width: 100%;

          box-sizing:
            border-box;

          margin-top: 8px;

          padding: 10px;

          border-radius: 8px;

          border:
            1px solid
            var(
              --divider-color
            );

          background:
            var(
              --secondary-background-color
            );

          color:
            var(
              --primary-text-color
            );
        }

        .checkbox {
          display:
            flex !important;

          align-items: center;

          gap: 10px;
        }

        .checkbox input {
          width: 20px;

          height: 20px;
        }

        .dialog-buttons {
          display: flex;

          justify-content:
            flex-end;

          gap: 10px;

          margin-top: 20px;
        }

        .dialog-buttons button {
          font-size: 14px;
        }

        .confirm {
          background:
            var(
              --primary-color
            );
        }

        /* =========================
           ANIMATION
           ========================= */

        @keyframes gas-pulse {

          0%,
          100% {
            opacity: 0.68;
          }

          50% {
            opacity: 0.82;
          }

        }

      </style>

      <ha-card>

        <!-- HEADER -->

        <div class="header">

          <div class="title">
            ${this.config.title}
          </div>

          <div
            class="
              status
              ${status.className}
            "
          >
            ${status.text}
          </div>

        </div>

        <!-- GAS BOTTLE -->

        <div class="bottle-section">

          <div class="bottle-wrapper">

            <div
              class="bottle-valve"
            ></div>

            <div
              class="bottle-neck"
            ></div>

            <div class="bottle-body">

              <div
                class="gas-fill"
              ></div>

              <div
                class="gas-line"
              ></div>

            </div>

            <div
              class="bottle-base"
            ></div>

          </div>

        </div>

        <!-- DAYS -->

        <div class="days">
          ${days}
        </div>

        <div class="days-label">
          DAYS REMAINING
        </div>

        <!-- DETAILS -->

        <div class="details">

          <div class="detail">

            <div class="label">
              Bottle Size
            </div>

            <div class="value">
              ${bottleSize} kg
            </div>

          </div>

          <div class="detail">

            <div class="label">
              Bottle Age