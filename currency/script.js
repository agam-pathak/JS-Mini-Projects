/**
 * Robust Currency Converter Engine
 * Uses ExchangeRate-API (Free tier, no key required for basic lookups)
 */

const BASE_URL = "https://open.er-api.com/v6/latest";

const dropdowns = document.querySelectorAll(".dropdown select");
const btn = document.querySelector("form button");
const fromCurr = document.querySelector(".from select");
const toCurr = document.querySelector(".to select");
const msg = document.querySelector(".msg");

// Populate dropdowns with currency options
for (let select of dropdowns) {
    for (let currCode in countryList) {
        let newOption = document.createElement("option");
        newOption.innerText = currCode;
        newOption.value = currCode;
        
        // Default selection logic
        if (select.name === "from" && currCode === "USD") {
            newOption.selected = "selected";
        } else if (select.name === "to" && currCode === "INR") {
            newOption.selected = "selected";
        }
        select.append(newOption);
    }

    select.addEventListener("change", (evt) => {
        updateFlag(evt.target);
    });
}

/**
 * Fetches the latest exchange rate and updates the UI
 */
const updateExchangeRate = async () => {
    let amount = document.querySelector(".amount input");
    let amtVal = amount.value;
    
    // Sanitize input
    if (amtVal === "" || amtVal < 0) {
        amtVal = 1;
        amount.value = "1";
    }

    // UI Feedback: Start Loading
    msg.innerText = "Fetching exchange rate...";
    btn.classList.add("loading");
    btn.innerText = "Updating...";

    try {
        const URL = `${BASE_URL}/${fromCurr.value}`;
        const response = await fetch(URL);
        
        if (!response.ok) throw new Error("API Network response was not ok");
        
        const data = await response.json();
        
        if (data.result === "error") {
            throw new Error(data["error-type"] || "Failed to fetch data");
        }

        const rates = data.rates;
        const rate = rates[toCurr.value];
        const finalAmount = (amtVal * rate).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        });

        // Update UI with result
        msg.innerHTML = `${amtVal} ${fromCurr.value} = <strong>${finalAmount} ${toCurr.value}</strong>`;
        
    } catch (error) {
        console.error("Conversion Error:", error);
        msg.innerHTML = `<span style="color: #ef4444;">Error: ${error.message}</span>`;
    } finally {
        // UI Feedback: End Loading
        btn.classList.remove("loading");
        btn.innerText = "Get Exchange Rate";
    }
};

/**
 * Updates the flag image based on selected country code
 */
const updateFlag = (element) => {
    let currCode = element.value;
    let countryCode = countryList[currCode];
    if (countryCode) {
        let newSrc = `https://flagsapi.com/${countryCode}/flat/64.png`;
        let img = element.parentElement.querySelector("img");
        img.src = newSrc;
    }
};

// Event Listeners
btn.addEventListener("click", (evt) => {
    evt.preventDefault();
    updateExchangeRate();
});

// Auto-update on page load
window.addEventListener("load", () => {
    updateExchangeRate();
});