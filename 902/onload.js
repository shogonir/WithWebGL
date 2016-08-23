class Camera {

  constructor (canvasId) {
    var c = document.getElementById(canvasId);
    this.canvas = c;
    this.gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    this.prg = this.linkProgram('vertex-shader', 'fragment-shader');
    this.vMat = mat4.create();
    mat4.lookAt(this.vMat, [0, 1, 3], [0, 0, 0], [0, 1, 0]);
    this.pMat = mat4.create();
    var ratio = this.canvas.width / this.canvas.height;
    mat4.perspective(this.pMat, degToRad(90), ratio, 0.1, 100);
    this.vpMat = mat4.create();
    mat4.multiply(this.vpMat, this.pMat, this.vMat);
  }

  clearCanvas (r, g, b, a, depth) {
    var gl = this.gl;
    gl.clearColor(r, g, b, a);
    gl.clearDepth(depth);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  flush () {
    this.gl.flush();
  }

  linkProgram (vshaderId, fshaderId) {
    var vshader = this.createShader(vshaderId);
    var fshader = this.createShader(fshaderId);
    return this.createProgram(vshader, fshader);
  }

  createShader (id) {
    var gl = this.gl;
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

  createProgram (vs, fs) {
    var gl = this.gl;
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

  registerData (data, name, attrStride) {
    var gl = this.gl;
    var vbo = this.createVbo(data);
    var attrLocation = gl.getAttribLocation(this.prg, name);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.enableVertexAttribArray(attrLocation);
    gl.vertexAttribPointer(attrLocation, attrStride, gl.FLOAT, false, 0, 0);
  }

  createVbo (data) {
    var gl = this.gl;
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return vbo;
  }

  drawObject(mMat) {
    var gl = this.gl;
    var mvpMat = mat4.create();
    mat4.multiply(mvpMat, this.vpMat, mMat);
    var uniLocation = gl.getUniformLocation(this.prg, 'mvpMatrix');
    gl.uniformMatrix4fv(uniLocation, false, mvpMat);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

class Object3D {

  constructor () {
    this.setPosition(0.0, 0.0, 0.0);
    this.setScale(1.0, 1.0, 1.0);
  }

  setPosition (x, y, z) {
    var position = vec3.create();
    vec3.set(position, x, y, z);
    this.position = position;
  }

  setScale (x, y, z) {
    var scale = vec3.create();
    vec3.set(scale, x, y, z);
    this.scale = scale;
  }

  calcModelMatrix () {
    var mMat = mat4.create();
    mat4.scale(mMat, mMat, this.scale);
    mat4.translate(mMat, mMat, this.position);
    return mMat;
  }
}

class Triangle extends Object3D {

  constructor () {
    super();
  }
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

  camera.registerData(vertexPositions, 'position', 3);
  camera.registerData(vertexColors,    'color',    4);

  var count = 0;

  (function () {

    camera.clearCanvas(0.0, 0.0, 0.0, 1.0, 1.0);

    count ++;

    var rad = (count % 360) * Math.PI / 45;
    var x = Math.cos(rad);
    var y = Math.sin(rad);

    var triangle;

    triangle = new Triangle();
    triangle.setPosition(x, y, 0.0);
    triangle.setScale(x / 4 + 1, y / 4 + 1, 1.0);
    camera.drawObject(triangle.calcModelMatrix());

    triangle = new Triangle();
    triangle.setPosition(3.0, 0.0, 0.0);
    camera.drawObject(triangle.calcModelMatrix());

    camera.flush();

    setTimeout(arguments.callee, 1000 / 30);
  })();
}

function printMatrix (mat) {
  var matrix = [];
  for (var i=0; i<4; i++) {
    matrix.push([mat[i], mat[4+i], mat[8+i], mat[12+i]]);
  }
  console.log(matrix);
}

function degToRad (angle) {
  return angle / 180 * Math.PI;
}
