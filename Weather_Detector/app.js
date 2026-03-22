const weatherDisplay = document.getElementById('weather-display');

document.getElementById('weather-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const cityInput = document.querySelector('input[name="city"]');
    const city = cityInput.value;
    const apiKey = '0942f832e6ae6e86a18765b6a522f0bf'; 
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const submitBtn = document.querySelector('input[type="submit"]');
  
    try {
        // UI Feedback: Loading
        submitBtn.value = "Searching...";
        submitBtn.style.opacity = "0.7";

        const response = await fetch(apiUrl);
        const data = await response.json();
  
        if (data.cod === 200) {
            // Update UI Elements
            document.getElementById('city').innerText = `${data.name}, ${data.sys.country}`;
            document.getElementById('temp').innerText = Math.round(data.main.temp) + '°C';
            document.getElementById('humidity').innerText = data.main.humidity + '%';
            document.getElementById('pressure').innerText = data.main.pressure + ' hPa';
            document.getElementById('wind-speed').innerText = data.wind.speed + ' m/s';
            document.getElementById('weather').innerText = data.weather[0].description;
            document.getElementById('country').innerText = data.sys.country;
            document.getElementById('lat').innerText = data.coord.lat;
            document.getElementById('lon').innerText = data.coord.lon;

            // Weather Icon logic
            const iconCode = data.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
            const iconContainer = document.getElementById('weather-icon-container');
            iconContainer.innerHTML = `<img src="${iconUrl}" alt="${data.weather[0].description}">`;

            // Reveal Display
            weatherDisplay.style.display = 'block';
            
            // Clear input
            cityInput.value = "";
            cityInput.blur();

        } else {
            alert('City not found. Please try another name.');
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Unable to connect to weather service. Please try again later.');
    } finally {
        // Restore Button
        submitBtn.value = "Search";
        submitBtn.style.opacity = "1";
    }
});