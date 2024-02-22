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

  inputs: getDomElement(".form__input--validate", true),
  inputType: getDomElement(".form__input--type"),
  inputDistance: getDomElement(".form__input--distance"),
  inputDuration: getDomElement(".form__input--duration"),
  inputCadence: getDomElement(".form__input--cadence"),
  inputElevation: getDomElement(".form__input--elevation"),

  confirmationDialog: getDomElement("#confirmation-dialog"),
  confirmationDialogMessage: getDomElement(".confirmation-dialog__message"),
  confirmationDialogClose: getDomElement("#confirmation-dialog-close"),
  confirmationDialogCancel: getDomElement(".confirmation-dialog__btn--cancel"),
  confirmationDialogDelete: getDomElement(".confirmation-dialog__btn--delete"),

  toastNotification: getDomElement("#toast-notification"),

  startingHint: getDomElement("#starting-hint"),
  clear: getDomElement("#clear"),
};
