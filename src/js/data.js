export const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const validationRules = {
  distance: {
    required: true,
    type: "number",
    positive: true,
  },
  duration: {
    required: true,
    type: "number",
    positive: true,
  },
  cadence: {
    required: true,
    type: "number",
    positive: true,
  },
  elevation: {
    required: true,
    type: "number",
    positive: false, // Allows negative numbers
  },
};
