const bgInput       = document.getElementById('bgInput');
const wmInput       = document.getElementById('wmInput');
const bgPreview     = document.getElementById('bgPreview');
const wmPreview     = document.getElementById('wmPreview');
const bgThumb       = document.getElementById('bgThumb');
const wmThumb       = document.getElementById('wmThumb');
const mergeBtn      = document.getElementById('mergeBtn');
const resetBtn      = document.getElementById('resetBtn');
const downloadBtn   = document.getElementById('downloadBtn');
const canvas        = document.getElementById('canvas');
const ctx           = canvas.getContext('2d');
const previewSection = document.getElementById('previewSection');

let bgImage = null;
let wmImage = null;

// ── Helpers ────────────────────────────────────────────────────────────────

function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

function colorDistance(r1, g1, b1, r2, g2, b2) {
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;
    return Math.sqrt((dr * dr) + (dg * dg) + (db * db));
}

function buildForegroundCanvas(sourceImage) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sourceImage.naturalWidth;
    tempCanvas.height = sourceImage.naturalHeight;

    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(sourceImage, 0, 0);

    const w = tempCanvas.width;
    const h = tempCanvas.height;
    const imageData = tempCtx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Estimate background color from four corners.
    const corners = [
        [0, 0],
        [w - 1, 0],
        [0, h - 1],
        [w - 1, h - 1]
    ];

    let bgR = 0;
    let bgG = 0;
    let bgB = 0;

    corners.forEach(([x, y]) => {
        const i = ((y * w) + x) * 4;
        bgR += data[i];
        bgG += data[i + 1];
        bgB += data[i + 2];
    });

    bgR = Math.round(bgR / corners.length);
    bgG = Math.round(bgG / corners.length);
    bgB = Math.round(bgB / corners.length);

    const threshold = 65;
    const visited = new Uint8Array(w * h);
    const queue = [];

    const isNearBackground = (pixelIndex) => {
        if (data[pixelIndex + 3] === 0) return false;
        const distance = colorDistance(
            data[pixelIndex],
            data[pixelIndex + 1],
            data[pixelIndex + 2],
            bgR,
            bgG,
            bgB
        );
        return distance <= threshold;
    };

    const enqueue = (x, y) => {
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        const pos = (y * w) + x;
        if (visited[pos]) return;
        visited[pos] = 1;

        const pixelIndex = pos * 4;
        if (isNearBackground(pixelIndex)) {
            queue.push([x, y]);
        }
    };

    for (let x = 0; x < w; x += 1) {
        enqueue(x, 0);
        enqueue(x, h - 1);
    }
    for (let y = 0; y < h; y += 1) {
        enqueue(0, y);
        enqueue(w - 1, y);
    }

    for (let q = 0; q < queue.length; q += 1) {
        const [x, y] = queue[q];
        const pos = (y * w) + x;
        const pixelIndex = pos * 4;

        data[pixelIndex + 3] = 0;

        enqueue(x + 1, y);
        enqueue(x - 1, y);
        enqueue(x, y + 1);
        enqueue(x, y - 1);
    }

    tempCtx.putImageData(imageData, 0, 0);
    return tempCanvas;
}

function updateMergeBtn() {
    mergeBtn.disabled = !(bgImage && wmImage);
}

// ── Event: background upload ───────────────────────────────────────────────
bgInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    bgImage = await loadImageFromFile(file);
    bgPreview.src = bgImage.src;
    bgThumb.classList.add('visible');
    updateMergeBtn();
    previewSection.classList.remove('visible');
});

// ── Event: watermark upload ────────────────────────────────────────────────
wmInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    wmImage = await loadImageFromFile(file);
    wmPreview.src = wmImage.src;
    wmThumb.classList.add('visible');
    updateMergeBtn();
    previewSection.classList.remove('visible');
});

// ── Event: merge ───────────────────────────────────────────────────────────
mergeBtn.addEventListener('click', () => {
    if (!bgImage || !wmImage) return;

    canvas.width = bgImage.naturalWidth;
    canvas.height = bgImage.naturalHeight;

    ctx.drawImage(bgImage, 0, 0);

    const foregroundCanvas = buildForegroundCanvas(wmImage);
    const maxWmW = canvas.width * 0.45;
    const maxWmH = canvas.height * 0.45;
    const scale = Math.min(maxWmW / wmImage.naturalWidth, maxWmH / wmImage.naturalHeight, 1);
    const wmW = wmImage.naturalWidth * scale;
    const wmH = wmImage.naturalHeight * scale;
    const x = (canvas.width - wmW) / 2;
    const y = (canvas.height - wmH) / 2;

    ctx.drawImage(foregroundCanvas, x, y, wmW, wmH);

    downloadBtn.disabled = false;
    previewSection.classList.add('visible');
    previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// ── Event: download ────────────────────────────────────────────────────────
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'result.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
});

// ── Event: reset ───────────────────────────────────────────────────────────
resetBtn.addEventListener('click', () => {
    bgImage = null;
    wmImage = null;

    bgInput.value = '';
    wmInput.value = '';
    bgPreview.src = '';
    wmPreview.src = '';
    bgThumb.classList.remove('visible');
    wmThumb.classList.remove('visible');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    previewSection.classList.remove('visible');
    downloadBtn.disabled = true;
    updateMergeBtn();
});
