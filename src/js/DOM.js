import { getDomElement } from "./utils.js";

export const dom = {
  root: document.documentElement,

  form: getDomElement(".form"),
  formBtn: getDomElement(".form__btn"),
  formCloseIcon: getDomElement(".form__close-icon"),

  sortWrapper: getDomElement(".sort__wrapper"),
  sortSelectInput: getDomElement("#sort__select-input"),
  sortRadioGroup: getDomElement(".sort__radio-group"),

  containerWorkouts: getDomElement(".workouts"),

  inputType: getDomElement(".form__input--type"),
  inputDistance: getDomElement(".form__input--distance"),
  inputDuration: getDomElement(".form__input--duration"),
  inputCadence: getDomElement(".form__input--cadence"),
  inputElevation: getDomElement(".form__input--elevation"),

  startingHint: getDomElement("#starting-hint"),
  clear: getDomElement("#clear"),
};
