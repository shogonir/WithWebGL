var gl;

initGL = function (id, width, height) {
    var c = document.getElementById(id);
    if (width) {
        c.width = width;
    }
    if (height) {
        c.height = height;
    }
    return c.getContext('webgl') || c.getContext('experimental-webgl')
}

linkProgram = function (vshaderId, fshaderId) {
    var vshader = create_shader(vshaderId);
    var fshader = create_shader(fshaderId);
    return create_program(vshader, fshader);
}

registerData = function (data, prg, name, attrStride) {
    var vbo = create_vbo(data);
    var attrLocation = gl.getAttribLocation(prg, name);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.enableVertexAttribArray(attrLocation);
    gl.vertexAttribPointer(attrLocation, attrStride, gl.FLOAT, false, 0, 0);
}

onload = function () {

    var width  = 500;
    var height = 300;

    gl = initGL('canvas', width, height);

    var prg = linkProgram('vertex-shader', 'fragment-shader');

    var vertex_position = [
        0.0, 1.0, 0.0,
        1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0
    ];

    var vertex_color = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0
    ];
    
    registerData(vertex_position, prg, 'position', 3);
    registerData(vertex_color, prg, 'color', 4);
    
    var vMat = makeLookAt(
        0.0, 1.0, 3.0,
        0.0, 0.0, 0.0,
        0.0, 1.0, 0.0
    );
    var pMat = makePerspective(90.0, width / height, 0.1, 100);
    var vpMat = pMat.x(vMat);

    var count = 0;

    (function () {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        count++;

        var rad = (count % 360) * Math.PI / 45;
        var x = Math.cos(rad);
        var y = Math.sin(rad);
        
        var mMat = identity4x4().translate($V([x, y + 1.0, 0.0]));
        var mvpMat = vpMat.x(mMat);

        var uniLocation = gl.getUniformLocation(prg, 'mvpMatrix');

        gl.uniformMatrix4fv(uniLocation, false, mvpMat.flatten());
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        mMat = identity4x4();
        mMat = mMat.translate($V([3.0, 0.0, 0.0]));
        mvpMat = vpMat.x(mMat);
        gl.uniformMatrix4fv(uniLocation, false, mvpMat.flatten());
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        gl.flush();

        setTimeout(arguments.callee, 1000 / 30);
    })();
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

