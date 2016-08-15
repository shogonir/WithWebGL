var gl;

onload = function() {
    var c = document.getElementById('canvas');

    c.width  = 500;
    c.height = 300;

    gl = c.getContext('webgl') || c.getContext('experimental-webgl')

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var vshader = create_shader('vertex-shader');
    var fshader = create_shader('fragment-shader');

    var prg = create_program(vshader, fshader);

    var attLocation = gl.getAttribLocation(prg, 'position');

    var attStride = 3;

    var vertex_position = [
        0.0, 1.0, 0.0,
        1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0
    ];

    var vbo = create_vbo(vertex_position);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    gl.enableVertexAttribArray(attLocation);

    gl.vertexAttribPointer(attLocation, attStride, gl.FLOAT, false, 0, 0);

    var mMat = identity4x4();
    
    var vMat = makeLookAt(
        0.0, 1.0, 3.0,
        0.0, 0.0, 0.0,
        0.0, 1.0, 0.0
    );

    var pMat = makePerspective(90.0, 1.0 * c.width / c.height, 0.1, 100);

    var mvMat = vMat.x(mMat);

    var mvpMat = pMat.x(mvMat);

    var uniLocation = gl.getUniformLocation(prg, 'mvpMatrix');

    console.log(mvpMat);

    gl.uniformMatrix4fv(uniLocation, false, mvpMat.flatten());

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.flush();
}

function identity4x4 () {
    return $M([
        [1.0, 0.0, 0.0, 0.0],
        [0.0, 1.0, 0.0, 0.0],
        [0.0, 0.0, 1.0, 0.0],
        [0.0, 0.0, 0.0, 1.0]
    ]);
}

function create_shader (id) {
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

    var source_code, req = new XMLHttpRequest();
    req.open('GET', scriptElement.src, false);
    req.onload = function () {
        source_code = req.response;
    }
    req.send();

    gl.shaderSource(shader, source_code);
    gl.compileShader(shader);

    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return shader;
    } else {
        alert('ERROR @create_shader("' + id + '") : ' + gl.getShaderInfoLog(shader));
        return null;
    }
}

function create_program(vs, fs){
    var program = gl.createProgram();
    
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    
    if(gl.getProgramParameter(program, gl.LINK_STATUS)){
        gl.useProgram(program);
        return program;
    }else{
        alert(gl.getProgramInfoLog(program));
    }
}

function create_vbo (data) {
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return vbo;
}

