var gl;

onload = function() {
    var c = document.getElementById('canvas');

    c.width  = 500;
    c.height = 300;

    gl = c.getContext('webgl') || c.getContext('experimental-webgl')

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    vshader = create_shader('vertex-shader');
    fshader = create_shader('fragment-shader');

    create_program(vshader, fshader);
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
