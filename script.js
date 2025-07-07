const thermometerInner = document.getElementById('thermometer-inner');
const tempInput = document.getElementById('temp-input');
const setTempBtn = document.getElementById('set-temp');
const fetchWeatherBtn = document.getElementById('fetch-weather');
const unitToggle = document.getElementById('unit-toggle');
const minMarker = document.getElementById('min-marker');
const maxMarker = document.getElementById('max-marker');
const chartCanvas = document.getElementById('history-chart');

// Default thermometer range
let minTempC = -20;
let maxTempC = 50;
let currentTempC = 20;
let tempHistory = [{ temp: 20, unit: 'C', time: new Date() }];
let chart;

function cToF(c) { return c * 9/5 + 32; }
function fToC(f) { return (f - 32) * 5/9; }

function getCurrentUnit() {
    return unitToggle.value;
}

function getDisplayTemp() {
    return getCurrentUnit() === 'C' ? currentTempC : cToF(currentTempC);
}

function getMinMax() {
    if (getCurrentUnit() === 'C') {
        return { min: minTempC, max: maxTempC };
    } else {
        return { min: cToF(minTempC), max: cToF(maxTempC) };
    }
}

function updateThermometer() {
    const { min, max } = getMinMax();
    const temp = getDisplayTemp();
    const percent = Math.max(0, Math.min(1, (temp - min) / (max - min)));
    const height = percent * 240; // 240px is the thermometer height minus bulb
    thermometerInner.style.height = height + 'px';
    // Color animation
    let color;
    if (temp <= min + (max-min)*0.33) color = '#00bfff'; // blue
    else if (temp >= min + (max-min)*0.66) color = '#ff3e3e'; // red
    else color = '#ffd700'; // yellow
    thermometerInner.style.background = color;
    // Min/Max markers
    minMarker.style.bottom = '30px';
    maxMarker.style.top = '0';
}

function updateMarkers() {
    // No-op for now, could animate or label
}

function updateChart() {
    const labels = tempHistory.map(h => h.time.toLocaleTimeString());
    const data = tempHistory.map(h => h.unit === getCurrentUnit() ? h.temp : (getCurrentUnit() === 'C' ? fToC(h.temp) : cToF(h.temp)));
    if (!chart) {
        chart = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: `Temperature (°${getCurrentUnit()})`,
                    data,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0,123,255,0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    } else {
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.data.datasets[0].label = `Temperature (°${getCurrentUnit()})`;
        chart.update();
    }
}

function addToHistory(temp, unit) {
    tempHistory.push({ temp, unit, time: new Date() });
    if (tempHistory.length > 20) tempHistory.shift();
    updateChart();
}

setTempBtn.addEventListener('click', () => {
    let val = parseFloat(tempInput.value);
    if (isNaN(val)) return;
    if (getCurrentUnit() === 'F') val = fToC(val);
    currentTempC = val;
    addToHistory(getDisplayTemp(), getCurrentUnit());
    updateThermometer();
});

unitToggle.addEventListener('change', () => {
    updateThermometer();
    updateChart();
});

fetchWeatherBtn.addEventListener('click', async () => {
    const city = prompt('Enter city for weather:');
    if (!city) return;
    // Use Open-Meteo geocoding
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}`);
    const geoData = await geoRes.json();
    if (!geoData.results || !geoData.results.length) {
        alert('City not found!');
        return;
    }
    const { latitude, longitude } = geoData.results[0];
    // Fetch weather
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
    const weatherData = await weatherRes.json();
    if (!weatherData.current_weather) {
        alert('Weather data not found!');
        return;
    }
    let tempC = weatherData.current_weather.temperature;
    currentTempC = tempC;
    addToHistory(getDisplayTemp(), getCurrentUnit());
    updateThermometer();
});

// Initial render
updateThermometer();
updateChart(); 