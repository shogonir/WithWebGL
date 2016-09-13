class Camera {

  constructor (canvasId) {
    this.canvas = this.initCanvas(canvasId);
    this.gl = this.initGL();
    this.position = [10, 10, 10];
    this.vpMat = this.calcVPMatrix();
  }

  initCanvas (canvasId) {
    var c = document.getElementById(canvasId);
    c.width  = 960;
    c.height = 540;
    return c;
  }

  initGL () {
    var c = this.canvas;
    var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    return gl;
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

    return program;
  }
    
  attachProgram (obj) {
    var gl = this.gl; 

    if (gl.getProgramParameter(obj.program, gl.LINK_STATUS)) {
      gl.useProgram(obj.program);
      this.registerData(obj.vertices, 'position', 3, obj.program);
      this.registerData(obj.colors,   'color',    4, obj.program);
      this.createIbo(obj.indices);
      var uniLocation = gl.getUniformLocation(obj.program, 'mvpMatrix');
      gl.uniformMatrix4fv(uniLocation, false, this.calcMVPMatrix(obj.calcModelMatrix()));
    } else {
      alert('ERROR at onload.create_program()\n' + gl.getProgramInfoLog(obj.program));
    }
  }

  registerData (data, name, attrStride, program) {
    var gl = this.gl;
    var vbo = this.createVbo(data);
    var attrLocation = gl.getAttribLocation(program, name);
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

  createIbo (indices) {
    var gl = this.gl;
    var ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(indices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  }

  calcVPMatrix () {
    var vMat = mat4.create();
    mat4.lookAt(vMat, this.position, [0, 0, 0], [0, 1, 0]);
    var pMat = mat4.create();
    this.vpMat = mat4.create();
    var ratio = this.canvas.width / this.canvas.height;
    mat4.perspective(pMat, degToRad(90), ratio, 0.1, 100);
    mat4.multiply(this.vpMat, pMat, vMat);
    return this.vpMat;
  } 

  calcMVPMatrix (mMat) {
    var mvpMat = mat4.create();
    mat4.multiply(mvpMat, this.calcVPMatrix(), mMat);
    return mvpMat;
  }

  drawObject(obj) {
    var gl = this.gl;
    var mvpMat = this.calcMVPMatrix(obj.calcModelMatrix());
    if (!obj.program) {
      obj.program = this.linkProgram('vertex-shader', 'fragment-shader');
    }
    this.attachProgram(obj); 
    gl.drawElements(gl.TRIANGLES, obj.indices.length, gl.UNSIGNED_SHORT, 0);
  }
}

class Object3D {

  constructor (vertices, indices, colors) {
    this.vertices = vertices;
    this.indices  = indices;
    this.colors   = colors;
    this.program  = null;
    this.setPosition(0.0, 0.0, 0.0);
    this.setRotationAxis(0.0, 1.0, 0.0);
    this.setScale(1.0, 1.0, 1.0);
    this.rotationAngle = 0.0;
  }

  setPosition (x, y, z) {
    var position = vec3.create();
    vec3.set(position, x, y, z);
    this.position = position;
  }

  setRotationAxis (x, y, z) {
    var axis = vec3.create();
    vec3.set(axis, x, y, z);
    this.rotationAxis = axis;
  }

  setScale (x, y, z) {
    var scale = vec3.create();
    vec3.set(scale, x, y, z);
    this.scale = scale;
  }

  calcModelMatrix () {
    var mMat = mat4.create();
    mat4.translate(mMat, mMat, this.position);
    mat4.rotate(mMat, mMat, this.rotationAngle, this.rotationAxis);
    mat4.scale(mMat, mMat, this.scale);
    return mMat;
  }
}

var camera;

onload = function () {

  var json = readJson('../data/object3d.json');
  
  var buildings = new Object3D(json.vertices, json.indices, json.colors)

  camera = new Camera('canvas');

  camera.canvas.addEventListener('mousemove', mouseMove);

  (function () {

    camera.clearCanvas(0.0, 0.0, 0.0, 1.0, 1.0);

    camera.drawObject(buildings);

    camera.flush();
    
    setTimeout(arguments.callee, 1000 / 30);
  })();
}

function readJson(fname) {
  var request = new XMLHttpRequest();
  request.open('get', fname, false);
  var json = '';
  request.onload = function () {
    json = request.responseText;
  }
  request.send();
  return JSON.parse(json);
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

function mouseMove (e) {
  var c  = camera.canvas;
  var cw = c.width;
  var ch = c.height;
  var x  = - (e.clientX - c.offsetLeft - cw * 0.5) / cw;
  var y  = (e.clientY - c.offsetTop  - ch * 0.5) / ch;
  var m  = Math.sqrt(x * x + y * y);
  var r  = 7.5;
  var radx = 0.4 * Math.PI * (y + 0.5);
  var rady = Math.PI * x;
  var cos  = r * Math.cos(radx);
  camera.position = [cos*Math.sin(rady), r*Math.sin(radx), cos*Math.cos(rady)];
}

