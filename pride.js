'use strict';
let isLoading = true;

const COLOR_SCHEMES = {
    '🇺🇦 ukraine':         ['#005bbb', '#ffd500'],
    'standard':           ['#e50000', '#ff8d00', '#ffee00', '#008121', '#004cff', '#760188'],
    'modern 1':           ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'],
    'modern 2':           ['#e22016', '#f28917', '#efe524', '#78b82a', '#2c58a4', '#6d2380'],
    'progress LGBT':      ['#ee3124', '#f57f29', '#fff000', '#58b947', '#0054a6', '#9f248f'],
    'progress trans+PoC': ['#000000', '#603917', '#7cc0ea', '#f498c0', '#ffffff'],
    'gay men (MLM)':      ['#078d70', '#26ceaa', '#98e8c1', '#ffffff', '#7bade2', '#5049cc', '#3d1a78'],
    'lesbian (WLW)':      ['#d52d00', '#ef7627', '#ff9a56', '#ffffff', '#d162a4', '#b55690', '#a30262'],
    'bi':                 ['#d60270', '#d60270', '#9b4f96', '#0038a8', '#0038a8'],
    'pan':                ['#ff1e8c', '#fed818', '#1fb2fd'],
    'ace':                ['#000000', '#a4a4a4', '#ffffff', '#81047f'],
    'trans':              ['#5bcffa', '#f5abb9', '#ffffff', '#f5abb9', '#5bcffa'],
    'genderqueer':        ['#b67fdb', '#ffffff', '#478121'],
    'enby':               ['#fff434', '#ffffff', '#9c59cf', '#2d2d2d'],
    'agender':            ['#000000', '#bcc4c6', '#ffffff', '#b6f583', '#ffffff', '#bcc4c6', '#000000'],
    'genderless':         ['#00b5a6', '#97d800', '#fef858', '#ffa101', '#ff4f00'],
    'custom…':            [],
};
const DEFAULT_SCHEME = 'modern 1';
/** @param {String} selector @returns {HTMLElement} */
const $ = (selector) => document.querySelector(selector);
/** @type {HTMLCanvasElement} */
const canvas = $('#canvas');
const ctx = canvas.getContext('2d');
const size = $('#size');
const previewCircle = $('#preview-circle');
const scale = $('#scale');
const scaleValue = $('#scale-value');
const opacity = $('#opacity');
const opacityValue = $('#opacity-value');
const rotate = $('#rotate');
const margin = $('#margin');
const autoscale = $('#autoscale');
const offX = $('#offx');
const offY = $('#offy');
const fileInput = $('#file');
const colorsWrapper = $('#colors-wrapper');
const colorSelect1 = $('#color-select-1');
const colorSelect2 = $('#color-select-2');
const colorPlural = $('#color-plural');
const customColors1 = $('#custom-colors-1');
const customColors2 = $('#custom-colors-2');
const splitFlag = $('#split-flag');
const download = $('#download');
const downloadBtn = $('#download-btn');
const form = $('form');
ctx.resetTransform = () => ctx.setTransform(1, 0, 0, 1, 0, 0);
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

// Redraw after avatar file read
const reader = new FileReader();
const image = new Image();
reader.onload = () => image.src = reader.result;
image.onload = redraw;

fileInput.addEventListener('change', checkImageFile);
downloadBtn.onclick = () => {
    download.href = canvas.toDataURL('image/png');
    download.click();
}
splitFlag.addEventListener('change', () => {
    colorsWrapper.classList.toggle('split-flag', splitFlag.checked);
    colorPlural.classList.toggle('hidden', !splitFlag.checked);
    redraw();
});
scale.addEventListener('change', rescale);
previewCircle.addEventListener('change', redraw);
opacity.addEventListener('change', redraw);
rotate.addEventListener('change', redraw);
offX.addEventListener('change', redraw);
offY.addEventListener('change', redraw);
size.addEventListener('change', resize);
margin.addEventListener('change', updateMargin);
autoscale.addEventListener('change', updateMargin);

