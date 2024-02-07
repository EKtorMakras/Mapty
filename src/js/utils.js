

// ========= Strings ========= //
export function toProperCase(str) {
    return (str[0].toUpperCase() + str.substring(1).toLowerCase())
}



// ========= Numbers ========= //
export function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
}


export function randomNumberBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}


export function numberIsEven(number) {
  return number % 2 === 0;
}


export function getAverage(...nums) {
  nums.reduce((a,b) => a + b) / nums.length
}


export function formatNumber(number,notation,locale) {
  const NUMBER_FORMATTER = new Intl.NumberFormat(locale, {
    notation
  });

  return NUMBER_FORMATTER.format(number);
}


export function formatCurrency(number, currency = 'USD', locale = 'en-US') {
  const CURRENCY_FORMATTER = new Intl.NumberFormat(locale, {
    currency: currency,
    style: 'currency',
  });

  return CURRENCY_FORMATTER.format(number);
}



// ========= Dates ========= //
export function getNextDay(i, length = 7) {
    
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const nextDayNumber = new Date().getDay() + 1;
    const nextDay = days[(nextDayNumber + i) % length];

    return nextDay
}


export function formatDate(date = new Date()) {
    return [
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
    ].join('-');
}


export function formatRelativeDate(toDate, fromDate = new Date(), locale) {

  const DIVISIONS = [
    { amount: 60, name: "seconds" },
    { amount: 60, name: "minutes" },
    { amount: 24, name: "hours" },
    { amount: 7, name: "days" },
    { amount: 4.34524, name: "weeks" },
    { amount: 12, name: "months" },
    { amount: Number.POSITIVE_INFINITY, name: "years" },
  ]

  const RELATIVE_DATE_FORMATTER = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
  })

  let duration = (toDate - fromDate) / 1000

  for (let i = 0; i <= DIVISIONS.length; i++) {
    const division = DIVISIONS[i]
    if (Math.abs(duration) < division.amount) {
      return RELATIVE_DATE_FORMATTER.format(Math.round(duration), division.name)
    }
    duration /= division.amount
  }
}



// ========= Colors ========= //
export function getColorFromCustomProps(colorName) {
    const color = getComputedStyle(document.documentElement).getPropertyValue(`--clr-${colorName}`);
    return color;
}



// ========= Arrays ========= //
export function arrFirst(array, n = 1) {
  if (n === 1) return array[0]
  return array.filter((_, index) => index < n)
}


export function arrLast(array, n = 1) {
  if (n === 1) return array[array.length - 1]
  return array.filter((_, index) => array.length - index <= n)
}


export function arrRandom(array) {
  return array[randomNumberBetween(0, array.length - 1)]
}


export function arrGetUniqueValues(array,value) {
  return [
      ...new Set(array.map(item => {
          return item[value];
      }))
  ]
}


export function arrGroupBy(array, key) {
  return array.reduce((group, element) => {
    const keyValue = element[key]

    return {
      ...group,
      [keyValue]: [...(group[keyValue] ?? []), element]
    }
  }, {})
}


export function arrIsNotEmpty(array) {
  return Array.isArray(array) && array.length > 0;
}


export function arrShuffle(array) {
  return array.sort(() => 0.5 - Math.random())
}

 

// ========= DOM ========= //

// Global Event Listener
export function addGlobalEventListener(type = 'click', selector, callback, parent = document, options) {
  parent.addEventListener(type, e => {
    if (e.target.matches(selector)) callback(e);
  },options)
}


//  Get Dom Element //
export function getDomElement(selection, multiple = false, parent = document) {
    
    let element;

    if (multiple) {
      element = [...parent.querySelectorAll(selection)];
    }
    else {
      element = parent.querySelector(selection);
    }
    

    if (element) {
        return element;
    }

    throw new Error('no element selected');
}


//  Create Element  //
export function createHtmlElement(htmlString) {
    const template = document.createElement('template');
    htmlString = htmlString.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = htmlString;

    return template.content.firstElementChild;
}


export function createElement(options = {}, type = 'div') {

  const element = document.createElement(type)

  Object.entries(options).forEach(([key, value]) => {

    if (key === "class") {
      element.classList.add(value)
      return
    }

    if (key === "dataset") {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue
      })
      return
    }

    if (key === "text") {
      element.textContent = value
      return
    }

    element.setAttribute(key, value)
  })
  return element
}


//  Delete All Child Elements  //
export function deleteChildElements(parentElement) {
    let child = parentElement.lastElementChild;
    while (child) {
        parentElement.removeChild(child);
        child = parentElement.lastElementChild;
    }
}



// ========= Local Storage ========= //

export function getObjectLs(key) {
    return JSON.parse(localStorage.getItem(key));
} 


export function setObjectLs(key, obj) {
    localStorage.setItem(key, JSON.stringify(obj));
}


export function updateItemLs(key, property, value) {
    var obj = getObjectLs(key);

    if (obj) {
     obj[property] = value;    
     setObjectLs(key, obj);
    }

    else {
        setObjectLs(key, {
         [property]: value
     });
    }
    
}


// ========= Other ========= //
export function sanitizeInput(inputValue) {
    const div = document.createElement('div');
    div.textContent = inputValue;
    return div.innerHTML;
}


export function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
}


// Get parameters by name from url
export function getParameterValue  (paramName, url = window.location.href) {
    if (!url) url = window.location.href;
    const regex = new RegExp(`[?&]${paramName}(=([^&#]*))`);
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}