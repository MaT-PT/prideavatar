'use strict';
const COLOR_SCHEMES = {
    'standard':    ['#e50000', '#ff8d00', '#ffee00', '#008121', '#004cff', '#760188'],
    'modern':      ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'],
    'progress':    ['#ee3124', '#f57f29', '#fff000', '#58b947', '#0054a6', '#9f248f'],
    'bi':          ['#d60270', '#d60270', '#9b4f96', '#0038a8', '#0038a8'],
    'trans':       ['#5bcffa', '#f5abb9', '#ffffff', '#f5abb9', '#5bcffa'],
    'genderqueer': ['#b67fdb', '#ffffff', '#478121'],
    'enby':        ['#fff434', '#ffffff', '#9c59cf', '#2d2d2d'],
    'ace':         ['#000000', '#a4a4a4', '#ffffff', '#81047f'],
    'pan':         ['#ff1e8c', '#fed818', '#1fb2fd'],
};
const $ = (selector) => document.querySelector(selector);
const canvas = $('#canvas');
const ctx = canvas.getContext('2d');
const size = $('#size');
const scale = $('#scale');
const scaleValue = $('#scale-value');
const opacity = $('#opacity');
const opacityValue = $('#opacity-value');
const rotate = $('#rotate');
const margin = $('#margin');
const autoscale = $('#autoscale');
const offX = $('#offx');
const offY = $('#offy');
const download = $('#download');
const downloadBtn = $('#download-btn');
const form = $('form');
ctx.resetTransform = () => ctx.setTransform(1, 0, 0, 1, 0, 0);

// Generate color scheme list
(() => {
    const template = $('#color-radio')
    const list = $('#colors');
    Object.keys(COLOR_SCHEMES).forEach((name, i) => {
        const clone = document.importNode(template.content, true);
        const input = clone.querySelector('input');
        const label = clone.querySelector('label');
        input.value = name;
        input.checked = i === 1;
        input.addEventListener('change', redraw);
        label.appendChild(document.createTextNode(name));
        list.appendChild(clone);
    });
})();

// Redraw after avatar file read
const reader = new FileReader();
const image = new Image();
reader.onload = () => image.src = reader.result;
image.onload = redraw;

$('#file').addEventListener('change', event => {
    reader.readAsDataURL(event.target.files[0])
});
downloadBtn.onclick = () => {
    download.href = canvas.toDataURL('image/png');
    download.click();
}
margin.addEventListener('change', () => {
    if (autoscale.checked) {
        const halfWidth = canvas.width / 2;
        scale.value = halfWidth / (halfWidth - margin.value);
    }
    redraw();
});
scale.addEventListener('change', rescale);
opacity.addEventListener('change', redraw);
rotate.addEventListener('change', redraw);
offX.addEventListener('change', redraw);
offY.addEventListener('change', redraw);
size.addEventListener('change', resize);

// Handle dropping image file
function onDrop(event) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
            reader.readAsDataURL(file);
            break;
        }
    }
};

// Handle mouse wheel to scaling
canvas.addEventListener('wheel', event => {
    event.preventDefault();
    let x = parseFloat(scale.value);
    if (event.deltaY < 0) x -= 0.05;
    else x += 0.05;
    scale.value = x.toFixed(4);
    scale.dispatchEvent(new Event('change'));
});

function resize() {
    canvas.width = canvas.height = size.value;
    margin.max = Math.round(size.value / 2);
    margin.min = -margin.max;
    rescale();
}

function rescale() {
    if (autoscale.checked) {
        const halfWidth = canvas.width / 2;
        margin.value = halfWidth - halfWidth / scale.value;
    }
    redraw();
}

function roundPercentage(value) {
    return (Math.round((parseFloat(value) + Number.EPSILON) * 10000) / 100).toString() + '%';
}

function redraw() {
    console.log("REDRAW");
    scaleValue.value = roundPercentage(scale.value);
    opacityValue.value = roundPercentage(opacity.value);
    
    const halfWidth = canvas.width / 2;
    // Reset
    ctx.restore();
    ctx.save();
    //ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw rainbow
    const color = $('input[name=color]:checked').value || 'standard';
    const colors = COLOR_SCHEMES[color];
    const radians = rotate.value * Math.PI / 180;
    const rainbowWidth = canvas.width / colors.length;
    const rainbowWidthExtra = rainbowWidth * Math.abs(Math.sin(radians * 2)) * 0.5;

    ctx.translate(halfWidth, halfWidth);
    ctx.rotate(radians);
    ctx.translate(-canvas.width, -canvas.width);
    colors.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width * 2, canvas.width);
        if (i === 0)
            ctx.translate(0,
                halfWidth + rainbowWidth -
                (rainbowWidthExtra * (colors.length - 2) / 2)
            );
        else
            ctx.translate(0, rainbowWidth + rainbowWidthExtra);
    });
    ctx.resetTransform();

    // Draw circluar crop mask
    ctx.translate(halfWidth, halfWidth);
    ctx.beginPath()
    ctx.arc(0, 0, halfWidth - margin.value, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.resetTransform();

    // Draw user's avatar
    const dimension = Math.min(image.width, image.height) * scale.value;
    const xOffset = (image.width  - dimension) / 2 + parseFloat(offX.value);
    const yOffset = (image.height - dimension) / 2 + parseFloat(offY.value);
    ctx.globalAlpha = opacity.value;
    ctx.drawImage(
        image, xOffset, yOffset, dimension, dimension,
        0, 0, canvas.width, canvas.height
    );
}

resize();
