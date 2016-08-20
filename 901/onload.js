var gl;

onload = function () {
    
    var width  = 500;
    var height = 300;

    gl = initGl('canvas', width, height);

    var prg = linkProgram('vertex-shader', 'fragment-shader');

    var vertexPositions = [
        0.0, 1.0, 0.0,
        1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0
    ];

    var vertexColors = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0
    ];

    registerData(vertexPositions, prg, 'position', 3);
    registerData(vertexColors,    prg, 'color',    4);

    var vMat = mat4.create();
    mat4.lookAt(vMat, [0.0, 1.0, 3.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);

    var pMat = mat4.create();
    mat4.perspective(pMat, 90 / 180 * Math.PI, width / height, 0.1, 100);

    var vpMat = mat4.create();
    mat4.multiply(vpMat, pMat, vMat);
    console.log(' vMat ');
    printMatrix(vMat);
    console.log(' pMat ');
    printMatrix(pMat);
    console.log('vpMat ');
    printMatrix(vpMat);

    var count = 0;

    (function () {
        
        clearCanvas(0.0, 0.0, 0.0, 1.0, 1.0);
        
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
        mat4.multiply(mvpMat, vpMat, mMat);
        drawObject(prg, mvpMat);

        mMat = mat4.create();
        translation = vec3.create();
        vec3.set(translation, 3.0, 0.0, 0.0);
        mat4.translate(mMat, mMat, translation);
        mvpMat = mat4.create();
        mat4.multiply(mvpMat, vpMat, mMat);
        drawObject(prg, mvpMat);
        printMatrix(mvpMat)
        
        gl.flush();
        
        setTimeout(arguments.callee, 1000 / 5);
    })();
}

function initGl (id, width, height) {
    var c = document.getElementById(id);
    if (width) {
        c.width = width;
    }
    if (height) {
        c.height = height;
    }
    return c.getContext('webgl') || c.getContext('experimental-webgl');
}

function linkProgram (vshaderId, fshaderId) {
    var vshader = createShader(vshaderId);
    var fshader = createShader(fshaderId);
    return createProgram(vshader, fshader);
}

function createShader (id) {
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

function createProgram (vs, fs) {
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

function registerData (data, prg, name, attrStride) {
    var vbo = createVbo(data);
    var attrLocation = gl.getAttribLocation(prg, name);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.enableVertexAttribArray(attrLocation);
    gl.vertexAttribPointer(attrLocation, attrStride, gl.FLOAT, false, 0, 0);
}

function createVbo (data) {
    var vbo = gl.createBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return vbo;
}

function clearCanvas (r, g, b, a, depth) {
    gl.clearColor(r, g, b, a);
    gl.clearDepth(depth);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function drawObject(prg, mvpMat) {
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
