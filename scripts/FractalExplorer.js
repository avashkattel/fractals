function initializeFractalExplorer(fractalConfig) {
    const PALETTES = [
        { name: "Deep Space", colors: ["#111827", "#331a80", "#e6e6ff", "#ffb300", "#111827"] },
        { name: "Volcanic", colors: ["#111827", "#540d0d", "#f03800", "#f9a100", "#111827"] },
        { name: "Flashy", colors: ["#111827", "#00ffff", "#ffff00", "#ff00ff", "#111827"] },
        { name: "Ice & Fire", colors: ["#111827", "#0077b6", "#90e0ef", "#ff9e00", "#111827"] },
        { name: "Forest", colors: ["#111827", "#154734", "#57a773", "#d9e650", "#111827"] },
        { name: "Grayscale", colors: ["#111827", "#444444", "#888888", "#cccccc", "#111827"] },
    ];

    const canvas = document.getElementById('canvas');
    const gl = canvas.getContext('webgl', { antialias: true });

    if (!gl) {
        console.error("WebGL not supported!");
        document.body.innerHTML = "Sorry, your browser does not support WebGL, which is required for this explorer.";
        return;
    }

    const controlsContainer = document.getElementById('controls-container');
    const toggleControlsBtn = document.getElementById('toggle-controls-btn');
    const iterationsSlider = document.getElementById('iterations');
    const iterationsValue = document.getElementById('iterations-value');
    const colorPowerSlider = document.getElementById('color-power');
    const colorPowerValue = document.getElementById('color-power-value');
    const colorDensitySlider = document.getElementById('color-density');
    const colorDensityValue = document.getElementById('color-density-value');
    const paletteSelect = document.getElementById('palette-select');
    const colorPickers = [
        document.getElementById('color1'), document.getElementById('color2'),
        document.getElementById('color3'), document.getElementById('color4'),
        document.getElementById('color5')
    ];
    const resetBtn = document.getElementById('reset-btn');
    const centerXVal = document.getElementById('center-x-val');
    const centerYVal = document.getElementById('center-y-val');
    const zoomVal = document.getElementById('zoom-val');

    let shaderProgram;
    let positionBuffer;
    let positionAttributeLocation;

    const DEFAULTS = fractalConfig.defaults;
    let center = [...DEFAULTS.center];
    let zoom = DEFAULTS.zoom;
    let maxIterations = DEFAULTS.maxIterations;
    let colorPower = DEFAULTS.colorPower;
    let colorDensity = DEFAULTS.colorDensity;
    let colors = [...DEFAULTS.colors];
    
    let isDragging = false;
    let lastMousePos = { x: 0, y: 0 };
    let lastPinchDistance = null;
    let autoZoomIntervalId = null;

    const AUTO_ZOOM_FPS = 10;
    const AUTO_ZOOM_FACTOR = 1.05;
    const TAP_THRESHOLD_MS = 200;
    const TAP_THRESHOLD_PX = 10;
    let panStart = {x: 0, y: 0, time: 0};

    function hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return [r, g, b];
    }

    function screenToComplex(x, y) {
        const rect = canvas.getBoundingClientRect();
        const minDim = Math.min(rect.width, rect.height);
        const complexX = center[0] + (x * 2 - rect.width) / minDim / zoom;
        const complexY = center[1] + (rect.height - y * 2) / minDim / zoom;
        return { x: complexX, y: complexY };
    }

    function initWebGL() {
        const vertexShaderSource = document.getElementById('vertex-shader').text;
        const fragmentShaderSource = fractalConfig.getFragmentShader(); 
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        shaderProgram = createProgram(gl, vertexShader, fragmentShader);
        positionAttributeLocation = gl.getAttribLocation(shaderProgram, 'a_position');
        
        positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
        console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }

    function createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
        console.error('Error linking program:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }

    function render() {
        if (!gl) return;

        const { clientWidth, clientHeight } = gl.canvas;
        if (gl.canvas.width !== clientWidth || gl.canvas.height !== clientHeight) {
            gl.canvas.width = clientWidth;
            gl.canvas.height = clientHeight;
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(shaderProgram);

        gl.uniform2f(gl.getUniformLocation(shaderProgram, 'u_resolution'), gl.canvas.width, gl.canvas.height);
        gl.uniform2f(gl.getUniformLocation(shaderProgram, 'u_center'), center[0], center[1]);
        gl.uniform1f(gl.getUniformLocation(shaderProgram, 'u_zoom'), zoom);
        gl.uniform1i(gl.getUniformLocation(shaderProgram, 'u_max_iterations'), maxIterations);
        gl.uniform1f(gl.getUniformLocation(shaderProgram, 'u_color_power'), colorPower);
        gl.uniform1f(gl.getUniformLocation(shaderProgram, 'u_color_density'), colorDensity);
        colors.forEach((hex, i) => {
            const rgb = hexToRgb(hex);
            gl.uniform3f(gl.getUniformLocation(shaderProgram, `u_color${i+1}`), rgb[0], rgb[1], rgb[2]);
        });
        
        if (fractalConfig.setUniforms) {
            fractalConfig.setUniforms(gl, shaderProgram);
        }
        
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
                
        updateUI();
    }

    function updateUI() {
        centerXVal.textContent = center[0].toExponential(4);
        centerYVal.textContent = center[1].toExponential(4);
        zoomVal.textContent = zoom.toExponential(4);
        iterationsValue.textContent = maxIterations;
        colorPowerValue.textContent = parseFloat(colorPower).toFixed(2);
        colorDensityValue.textContent = parseFloat(colorDensity).toFixed(1);
    }

    function setupEventListeners() {
        const requestRender = () => requestAnimationFrame(render);
        
        function handlePanStart(x, y) {
            isDragging = true;
            canvas.style.cursor = 'grabbing';
            lastMousePos = { x, y };
            panStart = { x, y, time: Date.now() };
            stopAutoZoom();
        }

        function handlePanMove(x, y) {
            if (!isDragging) return;
            const dx = x - lastMousePos.x;
            const dy = y - lastMousePos.y;
            const minDim = Math.min(canvas.width, canvas.height);
            center[0] -= dx * 2 / minDim / zoom;
            center[1] += dy * 2 / minDim / zoom;
            lastMousePos = { x, y };
            requestRender();
        }

        function handlePanEnd(x, y) {
            if (!isDragging) return;
            isDragging = false;
            canvas.style.cursor = 'grab';

            const timeElapsed = Date.now() - panStart.time;
            const distanceMoved = Math.hypot(x - panStart.x, y - panStart.y);

            if (timeElapsed < TAP_THRESHOLD_MS && distanceMoved < TAP_THRESHOLD_PX) {
                handleAutoZoom(panStart.x, panStart.y);
            }
        }

        function handleAutoZoom(screenX, screenY) {
            if (autoZoomIntervalId) {
                stopAutoZoom();
            } else {
                const targetComplex = screenToComplex(screenX, screenY);
                autoZoomIntervalId = setInterval(() => {
                    const zoomFactor = AUTO_ZOOM_FACTOR;
                    zoom *= zoomFactor;
                    center[0] = targetComplex.x - (targetComplex.x - center[0]) / zoomFactor;
                    center[1] = targetComplex.y - (targetComplex.y - center[1]) / zoomFactor;
                    requestRender();
                }, 1000 / AUTO_ZOOM_FPS);
            }
        }
        
        function stopAutoZoom() {
            if (autoZoomIntervalId) {
                clearInterval(autoZoomIntervalId);
                autoZoomIntervalId = null;
            }
        }

        function handlePinch(e) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

            if (lastPinchDistance !== null) {
                const zoomFactor = currentDist / lastPinchDistance;
                
                const rect = canvas.getBoundingClientRect();
                const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
                const midY = (t1.clientY + t2.clientY) / 2 - rect.top;
                const midComplex = screenToComplex(midX, midY);
                
                zoom *= zoomFactor;
                center[0] = midComplex.x - (midComplex.x - center[0]) / zoomFactor;
                center[1] = midComplex.y - (midComplex.y - center[1]) / zoomFactor;
                
                requestRender();
            }
            lastPinchDistance = currentDist;
        }

        function populatePalettes() {
            PALETTES.forEach((palette, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = palette.name;
                paletteSelect.appendChild(option);
            });
            const customOption = document.createElement('option');
            customOption.value = "custom";
            customOption.textContent = "Custom";
            paletteSelect.appendChild(customOption);
            paletteSelect.value = 0;
        }

        function applyPalette(paletteIndex) {
            if (paletteIndex === "custom") return;
            const palette = PALETTES[paletteIndex];
            if (!palette) return;

            colors = [...palette.colors];
            colorPickers.forEach((picker, i) => {
                picker.value = colors[i];
            });
            requestRender();
        }

        canvas.addEventListener('mousedown', e => handlePanStart(e.clientX, e.clientY));
        canvas.addEventListener('mousemove', e => handlePanMove(e.clientX, e.clientY));
        canvas.addEventListener('mouseup', e => handlePanEnd(e.clientX, e.clientY));
        canvas.addEventListener('mouseleave', () => { isDragging = false; canvas.style.cursor = 'grab'; });

        canvas.addEventListener('touchstart', e => {
            e.preventDefault();
            stopAutoZoom();
            if (e.touches.length === 1) {
                handlePanStart(e.touches[0].clientX, e.touches[0].clientY);
            } else if (e.touches.length === 2) {
                isDragging = false;
                handlePinch(e);
            }
        }, { passive: false });

        canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            if (e.touches.length === 1) {
                handlePanMove(e.touches[0].clientX, e.touches[0].clientY);
            } else if (e.touches.length === 2) {
                handlePinch(e);
            }
        }, { passive: false });
        
        canvas.addEventListener('touchend', e => {
            if (e.touches.length < 2) {
                lastPinchDistance = null;
            }
            const touch = e.changedTouches[0];
            handlePanEnd(touch.clientX, touch.clientY);
        });

        canvas.addEventListener('wheel', e => {
            e.preventDefault();
            stopAutoZoom();
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const mouseComplex = screenToComplex(mouseX, mouseY);
            const zoomFactor = e.deltaY < 0 ? 1.4 : 1 / 1.4;
            zoom *= zoomFactor;
            center[0] = mouseComplex.x - (mouseComplex.x - center[0]) / zoomFactor;
            center[1] = mouseComplex.y - (mouseComplex.y - center[1]) / zoomFactor;
            requestRender();
        });

        toggleControlsBtn.addEventListener('click', () => {
            const isHidden = controlsContainer.classList.toggle('hidden');
            toggleControlsBtn.textContent = isHidden ? 'Show Controls' : 'Hide Controls';
        });

        iterationsSlider.addEventListener('input', e => { maxIterations = parseInt(e.target.value); updateUI(); });
        iterationsSlider.addEventListener('change', requestRender);
        
        colorPowerSlider.addEventListener('input', e => { colorPower = parseFloat(e.target.value); updateUI(); });
        colorPowerSlider.addEventListener('change', requestRender);
        
        colorDensitySlider.addEventListener('input', e => { colorDensity = parseFloat(e.target.value); updateUI(); });
        colorDensitySlider.addEventListener('change', requestRender);

        paletteSelect.addEventListener('change', e => applyPalette(e.target.value));

        colorPickers.forEach((picker, i) => {
            picker.addEventListener('input', e => {
                colors[i] = e.target.value;
                paletteSelect.value = "custom";
                requestRender();
            });
        });

        resetBtn.addEventListener('click', () => {
            stopAutoZoom();
            center = [...DEFAULTS.center];
            zoom = DEFAULTS.zoom;
            maxIterations = DEFAULTS.maxIterations;
            colorPower = DEFAULTS.colorPower;
            colorDensity = DEFAULTS.colorDensity;
            colors = [...DEFAULTS.colors];
            iterationsSlider.value = maxIterations;
            colorPowerSlider.value = colorPower;
            colorDensitySlider.value = colorDensity;
            paletteSelect.value = 0;
            applyPalette(0);
        });
                
        window.addEventListener('resize', requestRender);
        
        populatePalettes();
        applyPalette(0);
    }

    initWebGL();
    setupEventListeners();
}
