document.addEventListener('DOMContentLoaded', () => {
    const methodSelect = document.getElementById('methodSelect');
    const coffeeWeightInput = document.getElementById('coffeeWeight');
    const waterWeightInput = document.getElementById('waterWeight');
    const waterTempInput = document.getElementById('waterTemp');
    const tempVal = document.getElementById('tempVal');
    const roastLevelSelect = document.getElementById('roastLevel');
    const grindSizeInput = document.getElementById('grindSize');
    const calculateBtn = document.getElementById('calculateBtn');

    const resRatio = document.getElementById('resRatio');
    const resTime = document.getElementById('resTime');
    const resExtraction = document.getElementById('resExtraction');
    const resTds = document.getElementById('resTds');
    const extractionStatus = document.getElementById('extractionStatus');
    const stepsList = document.getElementById('stepsList');
    const radarCanvas = document.getElementById('radarCanvas');

    // Preset water ratios for different brew methods
    const methodRatios = {
        v60: 16,
        chemex: 17,
        espresso: 2,
        aeropress: 14,
        frenchpress: 15
    };

    // Update water weight automatically when coffee weight or method changes
    methodSelect.addEventListener('change', () => {
        const method = methodSelect.value;
        const ratio = methodRatios[method];
        const coffee = parseFloat(coffeeWeightInput.value) || 20;
        if (method !== 'espresso') {
            waterWeightInput.value = Math.round(coffee * ratio);
        } else {
            waterWeightInput.value = Math.round(coffee * ratio);
        }
        updateCalculations();
    });

    coffeeWeightInput.addEventListener('input', () => {
        const method = methodSelect.value;
        const ratio = methodRatios[method];
        const coffee = parseFloat(coffeeWeightInput.value) || 0;
        if (coffee > 0) {
            waterWeightInput.value = Math.round(coffee * ratio);
        }
    });

    waterTempInput.addEventListener('input', () => {
        tempVal.textContent = waterTempInput.value + '°C';
    });

    calculateBtn.addEventListener('click', () => {
        updateCalculations();
    });

    function updateCalculations() {
        const coffee = parseFloat(coffeeWeightInput.value) || 20;
        const water = parseFloat(waterWeightInput.value) || 320;
        const temp = parseInt(waterTempInput.value) || 92;
        const grind = parseInt(grindSizeInput.value) || 5;
        const method = methodSelect.value;
        const roast = roastLevelSelect.value;

        // 1. Calculate Ratio
        const ratioVal = (water / coffee).toFixed(1);
        resRatio.textContent = `1 : ${ratioVal}`;

        // 2. Estimate Brew Time based on method and grind
        let baseTimeSec = 180; // 3 mins default
        if (method === 'v60') baseTimeSec = 195;
        if (method === 'chemex') baseTimeSec = 240;
        if (method === 'espresso') baseTimeSec = 28; // 28 seconds
        if (method === 'aeropress') baseTimeSec = 120;
        if (method === 'frenchpress') baseTimeSec = 240;

        // Adjust time slightly by grind size
        baseTimeSec += (grind - 5) * 5;
        if (baseTimeSec < 15) baseTimeSec = 15;

        const mins = Math.floor(baseTimeSec / 60);
        const secs = baseTimeSec % 60;
        resTime.textContent = method === 'espresso' ? `${baseTimeSec}s` : `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        // 3. Estimate Extraction Yield & TDS
        // Ideal extraction: 18% - 22%
        // Affected by temp, grind, and ratio
        let extraction = 19.0 + (temp - 92) * 0.3 - (grind - 5) * 0.2;
        if (roast === 'dark') extraction += 0.8;
        if (roast === 'light') extraction -= 0.6;
        extraction = Math.max(15.0, Math.min(24.0, extraction));
        resExtraction.textContent = extraction.toFixed(1) + '%';

        let tds = 1.35 + (20 - ratioVal) * 0.05 - (grind - 5) * 0.03;
        if (method === 'espresso') tds = 9.5;
        tds = Math.max(0.9, Math.min(12.0, tds));
        resTds.textContent = tds.toFixed(2) + '%';

        // 4. Extraction Status Badge
        if (extraction < 18.0) {
            extractionStatus.textContent = 'Under-Extracted (Sour, Grassy notes - Try finer grind or higher temp)';
            extractionStatus.className = 'status-badge under';
        } else if (extraction > 22.0) {
            extractionStatus.textContent = 'Over-Extracted (Bitter, Astringent notes - Try coarser grind or lower temp)';
            extractionStatus.className = 'status-badge over';
        } else {
            extractionStatus.textContent = 'Optimal Extraction Balance (Sweet, Balanced, Complex)';
            extractionStatus.className = 'status-badge optimal';
        }

        // 5. Generate Steps
        generateSteps(method, coffee, water, temp);

        // 6. Draw Radar Chart
        drawRadarChart(extraction, grind, roast);
    }

    function generateSteps(method, coffee, water, temp) {
        stepsList.innerHTML = '';
        let steps = [];

        if (method === 'v60' || method === 'chemex') {
            const bloomWater = Math.round(coffee * 2);
            steps = [
                `<strong>Prep:</strong> Insert filter paper, rinse with hot water at ${temp}°C to eliminate paper taste, and discard rinse water.`,
                `<strong>Dose:</strong> Add ${coffee}g of medium-fine ground coffee to the dripper and level the bed.`,
                `<strong>Bloom:</strong> Pour ${bloomWater}g of water evenly. Let it degas for 30 to 45 seconds.`,
                `<strong>First Pour:</strong> Spiral pour up to ${Math.round(water * 0.6)}g at 1:00.`,
                `<strong>Final Pour:</strong> Complete pouring to ${water}g by 2:00. Give a gentle swirl and let draw down complete.`
            ];
        } else if (method === 'espresso') {
            steps = [
                `<strong>Prep:</strong> Wipe the portafilter basket dry and dose ${coffee}g of fine ground coffee.`,
                `<strong>Distribution:</strong> Distribute evenly and tamp firmly and level with consistent pressure.`,
                `<strong>Flush & Lock:</strong> Flush group head briefly, lock in portafilter, and immediately start the shot.`,
                `<strong>Extraction:</strong> Target yield of ${water}g liquid espresso in approximately 25-30 seconds.`
            ];
        } else if (method === 'aeropress') {
            steps = [
                `<strong>Setup:</strong> Set Aeropress in inverted position. Add ${coffee}g of medium-fine coffee.`,
                `<strong>Fill:</strong> Pour water up to the number matching your recipe (${water}g total).`,
                `<strong>Stir & Cap:</strong> Stir gently for 10 seconds. Twist on filter cap with paper filter rinsed.`,
                `<strong>Press:</strong> Flip onto your vessel at 1:30 and gently plunge for 30 seconds.`
            ];
        } else {
            // French Press
            steps = [
                `<strong>Dose:</strong> Add ${coffee}g of coarse ground coffee to the clean french press carafe.`,
                `<strong>Saturate:</strong> Pour all ${water}g of water at ${temp}°C, ensuring all grounds are fully saturated.`,
                `<strong>Steep:</strong> Place plunger on top without pressing. Steep for 4 minutes.`,
                `<strong>Break Crust:</strong> At 4:00, gently stir the crust, skim foam, and press plunger down slowly.`
            ];
        }

        steps.forEach(stepText => {
            const li = document.createElement('li');
            li.innerHTML = stepText;
            stepsList.appendChild(li);
        });
    }

    function drawRadarChart(extraction, grind, roast) {
        if (!radarCanvas.getContext) return;
        const ctx = radarCanvas.getContext('2d');
        const width = radarCanvas.width;
        const height = radarCanvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) - 30;

        ctx.clearRect(0, 0, width, height);

        // Flavor dimensions: Acidity, Sweetness, Body, Bitterness, Clarity
        // Compute scores (0 to 1) based on inputs
        let acidity = roast === 'light' ? 0.85 : (roast === 'medium' ? 0.6 : 0.3);
        let sweetness = (extraction >= 18 && extraction <= 22) ? 0.9 : 0.5;
        let body = grind > 6 ? 0.85 : 0.5;
        let bitterness = roast === 'dark' ? 0.85 : (roast === 'medium' ? 0.4 : 0.2);
        if (extraction > 22) bitterness += 0.2;
        let clarity = grind < 5 ? 0.8 : 0.5;

        const values = [acidity, sweetness, body, bitterness, clarity];
        const labels = ['Acidity', 'Sweetness', 'Body', 'Bitterness', 'Clarity'];
        const numPoints = values.length;

        // Draw background web
        ctx.strokeStyle = '#2e2621';
        ctx.lineWidth = 1;
        for (let level = 1; level <= 4; level++) {
            ctx.beginPath();
            const curRadius = (radius / 4) * level;
            for (let i = 0; i < numPoints; i++) {
                const angle = (Math.PI * 2 / numPoints) * i - Math.PI / 2;
                const x = centerX + curRadius * Math.cos(angle);
                const y = centerY + curRadius * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
        }

        // Draw axes and labels
        ctx.fillStyle = '#a3988c';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < numPoints; i++) {
            const angle = (Math.PI * 2 / numPoints) * i - Math.PI / 2;
            const xEnd = centerX + radius * Math.cos(angle);
            const yEnd = centerY + radius * Math.sin(angle);

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(xEnd, yEnd);
            ctx.strokeStyle = '#2e2621';
            ctx.stroke();

            // Label offset
            const labelRadius = radius + 18;
            const lx = centerX + labelRadius * Math.cos(angle);
            const ly = centerY + labelRadius * Math.sin(angle);
            ctx.fillText(labels[i], lx, ly);
        }

        // Draw data polygon
        ctx.beginPath();
        for (let i = 0; i < numPoints; i++) {
            const angle = (Math.PI * 2 / numPoints) * i - Math.PI / 2;
            const valRadius = radius * values[i];
            const x = centerX + valRadius * Math.cos(angle);
            const y = centerY + valRadius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(212, 131, 49, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#d48331';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw data points
        for (let i = 0; i < numPoints; i++) {
            const angle = (Math.PI * 2 / numPoints) * i - Math.PI / 2;
            const valRadius = radius * values[i];
            const x = centerX + valRadius * Math.cos(angle);
            const y = centerY + valRadius * Math.sin(angle);

            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#d48331';
            ctx.fill();
        }
    }

    // Initial render on load
    updateCalculations();
});
