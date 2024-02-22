import "@/scss/style.scss";
import { dom } from "./DOM.js";
import { months, validationRules } from "./data.js";
import { getDomElement, toProperCase } from "./utils.js";
import workoutMarkerIcon from "@/assets/img/workout-marker.svg";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

//  ================ Classes ================ //
class App {
  //# Private Variables
  #map;
  #userCoords = {};
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  #editFlag = false;
  #editingWorkoutId;
  #sort = {
    value: dom.sortSelectInput.value,
    order: getDomElement("input[type='radio']:checked", false, dom.sortRadioGroup).value,
  };
  #deleteCb;
  #toastNotificationTimeout;

  //# Constructor
  constructor() {
    // Set Page title form .env
    this._setPageTitle();

    // Load Events
    this._loadEvents();

    // Get user's position
    this._getPosition();

    // Get Data from locale storage
    this._getLocalStorage();

    // Check State
    this._checkState();

    // Sort Workouts
    this._sortWorkouts();
  }

  //# Events
  _loadEvents() {
    dom.form.addEventListener("submit", this._formSubmitted.bind(this));
    dom.formCloseIcon.addEventListener("click", this._hideForm.bind(this));
    dom.inputType.addEventListener("change", this._toggleElevationField);
    dom.inputs.forEach((input) => input.addEventListener("blur", this._validateInput.bind(this, input)));
    dom.inputs.forEach((input) => input.addEventListener("keydown", this._removeValidationMessage.bind(this, input)));

    dom.sortSelectInput.addEventListener("change", this._sortPropertyChange.bind(this));
    dom.sortRadioGroup.addEventListener("change", this._sortOrderChange.bind(this));

    dom.containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
    dom.containerWorkouts.addEventListener("click", this._editWorkout.bind(this));
    dom.containerWorkouts.addEventListener("click", this._deleteWorkout.bind(this));

    dom.confirmationDialogClose.addEventListener("click", this._hideDialog);
    dom.confirmationDialogCancel.addEventListener("click", this._hideDialog);
    dom.confirmationDialog.addEventListener("click", this._dialogOverlayClicked.bind(this));
    dom.confirmationDialogDelete.addEventListener("click", this._dialogDeleteClicked.bind(this));

    dom.clear.addEventListener("click", this._clearAllWorkoutsClicked.bind(this));
    window.addEventListener("keydown", this._escapePressed.bind(this));
  }

  // #region ########## Geolocation ########## //
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._geoSuccess.bind(this), this._geoError);
    }
  }

  _geoSuccess(evt) {
    const { latitude, longitude } = evt.coords;
    this.#userCoords = { latitude, longitude };
    this._loadMap();
  }

  _geoError(error) {
    alert("could not get current position");
  }
  // #endregion

  // #region ########## Map ########## //
  _loadMap(position = { coords: this.#userCoords }) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
    }).addTo(this.#map);

    L.marker(coords).addTo(this.#map).bindPopup("Your Location").openPopup();

    // Handling clicks on map
    this.#map.on("click", this._showForm.bind(this));

    this.#workouts.forEach((workout) => {
      this._renderWorkoutMarker(workout);
    });
  }

  _refreshMap() {
    // Save the current map center coordinates
    const currentCenter = this.#map.getCenter();

    // Remove the map
    this.#map.remove();

    // Load the map with the saved center coordinates
    // this._loadMap({ coords: { latitude: currentCenter.lat, longitude: currentCenter.lng } });

    this._loadMap();
  }

  _moveToPopup(evt) {
    const workoutEl = evt.target.closest(".workout");
    if (!workoutEl) return;

    const selectedWorkout = this.#workouts.find((workout) => workout.id === workoutEl.dataset.id);

    this.#map.setView(selectedWorkout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  // #endregion

  // #region ########## Form ########## //
  _showForm(mapEvt, workoutToEdit = null) {
    if (mapEvt) {
      this.#mapEvent = mapEvt;
    }

    dom.form.classList.remove("hidden");
    dom.inputDistance.focus();
    dom.startingHint.classList.add("hidden");

    // If editing a workout, populate the form with the workout details
    if (workoutToEdit) {
      this.#editFlag = true;
      this.#editingWorkoutId = workoutToEdit.id;

      dom.inputType.value = workoutToEdit.type;
      dom.inputDistance.value = workoutToEdit.distance;
      dom.inputDuration.value = workoutToEdit.duration;

      if (workoutToEdit.type === "running") {
        dom.inputCadence.value = workoutToEdit.cadence;
        dom.inputElevation.closest(".form__row").classList.add("form__row--hidden");
        dom.inputCadence.closest(".form__row").classList.remove("form__row--hidden");
      } else if (workoutToEdit.type === "cycling") {
        dom.inputElevation.value = workoutToEdit.elevationGain;
        dom.inputElevation.closest(".form__row").classList.remove("form__row--hidden");
        dom.inputCadence.closest(".form__row").classList.add("form__row--hidden");
      }

      dom.formBtn.textContent = "Save";
    } else {
      // If adding a new workout, clear the form fields
      this._clearForm();
      this.#editFlag = false;
      dom.formBtn.textContent = "Add";
    }
  }

  _hideForm() {
    dom.form.style.display = "none";
    dom.form.classList.add("hidden");

    this._clearInvalidInputsMessages();

    setTimeout(() => {
      dom.form.style.display = "grid";
    }, 10);

    this._checkState();
  }

  _formSubmitted(evt) {
    evt.preventDefault();
    let isValid = true;

    const visibleInputs = [...dom.inputs.filter((input) => !input.closest(".form__row--hidden"))];

    this._clearInvalidInputsMessages();

    visibleInputs.forEach((input) => {
      this._validateInput(input);

      if (input.classList.contains("invalid")) {
        isValid = false;
      }
    });

    if (!isValid) return;

    if (this.#editFlag) {
      this._saveWorkout(evt);
    } else {
      this._newWorkout(evt);
    }
  }

  _clearForm() {
    dom.inputDistance.value = "";
    dom.inputCadence.value = "";
    dom.inputDuration.value = "";
    dom.inputElevation.value = "";
  }

  _toggleElevationField() {
    dom.inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    dom.inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }
  // #endregion

  // #region ########## Input Validation ########## //
  _validateInput(inputElement) {
    const inputName = inputElement.dataset.name; // Get the name of the input from the data-name attribute
    const value = inputElement.value;
    const errorElement = inputElement.nextElementSibling;
    const rules = validationRules[inputName]; // Get the rules for this input
    let isValid = true;
    let errorMessage = "";

    switch (true) {
      case rules.required && value.trim() === "":
        isValid = false;
        errorMessage = "The value cannot be empty";
        break;
      case rules.type === "number" && isNaN(value):
        isValid = false;
        errorMessage = "The value must be a number";
        break;
      case rules.positive && +value <= 0:
        isValid = false;
        errorMessage = "Number must be positive";
        break;
      default:
        break;
    }

    if (isValid) {
      inputElement.classList.remove("invalid");
    } else {
      inputElement.classList.add("invalid");
      errorElement.textContent = errorMessage; // Set the error message text
    }
  }

  _removeValidationMessage(inputElement) {
    inputElement.classList.remove("invalid");
    const errorElement = inputElement.nextElementSibling;
    errorElement.textContent = "";
  }

  _clearInvalidInputsMessages() {
    dom.inputs.forEach((input) => {
      input.classList.remove("invalid");
    });
  }
  // #endregion

  // #region ########## CRUD ########## //
  _newWorkout(evt) {
    evt.preventDefault();

    // Get data from the form
    const type = dom.inputType.value;
    const distance = +dom.inputDistance.value;
    const duration = +dom.inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If activity running , create running object
    if (type === "running") {
      const cadence = +dom.inputCadence.value;
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If activity cycling , create cycling object
    if (type === "cycling") {
      const elevation = +dom.inputElevation.value;
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to the workout array
    this.#workouts.push(workout);

    // Render workout on the map as marker
    this._renderWorkoutMarker(workout);

    // Update UI
    this._sortWorkouts();

    // Clear Inputs
    this._clearForm();

    // Hide Form
    this._hideForm();

    // Set to locale storage
    this._setLocaleStorage();

    // Display toast notification
    this._displayToastNotification("success", "Workout added successfully");

    // Check State
    this._checkState();
  }

  _saveWorkout(evt) {
    evt.preventDefault();

    // Find the workout to be edited
    const workoutIndex = this.#workouts.findIndex((w) => w.id === this.#editingWorkoutId);
    const selectedWorkout = this.#workouts[workoutIndex];

    if (workoutIndex === -1) return; // Workout not found

    // Get data from the form
    const type = dom.inputType.value;
    const distance = +dom.inputDistance.value;
    const duration = +dom.inputDuration.value;
    const {
      coords: [lat, lng],
      date,
      id,
    } = selectedWorkout;

    let workout;

    // Create a new workout object with the updated values
    if (type === "running") {
      const cadence = +dom.inputCadence.value;
      workout = new Running([lat, lng], distance, duration, cadence, date, id);
    } else if (type === "cycling") {
      const elevation = +dom.inputElevation.value;
      workout = new Cycling([lat, lng], distance, duration, elevation, date, id);
    }

    // Replace the old workout with the new one in the array
    this.#workouts[workoutIndex] = workout;

    // Render workout on the map as marker
    this._refreshState();

    // Save the updated workouts array to local storage
    this._setLocaleStorage();

    // Reset Form
    this._clearForm();
    this._hideForm();

    // Show toast notification
    this._displayToastNotification("success", "Workout saved successfully");

    // Reset the editFlag
    this.#editFlag = false;
  }

  _deleteWorkout(evt) {
    const deleteActionEl = evt.target.closest(".workout__action--delete");
    if (!deleteActionEl) return;

    const workoutEl = deleteActionEl.closest(".workout");
    const selectedId = workoutEl.dataset.id;

    const msg = "Are you sure you want to delete this workout?";
    const btnText = "Delete";
    const cb = () => this._deleteWorkoutConfirm(selectedId);

    this._showDialog(msg, btnText, cb);
  }

  _deleteWorkoutConfirm(id) {
    this.#workouts = this.#workouts.filter((workout) => workout.id !== id);

    if (this.#editingWorkoutId === id) {
      this._clearForm();
      this._hideForm();
    }

    this._refreshState();
    this._setLocaleStorage();
    this._displayToastNotification("danger", "Workout deleted successfully");
  }

  _editWorkout(evt) {
    const editActionEl = evt.target.closest(".workout__action--edit");
    if (!editActionEl) return;

    const workoutEl = editActionEl.closest(".workout");
    const workoutId = workoutEl.dataset.id;
    const workoutToEdit = this.#workouts.find((workout) => workout.id === workoutId);

    if (workoutToEdit) {
      // Call _showForm with the workout to edit
      this._showForm(null, workoutToEdit);
    }
  }
  // #endregion

  // #region ########## Display ########## //
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords, {
      icon: L.icon({
        iconUrl: workoutMarkerIcon,
        iconSize: [32, 35],
        popupAnchor: [0, -15],
      }),
    })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 200,
          minWidth: 120,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.emoji} ${workout.description}`)
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <div class="workout__header">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__actions">
          <span class="workout__action workout__action--edit">
            <i class="fa-solid fa-pen-to-square"></i>
          </span>
          <span class="workout__action workout__action--delete">
            <i class="fas fa-trash"></i>
          </span>
        </div>
      </div>
      <div class="workout__details" title="Distance">
        <span class="workout__icon">${workout.emoji}</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details" title="Duration">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `;

    if (workout.type === "running") {
      html += `
        <div class="workout__details" title="Pace">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details" title="Cadence">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;
    }

    if (workout.type === "cycling") {
      html += `
        <div class="workout__details" title="Speed">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details" title="Elevation Gain">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;
    }

    dom.form.insertAdjacentHTML("afterend", html);
  }

  _displayWorkouts() {
    // Reset UI
    const workoutsEl = getDomElement(".workout", true);
    workoutsEl.forEach((workout) => workout.remove());

    // If workouts array is empty
    if (this.#workouts.length === 0) {
      // Check if the starting hint already exists
      const startingHintExists = !!document.getElementById("starting-hint");

      // Only insert the starting hint message if it doesn't already exist
      if (!startingHintExists) {
        dom.form.insertAdjacentHTML(
          "afterend",
          `
          <p class="starting-hint" id="starting-hint">
            <i class="fa-solid fa-location-dot"></i>
            <span class="ml-2">Click anywhere on the map to add a new workout</span>
          </p>
        `
        );
      }
    }

    // if we have workouts
    this.#workouts.forEach((workout) => {
      this._renderWorkout(workout);
    });
  }

  _checkState() {
    if (this.#workouts.length === 0) {
      if (dom.form.classList.contains("hidden")) {
        dom.startingHint.classList.remove("hidden");
      }
      dom.clear.classList.add("hidden");
      dom.sortWrapper.classList.add("hidden");
    } else {
      dom.startingHint.classList.add("hidden");
      dom.clear.classList.remove("hidden");
      dom.sortWrapper.classList.remove("hidden");
    }
  }
  // #endregion

  // #region ########## Sorting ########## //
  _sortPropertyChange(evt) {
    this.#sort.value = evt.target.value;
    this._sortWorkouts();
  }

  _sortOrderChange(evt) {
    if (evt.target.matches("input[type='radio']")) {
      this.#sort.order = evt.target.value;
    }
    this._sortWorkouts();
  }

  _sortWorkouts() {
    const { value: sortBy, order } = this.#sort;

    this.#workouts.sort((a, b) => {
      // Convert the date strings to Date objects for comparison
      if (sortBy === "date") {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return order === "asc" ? dateB - dateA : dateA - dateB; // Reversed logic
      }

      // For numeric properties, compare them directly
      if (sortBy === "distance" || sortBy === "duration") {
        return order === "asc" ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy]; // Reversed logic
      }

      // For string properties, compare them alphabetically
      if (sortBy === "description") {
        return order === "asc" ? b[sortBy].localeCompare(a[sortBy]) : a[sortBy].localeCompare(b[sortBy]); // Reversed logic
      }

      // Default case, no sorting
      return 0;
    });

    // Display Workouts
    this._displayWorkouts();
  }
  // #endregion

  // #region ########## Toast Notification ########## //
  _showToastNotification() {
    dom.toastNotification.classList.add("shown");
  }

  _hideToastNotification() {
    dom.toastNotification.classList.remove("shown");
  }

  _displayToastNotification(category, msg) {
    const baseClass = "toast-notification";
    clearTimeout(this.#toastNotificationTimeout);

    dom.toastNotification.textContent = msg;
    dom.toastNotification.className = `${baseClass} ${category}`;

    this._showToastNotification();

    this.#toastNotificationTimeout = setTimeout(() => {
      this._hideToastNotification();
    }, 4000);
  }
  // #endregion

  // #region ########## Local Storage ########## //
  _setLocaleStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));

    if (!data) return;

    this.#workouts = data;
    this._sortWorkouts();
  }

  _removeLocalStorage() {
    localStorage.removeItem("workouts");
  }
  // #endregion

  // #region ########## Clear ########## //
  _clearAllWorkoutsClicked() {
    const msg = "Are you sure you want to delete all workouts? This action cannot be undone.";
    const btnText = "Clear";
    const cb = () => {
      this._clearWorkoutsConfirmed();
    };

    this._showDialog(msg, btnText, cb);
  }

  _clearWorkoutsConfirmed() {
    this.#workouts = [];
    this._removeLocalStorage();
    this._refreshState();
    this._displayToastNotification("danger", "Workouts cleared successfully");
  }
  // #endregion

  // #region ########## Dialog ########## //
  _showDialog(msg, btnText, cb) {
    dom.confirmationDialogMessage.textContent = msg;
    dom.confirmationDialogDelete.textContent = btnText;
    dom.confirmationDialog.classList.remove("hidden");
    this.#deleteCb = cb;
  }

  _hideDialog() {
    dom.confirmationDialog.classList.add("hidden");
  }

  _dialogOverlayClicked(evt) {
    const clickedOnContent = !!evt.target.closest(".confirmation-dialog__content");
    if (clickedOnContent) return;

    this._hideDialog();
  }

  _dialogDeleteClicked() {
    if (typeof this.#deleteCb === "function") {
      this.#deleteCb();
      this._hideDialog();
    }
  }
  // #endregion

  // #region ########## Other ########## //
  _refreshState() {
    this._sortWorkouts();
    this._checkState();
    this._refreshMap();
  }

  _escapePressed(evt) {
    if (evt.key !== "Escape") return;

    if (!dom.confirmationDialog.classList.contains("hidden")) {
      this._hideDialog();
      return;
    }

    if (!dom.form.classList.contains("hidden")) {
      this._hideForm();
      return;
    }
  }

  _setPageTitle() {
    document.title = import.meta.env.VITE_APP_PAGE_TITLE;
  }
  // #endregion
}

class Workout {
  constructor(coords, distance, duration, date, id) {
    this.coords = coords;
    this.distance = distance; //in km
    this.duration = duration; // in min
    this.date = date ? new Date(date) : new Date();
    this.id = id || String((Date.now() + "").slice(-7) * Math.floor(Math.random() * 10));
  }

  _setDescription() {
    this.description = `${toProperCase(this.type)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = "running";
  emoji = "🏃‍♂️";
  markerName = "marker-running";

  constructor(coords, distance, duration, cadence, date, id) {
    super(coords, distance, duration, date, id);
    this.cadence = cadence;

    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    //min/km
    this.pace = Number((this.duration / this.distance).toFixed(2));
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";
  emoji = "🚴‍♀️";
  markerName = "marker-cycling";

  constructor(coords, distance, duration, elevationGain, date, id) {
    super(coords, distance, duration, date, id);
    this.elevationGain = elevationGain;

    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    //km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

//  ================ Init ================ //
const app = new App();
