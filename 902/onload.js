class Camera {
    
    constructor (canvasId) {
        var c = document.getElementById(canvasId);
        this.canvas = c;
        this.gl = c.getContext('webgl') || c.getContext('experimental-webgl');
        console.log(this.gl);
        this.prg = linkProgram('vertex-shader', 'fragment-shader', this.gl);
        this.vMat = mat4.create();
        mat4.lookAt(this.vMat, [0, 1, 3], [0, 0, 0], [0, 1, 0]);
        this.pMat = mat4.create();
        var ratio = this.canvas.width / this.canvas.height;
        mat4.perspective(this.pMat, degToRad(90), ratio, 0.1, 100);
        this.vpMat = mat4.create();
        mat4.multiply(this.vpMat, this.pMat, this.vMat);
    }

    clearCanvas (r, g, b, a, depth) {
        this.gl.clearColor(r, g, b, a);
        this.gl.clearDepth(depth);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    flush () {
        this.gl.flush();
    }
}

function degToRad (angle) {
    return angle / 180 * Math.PI;
}

onload = function () {
    
    var width  = 500;
    var height = 300;

    var camera = new Camera('canvas');

    var vertexPositions = [
        0.0, 1.0, 0.0,
        1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0
    ];

    var vertexColors = [
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,
    ];

    registerData(vertexPositions, camera.prg, 'position', 3, camera.gl);
    registerData(vertexColors,    camera.prg, 'color',    4, camera.gl);

    var count = 0;

    (function () {
        
        camera.clearCanvas(0.0, 0.0, 0.0, 1.0, 1.0);
        
        count ++;

        var rad = (count % 360) * Math.PI / 45;
        var x = Math.cos(rad);
        var y = Math.sin(rad);

        var mMat;
        var mvpMat;
        var translation;

        mMat = mat4.create();
        translation = vec3.create();
        vec3.set(translation, x, y + 1.0, 0.0);
        mat4.translate(mMat, mMat, translation);

        mvpMat = mat4.create();
        mat4.multiply(mvpMat, camera.vpMat, mMat);
        drawObject(camera.prg, mvpMat, camera.gl);

        mMat = mat4.create();
        translation = vec3.create();
        vec3.set(translation, 3.0, 0.0, 0.0);
        mat4.translate(mMat, mMat, translation);

        mvpMat = mat4.create();
        mat4.multiply(mvpMat, camera.vpMat, mMat);
        drawObject(camera.prg, mvpMat, camera.gl);
        
        camera.flush();
        
        setTimeout(arguments.callee, 1000 / 5);
    })();
}

function linkProgram (vshaderId, fshaderId, gl) {
    console.log(gl);
    var vshader = createShader(vshaderId, gl);
    var fshader = createShader(fshaderId, gl);
    return createProgram(vshader, fshader, gl);
}

function createShader (id, gl) {
    console.log(gl);
    var shader;
    var scriptElement = document.getElementById(id);
    if (!scriptElement) {
        return;
    }

    switch (scriptElement.type) {
        case 'x-shader/x-vertex' :
            shader = gl.createShader(gl.VERTEX_SHADER);
            break;
        case 'x-shader/x-fragment' :
            shader = gl.createShader(gl.FRAGMENT_SHADER);
            break;
        default :
            return;
    }

    var sourceCode, req = new XMLHttpRequest();
    req.open('GET', scriptElement.src, false);
    req.onload = function () {
        sourceCode = req.response;
    }
    req.send();
    
    gl.shaderSource(shader, sourceCode);
    gl.compileShader(shader);

    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return shader;
    } else {
        alert('ERROR at onload.createShader()\n' + gl.getShaderInfoLog(shader));
        return null;
    }
}

function createProgram (vs, fs, gl) {
    var program = gl.createProgram();

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.useProgram(program);
        return program;
    } else {
        alert('ERROR at onload.create_program()\n' + gl.getProgramInfoLog(program));
    }
}

function registerData (data, prg, name, attrStride, gl) {
    var vbo = createVbo(data, gl);
    var attrLocation = gl.getAttribLocation(prg, name);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.enableVertexAttribArray(attrLocation);
    gl.vertexAttribPointer(attrLocation, attrStride, gl.FLOAT, false, 0, 0);
}

function createVbo (data, gl) {
    var vbo = gl.createBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return vbo;
}

function drawObject(prg, mvpMat, gl) {
    var uniLocation = gl.getUniformLocation(prg, 'mvpMatrix');
    gl.uniformMatrix4fv(uniLocation, false, mvpMat);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function printMatrix (mat) {
    var matrix = [];
    for (var i=0; i<4; i++) {
        matrix.push([mat[i], mat[4+i], mat[8+i], mat[12+i]]);
    }
    console.log(matrix);
}