// Manage dragging events to move the image on the canvas
(() => {
    let isDragging = false;
    let dragX = 0;
    let dragY = 0;

    canvas.addEventListener('mousedown', ev => {
        isDragging = true;
        dragX = ev.offsetX;
        dragY = ev.offsetY;
    });
    canvas.addEventListener('mouseup', ev => {
        isDragging = false;
    });
    canvas.addEventListener('mousemove', ev => {
        if (!(isDragging && ev.buttons === 1)) return;

        ev.preventDefault();
        ev.stopPropagation();
        const deltaX = dragX - ev.offsetX;
        const deltaY = dragY - ev.offsetY;
        dragX = ev.offsetX;
        dragY = ev.offsetY;

        const imageScale = scale.value * Math.min(image.width / canvas.width, image.height / canvas.height);
        offX.value = parseFloat(offX.value) + imageScale * deltaX;
        offY.value = parseFloat(offY.value) + imageScale * deltaY;
        redraw();
    });
    canvas.addEventListener('touchstart', ev => {
        isDragging = true;
        const touch = ev.touches[0];
        dragX = touch.pageX;
        dragY = touch.pageY;
    });
    canvas.addEventListener('touchend', ev => {
        isDragging = false;
    });
    canvas.addEventListener('touchcancel', ev => {
        isDragging = false;
    });
    canvas.addEventListener('touchmove', ev => {
        if (!isDragging) return;
        ev.preventDefault();
        ev.stopPropagation();

        const touch = ev.touches[0];
        const deltaX = dragX - touch.pageX;
        const deltaY = dragY - touch.pageY;
        dragX = touch.pageX;
        dragY = touch.pageY;

        const imageScale = scale.value * Math.min(image.width / canvas.width, image.height / canvas.height);
        offX.value = parseFloat(offX.value) + imageScale * deltaX;
        offY.value = parseFloat(offY.value) + imageScale * deltaY;
        redraw();
    });
})();

// Generate color scheme list
(() => {
    /**
     * Update interface when a new color scheme is selected
     * @param {Event} event 
     */
    function changeColors(event) {
        const value = event.target.value;
        const selectId = event.target.id.slice(-1);
        colorsWrapper.classList.toggle('show-custom-colors-' + selectId, COLOR_SCHEMES[value].length === 0);
        redraw();
    }
    colorSelect1.addEventListener('change', changeColors);
    colorSelect2.addEventListener('change', changeColors);

    Object.keys(COLOR_SCHEMES).forEach(name => {
        const option = document.createElement('option')
        option.value = name;
        //option.selected = name === DEFAULT_SCHEME;
        if (name === DEFAULT_SCHEME)
            option.setAttribute('selected', 'selected');
        const text = name.replace(/(^\w|\s+\w)/g, m => m.toUpperCase());
        option.appendChild(document.createTextNode(text));

        colorSelect1.add(option);
        colorSelect2.add(option.cloneNode(true));
    });

    splitFlag.dispatchEvent(new Event('change'));
})();

/**
 * Handle dropping image file
 * @param {DragEvent} event 
 */
function onDrop(event) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    for (const file of files) {
        if (file.type.startsWith('image/')) {
            reader.readAsDataURL(file);
            break;
        }
    }
}

const customColorTemplate = $('#custom-colors-1 > .color-input').cloneNode(true);
customColorTemplate.querySelector('input').value = '#000000';
$('#custom-colors-2').insertAdjacentElement('afterbegin', customColorTemplate.cloneNode(true));

/**
 * Add custom color input
 * @param {MouseEvent} event
 */
function addCustomColor(event) {
    /** @type {HTMLElement} */
    const parent = event.target.parentElement;
    parent.insertBefore(customColorTemplate.cloneNode(true), parent.lastElementChild);
    redraw();
}

/**
 * Delete custom color input
 * @param {MouseEvent} event
 */
function deleteCustomColor(event) {
    event.target.parentElement.remove();
    redraw();
}

function getCustomColorList(selectId) {
    const colorInputs = document.querySelectorAll('#custom-colors-' + selectId + ' input[type="color"]');
    return Array.prototype.map.call(colorInputs, input => input.value);
}

function checkImageFile() {
    if (fileInput.files.length > 0) {
        reader.readAsDataURL(fileInput.files[0]);
    }
}

// Handle mouse wheel to scaling
canvas.addEventListener('wheel', event => {
    event.preventDefault();
    let x = parseFloat(scale.value);
    if (event.deltaY < 0)
        x -= 0.05;
    else
        x += 0.05;
    scale.value = x.toFixed(4);
    scale.dispatchEvent(new Event('change'));
});

function updateMargin() {
    if (autoscale.checked) {
        const halfWidth = canvas.width / 2;
        scale.value = halfWidth / (halfWidth - margin.value);
    }
    redraw();
}

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

/**
 * Draw stripes with the given colors, width and height.
 * angleRatio represents how much the stripes should be scaled
 * given their angle.
 * @param {String[]} colors 
 * @param {Number} width 
 * @param {Number} height
 * @param {Number} angleRatio
 */
function drawColors(colors, width, height) {
    const marginValue = parseFloat(margin.value);
    // Use the "middle" circle between the inner and outer ones as the basis for stripe height
    const adjustedHeight = height - marginValue;
    ctx.translate(0, marginValue / 2);
    let position = 0;
    colors.forEach((color, i) => {
        const newPosition = (1 - Math.cos(Math.PI * (i + 1) / colors.length)) / 2;
        const stripeHeight = adjustedHeight * (newPosition - position);
        position = newPosition;
        ctx.fillStyle = color;
        if (colors.length === 1) {
            ctx.fillRect(0, -height / 2, width, height * 2);
        }
        else if (i === 0) {
            ctx.fillRect(0, -height / 2, width, stripeHeight + height / 2 + 1);
        }
        else if (i === colors.length - 1) {
            ctx.fillRect(0, 0, width, stripeHeight + height / 2);
        }
        else {
            ctx.fillRect(0, 0, width, stripeHeight + 1);
        }
        ctx.translate(0, stripeHeight);
    });
    ctx.translate(0, marginValue / 2);
}

function redraw() {
    if (isLoading) return;
    console.log('REDRAW');
    scaleValue.value = roundPercentage(scale.value);
    opacityValue.value = roundPercentage(opacity.value);
    
    const halfWidth = canvas.width / 2;
    // Reset
    ctx.restore();
    ctx.save();

    if (previewCircle.checked) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath()
        ctx.arc(halfWidth, halfWidth, halfWidth, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.resetTransform();
    }

    // Draw rainbow
    const colorName1 = colorSelect1.value || 'standard';
    const colorName2 = colorSelect2.value || 'standard';
    const radians = rotate.value * Math.PI / 180;

    let colorList1 = COLOR_SCHEMES[colorName1];
    let colorList2 = COLOR_SCHEMES[colorName2];

    if (colorList1.length === 0)
        colorList1 = getCustomColorList(1);
    if (colorList2.length === 0)
        colorList2 = getCustomColorList(2);

    ctx.translate(halfWidth, halfWidth);
    ctx.rotate(radians);
    ctx.translate(-canvas.width, -halfWidth);
    if (splitFlag.checked) {
        drawColors(colorList1, canvas.width + 1, canvas.height);
        ctx.translate(canvas.width, -canvas.height);
        drawColors(colorList2, canvas.width, canvas.height);
    }
    else {
        drawColors(colorList1, canvas.width * 2, canvas.height);
    }
    ctx.resetTransform();

    // Draw circluar crop mask
    ctx.beginPath()
    ctx.arc(halfWidth, halfWidth, halfWidth - margin.value, 0, Math.PI * 2);
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

checkImageFile();
isLoading = false;
resize();
