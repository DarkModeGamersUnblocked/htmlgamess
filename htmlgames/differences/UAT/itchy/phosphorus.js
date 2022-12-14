// Scratch2apk: An (almost complete) scratch emulator written in javascript - includes support for (some) hacked blocks 
//
// (v0.249Cx) < insert random number here... C = Cloud variables inspired by http://phosphate.herokuapp.com/ 
var LAKITU = true; // allow cloud data (geddit?)
//
// Based on phosphorus (phosphorus.github.io) with additional bugfixes and enhancements by PF
//
// Regarding all code here: pillage 'till you puke! (aka take what you want!)
//   
// Sometimes, if this file is a certain size, Chrome 64bit on Windows 10 compiles it so it gives an extra, noticable speed boost (x2!)
// But I don't know why? UPDATE: possible Chrome is switching gfx card from intel to nvidia... 
// 
// P.S. after the autoloader has finished (currently the HTML Games logo), you can remove the word zip off the url, press enter and
// the examples dropdown will appear. Lots of lovely games to play!
//
// https://projects.scratch.mit.edu/internalapi/project/[id]/get/
var that; // PF
var TurboMode = true; // !!window.location.search.match("turbo=true"); // false = 99% compatibility for starters (use at your own risk!) 
//console.log("TurboMode: " + TurboMode); // after extensive testing this can be hardcoded true (it not the same turbo btw as when you shift click the green flag)
var ASCII = false; // pf for ASCII hack
var ShiftKey = true; // pf for ASCII hack
var greenFlag = 1; // returns -ve if project contains more than one green flag event

var P = (function() {
  'use strict';

  var SCALE = window.devicePixelRatio || 1;
  var hasTouchEvents = 'ontouchstart' in document;
  
  if (hasTouchEvents && document.getElementById("touchscreen")) document.getElementById("touchscreen").style.display = "block";

  var inherits = function(cla, sup) {
    cla.prototype = Object.create(sup.prototype);
    cla.parent = sup;
    cla.base = function(self, method /*, args... */) {
      return sup.prototype[method].call(self, [].slice.call(arguments, 2));
    };
  };

  var addEvents = function(cla /*, events... */) {
    [].slice.call(arguments, 1).forEach(function(event) {
      addEvent(cla, event);
    });
  };

  var addEvent = function(cla, event) {
    var capital = event[0].toUpperCase() + event.substr(1);

    cla.prototype.addEventListener = cla.prototype.addEventListener || function(event, listener) {
      var listeners = this['$' + event] = this['$' + event] || [];
      listeners.push(listener);
      return this;
    };

    cla.prototype.removeEventListener = cla.prototype.removeEventListener || function(event, listener) {
      var listeners = this['$' + event];
      if (listeners) {
        var i = listeners.indexOf(listener);
        if (i !== -1) {
          listeners.splice(i, 1);
        }
      }
      return this;
    };

    cla.prototype.dispatchEvent = cla.prototype.dispatchEvent || function(event, arg) {
      var listeners = this['$' + event];
      if (listeners) {
        listeners.forEach(function(listener) {
          listener(arg);
        });
      }
      var listener = this['on' + event];
      if (listener) {
        listener(arg);
      }
      return this;
    };

    cla.prototype['on' + capital] = function(listener) {
      this.addEventListener(event, listener);
      return this;
    };

    cla.prototype['dispatch' + capital] = function(arg) {
      this.dispatchEvent(event, arg);
      return this;
    };
  };

  var Request = function() {
    this.loaded = 0;
  };
  addEvents(Request, 'load', 'progress', 'error');

  Request.prototype.progress = function(loaded, total, lengthComputable) {
    this.loaded = loaded;
    this.total = total;
    this.lengthComputable = lengthComputable;
    this.dispatchProgress({
      loaded: loaded,
      total: total,
      lengthComputable: lengthComputable
    });
  };

  Request.prototype.load = function(result) {
    this.result = result;
    this.isDone = true;
    this.dispatchLoad(result);
  };

  Request.prototype.error = function(error) {
    this.result = error;
    this.isError = true;
    this.isDone = true;
    this.dispatchError(error);
  };

  var CompositeRequest = function() {
    this.requests = [];
    this.isDone = true;
    this.update = this.update.bind(this);
    this.error = this.error.bind(this);
  };
  inherits(CompositeRequest, Request);

  CompositeRequest.prototype.add = function(request) {
    if (request instanceof CompositeRequest) {
      for (var i = 0; i < request.requests.length; i++) {
        this.add(request.requests[i]);
      }
    } else {
      this.requests.push(request);
      request.addEventListener('progress', this.update);
      request.addEventListener('load', this.update);
      request.addEventListener('error', this.error);
      this.update();
    }
  };

  CompositeRequest.prototype.update = function() {
    if (this.isError) return;
    var requests = this.requests;
    var i = requests.length;
    var total = 0;
    var loaded = 0;
    var lengthComputable = true;
    var uncomputable = 0;
    var done = 0;
    while (i--) {
      var r = requests[i];
      loaded += r.loaded;
      if (r.isDone) {
        total += r.loaded;
        done += 1;
      } else if (r.lengthComputable) {
        total += r.total;
      } else {
        lengthComputable = false;
        uncomputable += 1;
      }
    }
    if (!lengthComputable && uncomputable !== requests.length) {
      var each = total / (requests.length - uncomputable) * uncomputable;
      i = requests.length;
      total = 0;
      loaded = 0;
      lengthComputable = true;
      while (i--) {
        var r = requests[i];
        if (r.lengthComputable) {
          loaded += r.loaded;
          total += r.total;
        } else {
          total += each;
          if (r.isDone) loaded += each;
        }
      }
    }
    this.progress(loaded, total, lengthComputable);
    this.doneCount = done;
    this.isDone = done === requests.length;
    if (this.isDone && !this.defer) {
      this.load(this.getResult());
    }
  };

  CompositeRequest.prototype.getResult = function() {
    throw new Error('Users must implement getResult()');
  };

  var wavFiles = {AcousticGuitar_F3:'instruments/AcousticGuitar_F3_22k.wav',AcousticPiano_As3:'instruments/AcousticPiano(5)_A%233_22k.wav',AcousticPiano_C4:'instruments/AcousticPiano(5)_C4_22k.wav',AcousticPiano_G4:'instruments/AcousticPiano(5)_G4_22k.wav',AcousticPiano_F5:'instruments/AcousticPiano(5)_F5_22k.wav',AcousticPiano_C6:'instruments/AcousticPiano(5)_C6_22k.wav',AcousticPiano_Ds6:'instruments/AcousticPiano(5)_D%236_22k.wav',AcousticPiano_D7:'instruments/AcousticPiano(5)_D7_22k.wav',AltoSax_A3:'instruments/AltoSax_A3_22K.wav',AltoSax_C6:'instruments/AltoSax(3)_C6_22k.wav',Bassoon_C3:'instruments/Bassoon_C3_22k.wav',BassTrombone_A2_2:'instruments/BassTrombone_A2(2)_22k.wav',BassTrombone_A2_3:'instruments/BassTrombone_A2(3)_22k.wav',Cello_C2:'instruments/Cello(3b)_C2_22k.wav',Cello_As2:'instruments/Cello(3)_A%232_22k.wav',Choir_F3:'instruments/Choir(4)_F3_22k.wav',Choir_F4:'instruments/Choir(4)_F4_22k.wav',Choir_F5:'instruments/Choir(4)_F5_22k.wav',Clarinet_C4:'instruments/Clarinet_C4_22k.wav',ElectricBass_G1:'instruments/ElectricBass(2)_G1_22k.wav',ElectricGuitar_F3:'instruments/ElectricGuitar(2)_F3(1)_22k.wav',ElectricPiano_C2:'instruments/ElectricPiano_C2_22k.wav',ElectricPiano_C4:'instruments/ElectricPiano_C4_22k.wav',EnglishHorn_D4:'instruments/EnglishHorn(1)_D4_22k.wav',EnglishHorn_F3:'instruments/EnglishHorn(1)_F3_22k.wav',Flute_B5_1:'instruments/Flute(3)_B5(1)_22k.wav',Flute_B5_2:'instruments/Flute(3)_B5(2)_22k.wav',Marimba_C4:'instruments/Marimba_C4_22k.wav',MusicBox_C4:'instruments/MusicBox_C4_22k.wav',Organ_G2:'instruments/Organ(2)_G2_22k.wav',Pizz_A3:'instruments/Pizz(2)_A3_22k.wav',Pizz_E4:'instruments/Pizz(2)_E4_22k.wav',Pizz_G2:'instruments/Pizz(2)_G2_22k.wav',SteelDrum_D5:'instruments/SteelDrum_D5_22k.wav',SynthLead_C4:'instruments/SynthLead(6)_C4_22k.wav',SynthLead_C6:'instruments/SynthLead(6)_C6_22k.wav',SynthPad_A3:'instruments/SynthPad(2)_A3_22k.wav',SynthPad_C6:'instruments/SynthPad(2)_C6_22k.wav',TenorSax_C3:'instruments/TenorSax(1)_C3_22k.wav',Trombone_B3:'instruments/Trombone_B3_22k.wav',Trumpet_E5:'instruments/Trumpet_E5_22k.wav',Vibraphone_C3:'instruments/Vibraphone_C3_22k.wav',Violin_D4:'instruments/Violin(2)_D4_22K.wav',Violin_A4:'instruments/Violin(3)_A4_22k.wav',Violin_E5:'instruments/Violin(3b)_E5_22k.wav',WoodenFlute_C5:'instruments/WoodenFlute_C5_22k.wav',BassDrum:'drums/BassDrum(1b)_22k.wav',Bongo:'drums/Bongo_22k.wav',Cabasa:'drums/Cabasa(1)_22k.wav',Clap:'drums/Clap(1)_22k.wav',Claves:'drums/Claves(1)_22k.wav',Conga:'drums/Conga(1)_22k.wav',Cowbell:'drums/Cowbell(3)_22k.wav',Crash:'drums/Crash(2)_22k.wav',Cuica:'drums/Cuica(2)_22k.wav',GuiroLong:'drums/GuiroLong(1)_22k.wav',GuiroShort:'drums/GuiroShort(1)_22k.wav',HiHatClosed:'drums/HiHatClosed(1)_22k.wav',HiHatOpen:'drums/HiHatOpen(2)_22k.wav',HiHatPedal:'drums/HiHatPedal(1)_22k.wav',Maracas:'drums/Maracas(1)_22k.wav',SideStick:'drums/SideStick(1)_22k.wav',SnareDrum:'drums/SnareDrum(1)_22k.wav',Tambourine:'drums/Tambourine(3)_22k.wav',Tom:'drums/Tom(1)_22k.wav',Triangle:'drums/Triangle(1)_22k.wav',Vibraslap:'drums/Vibraslap(1)_22k.wav',WoodBlock:'drums/WoodBlock(1)_22k.wav'};

  var IO = {};

  IO.PROJECT_URL = 'https://projects.scratch.mit.edu/internalapi/project/';
  IO.ASSET_URL = 'https://cdn.assets.scratch.mit.edu/internalapi/asset/';
  IO.SOUNDBANK_URL = "" + 'soundbank/';

  IO.FONTS = {
    '': 'Helvetica',
    Scratch: 'Scratch',	  
    Donegal: 'Donegal One',
    Gloria: 'Gloria Hallelujah',
    Marker: 'Permanent Marker',
    Mystery: 'Mystery Quest'
  };

  IO.LINE_HEIGHTS = {
    Helvetica: 1.13,
    'Scratch': 1.22,	  
    'Donegal One': 1.25,
    'Gloria Hallelujah': 1.97,
    'Permanent Marker': 1.43,
    'Mystery Quest': 1.37
  };

  IO.ADPCM_STEPS = [7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88, 97, 107, 118, 130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767];
  IO.ADPCM_INDEX = [-1, -1, -1, -1, 2, 4, 6, 8, -1, -1, -1, -1, 2, 4, 6, 8];

  IO.init = function(request) {
    IO.projectRequest = request;
    IO.zip = null;
    ASCII = false; // pf ASCII hack reset
    greenFlag = 1; // and this as well...
  };

  IO.parseJSONish = function(json) {
    if (!/^\s*\{/.test(json)) {
      that = false; // JSON not in UTF-8 format
      throw new SyntaxError('Bad JSON');
    }
    try {
      return JSON.parse(json);
    } catch (e) {}
    if (/[^,:{}\[\]0-9\.\-+EINaefilnr-uy \n\r\t]/.test(json.replace(/"(\\.|[^"\\])*"/g, ''))) {
      throw new SyntaxError('Bad JSON');
    }
    return (1, eval)('(' + json + ')');
  };


  IO.load = function(url, callback, self, type) {
    var request = new Request;
    var xhr = new XMLHttpRequest;
    xhr.open('GET', url, true);
    xhr.onprogress = function(e) {
      request.progress(e.loaded, e.total, e.lengthComputable);
    };
    xhr.onload = function() {
      if (location.hash.substr(1) === 'zip') { // pf: branch local / dragdrop zip stuff here...
          request.load(xhr.response);
      } else {	      
        if (xhr.status === 200) {
          if (that === false) {
            that = undefined; // reset
            //request.error(new Error("Bad JSON")); // Possible resource issue? (code here needs more checks!)
            console.log("Possible resource issue ...Please try remixing this project!");
          }
          request.load(xhr.response);
        } else {
          console.log("Possible unsupported Scratch 3 Project...");
          request.error(new Error('HTTPS ' + xhr.status + ': ' + xhr.statusText)); //
        }
      }
    };
    xhr.onerror = function() {
      request.error(new Error('XHR Error'));
    };
    xhr.responseType = type || '';
    setTimeout(xhr.send.bind(xhr));
    //(function(){xhr.send.bind(xhr)})(); // pf
    if (callback) request.onLoad(callback.bind(self));
    return request;
  };

  IO.loadImage = function(url, callback, self) {
    var request = new Request;
    var image = new Image;
    var bForcedBlank = false;
    image.crossOrigin = 'anonymous';
    image.src = url;
    image.onload = function() {
      request.load(image);
    };
    image.onerror = function() { // pf use default img - get the game loaded!
      //request.error(new Error('Failed to load image: ' + url));
      console.log('Failed to load image (forcing blank): ' + url);
      bForcedBlank = true;
      image.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABBJREFUeNpi+P//PwNAgAEACPwC/tuiTRYAAAAASUVORK5CYII=";
    };
    if (callback) {
      if (bForcedBlank) {request.onLoad(callback.bind(self));} else {request.onLoad(callback.bind(self));}
    }
    return (bForcedBlank) ? request : request;
  };


  IO.loadScratchr2Project = function(id, callback, self) {
    var request = new CompositeRequest;
    IO.init(request);

    request.defer = true;
    var url = IO.PROJECT_URL + id + '/get/';
    request.add(IO.load(url).onLoad(function(contents) {
      try {
        var json = IO.parseJSONish(contents);
      } catch (e) {
        request.add(IO.load(url, null, null, 'arraybuffer').onLoad(function(ab) {
          var request2 = new Request;
          request.add(request2);
          request.add(IO.loadSB2Project(ab, function(stage) {
            request.getResult = function() {
              return stage;
            };
            request2.load();
          }));
          request.defer = false;
        }));
        return;
      }
      try {
        IO.loadProject(json);
        if (callback) request.onLoad(callback.bind(self));
        if (request.isDone) {
          request.load(new Stage(id).fromJSON(json));
        } else {
          request.defer = false;
          request.getResult = function() {
            return new Stage(id).fromJSON(json);
          };
        }
      } catch (e) {
        request.error(e);
      }
    }));

    return request;
  };

  IO.loadScratchr2ProjectTitle = function(id, callback, self) {
    var request = new CompositeRequest;

    request.defer = true;
    // pf changed to use https...
    request.add(P.IO.load('https://crossorigin.me/https://scratch.mit.edu/projects/' + id + '/').onLoad(function(data) {
      var m = /<title>\s*(.+?)(\s+on\s+Scratch)?\s*<\/title>/.exec(data);
      if (callback) request.onLoad(callback.bind(self));
      if (m) {
        var d = document.createElement('div');
        d.innerHTML = m[1];
        request.load(d.innerText);
      } else {
        request.error(new Error('No title'));
      }
    }));

    return request;
  };

  IO.loadJSONProject = function(json, callback, self) {
    var request = new CompositeRequest;
    IO.init(request);

    try {
      IO.loadProject(json);
      if (callback) request.onLoad(callback.bind(self));
      if (request.isDone) {
        request.load(new Stage().fromJSON(json));
      } else {
        request.defer = false;
        request.getResult = function() {
          return new Stage().fromJSON(json);
        };
      }
    } catch (e) {
      request.error(e);
    }

    return request;
  };

  IO.loadSB2Project = function(ab, callback, self) {
    var request = new CompositeRequest;
    IO.init(request);

    try {
      IO.zip = new JSZip(ab);
      var json = IO.parseJSONish(IO.zip.file('project.json').asText());

      IO.loadProject(json);
      if (callback) request.onLoad(callback.bind(self));
      if (request.isDone) {
        request.load(new Stage().fromJSON(json));
      } else {
        request.defer = false;
        request.getResult = function() {
          return new Stage().fromJSON(json);
        };
      }
    } catch (e) {
      request.error(e);
    }

    return request;
  };

  IO.loadSB2File = function(f, callback, self) {
    var cr = new CompositeRequest;
    cr.defer = true;
    var request = new Request;
    cr.add(request);
    var reader = new FileReader;
    reader.onloadend = function() {
      cr.defer = true;
      cr.add(IO.loadSB2Project(reader.result, function(result) {
        cr.defer = false;
        cr.getResult = function() {
          return result;
        };
        cr.update();
      }));
      request.load();
    };
    reader.onprogress = function(e) {
      request.progress(e.loaded, e.total, e.lengthComputable);
    };
    reader.readAsArrayBuffer(f);
    if (callback) cr.onLoad(callback.bind(self));
    return cr;
  };

  IO.loadProject = function(data) {
    IO.loadWavs();
    IO.loadArray(data.children, IO.loadObject);
    IO.loadBase(data);
  };

  IO.wavBuffers = Object.create(null);
  IO.loadWavs = function() {
    if (!audioContext) return;
    if (location.hash.substr(1) === 'zip') return; // pf temp test - need to load local files here...
	  
    for (var name in wavFiles) {
      if (IO.wavBuffers[name]) {
        if (IO.wavBuffers[name] instanceof Request) {
          IO.projectRequest.add(IO.wavBuffers[name]);
        }
      } else {
        if (location.hash.substr(1) === 'zip') {
          IO.projectRequest.add(IO.wavBuffers[name] = IO.loadWavBufferZip(name));
        } else {
          IO.projectRequest.add(IO.wavBuffers[name] = IO.loadWavBuffer(name));
        }
      }
    }
  };

  IO.loadWavBufferZip = function(name) {
    var request = new Request;
    var wav = new Audio;
    var bForcedBlank = false;
    wav.crossOrigin = 'anonymous';
    wav.src = IO.SOUNDBANK_URL + wavFiles[name];
    IO.load(IO.SOUNDBANK_URL + wavFiles[name], function(ab) {
      IO.decodeAudio(ab, function(buffer) {
        IO.wavBuffers[name] = buffer;
        request.load();
      });
    }, null, 'arraybuffer').onError(function(err) {
      request.error(err);
    });
    return request;
  };	
	
  IO.loadWavBuffer = function(name) {
    var request = new Request;
    IO.load(IO.SOUNDBANK_URL + wavFiles[name], function(ab) {
      IO.decodeAudio(ab, function(buffer) {
        IO.wavBuffers[name] = buffer;
        request.load();
      });
    }, null, 'arraybuffer').onError(function(err) {
      request.error(err);
    });
    return request;
  };
  
  IO.decodeAudio = function(ab, cb) {
    if (audioContext) {
      IO.decodeADPCMAudio(ab, function(err, buffer) {
        if (buffer) return setTimeout(function() {cb(buffer)});
        var p = audioContext.decodeAudioData(ab, function(buffer) {
          cb(buffer);
        }, function(err2) {
          console.warn(err, err2);
          cb(null);
        });
        if (p.catch) p.catch(function() {});
      });
    } else {
      setTimeout(cb);
    }
  };
  
  IO.decodeADPCMAudio = function(ab, cb) {
    var dv = new DataView(ab);
    if (dv.getUint32(0) !== 0x52494646 || dv.getUint32(8) !== 0x57415645) {
      return cb(new Error('Unrecognized audio format'));
    }

    var blocks = {};
    var i = 12, l = dv.byteLength - 8;
    while (i < l) {
      blocks[String.fromCharCode(
        dv.getUint8(i),
        dv.getUint8(i + 1),
        dv.getUint8(i + 2),
        dv.getUint8(i + 3))] = i;
      i += 8 + dv.getUint32(i + 4, true);
    }

    var format        = dv.getUint16(20, true);
    var channels      = dv.getUint16(22, true);
    var sampleRate    = dv.getUint32(24, true);
    var byteRate      = dv.getUint32(28, true);
    var blockAlign    = dv.getUint16(32, true);
    var bitsPerSample = dv.getUint16(34, true);

    if (format === 17) {
      var samplesPerBlock = dv.getUint16(38, true);
      var blockSize = ((samplesPerBlock - 1) / 2) + 4;

      var frameCount = dv.getUint32(blocks.fact + 8, true);

      var buffer = audioContext.createBuffer(1, frameCount, sampleRate);
      var channel = buffer.getChannelData(0);

      var sample, index = 0;
      var step, code, delta;
      var lastByte = -1;

      var offset = blocks.data + 8;
      i = offset;
      var j = 0;
      while (true) {
        if ((((i - offset) % blockSize) == 0) && (lastByte < 0)) {
          if (i >= dv.byteLength) break;
          sample = dv.getInt16(i, true); i += 2;
          index = dv.getUint8(i); i += 1;
          i++;
          if (index > 88) index = 88;
          channel[j++] = sample / 32767;
        } else {
          if (lastByte < 0) {
            if (i >= dv.byteLength) break;
            lastByte = dv.getUint8(i); i += 1;
            code = lastByte & 0xf;
          } else {
            code = (lastByte >> 4) & 0xf;
            lastByte = -1;
          }
          step = IO.ADPCM_STEPS[index];
          delta = 0;
          if (code & 4) delta += step;
          if (code & 2) delta += step >> 1;
          if (code & 1) delta += step >> 2;
          delta += step >> 3;
          index += IO.ADPCM_INDEX[code];
          if (index > 88) index = 88;
          if (index < 0) index = 0;
          sample += (code & 8) ? -delta : delta;
          if (sample > 32767) sample = 32767;
          if (sample < -32768) sample = -32768;
          channel[j++] = sample / 32768;
        }
      }
      return cb(null, buffer);
    }
    cb(new Error('Unrecognized WAV format ' + format));
  };
  

// PF - New audio stuff ### OLD WAY ### ***

  IO.__decodeAudio = function(ab, cb) {
    if (audioContext) {
    // PF check buffer type is PCM or ADPCM 1st? (ie headers)
	var abc = false;
	var uInt8Array = new Uint8Array(ab);
	if (readBytes(20, 2, uInt8Array) == 17) { // 11 hex (needs to be 1)
		console.warn('Processing audio conversion');
      		// PF it's most likely ADPCM - lets hack the header and correct the buffer
		abc = readADPCM(uInt8Array);
	}
        if (abc) { // new
	  audioContext.decodeAudioData(abc, function(buffer) {
          cb(buffer);
          }, function(err) {
          console.warn('Failed to convert audio');
          cb(null);
          });
	} else { // old
	  audioContext.decodeAudioData(ab, function(buffer) {
          cb(buffer);
          }, function(err) {
          console.warn('Failed to load audio');
          cb(null);
          });
	}
    } else {
      setTimeout(cb);
    }
  };

// helper function
function readBytes(start, length, uInt8Array) {
	var returnval = 0;
	for (var j = 0; j < length; j++) {
		returnval += uInt8Array[start + j] << (8 * j);
	}
	return returnval;
}

function readADPCM(uInt8Array) {

	var blockAlign = readBytes(32, 2, uInt8Array);
	var samplesPerBlock = (blockAlign - 4);
	var sampleRate = readBytes(24, 4, uInt8Array);

	var offset = (readBytes(20, 2, uInt8Array) != 1) ? 38 + readBytes(36, 2, uInt8Array) : 36;
	offset += 8 + readBytes(offset + 4, 4, uInt8Array);

	var soundBytes = readBytes(offset + 4, 4, uInt8Array);
	var nBlocks = soundBytes / blockAlign;
	offset += 8;

	var resultStepChange = [-1, -1, -1, -1, 2, 4, 6, 8, -1, -1, -1, -1, 2, 4, 6, 8];
	var stepSizes = [7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88, 97, 107, 118, 130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767];

	var stepID = 8;
	var step = 16;
	var volume = 0;
	var sdi = 0;
	var in_s;
	var s = 0;
	var byte;
	var nib;
	var diff;

	var length = (samplesPerBlock * 4 + 2) * nBlocks;
	var soundBuf = new ArrayBuffer(length + 32);
	var soundData = new Uint8Array(soundBuf, 32, length);

	for (var b = 0; b < nBlocks; b++)
	{
		in_s = s;

		volume = readBytes(s + offset, 2, uInt8Array)
		if (volume > 32767) volume = (volume - 65536);
		stepID = Math.max(0, Math.min(readBytes(s + offset + 2, 1, uInt8Array), 88));
		s += 4;

		var sample = Math.round(volume);
		if (sample < 0) sample += 65536; // 2's complement signed

		soundData[sdi++] = sample % 256;
		soundData[sdi++] = Math.floor(sample / 256);

		for (var as = 0; as < samplesPerBlock; as++)
		{
			byte = uInt8Array[s + offset].toString(2);
			while (byte.length < 8) {
				byte = "0" + byte;
			}

			for (var nibble = 0; nibble < 2; nibble++)
			{
				nib = parseInt(byte.substr(nibble*4, 4), 2);
				nib &= 15;
				step = stepSizes[stepID];
				diff = step >> 3;
				if (nib & 1) diff += step >> 2;
				if (nib & 2) diff += step >> 1;
				if (nib & 4) diff += step;
				if (nib & 8) diff = 0 - diff;
				volume = Math.max(Math.min(32767, volume + diff), -32768)
				var sample = Math.round(volume);
				if (sample < 0) sample += 65536; // 2's complement signed
				soundData[sdi++] = sample % 256;
				soundData[sdi++] = Math.floor(sample / 256);
				stepID = Math.max(0, Math.min(stepID + resultStepChange[nib], 88));
			}
			s += 1;
		}
		s = in_s + blockAlign;
	}

	return encodeAudio16bit(soundData, sampleRate, soundBuf);
}

function encodeAudio16bit(soundData, sampleRate, soundBuf) {

	// 16-bit mono WAVE header template
	var header = "RIFF<##>WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00<##><##>\x02\x00\x10\x00data<##>";

	// Helper to insert a 32-bit little endian int.
	function insertLong(value) {
		var bytes = "";
		for (var i = 0; i < 4; ++i) {
			bytes += String.fromCharCode(value % 256);
			value = Math.floor(value / 256);
		}
		header = header.replace('<##>', bytes);
	}

	var n = soundData.length / 2; // as buffer
	insertLong(36 + n * 2); // ChunkSize
	insertLong(sampleRate); // SampleRate
	insertLong(sampleRate * 2); // ByteRate
	insertLong(n * 2); // Subchunk2Size

	// Output sound data
	var bytes = new Uint8Array(soundBuf, 0, 40); // 32
	for (var i = 0; i < header.length; i++)
	{
  		bytes[i] = header.charCodeAt(i)	;
	}
	//console.log(new Uint8Array(soundBuf)); // debug only
	return soundBuf.slice(0);      
}

// PF end of New audio stuff ***

  IO.loadBase = function(data) {
    data.scripts = data.scripts || [];
    data.costumes = IO.loadArray(data.costumes, IO.loadCostume);
    data.sounds = IO.loadArray(data.sounds, IO.loadSound);
    data.variables = data.variables || [];
    data.lists = data.lists || [];
    //pf temp (dirty) hack for ASCII hack lists...
    if (data && data.lists && data.lists.length) {
        for (var ha = data.lists.length; ha--;)
	{
	    if (data.lists[ha].listName == "ASCII" && data.lists[ha].contents.length != 133) { // 2nd part ugh (skips GB ROM) !!!
	        ASCII = true;
		console.log("ASCII hack detected.");
	    }
	}
    } 
  };

  IO.loadArray = function(data, process) {
    if (!data) return [];
    for (var i = 0; i < data.length; i++) {
      process(data[i]);
    }
    return data;
  };

  IO.loadObject = function(data) {
    if (!data.cmd && !data.listName) {
      IO.loadBase(data);    
    }
  };

  IO.loadCostume = function(data) {
    IO.loadMD5(data.baseLayerMD5, data.baseLayerID, function(asset) {
      data.$image = asset;
    });
    if (data.textLayerMD5) {
      IO.loadMD5(data.textLayerMD5, data.textLayerID, function(asset) {
        data.$text = asset;
      });
    }
  };

  IO.loadSound = function(data) {
    IO.loadMD5(data.md5, data.soundID, function(asset) {
      data.$buffer = asset;
    }, true);
  };
	
  IO.fixSVG = function(svg, element) {
    if (element.nodeType !== 1) return
    if (element.nodeName === 'text') {
      var font = element.getAttribute('font-family') || '';
      font = IO.FONTS[font] || font;
      if (font) {
        element.setAttribute('font-family', font);
        if (font === 'Helvetica') element.style.fontWeight = 'bold';
      }	    
      var size = element.getAttribute('font-size'); // +
      if (!size) {
        element.setAttribute('font-size', size = 22); // 18 || 22 FIX TODO! - if font-size > 22 in bind then use 18 (hack?)
      }
      if(element.getAttribute('fill') === 'none') { // THANKS Sulfurous
        element.setAttribute('fill', '#7F7F7F');
      }
      var bb = element.getBBox();
      //var x = 4 - .6 * element.transform.baseVal.consolidate().matrix.a;
      //var y = (element.getAttribute('y') - bb.y) * 1.1;	    
      var x = (element.transform.baseVal.consolidate().matrix.a); // 4 - (0.44 *  
      var y = (element.getAttribute('y') - bb.y); // pf svg text 1.044 1.026  
      element.setAttribute('x', x);
      element.setAttribute('y', y);
      var lines = element.textContent.split('\n');
      if (lines.length > 1) {
        element.textContent = lines[0];
        var lineHeight = IO.LINE_HEIGHTS[font] || 1;
        for (var i = 1, l = lines.length; i < l; i++) {
          var tspan = document.createElementNS(null, 'tspan');
          tspan.textContent = lines[i];
          tspan.setAttribute('x', x);
          tspan.setAttribute('y', y + size * i * lineHeight);
          element.appendChild(tspan);
        }
      }
      // svg.style.cssText = '';
      // console.log(element.textContent, 'data:image/svg+xml;base64,' + btoa(svg.outerHTML));
    } else if ((element.hasAttribute('x') || element.hasAttribute('y')) && element.hasAttribute('transform')) {
      element.setAttribute('x', 0);
      element.setAttribute('y', 0);
    }
    [].forEach.call(element.childNodes, IO.fixSVG.bind(null, svg));
  };

  IO.loadMD5 = function(md5, id, callback, isAudio) {
    if (IO.zip) {
      var f = isAudio ? IO.zip.file(id + '.wav') : IO.zip.file(id + '.gif') || IO.zip.file(id + '.png') || IO.zip.file(id + '.jpg') || IO.zip.file(id + '.svg');
      md5 = (f) ? f.name : ""; // pf f
    }
    var ext = md5.split('.').pop();
    if (ext === 'svg') {
      var cb = function(source) {
        var div = document.createElement('div');
        div.innerHTML = source;
        var svg = div.getElementsByTagName('svg')[0];
	if (!svg) return
        svg.style.visibility = 'hidden';
        svg.style.position = 'absolute';
        svg.style.left = '-10000px';
        svg.style.top = '-10000px';

        document.body.appendChild(svg);
        var viewBox = svg.viewBox.baseVal;
        if (viewBox && (viewBox.x || viewBox.y)) {
          // SF
          if (svg.querySelector("path") || svg.querySelector("image")) { // PF fix - ignore text only svg's
	    var bb = svg.getBBox();
            viewBox.width  = svg.width.baseVal.value = Math.ceil(bb.x + bb.width + 1);
            viewBox.height = svg.height.baseVal.value = Math.ceil(bb.y + bb.height + 1);
            viewBox.x = 0;
            viewBox.y = 0;
	  }
	}
	// pf old way - 4 lines below
        IO.fixSVG(svg, svg);
        while (div.firstChild) div.removeChild(div.lastChild);
        div.appendChild(svg);
        svg.style.visibility = 'visible';
	// PF FIX - stop black box image appearing on slower pc's whilst loading project
        svg.style.position = 'absolute';
        svg.style.left = '-10000px';
        svg.style.top = '-10000px';

        var canvas = document.createElement('canvas'); // pf old way
	//var ctxA = canvas.getContext('2d');
	//ctxA.imageSmoothingEnabled = false; // PF
     
        var image = new Image;
        callback(image);
        // svg.style.cssText = '';
        // console.log(md5, 'data:image/svg+xml;base64,' + btoa(div.innerHTML.trim()));
	
        canvg(canvas, div.innerHTML.trim(), {
          ignoreMouse: true,
          ignoreAnimation: true,
          ignoreClear: true,
          renderCallback: function() {
	    //console.log(canvas.toDataURL()); // debug only
	    //image.style.imageRendering = 'crisp-edges'; // 'pixelated'; //
	    // TODO: resize image to rid of transparent wasted space!!!
            image.src = canvas.toDataURL();
          }
        });
      };
      if (IO.zip) {
        cb(f.asText());
      } else {
        IO.projectRequest.add(IO.load(IO.ASSET_URL + md5 + '/get/', cb));
      }
    } else if (ext === 'wav') {
      var request = new Request;
      var cb = function(ab) {
        IO.decodeAudio(ab, function(buffer) {
          callback(buffer);
          request.load(buffer);
        });
      }
      IO.projectRequest.add(request);
      if (IO.zip) {
        var audio = new Audio;
        var ab = f.asArrayBuffer();
        cb(ab);
      } else {
        IO.projectRequest.add(IO.load(IO.ASSET_URL + md5 + '/get/', cb, null, 'arraybuffer'));
      }
    } else {
      if (IO.zip) {
        var request = new Request;
        var image = new Image;
        image.onload = function() {
          if (callback) callback(image);
          request.load();
        };
        if (f) image.src = 'data:image/' + (ext === 'jpg' ? 'jpeg' : ext) + ';base64,' + btoa(f.asBinary()); // pf f
        IO.projectRequest.add(request);
      } else {
        IO.projectRequest.add(
          IO.loadImage(IO.ASSET_URL + md5 + '/get/', function(result) {
            callback(result);
          }));
      }
    }
  };

  var Cloud = function(stage) {
    this.stage = stage;
    this.autostart = false;
    this.connected = false;
    this.variables = Object.create(null);
    // TODO: replace with webrtc datachannels
    if (typeof DataChannel == "undefined") return
    this.channel = new DataChannel(stage.id); // Session Unique Identifier
    this.channel.onmessage = function(msg) {
      console.log("orig = " + msg);
      var msgdata = msg.replace('"key":','"data":{').replace(',"value":',':"').replace('}','"}}').replace('""','"').replace('""','"'); // PF correct msg format... hack!
      console.log("data = " + msgdata);
      var data = JSON.parse(msgdata); // .data
      switch (data.$) {
        case 'name':
          stage.username = data.name;
          this.connected = true;
          if (this.autostart) {
            stage.start();
            this.autostate = false;
          }
          break;
        case 'update':
          for (var key in data.data) { // .data
            if (!(key in this.variables)) this.watchVariable(key);
            this.variables[key] = data.data[key]; // data.
          }
          break;
      }
    }.bind(this);
  };
  Cloud.prototype.watchVariable = function(name, value) {
    this.variables[name] = value;
    Object.defineProperty(this.stage.vars, name, {
      get: function() { return this.variables[name]; }.bind(this),
      set: function(value) { this.setVariable(name, value); }.bind(this)
    });
  };
  Cloud.prototype.setVariable = function(name, value) {
    if (this.variables[name] === value) return;
    this.variables[name] = value;
    if (this.channel) {
      this.channel.send(JSON.stringify({
        $: 'update',
        key: name,
        value: value
      }));
    }
  };

  var Base = function() {
    this.isClone = false;
    this.costumes = [];
    this.currentCostumeIndex = 0;
    this.objName = '';
    this.instrument = 0;
    this.volume = 1;

    this.soundRefs = Object.create(null);
    this.sounds = [];

    this.vars = Object.create(null);
    this.watchers = Object.create(null);
    this.lists = Object.create(null);
    this.listsInfo = Object.create(null);

    this.procedures = {};
    this.listeners = {
      whenClicked: [],
      whenCloned: [],
      whenGreenFlag: [],
      whenIReceive: {},
      whenKeyPressed: [],
      whenSceneStarts: [],
      whenSensorGreaterThan: []
    };
    //for (var i = 0; i < 256; i++) {
    //  this.listeners.whenKeyPressed.push([]);
    //}
    for (var i = 128; i--;) {this.listeners.whenKeyPressed.push([])}; // pf db x // DarDoro Fix
    this.fns = [];
    this.scripts = [];

    this.filters = {
      color: 0,
      fisheye: 0,
      whirl: 0,
      pixelate: 0,
      mosaic: 0,
      brightness: 0,
      ghost: 0
    };
  };

  Base.prototype.fromJSON = function(data) {
    this.objName = data.objName;
    this.scripts = data.scripts;
    this.currentCostumeIndex = data.currentCostumeIndex || 0;
    this.costumes = data.costumes.map(function(d, i) {
      return new Costume(d, i, this);
    }, this);
    this.addSounds(data.sounds);
    this.addLists(data.lists);
    this.addVariables(data.variables);

    return this;
  };

  Base.prototype.addSounds = function(sounds) {
    for (var i = 0; i < sounds.length; i++) {
      var s = new Sound(sounds[i]);
      this.sounds.push(s);
      this.soundRefs[s.name] = s;
    }
  };

  Base.prototype.addVariables = function(variables) {
    for (var i = 0; i < variables.length; i++) {
      this.vars[variables[i].name] = variables[i].value;
      if (variables[i].isPersistent) {
        console.log("Cloud Variable Detected");
        var cloud = this.stage.connectToCloud();
	try {
          cloud.watchVariable(variables[i].name, variables[i].value);
	} catch(e){} // pf cloud hack
      }
    }
  };

  // older
  //Base.prototype.addVariables_OLD = function(variables) {
  //  for (var i = 0; i < variables.length; i++) {
  //    if (variables[i].isPersistent) {
  //      throw new Error('Cloud variables are not supported');
  //    }
  //    this.vars[variables[i].name] = variables[i].value;
  //  }
  //};

  // updated
  Base.prototype.addLists = function(lists) {
    for (var i = 0; i < lists.length; i++) {
      if (lists[i].isPersistent) {
        //throw new Error('Cloud lists are not supported');
	console.log("Cloud List Detected - TODO!");
      }
      this.lists[lists[i].listName] = lists[i].contents;
      // TODO list watchers, PF lazy hack below :)
      this.listsInfo[lists[i].listName] = lists[i].x + "," + lists[i].y + "," + lists[i].width + "," + lists[i].height+ "," + lists[i].visible;
    }
  };

  Base.prototype.showVariable = function(name, visible) {
    var watcher = this.watchers[name];
    var stage = this.stage;
    if (!watcher) {
      watcher = this.watchers[name] = new P.Watcher(stage);
      watcher.x = stage.defaultWatcherX;
      watcher.y = stage.defaultWatcherY;
      stage.defaultWatcherY += 26;
      if (stage.defaultWatcherY >= 450) {
        stage.defaultWatcherY = 10;
        stage.defaultWatcherX += 150;
      }
      watcher.target = this;
      watcher.label = (watcher.target === stage ? '' : watcher.target.objName + ': ') + name;
      watcher.param = name;
      stage.children.push(watcher);
    } else {
      var i = stage.children.indexOf(watcher);
      if (i !== stage.children.length - 1) {
        stage.children.splice(i, 1);
        stage.children.push(watcher);
      }
    }
    watcher.visible = visible;
  };

  Base.prototype.showNextCostume = function() {
    this.currentCostumeIndex = (this.currentCostumeIndex + 1) % this.costumes.length;
    if (this.isStage) this.updateBackdrop();
    if (this.saying) this.updateBubble();
  };

  Base.prototype.showPreviousCostume = function() {
    var length = this.costumes.length;
    this.currentCostumeIndex = (this.currentCostumeIndex + length - 1) % length;
    if (this.isStage) this.updateBackdrop();
    if (this.saying) this.updateBubble();
  };

  Base.prototype.getCostumeName = function() {
    return this.costumes[this.currentCostumeIndex] ? this.costumes[this.currentCostumeIndex].costumeName : '';
  };

  Base.prototype.setCostume = function(costume) { // SULF way
    if (typeof costume == 'string') {
      for (var i = 0; i < this.costumes.length; i++) {
        if (this.costumes[i].costumeName === costume) {
          this.currentCostumeIndex = i;
          if (this.isStage) this.updateBackdrop();
          if (this.saying) this.updateBubble();
          return;
        }
      }
      if (costume === (this.isSprite ? 'next costume' : 'next backdrop')) {
        this.showNextCostume();
        return;
      }
      if (costume === (this.isSprite ? 'previous costume' : 'previous backdrop')) {
        this.showPreviousCostume();
        return;
      }
    }
    if (!isNaN(parseInt(costume))) {
      if (!Number.isInteger(costume)) {
        var r = costume-~~(costume); // todo -ve costumes!
	if (r > 0.4) costume += 0.5;
      }
      var i = (Math.floor(parseInt(costume)) - 1) % this.costumes.length;
      if (i < 0) i += this.costumes.length;
      this.currentCostumeIndex = i;
      if (this.isStage) this.updateBackdrop();
      if (this.saying) this.updateBubble();
    }
  };	
	
  Base.prototype.setCostumeOLD = function(costume) {
    if (typeof costume !== 'number') {
      costume = '' + costume;
      for (var i = 0; i < this.costumes.length; i++) {
        if (this.costumes[i].costumeName === costume) {
          this.currentCostumeIndex = i;
          if (this.isStage) this.updateBackdrop();
          if (this.saying) this.updateBubble();
          return;
        }
      }
      if (costume === (this.isSprite ? 'next costume' : 'next backdrop')) {
        this.showNextCostume();
        return;
      }
      if (costume === (this.isSprite ? 'previous costume' : 'previous backdrop')) {
        this.showPreviousCostume();
        return;
      }
    } else { // pf round up (fix costume rounding 173248374)
      if (costume > 0.4) costume += 0.5;
    }
    var i = (Math.floor(costume) - 1 || 0) % this.costumes.length;
    if (i < 0) {
	    i += (this.costumes.length + 1) % this.costumes.length; // pf fix +1
	    //console.log("### i = " + i);
    }
    if (!isNaN(costume)) this.currentCostumeIndex = i;
    if (this.isStage) this.updateBackdrop();
    if (this.saying) this.updateBubble();
  };

  Base.prototype.setFilter = function(name, value) {
    var min = 0;
    var max = 100;
    switch (name) {
      case 'whirl':
      case 'fisheye':
      case 'brightness': // v2 way
      case 'pixelate': // absolute value
      case 'mosaic': // absolute value
      case 'color': // v2 way
        min = -Infinity;
        max = Infinity;
        break;
      //case 'color':
      //  value = value % 200;
      //  if (value < 0) value += 200;
      //  max = 200;
      //  break;
    }
    if (value < min) value = min;
    if (value > max) value = max;
    this.filters[name] = value;
    if (this.isStage) this.updateFilters();
  };

  Base.prototype.changeFilter = function(name, value) {
    this.setFilter(name, this.filters[name] + value);
  };

  Base.prototype.resetFilters = function() {
    this.filters = {
      color: 0,
      fisheye: 0,
      whirl: 0,
      pixelate: 0,
      mosaic: 0,
      brightness: 0,
      ghost: 0
    };
  };

  Base.prototype.getSound = function(name) {
    if (typeof name === 'string') {
      var s = this.soundRefs[name];
      if (s) return s;
      name = +name;
    }
    var l = this.sounds.length;
    if (l && typeof name === 'number' && name === name) {
      var i = Math.round(name - 1) % l;
      if (i < 0) i += l;
      return this.sounds[i];
    }
  };

  Base.prototype.stopSounds = function() {
    if (this.node) {
      this.node.disconnect();
      this.node = null;
    }
    for (var i = this.sounds.length; i--;) {
      var s = this.sounds[i];
      if (s.node) {
        s.node.disconnect();
        s.node = null;
      }
    }
  };

  Base.prototype.ask = function(question) {
    var stage = this.stage;
    if (question) {
      if (this.isSprite && this.visible) {
        this.say(question);
        stage.promptTitle.style.display = 'none';
      } else {
        stage.promptTitle.style.display = 'block';
        stage.promptTitle.textContent = question;
      }
    } else {
      stage.promptTitle.style.display = 'none';
    }
    stage.hidePrompt = false;
    stage.prompter.style.display = 'block';
    stage.prompt.value = '';
    stage.prompt.focus();
  };

  Base.prototype.say = function(text, thinking) { // moved to base
    text = '' + text;
    if (!text) {
      this.saying = false;
      if (!this.bubble) return;
      this.bubble.style.display = 'none';
      return ++this.sayId;
    }
    this.saying = true;
    this.thinking = thinking;
    if (!this.bubble) {
      this.bubble = document.createElement('div');
      this.bubble.style.zIndex = '1'; // pf say over lists fix
      this.bubble.style.maxWidth = ''+(127/14)+'em';
      this.bubble.style.minWidth = ''+(48/14)+'em';
      this.bubble.style.padding = ''+(8/14)+'em '+(10/14)+'em';
      this.bubble.style.border = ''+(3/14)+'em solid rgb(160, 160, 160)';
      this.bubble.style.borderRadius = ''+(10/14)+'em';
      this.bubble.style.background = '#fff';
      this.bubble.style.position = 'absolute';
      this.bubble.style.font = 'bold 14em sans-serif';
      this.bubble.style.whiteSpace = 'pre-wrap';
      this.bubble.style.wordWrap = 'break-word';
      this.bubble.style.textAlign = 'center';
      this.bubble.style.cursor = 'default';
      this.bubble.appendChild(this.bubbleText = document.createTextNode(''));
      this.bubble.appendChild(this.bubblePointer = document.createElement('div'));
      this.bubblePointer.style.position = 'absolute';
      this.bubblePointer.style.height = ''+(21/14)+'em';
      this.bubblePointer.style.width = ''+(44/14)+'em';
      this.bubblePointer.style.background = 'url(icons.svg) '+(-195/14)+'em '+(-4/14)+'em';
      this.bubblePointer.style.backgroundSize = ''+(320/14)+'em '+(96/14)+'em';
      this.stage.root.appendChild(this.bubble);
    } else { // tjvr
      this.stage.root.removeChild(this.bubble); 
      this.stage.root.appendChild(this.bubble);
    }
    this.bubblePointer.style.backgroundPositionX = ((thinking ? -259 : -195)/14)+'em';
    this.bubble.style.display = 'block';
    this.bubbleText.nodeValue = text;
    this.updateBubble();
    return ++this.sayId;
  };		
	
  var effectsCanvas = document.createElement('canvas');
  var effectsContext = effectsCanvas.getContext('2d');	
  effectsCanvas.style.display = "none"; // mobi3
	
  Base.prototype.effects = function(costume, isStage) { // note: SCALE = 2 for android phones / tablets (1 for Chrome desktop)

     if (costume && (this.filters.color !== 0 || this.filters.fisheye !== 0 || this.filters.whirl !== 0 || this.filters.pixelate !== 0 || this.filters.mosaic !== 0 || this.filters.brightness !== 0)) { // || this.filters.ghost !== 0) {

	//if (costume.image.width + costume.image.height < 1) return // PF nothing to do!
	// NOTE: issues with scaling here (ok if 1)     
	var ciw = (isStage) ? 480 * 1 : (costume.image.width < 1) ? 1 : costume.image.width; 
	var cih = (isStage) ? 360 * 1 : (costume.image.height < 1) ? 1 : costume.image.height; 
	     
	// Performance: if isStage then kill suttle effects... (for mobile) sorry :(
	var absVal = Math.abs(this.filters.color + this.filters.fisheye + this.filters.whirl + this.filters.pixelate + this.filters.mosaic + this.filters.brightness);
	if (P.hasTouchEvents && isStage) {
	  if (absVal%10) {
		return // TODO: oops! touchscreen PC's
	  }
	}

	// COLOR
        if (this.filters.color !== 0) {
	  //var colorVal = (this.filters.color * 2.55) & 0xff;
          var colorOld;
          var colorNew;	
	  effectsCanvas.width = ciw;
	  effectsCanvas.height = cih;		
	  effectsContext.drawImage(costume.image, 0, 0, ciw, cih);
	  var effect = effectsContext.getImageData(0, 0, ciw, cih);
          // PF: TODO improve
          for (var i = 0; i < effect.data.length; i += 4) {
	    // cheap 'n' nasty way... v1.1
	/*
	    if (effect.data[i + 0] + effect.data[i + 1] + effect.data[i + 2]) { // ignore black #000
              effect.data[i + 0] = (effect.data[i + 0] + colorVal) & 0xff;
              effect.data[i + 1] = (effect.data[i + 1] + colorVal) & 0xff;
              effect.data[i + 2] = (effect.data[i + 2] + colorVal) & 0xff;
              effect.data[i + 3] = effect.data[i + 3]; // alpha
	    } else {
              effect.data[i + 0] = (effect.data[i + 0] );
              effect.data[i + 1] = (effect.data[i + 1] );
              effect.data[i + 2] = (effect.data[i + 2] );
              effect.data[i + 3] = effect.data[i + 3]; // alpha
	    }
	*/
	    // (offical) sulfurous way... v2
	    var colorOld = rgbToHsv(effect.data[i + 0], effect.data[i + 1], effect.data[i + 2]);
	    var colorNew = hsvToRgb(colorOld.h + this.filters.color / 200, colorOld.s, colorOld.v);
	    effect.data[i + 0] = (colorNew.r) & 0xff;	// red
	    effect.data[i + 1] = (colorNew.g) & 0xff;	//green
	    effect.data[i + 2] = (colorNew.b) & 0xff;	//blue
	    //effect.data[i + 3] = effect.data[i + 3];	// alpha		  
	  }
	  effectsContext.putImageData(effect, 0, 0);	
        }

	// FISHEYE
        if (this.filters.fisheye !== 0) {
          var fisheyeVal = (this.filters.fisheye);

          var w = ciw;
          var h = cih;
          w = h = (w < h ) ? w : h; // must be a sqr
	  
          // performance fix sorry...
	  if (!isStage && w > 127) return
		
	  effectsCanvas.width = w;
	  effectsCanvas.height = h;		
	  effectsContext.drawImage(costume.image, 0, 0, w, h);

          var source = effectsContext.getImageData(0, 0, w, h); // orginal copy of costume
          var effect = effectsContext.getImageData(0, 0, w, h);
          var i, x, y, r, r2, t, nx, ny;
		
          for (i = 0; i < w * h * 4; i += 4) {
            x = (i / 4) % w;
            y = Math.floor((i / 4) / w);
            x -= w / 2; // center of image
            y -= h / 2;
            r2 = Math.sqrt(x * x + y * y);
            r = -r2 * Math.exp(-r2 / fisheyeVal) + r2;
            t = Math.atan2(y, x);
            nx = r * Math.cos(t);
            ny = r * Math.sin(t);
            nx = ~~(nx + w / 2);
            ny = ~~(ny + h / 2);
            effect.data[i + 0] = source.data[(ny * h * 4 + nx * 4) + 0];
            effect.data[i + 1] = source.data[(ny * h * 4 + nx * 4) + 1];
            effect.data[i + 2] = source.data[(ny * h * 4 + nx * 4) + 2];
            effect.data[i + 3] = source.data[(ny * h * 4 + nx * 4) + 3]; // alpha 255?
          }
          effectsContext.putImageData(effect, 0, 0);
	}

	// WHIRL
        if (this.filters.whirl !== 0) {
          var whirlVal = (this.filters.whirl / 255);

          var w = ciw;
          var h = cih;

          var centerX = Math.floor(w / 2);
          var centerY = Math.floor(h / 2);

          var size = w < h ? w : h;
          var radius = Math.floor(size / 2); // pft 

	  effectsCanvas.width = w;
	  effectsCanvas.height = h;		
	  effectsContext.drawImage(costume.image, 0, 0, w, h);

          var source = effectsContext.getImageData(0, 0, w, h); // orginal copy of costume
          var effect = effectsContext.getImageData(0, 0, w, h); 

          var radiusSquared = radius * radius;
          var r, alpha, sourcePosition, destPosition, newX, newY, degrees;

          for (y = -radius; y < radius; ++y) {
            for (x = -radius; x < radius; ++x) {
              if (x * x + y * y <= radius * radius) { 
                r = Math.sqrt(x * x + y * y);
                alpha = Math.atan2(y, x);
                destPosition = (y + centerY) * w + x + centerX;
                destPosition *= 4;
                degrees = (alpha * 180.0) / Math.PI;
                degrees += r * 10 * whirlVal;
                alpha = (degrees * Math.PI) / 180.0;
                newY = Math.floor(r * Math.sin(alpha));
                newX = Math.floor(r * Math.cos(alpha));
                sourcePosition = (newY + centerY) * w + newX + centerX;
                sourcePosition *= 4;
                effect.data[destPosition + 0] = source.data[sourcePosition + 0];
                effect.data[destPosition + 1] = source.data[sourcePosition + 1];
                effect.data[destPosition + 2] = source.data[sourcePosition + 2];
                effect.data[destPosition + 3] = source.data[sourcePosition + 3];
	      }
            }
          }
          effectsContext.putImageData(effect, 0, 0);
        }
	      
        // PIXELATE     
        if (this.filters.pixelate !== 0) {
          effectsCanvas.width = 16 * ciw / (this.filters.pixelate + ciw / 16);
          effectsCanvas.height = 16 * cih / (this.filters.pixelate + cih / 16);
    	  effectsContext.imageSmoothingEnabled = false;
          effectsContext.drawImage(costume.image, 0, 0, effectsCanvas.width, effectsCanvas.height);
        }
	 
        // MOSAIC   
        if (this.filters.mosaic !== 0) {
	  var mosaicVal = ~~ ( (Math.abs(this.filters.mosaic) + 5) / 10) + 1;
	  effectsCanvas.width = ciw;
	  effectsCanvas.height = cih;
          for (var o = 0; o < mosaicVal; o++) {
            for (var i = 0; i < mosaicVal; i++) { 
              effectsContext.drawImage(costume.image, o * ciw / mosaicVal, i * cih / mosaicVal, ciw / mosaicVal, cih / mosaicVal); // or effectsContext.createPattern
            }
	  }
        }

        // BRIGHTNESS	    
        if (this.filters.brightness !== 0 && Math.abs(this.filters.brightness) < 200) {
	  var brightnessVal = ~~ (this.filters.brightness %100.1) * 2.555;
	  effectsCanvas.width = ciw;
	  effectsCanvas.height = cih;		
	  //if (P.hasTouchEvents) {
	    //effectsContext.drawImage(costume.image, 0, 0, ciw, cih, 0, 0, ciw, cih); // fix android mobile (not needed if using SCALE)
	  //} else {
	    effectsContext.drawImage(costume.image, 0, 0, ciw, cih); // desktop
	  //}
	  var effect = effectsContext.getImageData(0, 0, ciw, cih);
	  for (var i = 0; i < effect.data.length; i += 4) {
                effect.data[i + 0] = ((effect.data[i + 0] + brightnessVal) << 0x00f) >> 0x00f;
                effect.data[i + 1] = ((effect.data[i + 1] + brightnessVal) << 0x00f) >> 0x00f;
                effect.data[i + 2] = ((effect.data[i + 2] + brightnessVal) << 0x00f) >> 0x00f;
                //effect.data[i + 3] = effect.data[i + 3]; // alpha
	  }
	  effectsContext.putImageData(effect, 0, 0);  
        }

     }
  };	     
	  
  var Stage = function(id) {
    that = this; // PF global!
    this.stage = this;

    Stage.parent.call(this);

    // update
    this.id = id;
    this.username = (LAKITU) ? '' + ["Mario","Zelda","Luigi","Scratch","Player","Bert","WiiU","Link","Acer","Peach"][parseInt(Math.random(10)*10)]+parseInt(Math.random(10)*10) + '' : '';
    this.cloud = null;
	  
    this.children = [];
    this.defaultWatcherX = 10;
    this.defaultWatcherY = 10;

    this.info = {};
    this.answer = '';
    this.promptId = 0;
    this.nextPromptId = 0;
    this.tempoBPM = 60;
    this.videoAlpha = 1;
    this.zoom = 1;
    this.maxZoom = SCALE;
    this.baseNow = 0;
    this.baseTime = 0;
    this.timerStart = 0;
    this.cloneCount = 0;

    this.keys = []; // pf fix was {};
    this.keys.any = 0; // pf fix enkee
    this.rawMouseX = 0;
    this.rawMouseY = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.mousePressed = false;

    this.root = document.createElement('div');
    this.root.style.position = 'absolute';
    this.root.style.overflow = 'hidden';
    this.root.style.width = '480px';
    this.root.style.height = '360px';
    this.root.style.fontSize = '1px';
    this.root.style.background = 'transparent'; // pf fix issue 17 (or transparent?)
    this.root.style.WebkitUserSelect =
    this.root.style.MozUserSelect =
    this.root.style.MSUserSelect =
    this.root.style.WebkitUserSelect = 'none';

    this.backdropCanvas = document.createElement('canvas');
    this.root.appendChild(this.backdropCanvas);
    this.backdropCanvas.width = SCALE * 480;
    this.backdropCanvas.height = SCALE * 360;
    this.backdropContext = this.backdropCanvas.getContext('2d');
	  
    this.penCanvas = document.createElement('canvas');
    this.root.appendChild(this.penCanvas);
    this.penCanvas.width = SCALE * 480;
    this.penCanvas.height = SCALE * 360;
    this.penContext = this.penCanvas.getContext('2d');

    this.penContext.lineCap = 'round';
    this.penContext.scale(SCALE, SCALE);

    this.canvas = document.createElement('canvas');
    this.root.appendChild(this.canvas);
    this.canvas.width = SCALE * 480;
    this.canvas.height = SCALE * 360;
    this.context = this.canvas.getContext('2d');

    this.context.imageSmoothingEnabled = false; // PF
    this.context.msImageSmoothingEnabled = false;

    this.canvas.tabIndex = 0;
    this.canvas.style.outline = 'none';
    this.backdropCanvas.style.position =
    this.penCanvas.style.position =
    this.canvas.style.position = 'absolute';
    this.backdropCanvas.style.width =
    this.penCanvas.style.width =
    this.canvas.style.width = '480px';
    this.backdropCanvas.style.height =
    this.penCanvas.style.height =
    this.canvas.style.height = '360px';

    // hardware acceleration
    this.root.style.WebkitTransform = 'translateZ(0)';

      // added old way here and split...
	  
      this.root.addEventListener('keypress', function(e) { // pf shift symbols helper.
       if (ASCII) {
	 
           if (e.altKey || e.metaKey || e.keyCode === 27) { // tjvr
             //return; // PF allow e.ctrlKey || allow e.shiftkey
           }
           var key = e.keyCode;

           //console.log(this.keys[key]); // debug only
           if (e.target === this.canvas && !this.keys[key]) {

	     ShiftKey = false;
	     if (key > 64 && key < 91) {
	       ShiftKey = true;	 
	     }		   
		   
	     this.keys[key] = true; // mandatory for symbols
	     self.key = key; // resets symbol keys
	     e.stopPropagation();
             e.preventDefault();
             //this.trigger('whenKeyPressed', key); // *
           }
	 
       } else {
	// TODO: as before (not needed)      
       }	       
    }.bind(this));

    this.root.addEventListener('keydown', function(e) { // pf inc. arrow keys and shift key mapper
      if (ASCII) {

          if (e.altKey || e.metaKey || e.keyCode === 27) { // tjvr
            return; // PF allow e.ctrlKey || 
          }
          var key = e.keyCode;
	  //console.log(key); // debug only
          e.stopPropagation();
          if (e.target === this.canvas && !this.keys[key] && "16.17.37.38.39.40".match(key.toString())) { // 
	    if (key == 16) key = 128; // (Shift key hack) was 0
	    //if (key == 17) key = 0;  
	    if (key == 37) key = 28;
	    if (key == 39) key = 29;
	    if (key == 38) key = 30;
	    if (key == 40) key = 31;
	    this.keys[key] = true; // pf done in keypress?
	    self.key = key;
            e.preventDefault();
	    if (ShiftKey) {
	      //console.log("Shift Pressed\n"); // debug only
              this.trigger('whenKeyPressed', 128);
	      //this.trigger('whenKeyPressed', key);
	    } else {
	      this.trigger('whenKeyPressed', key);	    
	    }
          }
	
      } else {
	var c = e.keyCode; // pf enkee fix
	if (!this.keys[c]) this.keys.any++; // pf enkee fix
        // TODO: as before    
        if (e.altKey || e.metaKey || e.keyCode === 27) { // tjvr
          return; // PF allow e.ctrlKey || 
        }
        //console.log(e.keyCode)+"\n";
        //this.keys[e.keyCode] = true;
	this.keys[c] = true; // pf enkee fix
        e.stopPropagation();
        if (e.target === this.canvas) {
          e.preventDefault();
          this.trigger('whenKeyPressed', e.keyCode);
        }	       
      }	       
    }.bind(this));	  
	  
    this.root.addEventListener('keyup', function(e) {
      if (ASCII) {
    
          var key = e.keyCode;
	  if (key == 16) key = 128; 
          //console.log(key); // db2
          this.keys[key] = false;
          if (key > 64 && key < 91) this.keys[key+32] = false; // was +32
          this.keys[self.key] = false;
          if (ShiftKey) {
	    //this.keys[128] = false;
	  } else {
	    //console.log (self.key + " :: " + key); // debug only
	  }
          e.stopPropagation();
          if (e.target === this.canvas) {
            e.preventDefault();
          }

      } else {
	var c = e.keyCode; // pf enkee fix
	if (this.keys[c]) this.keys.any--; // pf enkee fix	      
	// TODO: as before   
        //this.keys[e.keyCode] = false;
        this.keys[c] = false; // pf enkee fix
        e.stopPropagation();
        if (e.target === this.canvas) {
          e.preventDefault();
        }	       
      }
    }.bind(this));

    if (hasTouchEvents) {

      document.addEventListener('touchstart', function(e) {
	if (e.target === this.canvas) {
        this.mousePressed = true;
        for (var i = 0; i < e.changedTouches.length; i++) {
          this.updateMouse(e.changedTouches[i]);
          //if (e.target === this.canvas) {
            this.clickMouse();
          }
        }
        if (e.target === this.canvas) e.preventDefault(); // if done off canvas, we cannot scroll screen
      }.bind(this), {passive:false}); // pf pc

      document.addEventListener('touchmove', function(e) {
        if (e.target === this.canvas) {
	  this.updateMouse(e.changedTouches[0]);
	}
      }.bind(this), {passive:false}); // pf pc

      document.addEventListener('touchend', function(e) {
	if (e.target === this.canvas) {
          this.releaseMouse();
	}
      }.bind(this));

    } else {

      document.addEventListener('mousedown', function(e) {
        this.updateMouse(e);
        this.mousePressed = true;

        if (e.target === this.canvas) {
          this.clickMouse();
          e.preventDefault();
          this.canvas.focus();
        }
      }.bind(this));

      document.addEventListener('mousemove', function(e) {
        this.updateMouse(e);
      }.bind(this));

      document.addEventListener('mouseup', function(e) {
        this.updateMouse(e);
        this.releaseMouse();
      }.bind(this));
    }

    // PF joystick trigger
    document.addEventListener('gamepadConnected', function(e) {
        this.gamepads[0] = e
        console.log("Joystick Connected");
        if (hasTouchEvents) document.getElementById("touchscreen").style.display = "none";
        usingGamepad = true;
        checkGamepad(e);
	}.bind(this));
    
    document.addEventListener('gamepadDisconnected', function(e) {
        this.gamepads[0] = void 0
        console.log("Joystick Disconnected");
        if (hasTouchEvents) document.getElementById("touchscreen").style.display = "block";
        usingGamepad = false;
	}.bind(this));
    // PF end joystick trigger

    this.prompter = document.createElement('div');
    this.root.appendChild(this.prompter);
    this.prompter.style.zIndex = '1';
    this.prompter.style.position = 'absolute';
    this.prompter.style.left =
    this.prompter.style.right = '14em';
    this.prompter.style.bottom = '6em';
    this.prompter.style.padding = '5em 30em 5em 5em';
    this.prompter.style.border = '3em solid rgb(46, 174, 223)';
    this.prompter.style.borderRadius = '8em';
    this.prompter.style.background = '#fff';
    this.prompter.style.display = 'none';

    this.promptTitle = document.createElement('div');
    this.prompter.appendChild(this.promptTitle);
    this.promptTitle.textContent = '';
    this.promptTitle.style.cursor = 'default';
    this.promptTitle.style.font = 'bold 13em sans-serif';
    this.promptTitle.style.margin = '0 '+(-25/13)+'em '+(5/13)+'em 0';
    this.promptTitle.style.whiteSpace = 'pre';
    this.promptTitle.style.overflow = 'hidden';
    this.promptTitle.style.textOverflow = 'ellipsis';

    this.prompt = document.createElement('input');
    this.prompter.appendChild(this.prompt);
    this.prompt.style.border = '0';
    this.prompt.style.background = '#eee';
    this.prompt.style.MozBoxSizing =
    this.prompt.style.boxSizing = 'border-box';
    this.prompt.style.font = '13em sans-serif';
    this.prompt.style.padding = '0 '+(3/13)+'em';
    this.prompt.style.outline = '0';
    this.prompt.style.margin = '0';
    this.prompt.style.width = '100%';
    this.prompt.style.height = ''+(20/13)+'em';
    this.prompt.style.display = 'block';
    this.prompt.style.WebkitBorderRadius =
    this.prompt.style.borderRadius = '0';
    this.prompt.style.WebkitBoxShadow =
    this.prompt.style.boxShadow = 'inset '+(1/13)+'em '+(1/13)+'em '+(2/13)+'em rgba(0, 0, 0, .2), inset '+(-1/13)+'em '+(-1/13)+'em '+(1/13)+'em rgba(255, 255, 255, .2)';
    this.prompt.style.WebkitAppearance = 'none';

    this.promptButton = document.createElement('div');
    this.prompter.appendChild(this.promptButton);
    this.promptButton.style.width = '22em';
    this.promptButton.style.height = '22em';
    this.promptButton.style.position = 'absolute';
    this.promptButton.style.right = '4em';
    this.promptButton.style.bottom = '4em';
    this.promptButton.style.background = 'url(icons.svg) -165em -37em';
    this.promptButton.style.backgroundSize = '320em 96em';

    this.prompt.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) {
        this.submitPrompt();
      }
    }.bind(this));

    this.promptButton.addEventListener(hasTouchEvents ? 'touchstart' : 'mousedown', this.submitPrompt.bind(this));

    this.initRuntime();
  };
  inherits(Stage, Base);

  Stage.prototype.isStage = true;

  Stage.prototype.initLists = function () {
    var show = false; // init show / hide of all stage and childrens lists
    var name = false;
    var o_list = this.lists;
    var o_listInfo = this.listsInfo; // may need to loop this?
  
    if (o_list && o_listInfo) {
      for (var key in o_listInfo) {
        var obj = o_listInfo[key];
	for (var prop in obj) {
	 // skip loop if the property is from prototype //console.log(prop + " = " + obj[prop]);
	  if (!obj.hasOwnProperty(prop)) {
	    continue;
	  }
	  if (obj[prop].toString() == "t") {
	    console.log("List: " + key + " = true");
	    this.showList(key);
	    break;
	  }
	}
      }	     
    }
  	  
    var oc_list;
    var oc_listInfo;
    // loop around children
    for (var oc = 0; oc < this.children.length; oc++) {
      oc_listInfo = this.children[oc].listsInfo;
      if (oc_listInfo) {	     
	for (var key in o_listInfo) {
	  var obj = oc_listInfo[key];
	  for (var prop in obj) {
          // skip loop if the property is from prototype //console.log(prop + " = " + obj[prop]);
	    if (!obj.hasOwnProperty(prop)) {
	      continue;
	    }
	    if (obj[prop].toString() == "t") {
	      console.log("List: " + key + " = true");
	      this.showList(key);
	      break;
	    }
	  }
	}
      }
    }
  };
  
  Stage.prototype.updateList = function (name) {
    // this function is a potential performance killer, so only invoke if 'name' list is showing...
    if (document.getElementById(name)) {
      var show = false; // init show / hide of all stage and childrens lists
      //var name = false;
      var o_list = this.lists;
      var o_listInfo = this.listsInfo; // may need to loop this?
  
      if (o_list && o_listInfo) {
        for (var key in o_listInfo) {
          var obj = o_listInfo[key];
	  for (var prop in obj) {
	   // skip loop if the property is from prototype //console.log(prop + " = " + obj[prop]);
	    if (!obj.hasOwnProperty(prop)) {
	      continue;
	    }
	    if (obj[prop].toString() == "t") {
	      console.log("List: " + key + " = true");
	      if (key == name) {
	        this.showList(key);
	        break;	      
              }
            }
          }
        }	     
      }
    }
  };

  // pf new way - works with scaling via em's (was px)
  Stage.prototype.showList = function(name) {
    console.log("Show List:" + name + " isTurbo:" + this.isTurbo); // if turbo mode then only draw list every 4 ticks?

    var o_div_test = document.getElementById(name);
    if (this.isTurbo && o_div_test && (Date.now()%1024) <= 1000) return; //console.log("### RENDER ###");

    if (o_div_test) {
      console.log("List already rendered. DOM");
      this.stage.root.removeChild(o_div_test);
    }
	
    var o_list = (this.lists[name]) ? this.lists[name] : this.lists[name];
    var o_listInfo = (this.listsInfo[name]) ? this.listsInfo[name] : this.listsInfo[name];	  
    if (o_list && o_listInfo) {
      for (var ol = 0; ol < o_list.length; ol++) {
        console.log((ol+1) + " : " + o_list[ol]+"\n");
      }
      console.log(o_listInfo+"\n");
    } else {
      for (var oc = 0; oc < this.children.length; oc++) {
        if (this.children[oc].lists && this.children[oc].lists[name]) { // pf ###
          o_list = this.children[oc].lists[name];
	  o_listInfo = this.children[oc].listsInfo[name];
          break;
	}
      }
      if (o_list) {
        for (var ol = 0; ol < o_list.length; ol++) {
          console.log((ol+1) + " :: " + o_list[ol]+"\n");
        }
	console.log(o_listInfo+"\n");
      } 
    }
	  
    if (o_list && o_listInfo) {
	// display list using divs. Thanks to Dogtopius for the CSS colours!
	var info = o_listInfo.split(",");    
	var show = !!(o_listInfo.match("true"));
	var divContainer = document.createElement('div');
	var overflow = (2 + parseInt(info[0], 10) + parseInt(info[2], 10)) - 480; // border + left + width needs to be - 480px
	divContainer.id = name;
	divContainer.style.border = "solid #949191 2em"; // 
	divContainer.style.margin = "5em";
	divContainer.style.padding = "0";
	divContainer.style.borderRadius = "7em";
        divContainer.style.backgroundColor = "#c1c4c7";
	divContainer.style.position = 'absolute';
	divContainer.style.overflow = 'hidden';
	divContainer.style.left = (info[0] - 7) + 'em'; // border + margin
	divContainer.style.top = (info[1] - 7) + 'em'; // border + margin 
	if (overflow > 0) { // disable?
		divContainer.style.width = (info[2] - overflow) + 'em'; // if left + width > 480 then adjust to be < 480	    
	} else {
		divContainer.style.width = info[2] + 'em';
	}
	if (o_list.length) divContainer.style.height = info[3] + 'em';
	divContainer.innerHTML = "<div style='margin: 2em'><span style='font-size: 12em; text-align: center; font-weight: bold;'><center>" + name + "</center></span></div>";
	    
	var divHolder = this.stage.root.appendChild(divContainer); // or this.stage.canvas.parentNode;
	var divInner = document.createElement('div');
	divInner.style.position = 'relative';
	divInner.style.overflow = 'auto';
	divInner.style.height = '86%'; // as before (magic number!)

	var divItem;
	var replaced;
	
	for (var i = 0; i < o_list.length; i++) { // test
	  divItem = document.createElement('div');
	  divItem.style.backgroundColor = "#c1c4c7";
	  try {replaced = o_list[i].replace(/'/g, "&#39;");} catch(e) {replaced = o_list[i];} // pf fix replace
	  //if (typeof o_list[i] == "undefined") {replaced = o_list[i];} else {replaced = o_list[i].replace(/'/g, "&#39;");} // pf fix replace !worky
	  divItem.innerHTML = "<input readonly value=' " + (i + 1) + "' style='color: #000; border: 0; background-color: #c1c4c7; width: 10%; font-size: 11em; margin: 1px'/> <input readonly value='" + replaced + "' style='font-size: 12em; background-color: #cc5b22; color: white; width: 75%; height: 1em; border: 1px solid #fff; border-radius: 3px; padding: 3px; margin: 0px;' />"; // TODO: rid 75% width and calc instead!
	  divInner.appendChild(divItem);	
	}
	    
	var divItem2 = document.createElement('div');
	//divItem2.style.position = 'relative';
	if (o_list.length) {
	  if ( o_list.length > (parseInt(info[3],10) / 22) ) { // magic number! 'calc text px size as ~ number of elements'    
		console.log("Long List!"); 
		divInner.style.height = (parseInt(info[3],10) - 40) + "em"; // magic number! 'px gap to remove to stop clash'
	  }
	  divItem2.innerHTML = "<div style='font-size: 11em; text-align: center; bottom: 2px; position: absolute; width: 100%;'>" +  "length: " + o_list.length + "</div>";
	} else {
	  var hem = info[3] > 270 ? 93 : 89; // help! (more magic tomfoolery)
	  var pem = ( (info[3] / 100) * hem ) + 0; // qtest 
	  console.log("HEIGHT=" + info[3] + " pem=" + pem);
	  if (parseInt(info[1], 10) + parseInt(info[3], 10) < 360) { // !offscreen
	    divItem = document.createElement('div');
	    divItem.style.height = pem + 'em';
	    divItem.innerHTML = "<div style='padding-top: " + (pem / 2.4) + "em'><div style='font-size: 11em; text-align: center;'>(empty)</div></div>"; // 
	    divInner.appendChild(divItem);
	    divItem2.innerHTML = "<div style='font-size: 11em; text-align: center; bottom: 2px; position: absolute; width: 100%;'>length: 0</div>";
	  } else {
	    // old way...	
	    divItem2.innerHTML = "<div style='font-size: 11em; text-align: center;'><br><br>(empty)</div><div style='font-size: 11em; text-align: center; padding-bottom: 0.1em'><br><br>length: 0</div>"; 
	  }
	}
	divHolder.appendChild(divInner);
        divHolder.appendChild(divItem2);
    }
	if (this.saying) this.updateBubble();	  
  };
	
  Stage.prototype.hideList = function(name) {
     console.log("Hide List:" + name);
     var o_div = document.getElementById(name);
     if (o_div) this.stage.root.removeChild(o_div);
  };	
	
  
   Stage.prototype.fromJSON = function(data) {
    Stage.parent.prototype.fromJSON.call(this, data);

    data.children.forEach(function(d) {
      if (d.listName) return;
      this.children.push(new (d.cmd ? Watcher : Sprite)(this).fromJSON(d));
    }, this);

    this.children.forEach(function(child) {
      if (child.resolve) child.resolve();
    }, this);

    P.compile(this);

    return this;
  };

  Stage.prototype.focus = function() {
    if (this.promptId < this.nextPromptId) {
      this.prompt.focus();
    } else {
      this.canvas.focus();
    }
  };

  Stage.prototype.updateMouse = function(e) {
    var bb = this.canvas.getBoundingClientRect();
    var x = (e.clientX - bb.left) / this.zoom - 240;
    var y = 180 - (e.clientY - bb.top) / this.zoom;
    this.rawMouseX = x;
    this.rawMouseY = y;
    if (x < -240) x = -240;
    if (x > 240) x = 240;
    if (y < -180) y = -180;
    if (y > 180) y = 180;
    this.mouseX = x;
    this.mouseY = y;
  };

  Stage.prototype.updateBackdrop = function() {
    this.backdropCanvas.width = this.zoom * SCALE * 480;
    this.backdropCanvas.height = this.zoom * SCALE * 360;
    var costume = this.costumes[this.currentCostumeIndex];
    this.backdropContext.save();
    var s = this.zoom * SCALE * costume.scale;
    this.backdropContext.scale(s, s);
    if (costume.image.width && costume.image.height) { // pf fix 0 0
      this.backdropContext.drawImage(costume.image, 0, 0);
    }
    this.backdropContext.restore();
  };

  Stage.prototype.clearFilters = function() {
    this.backdropCanvas.style.opacity = Math.max(0, Math.min(1, 1 - this.filters.ghost / 100));
    var costume = this.costumes[this.currentCostumeIndex];
    this.backdropContext.drawImage(costume.image, 0, 0, 480 * SCALE , 360 * SCALE ); // reset      	  
  };	
	
  Stage.prototype.updateFilters = function() {
    this.backdropCanvas.style.opacity = Math.max(0, Math.min(1, 1 - this.filters.ghost / 100));
    // TOOO: add other effects... (warning will cause slowdown!)
    if ((this.filters.color !== 0 || this.filters.fisheye !== 0 || this.filters.whirl !== 0 || this.filters.pixelate !== 0 || this.filters.mosaic !== 0 || this.filters.brightness !== 0)) { // || this.filters.ghost !== 0) {	  
      var costume = this.costumes[this.currentCostumeIndex];
      this.effects(costume, true);    
      this.backdropContext.drawImage(effectsCanvas, 0, 0, 480 * SCALE , 360 * SCALE ); // was context       
    }	  
  };

  Stage.prototype.setZoom = function(zoom) {
    // zoom var affects overall canvas size - ie could bust outta frame!
    if (this.zoom === zoom) return;
    if (this.maxZoom < zoom * SCALE) {
      this.maxZoom = zoom * SCALE;
      var canvas = document.createElement('canvas');
      canvas.width = this.penCanvas.width;
      canvas.height = this.penCanvas.height;
      canvas.getContext('2d').drawImage(this.penCanvas, 0, 0);

      this.penCanvas.width = 480 * zoom * SCALE;
      this.penCanvas.height = 360 * zoom * SCALE;
      this.penContext.drawImage(canvas, 0, 0, 480 * zoom * SCALE, 360 * zoom * SCALE);
      this.penContext.scale(this.maxZoom, this.maxZoom);
      this.penContext.lineCap = 'round';
    }
    this.root.style.width =
    this.canvas.style.width =
    this.backdropCanvas.style.width =
    this.penCanvas.style.width = (480 * zoom | 0) + 'px';
    this.root.style.height =
    this.canvas.style.height =
    this.backdropCanvas.style.height =
    this.penCanvas.style.height = (360 * zoom | 0) + 'px';
    this.root.style.fontSize = zoom + 'px';
    this.zoom = zoom;
    this.updateBackdrop();
  };

  Stage.prototype.clickMouse = function() {
    this.mouseSprite = undefined;
    for (var i = this.children.length; i--;) {
      var c = this.children[i];
      if (c.isSprite && c.visible && c.filters.ghost < 100 && c.touching('_mouse_')) {
        if (c.isDraggable) {
          this.mouseSprite = c;
          c.mouseDown();
        } else {
          this.triggerFor(c, 'whenClicked');
        }
        return;
      }
    }
    this.triggerFor(this, 'whenClicked');
  };

  Stage.prototype.releaseMouse = function() {
    this.mousePressed = false;
    if (this.mouseSprite) {
      this.mouseSprite.mouseUp();
      this.mouseSprite = undefined;
    }
  };

  Stage.prototype.stopAllSounds = function() {
    for (var children = this.children, i = children.length; i--;) {
      if (children[i].isSprite) {
        children[i].stopSounds();
      }
    }
    this.stopSounds();
  };

  Stage.prototype.removeAllClones = function() {
    var i = this.children.length;
    while (i--) {
      if (this.children[i].isClone) {
        this.children[i].remove();
        this.children.splice(i, 1);
      }
    }
    this.cloneCount = 0;
  };

  Stage.prototype.getObject = function(name) {
    for (var i = 0; i < this.children.length; i++) {
      var c = this.children[i];
      if (c.objName === name && !c.isClone) {
        return c;
      }
    }
    if (name === '_stage_' || name === this.objName) {
      return this;
    }
  };

  Stage.prototype.getObjects = function(name) {
    var result = [];
    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].objName === name) {
        result.push(this.children[i]);
      }
    }
    return result;
  };

  Stage.prototype.draw = function() {
    var context = this.context;

    this.context.imageSmoothingEnabled = false; // PF
    this.context.msImageSmoothingEnabled = false;

    this.canvas.width = 480 * this.zoom * SCALE; // clear
    this.canvas.height = 360 * this.zoom * SCALE;

    context.scale(this.zoom * SCALE, this.zoom * SCALE);
    this.drawOn(context);

    if (this.hidePrompt) {
      this.hidePrompt = false;
      this.prompter.style.display = 'none';
      this.canvas.focus();
    }
  };

  Stage.prototype.drawOn = function(context, except) {
    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].visible && this.children[i] !== except) {
        this.children[i].draw(context);
      }
    }
  };

  Stage.prototype.drawAllOn = function(context, except) {
    var costume = this.costumes[this.currentCostumeIndex];
    context.save();

    context.scale(costume.scale, costume.scale);
    context.globalAlpha = Math.max(0, Math.min(1, 1 - this.filters.ghost / 100));
	  
    // TODO: add other effects (Warning will cause massive slowdown!)
    if ((this.filters.color !== 0 || this.filters.fisheye !== 0 || this.filters.whirl !== 0 || this.filters.pixelate !== 0 || this.filters.mosaic !== 0 || this.filters.brightness !== 0)) { // || this.filters.ghost !== 0) {	  
      var costume = this.costumes[this.currentCostumeIndex];
      this.effects(costume, true);    
      context.drawImage(effectsCanvas, 0, 0, 480 * SCALE, 360 * SCALE); // EFFECT was this.backdropContext  
    } else {		  
      context.drawImage(costume.image, 0, 0);
    }
    context.restore();

    context.save();
    context.scale(1 / this.maxZoom, 1 / this.maxZoom);
    context.drawImage(this.penCanvas, 0, 0);
    context.restore();

    this.drawOn(context, except);
  };

  Stage.prototype.moveTo = function() {};

  Stage.prototype.submitPrompt = function() {
    if (this.promptId < this.nextPromptId) {
      this.answer = this.prompt.value;
      this.promptId += 1;
      if (this.promptId >= this.nextPromptId) {
        this.hidePrompt = true;
      }
    }
  };

  // new
  Stage.prototype.connectToCloud = function() {
    if (LAKITU && this.id && !this.cloud) { // DISABLED
      this.cloud = new Cloud(this);
      // also show user cloud vars are being used in the project
      document.getElementsByClassName('username')[0].innerHTML = "??? ";
    }
    return this.cloud;
  };

  Stage.prototype.touchingColor = function(rgb) {
    // stage w & h don't change...
    var w = 480;
    var h = 360;
  
    collisionCanvas.width = (w < 1) ? 1 : w; // pf w < 1 ?
    collisionCanvas.height = (h < 1) ? 1 : h; // pf h < 1?

    // pf - fast match test (hack - watch out!)
    var bFast = ((w == h && h < 8)) ? true : false; // && (w + h > 2)
	  
    if (bFast) {
      collisionContext.translate(-(240), -(180)); // + -
      this.stage.drawOn(collisionContext, this);	    
    } else {
      collisionContext.save();
      collisionContext.translate(-(240), -(180)); // + -
      this.stage.drawAllOn(collisionContext, this);
      collisionContext.globalCompositeOperation = 'destination-in';
      this.draw(collisionContext, true);	  
      collisionContext.restore();
    }
	  
    var wt = (w < 1) ? 1 : w;
    var ht = (h < 1) ? 1 : h;
    var data = collisionContext.getImageData(0, 0, wt, ht).data;
  
    rgb = (rgb & 0xffffff);
    //var RGB = new hsvToRgb(data[0], data[1] ,data[2]); // pf test only

    // pf - fast match test
    if (!rgb && !data.join("").replace("000255","").length) return true;

    //if (rgb > 255) {
      var length = w * h * 4; // must be > 0
      for (var i = 0; i < length; i += 4) {
        if ((data[i] << 16 | data[i + 1] << 8 | data[i + 2]) === rgb && data[i + 3]) {
        //if (data[i] == RGB.r && data[i + 1] == RGB.g && data[i + 2] == RGB.b) { // pf test only
          return true;
        }
      }
    //} else {
	// pf - fast match test
    //  if (data.join("").match("25500"+rgb.toString()+"255")) return true;
    //}
  };	
	
  Stage.prototype.ColorTouchingColor = function(rgb1, rgb2) {
    // stage w & h don't change...
    var w = 480;
    var h = 360;
  
    collisionCanvas.width = (w < 1) ? 1 : w;
    collisionCanvas.height = (h < 1) ? 1 : h;
	   
    collisionContext.translate(-(240 + b.left), -(180 - b.top));
    this.stage.drawAllOn(collisionContext, this);
	  
    var wt = (w < 1) ? 1 : w;
    var ht = (h < 1) ? 1 : h;
    var data2 = collisionContext.getImageData(0, 0, wt, ht).data; // rgb2 'over'	   
	  
    collisionCanvas2.width = (w < 1) ? 1 :w;
    collisionCanvas2.height = (h < 1) ? 1 : h;
    collisionContext2.translate(-(240), -(180)); // + -
    this.draw(collisionContext2, true); // true ???

    var data1 = collisionContext2.getImageData(0, 0, wt, ht).data; // rgb1 'sprite'
    
    rgb1 = (rgb1 & 0xffffff);
    rgb2 = (rgb2 & 0xffffff);

    var length = w * h * 4; // must be > 0
    for (var i = 0; i < length; i += 4) {
      if ((data1[i] << 16 | data1[i + 1] << 8 | data1[i + 2]) === rgb1 && 255) { // ignore alfred
	if ((data2[i] << 16 | data2[i + 1] << 8 | data2[i + 2]) === rgb2 && 255) {
          return true;
	}
      }
    }	  
  };	

  Stage.prototype.setDirection = function(degrees) { // hacked block ?
    var d = degrees % 360;
    if (d > 180) d -= 360;
    if (d <= -180) d += 360;
    this.direction = d;
    if (this.saying) this.updateBubble();
  };

  Stage.prototype.forward = function(steps) { // hacked block ?
    var d = (90 - this.direction) * Math.PI / 180;
    this.moveTo(this.scratchX + steps * Math.cos(d), this.scratchY + steps * Math.sin(d));
  };
	
  // TODO: add others (like effects etc...) // NOW COVERED BY Base.
	
  var KEY_CODES = {
    'ctrl': 17,
    'space': 32,
    'left arrow': 37,
    'up arrow': 38,
    'right arrow': 39,
    'down arrow': 40,
    any: 'any'
  };

  var getKeyCode = function(keyName) {
    //if (keyName && keyName.length > 0) { // pf temp - old code but tested 
       if (ASCII) {
           //if (typeof keyName !== 'string') keyName = "" + keyName; // pf fix numbers (untested)
	   if (keyName && keyName.length > 0) {
	     if (ShiftKey) {
	       if( (keyName.charCodeAt(0) > 64) && (keyName.charCodeAt(0) < 90) ) return -1; //block uppercase sensing
	       return KEY_CODES[keyName.toLowerCase()] || keyName.toUpperCase().charCodeAt(0); // *
	     } else {
	       return KEY_CODES[keyName.toLowerCase()] || keyName.charCodeAt(0); // *      
	     }
	   } else {
	     return 128;
	   }

       } else {
          if (typeof keyName !== 'string') keyName = "" + keyName; // pf fix numbers
          if (keyName && keyName.length > 0) return KEY_CODES[keyName.toLowerCase()] || keyName.toUpperCase().charCodeAt(0);
       }
    //} // pf temp - old code but tested 
  };

  var Sprite = function(stage) {
    this.stage = stage;

    Sprite.parent.call(this);

    this.direction = 90;
    this.indexInLibrary = -1;
    this.isDraggable = false;
    this.isDragging = false;
    this.rotationStyle = 'normal';
    this.scale = 1;
    this.scratchX = 0;
    this.scratchY = 0;
    this.spriteInfo = {};
    this.visible = true;

    this.penHue = 240;
    this.penSaturation = 100;
    this.penLightness = 50;

    this.penSize = 1;
    this.isPenDown = false;
    this.isSprite = true;
    this.bubble = null;
    this.saying = false;
    this.thinking = false;
    this.sayId = 0;
  };
  inherits(Sprite, Base);
/*
  Base.prototype.addLists = function(lists) {
    for (var i = 0; i < lists.length; i++) {
      if (lists[i].isPersistent) {
        throw new Error('Cloud lists are not supported');
      }
      this.lists[lists[i].listName] = lists[i].contents;
      // TODO list watchers, PF lazy hack below :)
      this.listsInfo[lists[i].listName] = lists[i].x + "," + lists[i].y + "," + lists[i].width + "," + lists[i].height+ "," + lists[i].visible;
    }
  };
*/
  Sprite.prototype.fromJSON = function(data) {

    Sprite.parent.prototype.fromJSON.call(this, data);

    this.direction = data.direction;
    this.indexInLibrary = data.indexInLibrary;
    this.isDraggable = data.isDraggable;
    this.rotationStyle = data.rotationStyle;
    this.scale = data.scale;
    this.scratchX = data.scratchX;
    this.scratchY = data.scratchY;
    this.spriteInfo = data.spriteInfo;
    this.visible = data.visible;

    return this;
  };

  Sprite.prototype.clone = function() {
    var c = new Sprite(this.stage);

    c.isClone = true;
    c.costumes = this.costumes;
    c.currentCostumeIndex = this.currentCostumeIndex;
    c.objName = this.objName;
    c.soundRefs = this.soundRefs;
    c.sounds = this.sounds;

    var keys = Object.keys(this.vars);
    for (var i = keys.length; i--;) {
      var k = keys[i];
      c.vars[k] = this.vars[k];
    }

    var keys = Object.keys(this.lists);
    for (var i = keys.length; i--;) {
      var k = keys[i];
      c.lists[k] = this.lists[k].slice(0);
    }

    c.procedures = this.procedures;
    c.listeners = this.listeners;
    c.fns = this.fns;
    c.scripts = this.scripts;

    c.filters = { // pf fix this
      color: this.filters.color,
      fisheye: this.filters.fisheye,
      whirl: this.filters.whirl,
      pixelate: this.filters.pixelate,
      mosaic: this.filters.mosaic,
      brightness: this.filters.brightness,
      ghost: this.filters.ghost
    };

    c.direction = this.direction;
    c.instrument = this.instrument;
    c.indexInLibrary = this.indexInLibrary;
    c.isDraggable = this.isDraggable;
    c.rotationStyle = this.rotationStyle;
    c.scale = this.scale;
    c.volume = this.volume;
    c.scratchX = this.scratchX;
    c.scratchY = this.scratchY;
    c.visible = this.visible;
    c.penColor = this.penColor;
    c.penCSS = this.penCSS;
    c.penHue = this.penHue;
    c.penSaturation = this.penSaturation;
    c.penLightness = this.penLightness;
    c.penSize = this.penSize;
    c.isPenDown = this.isPenDown;

    return c;
  };

  Sprite.prototype.mouseDown = function() {
    this.dragStartX = this.scratchX;
    this.dragStartY = this.scratchY;
    this.dragOffsetX = this.scratchX - this.stage.mouseX;
    this.dragOffsetY = this.scratchY - this.stage.mouseY;
    this.isDragging = true;
  };

  Sprite.prototype.mouseUp = function() {
    if (this.isDragging && this.scratchX === this.dragStartX && this.scratchY === this.dragStartY) {
      this.stage.triggerFor(this, 'whenClicked');
    }
    this.isDragging = false;
  };

  Sprite.prototype.forward = function(steps) {
    var d = (90 - this.direction) * Math.PI / 180;
    this.moveTo(this.scratchX + steps * Math.cos(d), this.scratchY + steps * Math.sin(d));
  };

  var gwiDisable = true;// Disable for now	
  var gwix = 480 * 12; // adjusting these fixes projects that use moveTo in platformers for the blocks
  var gwiy = 360 * 4; // +
  Sprite.prototype.moveTo = function(x, y) {
    var ox = this.scratchX;
    var oy = this.scratchY;
    if (ox === x && oy === y && !this.isPenDown) return;
	  
    // new condition block below - fixes:133622642
    gwiDisable = (Math.abs(this.scratchX - x) > 480 && Math.abs(this.scratchY - y) > 360) ? true : false;
    if (gwiDisable||Math.abs(x) < gwix) {
      this.scratchX = x; // ### pft2 
    } else {
      if (gwix > 480) gwix--;
    }
    if (gwiDisable||Math.abs(y) < gwiy) {	    
      this.scratchY = y; // ###
    } else {
      if (gwiy > 360) gwiy--;
    }
    //
	  
    if (this.isPenDown && !this.isDragging) {
      var context = this.stage.penContext;
      if (this.penSize % 2 > .5 && this.penSize % 2 < 1.5) {
        ox -= .5;
        oy -= .5;
        x -= .5;
        y -= .5;
      }
      context.strokeStyle = this.penCSS || 'hsl(' + this.penHue + ',' + this.penSaturation + '%,' + (this.penLightness > 100 ? 200 - this.penLightness : this.penLightness) + '%)';
      context.lineWidth = this.penSize;
      context.beginPath();
      context.moveTo(240 + ox, 180 - oy);
      context.lineTo(240 + x, 180 - y);
      context.stroke();
    }
    if (this.saying) {
      this.updateBubble();
    }
  };	
	
  Sprite.prototype.moveTo_ = function(x, y) { // OLD FUNCTION!
    var ox = this.scratchX;
    var oy = this.scratchY;
    if (ox === x && oy === y && !this.isPenDown) return;
    this.scratchX = x;
    this.scratchY = y;
    if (this.isPenDown) { // || !this.visible) { // PF todo
      var context = this.stage.penContext;
      if (this.penSize % 2 > .5 && this.penSize % 2 < 1.5) {
        ox -= .5;
        oy -= .5;
        x -= .5;
        y -= .5;
      }

      context.strokeStyle = this.penCSS || 'hsl(' + this.penHue + ',' + this.penSaturation + '%,' + (this.penLightness > 100 ? 200 - this.penLightness : this.penLightness) + '%)';
      context.lineWidth = this.penSize;
      context.beginPath();
      context.moveTo(240 + ox, 180 - oy);
      context.lineTo(240 + x, 180 - y);
      context.stroke();
    }
    if (this.saying) {
      this.updateBubble();
    }
  };

  Sprite.prototype.dotPen = function() {
    var context = this.stage.penContext;
    var x = this.scratchX;
    var y = this.scratchY;
    context.fillStyle = this.penCSS || 'hsl(' + this.penHue + ',' + this.penSaturation + '%,' + (this.penLightness > 100 ? 200 - this.penLightness : this.penLightness) + '%)';
    context.beginPath();
    context.arc(240 + x, 180 - y, this.penSize / 2, 0, 2 * Math.PI, false);
    context.fill();
  };

  // Thanks Sulfurous (fn x 2)
  function rgbToHsv(r, g, b) {
    var max = Math.max(r, g, b),
	min = Math.min(r, g, b);
    var h, s, v = max;
    var d = max - min;
    s = max == 0 ? 0 : d / max;

    if (min == max) {
	h = 0;
    } else {
	switch (max) {
	    case r:
		h = (g - b) / d + (g < b ? 6 : 0);
		break;
	    case g:
		h = (b - r) / d + 2;
		break;
	    case b:
		h = (r - g) / d + 4;
		break;
	}
	h /= 6;
    }

    return {
	h: h,
	s: s,
	v: v
    };
  }

  function hsvToRgb(h, s, v) {
    var r, g, b;
    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch (i % 6) {
	case 0:
	    r = v, g = t, b = p;
	    break;
	case 1:
	    r = q, g = v, b = p;
	    break;
	case 2:
	    r = p, g = v, b = t;
	    break;
	case 3:
	    r = p, g = q, b = v;
	    break;
	case 4:
	    r = t, g = p, b = v;
	    break;
	case 5:
	    r = v, g = p, b = q;
	    break;
    }

    return {
	r: r,
	g: g,
	b: b
    };
  }
	
  Sprite.prototype.draw = function(context, noEffects) {
    var costume = this.costumes[this.currentCostumeIndex];

    if (this.isDragging) {
      this.moveTo(this.dragOffsetX + this.stage.mouseX, this.dragOffsetY + this.stage.mouseY);
    }

    if (costume) { 
      context.save();

      context.imageSmoothingEnabled = false;
      context.msImageSmoothingEnabled = false;

      var z = this.stage.zoom * SCALE;
      context.translate(((this.scratchX + 240) * z | 0) / z, ((180 - this.scratchY) * z | 0) / z);
      if (this.rotationStyle === 'normal') {
        context.rotate((this.direction - 90) * Math.PI / 180);
      } else if (this.rotationStyle === 'leftRight' && this.direction < 0) {
        context.scale(-1, 1);
      }
      context.scale(this.scale, this.scale);
      context.scale(costume.scale, costume.scale);
      context.translate(-costume.rotationCenterX, -costume.rotationCenterY); // ---

      if (!noEffects) { // pf todo Logic change to include below?
	// ghost effect handled here now...   
        context.globalAlpha = Math.max(0, Math.min(1, 1 - this.filters.ghost / 100));	      
      }

      if ((this.filters.color !== 0 || this.filters.fisheye !== 0 || this.filters.whirl !== 0 || this.filters.pixelate !== 0 || this.filters.mosaic !== 0 || this.filters.brightness !== 0)) { // || this.filters.ghost !== 0) {
        this.effects(costume, false);       
	// pf  *# draw using the effectsCanvas instead (TODO: allow one effect at once)
	context.drawImage(effectsCanvas, 0, 0, costume.image.width, costume.image.height);
      } else {
        // pf  only when no effects required use the costume.image directly...
        if (costume.image.width && costume.image.height) { // pf fix
         context.drawImage(costume.image, 0, 0); // , costume.image.width / costume.resScale, costume.image.height / costume.resScale);
        }
      }
      context.restore();
    }
  };

  Sprite.prototype.setDirection = function(degrees) {
    var d = degrees % 360;
    if (d > 180) d -= 360;
    if (d <= -180) d += 360;
    this.direction = d;
    if (this.saying) this.updateBubble();
  };

  var collisionCanvas = document.createElement('canvas');
  var collisionContext = collisionCanvas.getContext('2d');
  // pf temp	
  var collisionCanvas2 = document.createElement('canvas');
  var collisionContext2 = collisionCanvas2.getContext('2d');	

  Sprite.prototype.touching = function(thing) {
    var costume = this.costumes[this.currentCostumeIndex];

    if (thing === '_mouse_') {
      var bounds = this.rotatedBounds();
      var x = this.stage.rawMouseX;
      var y = this.stage.rawMouseY;
      if (x < bounds.left || y < bounds.bottom || x > bounds.right || y > bounds.top) {
        return false;
      }
      // pf fix
      var sX = isNaN(this.scratchX) ? 0 : this.scratchX;
      var sY = isNaN(this.scratchY) ? 0 : this.scratchY;

      var cx = (x - sX) / this.scale;
      var cy = (sY - y) / this.scale;
      if (this.rotationStyle === 'normal' && this.direction !== 90) {
        var d = (90 - this.direction) * Math.PI / 180;
        var ox = cx;
        var s = Math.sin(d), c = Math.cos(d);
        cx = c * ox - s * cy;
        cy = s * ox + c * cy;
      } else if (this.rotationStyle === 'leftRight' && this.direction < 0) {
        cx = -cx;
      }
      var d = costume.context.getImageData(cx * costume.bitmapResolution + costume.rotationCenterX, cy * costume.bitmapResolution + costume.rotationCenterY, 1, 1).data;
      return d[3] !== 0;
    } else if (thing === '_edge_') {
      var bounds = this.rotatedBounds();
      return bounds.left <= -240 || bounds.right >= 240 || bounds.top >= 180 || bounds.bottom <= -180;
    } else {
      if (!this.visible) return false;
      var sprites = this.stage.getObjects(thing);
      for (var i = sprites.length; i--;) {
        var sprite = sprites[i];
        if (!sprite.visible) continue;

        var mb = this.rotatedBounds();
        var ob = sprite.rotatedBounds();

        if (mb.bottom >= ob.top || ob.bottom >= mb.top || mb.left >= ob.right || ob.left >= mb.right) {
          continue;
        }

        var left = Math.max(mb.left, ob.left);
        var top = Math.min(mb.top, ob.top);
        var right = Math.min(mb.right, ob.right);
        var bottom = Math.max(mb.bottom, ob.bottom);

        var w = right - left;
        var h = top - bottom;
	
        collisionCanvas.width = (w < 1) ? 1 : w;
        collisionCanvas.height = (h < 1) ? 1 : h;

	var length = w * h * 4; // must be > 0

	if (length) {
          collisionContext.save();
          collisionContext.translate(-(240 + left), -(180 - top));

          this.draw(collisionContext, true);
          collisionContext.globalCompositeOperation = 'source-in';
          sprite.draw(collisionContext, true);

          collisionContext.restore();	      

          var wt = (w < 1) ? 1 : w;
          var ht = (h < 1) ? 1 : h;
          var data = collisionContext.getImageData(0, 0, wt, ht).data;		
	         
          for (var j = 0; j < length; j += 4) {
            if (data[j + 3]) {
              return true;
            }
          }
        }
      }
      return false;
    }
  };

  Sprite.prototype.touchingColor = function(rgb) {
    var b = this.rotatedBounds();

    var w = b.right - b.left;
    var h = b.top - b.bottom;
  
    collisionCanvas.width = (w < 1) ? 1 : w; // pf w < 1 ?
    collisionCanvas.height = (h < 1) ? 1 : h; // pf h < 1?

    // pf - fast match test (hack - watch out!)
    var bFast = ((w == h && h < 8)) ? true : false; // && (w + h > 2)
	  
    if (bFast) { // @a@
      collisionContext.translate(-(240 + b.left), -(180 - b.top));
      this.stage.drawOn(collisionContext, this);	    
    } else {
      collisionContext.save(); // ! needed?
      collisionContext.translate(-(240 + b.left), -(180 - b.top));
      this.stage.drawAllOn(collisionContext, this);
      collisionContext.globalCompositeOperation = 'destination-in';
      this.draw(collisionContext, true);	  
      collisionContext.restore(); // ! needed?
    }
	  
    var wt = (w < 1) ? 1 : w;
    var ht = (h < 1) ? 1 : h;
    var data = collisionContext.getImageData(0, 0, wt, ht).data;
  
    rgb = (rgb & 0xffffff);
    //var RGB = new hsvToRgb(data[0], data[1] ,data[2]); // pf test only

    // pf - fast match test
    if (!rgb && !data.join("").replace("000255","").length) return true;

    //if (rgb > 255) {
      var length = w * h * 4; // must be > 0
      for (var i = 0; i < length; i += 4) {
        if ((data[i] << 16 | data[i + 1] << 8 | data[i + 2]) === rgb && data[i + 3]) {
        //if (data[i] == RGB.r && data[i + 1] == RGB.g && data[i + 2] == RGB.b) { // pf test only
          return true;
        }
      }
    //} else {
	// pf - fast match test
    //  if (data.join("").match("25500"+rgb.toString()+"255")) return true;
    //}
  };
	
  Sprite.prototype.ColorTouchingColor = function(rgb1, rgb2) {
    var b = this.rotatedBounds();

    var w = b.right - b.left;
    var h = b.top - b.bottom;
  
    collisionCanvas.width = (w < 1) ? 1 : w;
    collisionCanvas.height = (h < 1) ? 1 : h;
	   
    collisionContext.translate(-(240 + b.left), -(180 - b.top));
    this.stage.drawAllOn(collisionContext, this);
	  
    var wt = (w < 1) ? 1 : w;
    var ht = (h < 1) ? 1 : h;
    var data2 = collisionContext.getImageData(0, 0, wt, ht).data; // rgb2 'over'	   
	  
    collisionCanvas2.width = (w < 1) ? 1 :w;
    collisionCanvas2.height = (h < 1) ? 1 : h;
    collisionContext2.translate(-(240 + b.left), -(180 - b.top));
    this.draw(collisionContext2, true); // true ???

    var data1 = collisionContext2.getImageData(0, 0, wt, ht).data; // rgb1 'sprite'
    
    rgb1 = (rgb1 & 0xffffff);
    rgb2 = (rgb2 & 0xffffff);

    var length = w * h * 4; // must be > 0
    for (var i = 0; i < length; i += 4) {
      if ((data1[i] << 16 | data1[i + 1] << 8 | data1[i + 2]) === rgb1 && 255) { // ignore alfred
	if ((data2[i] << 16 | data2[i + 1] << 8 | data2[i + 2]) === rgb2 && 255) {
          return true;
	}
      }
    }	  
  };
	
  Sprite.prototype.bounceOffEdge = function() {
    var b = this.rotatedBounds();
    var dl = 240 + b.left;
    var dt = 180 - b.top;
    var dr = 240 - b.right;
    var db = 180 + b.bottom;

    var d = Math.min(dl, dt, dr, db);
    if (d > 0) return;

    var dir = this.direction * Math.PI / 180;
    var dx = Math.sin(dir);
    var dy = -Math.cos(dir);

    switch (d) {
      case dl: dx = Math.max(0.2, Math.abs(dx)); break;
      case dt: dy = Math.max(0.2, Math.abs(dy)); break;
      case dr: dx = -Math.max(0.2, Math.abs(dx)); break;
      case db: dy = -Math.max(0.2, Math.abs(dy)); break;
    }

    this.direction = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    if (this.saying) this.updateBubble();

    b = this.rotatedBounds();
    var x = this.scratchX;
    var y = this.scratchY;
    if (b.left < -240) x += -240 - b.left;
    if (b.top > 180) y += 180 - b.top;
    if (b.right > 240) x += 240 - b.left;
    if (b.bottom < -180) y += -180 - b.top;
  };

  Sprite.prototype.rotatedBounds = function() { // PF late fix!
    var costume = this.costumes[this.currentCostumeIndex];

    if (typeof costume == "undefined") {
      return { // nothing to do?
        left: this.scratchX + 0,
        right: this.scratchX + 0,
        top: this.scratchY + 0,
        bottom: this.scratchY + 0
      };	    
    }

    //try {var scale = this.scale;} catch(e){var scale = 1;} // urh!	  
    var s = costume.scale * this.scale;
    var left = -costume.rotationCenterX * s; // ---
    var top = costume.rotationCenterY * s;
    var right = left + costume.image.width * s;
    var bottom = top - costume.image.height * s;

    if (this.rotationStyle !== 'normal') {
      if (this.rotationStyle === 'leftRight' && this.direction < 0) {
        right = -left;
        left = right - costume.image.width * costume.scale * this.scale;
      }
      return {
        left: this.scratchX + left,
        right: this.scratchX + right,
        top: this.scratchY + top,
        bottom: this.scratchY + bottom
      };
    }

    var mSin = Math.sin(this.direction * Math.PI / 180);
    var mCos = Math.cos(this.direction * Math.PI / 180);

    var tlX = mSin * left - mCos * top;
    var tlY = mCos * left + mSin * top;

    var trX = mSin * right - mCos * top;
    var trY = mCos * right + mSin * top;

    var blX = mSin * left - mCos * bottom;
    var blY = mCos * left + mSin * bottom;

    var brX = mSin * right - mCos * bottom;
    var brY = mCos * right + mSin * bottom;

    return {
      left: this.scratchX + Math.min(tlX, trX, blX, brX),
      right: this.scratchX + Math.max(tlX, trX, blX, brX),
      top: this.scratchY + Math.max(tlY, trY, blY, brY),
      bottom: this.scratchY + Math.min(tlY, trY, blY, brY)
    };
  };

  Sprite.prototype.showRotatedBounds = function() {
    var bounds = this.rotatedBounds();
    var div = document.createElement('div');
    div.style.outline = '1px solid red';
    div.style.position = 'absolute';
    div.style.left = (240 + bounds.left) + 'px';
    div.style.top = (180 - bounds.top) + 'px';
    div.style.width = (bounds.right - bounds.left) + 'px';
    div.style.height = (bounds.top - bounds.bottom) + 'px';
    this.stage.canvas.parentNode.appendChild(div);
  };

  Sprite.prototype.distanceTo = function(thing) {
    if (thing === '_mouse_') {
      var x = this.stage.mouseX;
      var y = this.stage.mouseY;
    } else {
      var sprite = this.stage.getObject(thing);
      if (!sprite) return 10000; // ND
      x = sprite.scratchX;
      y = sprite.scratchY;
    }
    return Math.sqrt((this.scratchX - x) * (this.scratchX - x) + (this.scratchY - y) * (this.scratchY - y));
  };

  Sprite.prototype.gotoObject = function(thing) {
    if (thing === '_mouse_') {
      this.moveTo(this.stage.mouseX, this.stage.mouseY);
    } else if (thing === '_random_') {
      var x = Math.round(480 * Math.random() - 240);
      var y = Math.round(360 * Math.random() - 180);
      this.moveTo(x, y);
    } else {
      var sprite = this.stage.getObject(thing);
      if (!sprite) return 0;
      this.moveTo(sprite.scratchX, sprite.scratchY);
    }
  };

  Sprite.prototype.pointTowards = function(thing) {
    if (thing === '_mouse_') {
      var x = this.stage.mouseX;
      var y = this.stage.mouseY;
      //this.direction = Math.atan2(x - this.scratchX, y - this.scratchY) * 180 / Math.PI;
    } else {
      var sprite = this.stage.getObject(thing);
      if (!sprite) return 0;
      x = sprite.scratchX;
      y = sprite.scratchY;
      //this.direction = Math.atan2(y - this.scratchY, x - this.scratchX) * 180 / Math.PI + 90;
    }
    var dx = x - this.scratchX;
    var dy = y - this.scratchY;
    if (dx === 0 && dy === 0) {
      this.direction = 90;
    } else {
      this.direction = Math.atan2(dx, dy) * 180 / Math.PI;
    }
    if (this.saying) this.updateBubble();
  };

  Sprite.prototype.sayOLD = function(text, thinking) {
    text = '' + text;
    if (!text) {
      this.saying = false;
      if (!this.bubble) return;
      this.bubble.style.display = 'none';
      return ++this.sayId;
    }
    this.saying = true;
    this.thinking = thinking;
    if (!this.bubble) {
      this.bubble = document.createElement('div');
      this.bubble.style.zIndex = '1'; // pf say over lists fix
      this.bubble.style.maxWidth = ''+(127/14)+'em';
      this.bubble.style.minWidth = ''+(48/14)+'em';
      this.bubble.style.padding = ''+(8/14)+'em '+(10/14)+'em';
      this.bubble.style.border = ''+(3/14)+'em solid rgb(160, 160, 160)';
      this.bubble.style.borderRadius = ''+(10/14)+'em';
      this.bubble.style.background = '#fff';
      this.bubble.style.position = 'absolute';
      this.bubble.style.font = 'bold 14em sans-serif';
      this.bubble.style.whiteSpace = 'pre-wrap';
      this.bubble.style.wordWrap = 'break-word';
      this.bubble.style.textAlign = 'center';
      this.bubble.style.cursor = 'default';
      this.bubble.appendChild(this.bubbleText = document.createTextNode(''));
      this.bubble.appendChild(this.bubblePointer = document.createElement('div'));
      this.bubblePointer.style.position = 'absolute';
      this.bubblePointer.style.height = ''+(21/14)+'em';
      this.bubblePointer.style.width = ''+(44/14)+'em';
      this.bubblePointer.style.background = 'url(icons.svg) '+(-195/14)+'em '+(-4/14)+'em';
      this.bubblePointer.style.backgroundSize = ''+(320/14)+'em '+(96/14)+'em';
      this.stage.root.appendChild(this.bubble);
    } else { // tjvr
      this.stage.root.removeChild(this.bubble); 
      this.stage.root.appendChild(this.bubble);
    }
    this.bubblePointer.style.backgroundPositionX = ((thinking ? -259 : -195)/14)+'em';
    this.bubble.style.display = 'block';
    this.bubbleText.nodeValue = text;
    this.updateBubble();
    return ++this.sayId;
  };

  Sprite.prototype.updateBubble = function() {
    if (!this.visible || !this.saying) {
      this.bubble.style.display = 'none';
      return;
    }
    var b = this.rotatedBounds();
    var left = 240 + b.right;
    var bottom = 180 + b.top;
    var width = this.bubble.offsetWidth / this.stage.zoom;
    var height = this.bubble.offsetHeight / this.stage.zoom;
    this.bubblePointer.style.top = ((height - 6) / 14) + 'em';
    if (left + width + 2 > 480) {
      this.bubble.style.right = ((240 - b.left) / 14) + 'em';
      this.bubble.style.left = 'auto';
      this.bubblePointer.style.right = (3/14)+'em';
      this.bubblePointer.style.left = 'auto';
      this.bubblePointer.style.backgroundPositionY = (-36/14)+'em';
    } else {
      this.bubble.style.left = (left / 14) + 'em';
      this.bubble.style.right = 'auto';
      this.bubblePointer.style.left = (3/14)+'em';
      this.bubblePointer.style.right = 'auto';
      this.bubblePointer.style.backgroundPositionY = (-4/14)+'em';
    }
    if (bottom + height + 2 > 360) {
      bottom = 360 - height - 2;
    }
    if (bottom < 19) {
      bottom = 19;
    }
    this.bubble.style.bottom = (bottom / 14) + 'em';
  };

  Sprite.prototype.remove = function() {
    if (this.bubble) {
      this.stage.root.removeChild(this.bubble);
      this.bubble = null;
    }
    if (this.node) {
      this.node.disconnect();
      this.node = null;
    }
  };

  var Costume = function(data, index, base) {
    this.index = index;
    this.base = base;
    this.baseLayerID = data.baseLayerID;
    this.baseLayerMD5 = data.baseLayerMD5;
    this.baseLayer = data.$image;
    this.bitmapResolution = data.bitmapResolution || 1;
    this.scale = 1 / this.bitmapResolution;
    this.costumeName = data.costumeName;
    this.rotationCenterX = data.rotationCenterX;
    this.rotationCenterY = data.rotationCenterY;
    this.textLayer = data.$text;

    this.image = document.createElement('canvas');
    this.context = this.image.getContext('2d');

    this.context.imageSmoothingEnabled = false; // PF
    this.context.msImageSmoothingEnabled = false;

    this.render();
    
    if (this.baseLayer) { // PF new block
      this.baseLayer.onload = function() {
        this.render();
      }.bind(this);
    }
    
    if (this.textLayer) {
      this.textLayer.onload = this.baseLayer.onload;
    }
  };
  addEvents(Costume, 'load');

  Costume.prototype.render = function() {

    this.image.width = (this.baseLayer) ? this.baseLayer.width : 0; // PF
    this.image.height = (this.baseLayer) ? this.baseLayer.height : 0; // PF
    
    this.context.imageSmoothingEnabled = false; // PF
    this.context.msImageSmoothingEnabled = false;

    if (this.baseLayer) { // PF
    this.context.drawImage(this.baseLayer, 0, 0);
    }
    if (this.textLayer) {
      this.context.drawImage(this.textLayer, 0, 0);
    }
    if (this.base.isStage && (this.index == this.base.currentCostumeIndex)) {
      setTimeout(function() {
        this.base.updateBackdrop();
        this.base.initLists();      
      }.bind(this), 30); // PF FF fix only, may not be required ?
    }
  };

  var Sound = function(data) {
    this.name = data.soundName;
    this.buffer = data.$buffer;
    this.duration = this.buffer ? this.buffer.duration : 0;
  };

  var Watcher = function(stage) {
    this.stage = stage;

    this.cmd = 'getVar:';
    this.color = '#ee7d16';
    this.isDiscrete = true;
    this.label = 'watcher';
    this.mode = 1;
    this.param = 'var';
    this.sliderMax = 100;
    this.sliderMin = 0;
    this.target = undefined;
    this.visible = true;
    this.x = 0;
    this.y = 0;
  };

  Watcher.prototype.fromJSON = function(data) {
    this.cmd = data.cmd || 'getVar:';
    if (data.color) {
      var c = (data.color < 0 ? data.color + 0x1000000 : data.color).toString(16);
      this.color = '#000000'.slice(0, -c.length) + c;
    }
    this.isDiscrete = data.isDiscrete == null ? true : data.isDiscrete;
    this.label = data.label || '';
    this.mode = data.mode || 1;
    this.param = data.param;
    this.sliderMax = data.sliderMax == null ? 100 : data.sliderMax;
    this.sliderMin = data.sliderMin || 0;
    this.targetName = data.target;
    this.visible = data.visible == null ? true : data.visible;
    this.x = data.x || 0;
    this.y = data.y || 0;

    return this;
  };

  Watcher.prototype.resolve = function() {
    this.target = this.stage.getObject(this.targetName);
    if (this.target && this.cmd === 'getVar:') {
      this.target.watchers[this.param] = this;
    }
    if (!this.label) {
      this.label = this.getLabel();
      if (this.target.isSprite) this.label = this.target.objName + ': ' + this.label;
    }
  };

  var WATCHER_LABELS = {
    'costumeIndex': 'costume #',
    'xpos': 'x position',
    'ypos': 'y position',
    'heading': 'direction',
    'scale': 'size',
    'backgroundIndex': 'background #',
    'sceneName': 'background name',
    'tempo': 'tempo',
    'volume': 'volume',
    'answer': 'answer',
    'timer': 'timer',
    'soundLevel': 'loudness',
    'isLoud': 'loud?',
    'xScroll': 'x scroll',
    'yScroll': 'y scroll'
  };

  Watcher.prototype.getLabel = function() {
    switch (this.cmd) {
      case 'getVar:': return this.param;
      case 'sensor:': return this.param + ' sensor value';
      case 'sensorPressed': return 'sensor ' + this.param + '?';
      case 'timeAndDate': return this.param;
      case 'senseVideoMotion': return 'video ' + this.param;
    }
    return WATCHER_LABELS[this.cmd] || '';
  };

  Watcher.prototype.draw = function(context) {
    var value = 0;
    if (!this.target) return;
    switch (this.cmd) {
      case 'answer':
        value = this.stage.answer;
        break;
      case 'backgroundIndex':
        value = this.stage.currentCostumeIndex + 1;
        break;
      case 'costumeIndex':
        value = this.target.currentCostumeIndex + 1;
        break;
      case 'getVar:':
        value = this.target.vars[this.param];
        if (this.mode === 3 && this.stage.mousePressed) {
          var x = this.stage.mouseX + 240 - this.x - 5;
          var y = 180 - this.stage.mouseY - this.y - 20;
          if (x >= 0 && y >= 0 && x <= this.width - 5 - 5 && y <= 9) {
            value = this.sliderMin + Math.max(0, Math.min(1, (x - 2.5) / (this.width - 5 - 5 - 5))) * (this.sliderMax - this.sliderMin);
            value = this.isDiscrete ? Math.round(value) : Math.round(value * 100) / 100;
            this.target.vars[this.param] = value;
          }
        }
        break;
      case 'heading':
        value = this.target.direction;
        break;
      case 'scale':
        value = this.target.scale * 100;
        break;
      case 'sceneName':
        value = this.stage.getCostumeName();
        break;
      case 'senseVideoMotion':
        // TODO
        break;
      case 'soundLevel':
        // TODO
        break;
      case 'tempo':
        value = this.stage.tempoBPM;
        break;
      case 'timeAndDate':
        value = this.timeAndDate(this.param);
        break;
      case 'timer':
        value = Math.round((this.stage.now() - this.stage.timerStart) / 100) / 10;
        break;
      case 'volume':
        value = this.target.volume * 100;
        break;
      case 'xpos':
        value = this.target.scratchX;
        break;
      case 'ypos':
        value = this.target.scratchY;
        break;
    }
    if (typeof value === 'number' && (value < 0.001 || value > 0.001)) {
      value = Math.round(value * 1000) / 1000;
    }
    value = '' + value;

    if (this.labelWidth == null) {
      context.font = 'bold 11px sans-serif';
      this.labelWidth = context.measureText(this.label).width;
    }

    context.save();
    context.translate(this.x, this.y);

    if (this.mode === 1 || this.mode === 3) {
      context.font = 'bold 11px sans-serif';

      var dw = Math.max(41, 5 + context.measureText(value).width + 5);
      var r = 5;
      var w = this.width = 5 + this.labelWidth + 5 + dw + 5;
      var h = this.mode === 1 ? 21 : 32;

      context.strokeStyle = 'rgb(148, 145, 145)';
      context.fillStyle = 'rgb(193, 196, 199)';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(r + 1, r + 1, r, Math.PI, Math.PI * 3/2, false);
      context.arc(w - r - 1, r + 1, r, Math.PI * 3/2, 0, false);
      context.arc(w - r - 1, h - r - 1, r, 0, Math.PI/2, false);
      context.arc(r + 1, h - r - 1, r, Math.PI/2, Math.PI, false);
      context.closePath();
      context.stroke();
      context.fill();

      context.fillStyle = '#000';
      context.fillText(this.label, 5, 14);

      var dh = 15;
      var dx = 5 + this.labelWidth + 5;
      var dy = 3;
      var dr = 4;

      context.save();
      context.translate(dx, dy);

      context.strokeStyle = '#fff';
      context.fillStyle = this.color;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(dr + 1, dr + 1, dr, Math.PI, Math.PI * 3/2, false);
      context.arc(dw - dr - 1, dr + 1, dr, Math.PI * 3/2, 0, false);
      context.arc(dw - dr - 1, dh - dr - 1, dr, 0, Math.PI/2, false);
      context.arc(dr + 1, dh - dr - 1, dr, Math.PI/2, Math.PI, false);
      context.closePath();
      context.stroke();
      context.fill();

      context.fillStyle = '#fff';
      context.textAlign = 'center';
      context.fillText(value, dw / 2, dh - 4);

      context.restore();

      if (this.mode === 3) {
        var sh = 5;
        var sw = w - 5 - 5;
        var sr = 1.5;
        var br = 4.5;

        context.save();
        context.translate(5, 22);

        context.strokeStyle = 'rgb(148, 145, 145)';
        context.fillStyle = 'rgb(213, 216, 219)';
        context.lineWidth = 2;
        context.beginPath();
        context.arc(sr + 1, sr + 1, sr, Math.PI, Math.PI * 3/2, false);
        context.arc(sw - sr - 1, sr + 1, sr, Math.PI * 3/2, 0, false);
        context.arc(sw - sr - 1, sh - sr - 1, sr, 0, Math.PI/2, false);
        context.arc(sr + 1, sh - sr - 1, sr, Math.PI/2, Math.PI, false);
        context.closePath();
        context.stroke();
        context.fill();

        var x = (sw - sh) * Math.max(0, Math.min(1, ((+value || 0) - this.sliderMin) / (this.sliderMax - this.sliderMin)));
        context.strokeStyle = 'rgb(108, 105, 105)';
        context.fillStyle = 'rgb(233, 236, 239)';
        context.beginPath();
        context.arc(x + sh / 2, sh / 2, br - 1, 0, Math.PI * 2, false);
        context.stroke();
        context.fill();

        context.restore();
      }
    } else if (this.mode === 2) {
      context.font = 'bold 15px sans-serif';

      dh = 21;
      dw = Math.max(41, 5 + context.measureText(value).width + 5);
      dr = 4;

      context.strokeStyle = '#fff';
      context.fillStyle = this.color;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(dr + 1, dr + 1, dr, Math.PI, Math.PI * 3/2, false);
      context.arc(dw - dr - 1, dr + 1, dr, Math.PI * 3/2, 0, false);
      context.arc(dw - dr - 1, dh - dr - 1, dr, 0, Math.PI/2, false);
      context.arc(dr + 1, dh - dr - 1, dr, Math.PI/2, Math.PI, false);
      context.closePath();
      context.stroke();
      context.fill();

      context.fillStyle = '#fff';
      context.textAlign = 'center';
      context.fillText(value, dw / 2, dh - 5);
    }

    context.restore();
  };

  var AudioContext = window.AudioContext || window.webkitAudioContext;
  var audioContext = AudioContext && new AudioContext; // causes issue with Chrome V66+

  return {
    hasTouchEvents: hasTouchEvents,
    getKeyCode: getKeyCode,
    audioContext: audioContext,
    IO: IO,
    Base: Base,
    Stage: Stage,
    Sprite: Sprite,
    Watcher: Watcher
  };

}());

P.compile = (function() {
  'use strict';

  var LOG_PRIMITIVES;
  var DEBUG;
  // LOG_PRIMITIVES = true;
  // DEBUG = true;

  var EVENT_SELECTORS = [
    'procDef',
    'whenClicked',
    'whenCloned',
    'whenGreenFlag',
    'whenIReceive',
    'whenKeyPressed',
    'whenSceneStarts',
    'whenSensorGreaterThan' // TODO
  ];

  var compileScripts = function(object) {
    for (var i = 0; i < object.scripts.length; i++) {
      compileListener(object, object.scripts[i][2]);
    }
  };

  var warnings;
  var warn = function(message) {
    warnings[message] = (warnings[message] || 0) + 1;
  };

  var compileListener = function(object, script) {
    if (!script[0] || EVENT_SELECTORS.indexOf(script[0][0]) === -1) return;

    var nextLabel = function() {
      return object.fns.length + fns.length;
    };

    var label = function() {
      var id = nextLabel();
      fns.push(source.length);
      return id;
    };

    var delay = function() {
      source += 'return;\n';
      label();
    };

    var queue = function(id) {
      source += 'queue(' + id + ');\n';
      source += 'return;\n';
    };

    var forceQueue = function(id) {
      source += 'forceQueue(' + id + ');\n';
      source += 'return;\n';
    };

    var seq = function(script) {
      if (!script) return;
      for (var i = 0; i < script.length; i++) {
        compile(script[i]);
      }
    };

    var varRef = function(name) {
      if (typeof name !== 'string') {
        return 'getVars(' + val(name) + ')[' + val(name) + ']';
      }
      var o = object.stage.vars[name] !== undefined ? 'self' : 'S';
      return o + '.vars[' + val(name) + ']';
    };

    var listRef = function(name) {
      if (typeof name !== 'string') {
        return 'getLists(' + val(name) + ')[' + val(name) + ']';
      }
      var o = object.stage.lists[name] !== undefined ? 'self' : 'S';
      if (o === 'S' && !object.lists[name]) {
        object.lists[name] = [];
      }
      return o + '.lists[' + val(name) + ']';
    };

    var param = function(name, usenum, usebool) {
      if (typeof name !== 'string') {
        throw new Error('Dynamic parameters are not supported');
      }	    
      //if (typeof name !== 'string') {
	// try to see if hacked block !here TODO
	//if (typeof name[1] === 'object' && name[1].length === 3 && name[1][0] === 'getParam' && name[1][1] === 'Var' && typeof name[1][2] === 'string') {
	   //name[1] = name[1][2]; // danger! assumes...
	//} else {
           //throw new Error('[Hacked Block] Dynamic parameters unknown');
	//}
      //}

      if (!inputs) return '0';

      var i = inputs.indexOf(name);
      if (i === -1) {
        return '0';
      }

      var t = types[i];
      var kind =
        t === '%n' || t === '%d' || t === '%c' ? 'num' :
        t === '%b' ? 'bool' : '';

      if (kind === 'num' && usenum) {
        return 'C.numargs[' + i + ']';
      }
      if (kind === 'bool' && usebool) {
        return 'C.boolargs[' + i + ']';
      }

      if (usenum) return '(+C.args[' + i + '] || 0)';
      if (usebool) return 'bool(C.args[' + i + '])';
      return 'C.args[' + i + ']';
    };

    var val = function(e, usenum, usebool) {
      // PF added e && check
      var v;

      if (typeof e === 'number' || typeof e === 'boolean') {

        return '' + e;

      } else if (typeof e === 'string') {

        return '"' + e
          .replace(/\\/g, '\\\\')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/"/g, '\\"')
          .replace(/\{/g, '\\x7b')
          .replace(/\}/g, '\\x7d') + '"';

      } else if (e && e[0] === 'getParam') { /* Data */

        return param(e[1], usenum, usebool);

      } else if ((v = numval(e)) != null || (v = boolval(e)) != null) {

        return v;

      } else if (e && e[0] === 'costumeName') {

        return 'S.getCostumeName()';

      } else if (e && e[0] === 'sceneName') {

        return 'self.getCostumeName()';

      } else if (e && e[0] === 'readVariable') {

        return varRef(e[1]);

      } else if (e && e[0] === 'contentsOfList:') {

        return 'contentsOfList(' + listRef(e[1]) + ')';

      } else if (e && e[0] === 'getLine:ofList:') {

        return 'getLineOfList(' + listRef(e[2]) + ', ' + val(e[1]) + ')';

      } else if (e && e[0] === 'concatenate:with:') {

        return '("" + ' + val(e[1]) + ' + ' + val(e[2]) + ')';

      } else if (e && e[0] === 'letter:of:') {

        return '(("" + ' + val(e[2]) + ')[(' + num(e[1]) + ' | 0) - 1] || "")';

      } else if (e && e[0] === 'answer') { /* Sensing */

        return 'self.answer';

      } else if (e && e[0] === 'getAttribute:of:') {

        return 'attribute(' + val(e[1]) + ', ' + val(e[2]) + ')';

      } else if (e && e[0] === 'getUserId') {

        return '0';

      } else if (e && e[0] === 'getUserName') {
        // also show user project is requesting a username...
        document.getElementsByClassName('username')[0].innerHTML = "??? " + that.username;	      
        return '"' + that.username + '"'; // pf
	      
      } else {

        warn('Undefined val');

      }
    };

    var numval = function(e) {
       // PF added e && check
      if (e && e[0] === 'xpos') { /* Motion */

        return 'S.scratchX';

      } else if (e && e[0] === 'ypos') {

        return 'S.scratchY';

      } else if (e && e[0] === 'heading') {

        return 'S.direction';

      } else if (e && e[0] === 'costumeIndex') { /* Looks */

        return '(S.currentCostumeIndex + 1)';

      } else if (e && e[0] === 'backgroundIndex') {

        return '(self.currentCostumeIndex + 1)';

      } else if (e && e[0] === 'scale') {

        return '(S.scale * 100)';

      } else if (e && e[0] === 'volume') { /* Sound */

        return '(S.volume * 100)';

      } else if (e && e[0] === 'tempo') {

        return 'self.tempoBPM';

      } else if (e && e[0] === 'lineCountOfList:') { /* Data */

        return listRef(e[1]) + '.length';

      } else if (e && e[0] === '+') { /* Operators */

        return '(' + num(e[1]) + ' + ' + num(e[2]) + ' || 0)';

      } else if (e && e[0] === '-') {

        return '(' + num(e[1]) + ' - ' + num(e[2]) + ' || 0)';

      } else if (e && e[0] === '*') {

        return '(' + num(e[1]) + ' * ' + num(e[2]) + ' || 0)';

      } else if (e && e[0] === '/') {

        return '(' + num(e[1]) + ' / ' + num(e[2]) + ' || 0)';

      } else if (e && e[0] === 'randomFrom:to:') {

        return 'random(' + num(e[1]) + ', ' + num(e[2]) + ')';

      } else if (e && e[0] === 'abs') {

        return 'Math.abs(' + num(e[1]) + ')';

      } else if (e && e[0] === 'sqrt') {

        return 'Math.sqrt(' + num(e[1]) + ')';

      } else if (e && e[0] === 'stringLength:') {

        return '("" + ' + val(e[1]) + ').length';

      } else if ( e && (e[0] === '%' || e[0] === '\\\\') ) {

        return 'mod(' + num(e[1]) + ', ' + num(e[2]) + ')';

      } else if (e && e[0] === 'rounded') {

        return 'Math.round(' + num(e[1]) + ')';

      } else if (e && e[0] === 'computeFunction:of:') {

        return 'mathFunc(' + val(e[1]) + ', ' + num(e[2]) + ')';

      } else if (e && e[0] === 'mouseX') { /* Sensing */

        return 'self.mouseX';

      } else if (e && e[0] === 'mouseY') {

        return 'self.mouseY';

      } else if (e && e[0] === 'timer') {

        return '((self.now() - self.timerStart) / 1000)';

      } else if (e && e[0] === 'distanceTo:') {

        return 'S.distanceTo(' + val(e[1]) + ')';

      // } else if (e && e[0] === 'soundLevel') {

      } else if (e && e[0] === 'timestamp') {

        return '((Date.now() - epoch) / 86400000)';

      } else if (e && e[0] === 'timeAndDate') {

        return 'timeAndDate(' + val(e[1]) + ')';

      // } else if (e && e[0] === 'sensor:') {

      }
    };

    var DIGIT = /\d/;
    var boolval = function(e) {
      // PF added e && check
      if (e && e[0] === 'list:contains:') { /* Data */

        return 'listContains(' + listRef(e[1]) + ', ' + val(e[2]) + ')';

      } else if ( e && (e[0] === '<' || e[0] === '>') ) { /* Operators */

        if ( e && typeof e[1] === 'string' && (DIGIT.test(e[1]) || typeof e[1] === 'number') ) {
          var less = e[0] === '<';
          var x = e[1];
          var y = e[2];
        } else if ( e && typeof e[2] === 'string' && (DIGIT.test(e[2]) || typeof e[2] === 'number') ) {
          var less = e[0] === '>';
          var x = e[2];
          var y = e[1];
        }
        var nx = +x;
        if (x == null || nx !== nx) {
          return '(compare(' + val(e[1]) + ', ' + val(e[2]) + ') === ' + (e[0] === '<' ? -1 : 1) + ')';
        }
        return (less ? 'numLess' : 'numGreater') + '(' + nx + ', ' + val(y) + ')';

      } else if (e && e[0] === '=') {

        if ( e && typeof e[1] === 'string' && (DIGIT.test(e[1]) || typeof e[1] === 'number') ) {
          var x = e[1];
          var y = e[2];
        } else if ( e && typeof e[2] === 'string' && (DIGIT.test(e[2]) || typeof e[2] === 'number') ) {
          var x = e[2];
          var y = e[1];
        }
        var nx = +x;
        if (x == null || nx !== nx) {
          return '(equal(' + val(e[1]) + ', ' + val(e[2]) + '))';
        }
        return '(numEqual(' + nx + ', ' + val(y) + '))';

      } else if (e && e[0] === '&') {

        return '(' + bool(e[1]) + ' && ' + bool(e[2]) + ')';

      } else if (e && e[0] === '|') {

        return '(' + bool(e[1]) + ' || ' + bool(e[2]) + ')';

      } else if (e && e[0] === 'not') {

        return '!' + bool(e[1]) + '';

      } else if (e && e[0] === 'mousePressed') { /* Sensing */

        return 'self.mousePressed';

      } else if (e && e[0] === 'touching:') {

        return 'S.touching(' + val(e[1]) + ')';

      } else if (e && e[0] === 'touchingColor:') {

        return 'S.touchingColor(' + val(e[1]) + ')';

      } else if (e && e[0] === 'color:sees:') {
	      
	return 'S.ColorTouchingColor(' + val(e[1]) + ', ' + val(e[2]) + ')';

      } else if (e && e[0] === 'keyPressed:') {
	if (e[1] === "") e[1] = "ctrl"; // PF ctrl hack!
        return '!!self.keys[P.getKeyCode(' + val(e[1]) + ')]';

      // } else if (e && e[0] === 'isLoud') {

      // } else if (e && e[0] === 'sensorPressed:') {

      }
    };

    var bool = function(e) {
      if (typeof e === 'boolean') {
        return e;
      }
      if (typeof e === 'number' || typeof e === 'string') {
        return +e !== 0 && e !== '' && e !== 'false' && e !== false;
      }
      var v = boolval(e);
      return v != null ? v : 'bool(' + val(e, false, true) + ')';
    };

    var num = function(e) {
      if (typeof e === 'number') {
        return e || 0;
      }
      if (typeof e === 'boolean' || typeof e === 'string') {
        return +e || 0;
      }
      var v = numval(e);
      return v != null ? v : '(+' + val(e, true) + ' || 0)';
    };

    var beatHead = function(dur) {
      source += 'save();\n';
      source += 'R.start = self.now();\n';
      source += 'R.duration = ' + num(dur) + ' * 60 / self.tempoBPM;\n';
      source += 'R.first = true;\n';
    };

    var beatTail = function(dur) {
        var id = label();
        source += 'if (self.now() - R.start < R.duration * 1000 || R.first) {\n';
        source += '  R.first = false;\n';
        forceQueue(id);
        source += '}\n';

        source += 'restore();\n';
    };

    var wait = function(dur) {
        source += 'save();\n';
        source += 'R.start = self.now();\n';
        source += 'R.duration = ' + dur + ';\n';
        source += 'R.first = true;\n';

        var id = label();
        source += 'if (self.now() - R.start < R.duration * 1000 || R.first) {\n';
        source += '  R.first = false;\n';
        forceQueue(id);
        source += '}\n';

        source += 'restore();\n';
    };

    var noRGB = '';
    noRGB += 'if (S.penCSS) {\n';
    noRGB += '  var hsl = rgb2hsl(S.penColor & 0xffffff);\n';
    noRGB += '  S.penHue = hsl[0];\n';
    noRGB += '  S.penSaturation = hsl[1];\n';
    noRGB += '  S.penLightness = hsl[2];\n';
    noRGB += '  S.penCSS = null;';
    noRGB += '}\n';

    var compile = function(block) {
      // PF - code here run only once during stage setup...
      if (LOG_PRIMITIVES) {
        source += 'console.log(' + val(block[0]) + ');\n';
      }
      // pf - S.visible is set true / false, depending if block is show / hide (WARP tests need adding)
      if (['turnRight:', 'turnLeft:', 'heading:', 'pointTowards:', 'setRotationStyle', 'lookLike:', 'nextCostume', 'say:duration:elapsed:from:', 'say:', 'think:duration:elapsed:from:', 'think:', 'changeGraphicEffect:by:', 'setGraphicEffect:to:', 'filterReset', 'changeSizeBy:', 'setSizeTo:', 'comeToFront', 'goBackByLayers:'].indexOf(block[0]) !== -1) {
          source += 'if (S.visible) VISUAL = true\n';
      } else if (['forward:', 'gotoX:y:', 'gotoSpriteOrMouse:', 'changeXposBy:', 'xpos:', 'changeYposBy:', 'ypos:', 'bounceOffEdge', 'glideSecs:toX:y:elapsed:from:'].indexOf(block[0]) !== -1) {
          source += 'if (S.visible || S.isPenDown) VISUAL = true\n';
      } else if (['showBackground:', 'startScene', 'nextBackground', 'nextScene', 'startSceneAndWait', 'show', 'hide', 'putPenDown', 'stampCostume', 'showVariable:', 'hideVariable:', 'showList:', 'hideList:', 'doAsk', 'setVolumeTo:', 'changeVolumeBy:', 'setTempoTo:', 'changeTempoBy:'].indexOf(block[0]) !== -1) {
          source += 'VISUAL = true;\n';
      } else if (that.bInProcDef) {
      	  // pf run without screen refresh (warp stuff)
      	  if (TurboMode) {
      	      if (that.bWarp) {
      	    	source += 'if (!WARP) WARP = 1;\n'; // can cause 'lockup', note C.Warp does nothing here...
      	      }
      	  } else {
      	        //source += 'VISUAL = false;\n'; // pf makes a small speed increase ?	
      	  }
      }

      if (block[0] === 'forward:') { /* Motion */

        source += 'S.forward(' + num(block[1]) + ');\n';

      } else if (block[0] === 'turnRight:') {

        source += 'S.setDirection(S.direction + ' + num(block[1]) + ');\n';

      } else if (block[0] === 'turnLeft:') {

        source += 'S.setDirection(S.direction - ' + num(block[1]) + ');\n';

      } else if (block[0] === 'heading:') {

        source += 'S.setDirection(' + num(block[1]) + ');\n';

      } else if (block[0] === 'pointTowards:') {

        source += 'S.pointTowards(' + val(block[1]) + ');\n';

      } else if (block[0] === 'gotoX:y:') {

        source += 'S.moveTo(' + num(block[1]) + ', ' + num(block[2]) + ');\n';

      } else if (block[0] === 'gotoSpriteOrMouse:') {

        source += 'S.gotoObject(' + val(block[1]) + ');\n';

      } else if (block[0] === 'changeXposBy:') {

        source += 'S.moveTo(S.scratchX + ' + num(block[1]) + ', S.scratchY);\n';

      } else if (block[0] === 'xpos:') {

        source += 'S.moveTo(' + num(block[1]) + ', S.scratchY);\n';

      } else if (block[0] === 'changeYposBy:') {

        source += 'S.moveTo(S.scratchX, S.scratchY + ' + num(block[1]) + ');\n';

      } else if (block[0] === 'ypos:') {

        source += 'S.moveTo(S.scratchX, ' + num(block[1]) + ');\n';

      } else if (block[0] === 'bounceOffEdge') {

        source += 'S.bounceOffEdge();\n';

      } else if (block[0] === 'setRotationStyle') {

        source += 'var style = ' + val(block[1]) + ';\n';
        source += 'S.rotationStyle = style === "left-right" ? "leftRight" : style === "don\'t rotate" ? "none" : "normal";\n';

      } else if (block[0] === 'lookLike:') { /* Looks */

        source += 'S.setCostume(' + val(block[1]) + ');\n';

      } else if (block[0] === 'nextCostume') {

        source += 'S.showNextCostume();\n';

      } else if (block[0] === 'showBackground:' ||
                 block[0] === 'startScene') {

        source += 'var bgname = self.getCostumeName();\n'; // sulfurous
        source += 'self.setCostume(' + val(block[1]) + ');\n';
        //source += 'var threads = sceneChange();\n';
        source += 'var threads = (self.getCostumeName()!= bgname)? sceneChange(): "";\n'; // sulfurous	      
        source += 'if (threads.indexOf(BASE) !== -1) return;\n';

      } else if (block[0] === 'nextBackground' ||
                 block[0] === 'nextScene') {

        source += 'S.showNextCostume();\n';
        source += 'var threads = sceneChange();\n';
        source += 'if (threads.indexOf(BASE) !== -1) return;\n';

      } else if (block[0] === 'startSceneAndWait') {

        source += 'save();\n';
        source += 'self.setCostume(' + val(block[1]) + ');\n';
        source += 'R.threads = sceneChange();\n';
        source += 'if (R.threads.indexOf(BASE) !== -1) return;\n';
        var id = label();
        source += 'if (running(R.threads)) {\n'; // removed !
        forceQueue(id);
        source += '}\n';
        source += 'restore();\n';

      } else if (block[0] === 'say:duration:elapsed:from:') {

        source += 'save();\n';
        source += 'R.id = S.say(' + val(block[1]) + ', false);\n';
        source += 'R.start = self.now();\n';
        source += 'R.duration = ' + num(block[2]) + ';\n';

        var id = label();
        source += 'if (self.now() - R.start < R.duration * 1000) {\n';
        forceQueue(id);
        source += '}\n';

        source += 'if (S.sayId === R.id) {\n';
        source += '  S.say("");\n';
        source += '}\n';
        source += 'restore();\n';

      } else if (block[0] === 'say:') {

        source += 'S.say(' + val(block[1]) + ', false);\n';

      } else if (block[0] === 'think:duration:elapsed:from:') {

        source += 'save();\n';
        source += 'R.id = S.say(' + val(block[1]) + ', true);\n';
        source += 'R.start = self.now();\n';
        source += 'R.duration = ' + num(block[2]) + ';\n';

        var id = label();
        source += 'if (self.now() - R.start < R.duration * 1000) {\n';
        forceQueue(id);
        source += '}\n';

        source += 'if (S.sayId === R.id) {\n';
        source += '  S.say("");\n';
        source += '}\n';
        source += 'restore();\n';

      } else if (block[0] === 'think:') {

        source += 'S.say(' + val(block[1]) + ', true);\n';

      } else if (block[0] === 'changeGraphicEffect:by:') {

        source += 'S.changeFilter(' + val(block[1]) + ', ' + num(block[2]) + ');\n';

      } else if (block[0] === 'setGraphicEffect:to:') {

        source += 'S.setFilter(' + val(block[1]) + ', ' + num(block[2]) + ');\n';

      } else if (block[0] === 'filterReset') {

        source += 'S.resetFilters();\n';

      } else if (block[0] === 'changeSizeBy:') {

        source += 'S.scale += ' + num(block[1]) + ' / 100;\n';
	source += 'if (S.scale < 0) S.scale = 0;\n'; // pf fix

      } else if (block[0] === 'setSizeTo:') {

        source += 'S.scale = ' + num(block[1]) + ' / 100;\n';
	source += 'if (S.scale < 0) S.scale = 0;\n'; // pf fix

      } else if (block[0] === 'show') {

        source += 'S.visible = true;\n';
        source += 'if (S.saying) S.updateBubble();\n';

      } else if (block[0] === 'hide') {

        source += 'S.visible = false;\n';
        source += 'if (S.saying) S.updateBubble();\n';

      } else if (block[0] === 'comeToFront') {

        source += 'var i = self.children.indexOf(S);\n';
        source += 'if (i !== -1) self.children.splice(i, 1);\n';
        source += 'self.children.push(S);\n';

      } else if (block[0] === 'goBackByLayers:') {

        source += 'var i = self.children.indexOf(S);\n';
        source += 'if (i !== -1) {\n';
        source += '  self.children.splice(i, 1);\n';
        source += '  self.children.splice(Math.max(0, i - ' + num(block[1]) + '), 0, S);\n';
        source += '}\n';

      // } else if (block[0] === 'setVideoState') {

      // } else if (block[0] === 'setVideoTransparency') {

      } else if (block[0] === 'playSound:') { /* Sound */

        if (P.audioContext) {
          source += 'var sound = S.getSound(' + val(block[1]) + ');\n';
          source += 'if (sound) playSound(sound);\n';
        }

      } else if (block[0] === 'doPlaySoundAndWait') {

        if (P.audioContext) {
          source += 'var sound = S.getSound(' + val(block[1]) + ');\n';
          source += 'if (sound) {\n';
          source += '  playSound(sound);\n';
          wait('sound.duration');
          source += '}\n';
        }

      } else if (block[0] === 'stopAllSounds') {

        if (P.audioContext) {
          source += 'self.stopAllSounds();\n';
        }

      // } else if (block[0] === 'drum:duration:elapsed:from:') {

      } else if (block[0] === 'playDrum') {

        beatHead(block[2]);
        if (P.audioContext) {
          source += 'playSpan(DRUMS[Math.round(' + num(block[1]) + ') - 1] || DRUMS[2], 60, 10);\n';
        }
        beatTail();

      } else if (block[0] === 'rest:elapsed:from:') {

        beatHead(block[1]);
        beatTail();

      } else if (block[0] === 'noteOn:duration:elapsed:from:') {

        beatHead(block[2]);
        if (P.audioContext) {
          source += 'playNote(' + num(block[1]) + ', R.duration);\n';
        }
        beatTail();

      // } else if (block[0] === 'midiInstrument:') {

      } else if (block[0] === 'instrument:') {

        source += 'S.instrument = Math.max(0, Math.min(INSTRUMENTS.length - 1, ' + num(block[1]) + ' - 1)) | 0;';

      } else if (block[0] === 'changeVolumeBy:' || block[0] === 'setVolumeTo:') {

        source += 'S.volume = Math.min(1, Math.max(0, ' + (block[0] === 'changeVolumeBy:' ? 'S.volume + ' : '') + num(block[1]) + ' / 100));\n';
        source += 'if (S.node) S.node.gain.setValueAtTime(S.volume, audioContext.currentTime);\n';
        source += 'for (var sounds = S.sounds, i = sounds.length; i--;) {\n';
        source += '  var sound = sounds[i];\n';
        source += '  if (sound.node && sound.target === S) {\n';
        source += '    sound.node.gain.setValueAtTime(S.volume, audioContext.currentTime);\n';
        source += '  }\n';
        source += '}\n';

      } else if (block[0] === 'changeTempoBy:') {

        source += 'self.tempoBPM += ' + num(block[1]) + ';\n';

      } else if (block[0] === 'setTempoTo:') {

        source += 'self.tempoBPM = ' + num(block[1]) + ';\n';

      } else if (block[0] === 'clearPenTrails') { /* Pen */

        source += 'self.penCanvas.width = 480 * self.maxZoom;\n';
        source += 'self.penContext.scale(self.maxZoom, self.maxZoom);\n';
        source += 'self.penContext.lineCap = "round";\n'

      } else if (block[0] === 'putPenDown') {

        source += 'S.isPenDown = true;\n';
        source += 'S.dotPen();\n';

      } else if (block[0] === 'putPenUp') {

        source += 'S.isPenDown = false;\n';
        source += 'S.penState = null;\n';

      } else if (block[0] === 'penColor:') {

        source += 'var c = ' + num(block[1]) + ';\n';
        source += 'if (!S.penCSS) { S.penColor = c;} else { S.penColor = (c & 0xff); } \n'; // pf fix2
        source += 'var a = (c >> 24 & 0xff) / 0xff;\n';
        source += 'S.penCSS = "rgba(" + (c >> 16 & 0xff) + "," + (c >> 8 & 0xff) + "," + (c & 0xff) + ", " + (a || 1) + ")";\n';

      } else if (block[0] === 'setPenHueTo:') {

        source += noRGB;
        source += 'S.penHue = ' + num(block[1]) + ' * 360 / 200;\n';
        source += 'S.penSaturation = 100;\n';

      } else if (block[0] === 'changePenHueBy:') {

        source += noRGB;
        source += 'S.penHue += ' + num(block[1]) + ' * 360 / 200;\n';
        source += 'S.penSaturation = 100;\n';

      } else if (block[0] === 'setPenShadeTo:') {

        source += noRGB;
        source += 'S.penLightness = ' + num(block[1]) + ' % 200;\n';
        source += 'if (S.penLightness < 0) S.penLightness += 200;\n';
        source += 'S.penSaturation = 100;\n';

      } else if (block[0] === 'changePenShadeBy:') {

        source += noRGB;
        source += 'S.penLightness = (S.penLightness + ' + num(block[1]) + ') % 200;\n';
        source += 'if (S.penLightness < 0) S.penLightness += 200;\n';
        source += 'S.penSaturation = 100;\n';

      } else if (block[0] === 'penSize:') {

        source += 'var f = ' + num(block[1]) + ';\n';
        source += 'S.penSize = f < 1 ? 1 : f;\n';

      } else if (block[0] === 'changePenSizeBy:') {

        source += 'var f = S.penSize + ' + num(block[1]) + ';\n';
        source += 'S.penSize = f < 1 ? 1 : f;\n';

      } else if (block[0] === 'stampCostume') {

        //source += 'self.penCanvas.width = 480 * self.maxZoom;\n'; // pf fix z
        //source += 'self.penContext.scale(self.maxZoom, self.maxZoom);\n'; // pf fix z
        source += 'S.draw(self.penContext);\n';

      } else if (block[0] === 'setVar:to:') { /* Data */
	if(block[2] == '/,0,0') block[2] = 'NaN'; // PF fix NaN
        source += varRef(block[1]) + ' = ' + val(block[2]) + ';\n';

      } else if (block[0] === 'changeVar:by:') {

        var ref = varRef(block[1]);
        source += ref + ' = (+' +  ref + ' || 0) + ' + num(block[2]) + ';\n';

      } else if (block[0] === 'append:toList:') {

        source += 'appendToList(' + listRef(block[2]) + ', ' + val(block[1]) + ');\n';
	source += 'self.updateList(' + val(block[2]) + ');\n'; // pf update list test only

      } else if (block[0] === 'deleteLine:ofList:') {

        source += 'deleteLineOfList(' + listRef(block[2]) + ', ' + val(block[1]) + ');\n';
        source += 'self.updateList(' + val(block[2]) + ');\n'; // pf update list test only

      } else if (block[0] === 'insert:at:ofList:') {

        source += 'insertInList(' + listRef(block[3]) + ', ' + val(block[2]) + ', '+ val(block[1]) + ');\n';
        source += 'self.updateList(' + val(block[3]) + ');\n'; // pf update list test only

      } else if (block[0] === 'setLine:ofList:to:') {

        source += 'setLineOfList(' + listRef(block[2]) + ', ' + val(block[1]) + ', '+ val(block[3]) + ');\n';
        source += 'self.updateList(' + val(block[2]) + ');\n'; // pf update list test only

      } else if (block[0] === 'showVariable:' || block[0] === 'hideVariable:') {

        var isShow = block[0] === 'showVariable:';
        if (typeof name !== 'string') {
	  // try to see if hacked block
	  if (typeof block[1] === 'object' && block[1].length === 3 && block[1][0] === 'getParam' && block[1][1] === 'Var' && typeof block[1][2] === 'string') {
	     block[1] = block[1][2]; // danger! assumes...
	  } else {
             throw new Error('[Hacked Block] Dynamic parameters unknown');
	  }
        }
        var o = object.vars[block[1]] !== undefined ? 'S' : 'self';
        source += o + '.showVariable(' + val(block[1]) + ', ' + isShow + ');\n';

       } else if (block[0] === 'showList:') { // PF
         source += 'self.showList(' + val(block[1]) + ');\n';	  
       } else if (block[0] === 'hideList:') { // PF
         source += 'self.hideList(' + val(block[1]) + ');\n';
      } else if (block[0] === 'broadcast:') { /* Control */

        source += 'var threads = broadcast(' + val(block[1]) + ');\n';
        source += 'if (threads.indexOf(BASE) !== -1) return;\n';

      } else if (block[0] === 'call') {

        if (DEBUG && block[1] === 'phosphorus: debug') {
          source += 'debugger;\n';
        } else {
          source += 'call(' + val(block[1]) + ', ' + nextLabel() + ', [';
          for (var i = 2; i < block.length; i++) {
            if (i > 2) {
              source += ', ';
            }
            source += val(block[i]);
          }
          source += ']);\n';
          delay();
        }

      } else if (block[0] === 'doBroadcastAndWait') {

        source += 'save();\n';
        source += 'R.threads = broadcast(' + val(block[1]) + ');\n';
        source += 'if (R.threads.indexOf(BASE) !== -1) return;\n';
        var id = label();
        source += 'if (running(R.threads)) {\n';
        forceQueue(id);
        source += '}\n';
        source += 'restore();\n';

      } else if (block[0] === 'doForever') {

        var id = label();
        seq(block[1]);
        forceQueue(id);

      } else if (block[0] === 'doForeverIf') {

        var id = label();

        source += 'if (' + bool(block[1]) + ') {\n';
        seq(block[2]);
        source += '}\n';

        forceQueue(id);

      // } else if (block[0] === 'doForLoop') {

      } else if (block[0] === 'doIf') {

        source += 'if (' + bool(block[1]) + ') {\n';
        seq(block[2]);
        source += '}\n';

      } else if (block[0] === 'doIfElse') {

        source += 'if (' + bool(block[1]) + ') {\n';
        seq(block[2]);
        source += '} else {\n';
        seq(block[3]);
        source += '}\n';

      } else if (block[0] === 'doRepeat') {

        source += 'save();\n';
        source += 'R.count = ' + num(block[1]) + ';\n';

        var id = label();

        source += 'if (R.count >= 0.5) {\n';
        source += '  R.count -= 1;\n';
        seq(block[2]);
        queue(id);
        source += '} else {\n';
        source += '  restore();\n';
        source += '}\n';

      } else if (block[0] === 'doReturn') {

        source += 'endCall();\n';
        source += 'return;\n';

      } else if (block[0] === 'doUntil') {

        var id = label();
        source += 'if (!' + bool(block[1]) + ') {\n';
        seq(block[2]);
        queue(id);
        source += '}\n';

      } else if (block[0] === 'doWhile') {

        var id = label();
        source += 'if (' + bool(block[1]) + ') {\n';
        seq(block[2]);
        queue(id);
        source += '}\n';

      } else if (block[0] === 'doWaitUntil') {

        var id = label();
        source += 'if (!' + bool(block[1]) + ') {\n';
        queue(id);
        source += '}\n';

      } else if (block[0] === 'glideSecs:toX:y:elapsed:from:') {

        source += 'save();\n';
        source += 'R.start = self.now();\n';
        source += 'R.duration = ' + num(block[1]) + ';\n';
        source += 'R.baseX = S.scratchX;\n';
        source += 'R.baseY = S.scratchY;\n';
        source += 'R.deltaX = ' + num(block[2]) + ' - S.scratchX;\n';
        source += 'R.deltaY = ' + num(block[3]) + ' - S.scratchY;\n';

        var id = label();
        source += 'var f = (self.now() - R.start) / (R.duration * 1000);\n';
        source += 'if (f > 1) f = 1;\n';
        source += 'S.moveTo(R.baseX + f * R.deltaX, R.baseY + f * R.deltaY);\n';

        source += 'if (f < 1) {\n';
        forceQueue(id);
        source += '}\n';
        source += 'restore();\n';

      } else if (block[0] === 'stopAll') {

        source += 'self.stopAll();\n';
        source += 'return;\n';

      } else if (block[0] === 'stopScripts') {

        source += 'switch (' + val(block[1]) + ') {\n';
        source += '  case "all":\n';
        source += '    self.stopAll();\n';
        source += '    return;\n';
        source += '  case "this script":\n';
        source += '    endCall();\n';
        source += '    return;\n';
        source += '  case "other scripts in sprite":\n';
        source += '  case "other scripts in stage":\n';
        source += '    for (var i = 0; i < self.queue.length; i++) {\n';
        source += '      if (i !== THREAD && self.queue[i] && self.queue[i].sprite === S) {\n';
        source += '        S.stopSounds();\n'; // @@@	      
        source += '        self.queue[i] = undefined;\n';
        source += '      }\n';
        source += '    }\n';
        source += '    break;\n';
        source += '}\n';

      } else if (block[0] === 'wait:elapsed:from:') {

	if (isNaN(Number(block[1]))) {
	  wait(num(block[1]));
	} else {
	  if (!!Number(block[1])) {
            wait(num(block[1]));
	  } else { // PF fix 11/7/17
	    if (!that.bWarp && block[1] === 0) {
	      wait(num(block[1]));
	    }
	  }
	}
      } else if (block[0] === 'warpSpeed') {
        source += 'WARP++;\n';
        seq(block[1]);
        source += 'WARP--;\n';

      } else if (block[0] === 'createCloneOf') {

        source += 'clone(' + val(block[1]) + ');\n';

      } else if (block[0] === 'deleteClone') {

        source += 'if (S.isClone) {\n';
	source += ' S.stopSounds();\n';	 // @@@
        source += '  S.remove();\n';
        source += '  var i = self.children.indexOf(S);\n';
        source += '  if (i !== -1) self.children.splice(i, 1);\n';
        source += '  for (var i = 0; i < self.queue.length; i++) {\n';
        source += '    if (self.queue[i] && self.queue[i].sprite === S) {\n';
        source += '      self.queue[i] = undefined;\n';
        source += '    }\n';
        source += '  }\n';
        source += '  return;\n';
        source += '}\n';

      } else if (block[0] === 'doAsk') { /* Sensing */

        source += 'R.id = self.nextPromptId++;\n';

        var id = label();
        source += 'if (self.promptId < R.id) {\n';
        forceQueue(id);
        source += '}\n';

        source += 'S.ask(' + val(block[1]) + ');\n';

        var id = label();
        source += 'if (self.promptId === R.id) {\n';
        forceQueue(id);
        source += '}\n';

      } else if (block[0] === 'timerReset') {

        source += 'self.timerStart = self.now();\n';

      } else {

        warn('Undefined command: ' + block[0]);

      }
    };

    var source = '';
    var startfn = object.fns.length;
    var fns = [0];

    if (script[0][0] === 'procDef') {
      if (TurboMode) {
        that.bWarp = that.bInProcDef = script[0][4]; // pf turbo warp *
      }
      var inputs = script[0][2];
      var types = script[0][1].match(/%[snmdcb]/g) || [];
      for (var i = types.length; i--;) {
        var t = types[i];
        if (t === '%d' || t === '%n' || t === '%c') {
          source += 'C.numargs[' + i + '] = +C.args[' + i + '] || 0;\n';
        } else if (t === '%b') {
          source += 'C.boolargs[' + i + '] = bool(C.args[' + i + ']);\n';
        }
      }
    }

    for (var i = 1; i < script.length; i++) {
      compile(script[i]);
    }

    if (script[0][0] === 'procDef') {
      // seem slightly faster reseting bWarp and bInProcDef within endCall() rather than here.
      source += 'endCall();\n';
      source += 'return;\n';
    }
    // PF: eval Magic created here...
    var createContinuation = function(source) {
      var result = '(function() {\n';
      var brackets = 0;
      var delBrackets = 0;
      var shouldDelete = false;
      var here = 0;
      var length = source.length;
      while (here < length) {
        var i = source.indexOf('{', here);
        var j = source.indexOf('}', here);
        if (i === -1 && j === -1) {
          if (!shouldDelete) {
            result += source.slice(here);
          }
          break;
        }
        if (i === -1) i = length;
        if (j === -1) j = length;
        if (shouldDelete) {
          if (i < j) {
            delBrackets++;
            here = i + 1;
          } else {
            delBrackets--;
            if (!delBrackets) {
              shouldDelete = false;
            }
            here = j + 1;
          }
        } else {
          if (i < j) {
            result += source.slice(here, i + 1);
            brackets++;
            here = i + 1;
          } else {
            result += source.slice(here, j);
            here = j + 1;
            if (source.substr(j, 8) === '} else {') {
              if (brackets > 0) {
                result += '} else {';
                here = j + 8;
              } else {
                shouldDelete = true;
                delBrackets = 0;
              }
            } else {
              if (brackets > 0) {
                result += '}';
                brackets--;
              }
            }
          }
        }
      }
      result += '})';
      return P.runtime.scopedEval(result);
    };

    for (var i = 0; i < fns.length; i++) {
      object.fns.push(createContinuation(source.slice(fns[i])));
    }

    var f = object.fns[startfn];

    if (script[0][0] === 'whenClicked') {
      object.listeners.whenClicked.push(f);
    } else if (script[0][0] === 'whenGreenFlag') {
      object.listeners.whenGreenFlag.push(f);
      greenFlag--; // ugly hack
    } else if (script[0][0] === 'whenCloned') {
      object.listeners.whenCloned.push(f);
    } else if (script[0][0] === 'whenIReceive') {
      var key = script[0][1].toLowerCase();
      (object.listeners.whenIReceive[key] || (object.listeners.whenIReceive[key] = [])).push(f);
    } else if (script[0][0] === 'whenKeyPressed') { // any
      if (script[0][1] == "") script[0][1] = "ctrl"; // PF ctrl hack!
      if (script[0][1] == 'any') {
        for (var any = 128;any--;) {  // pf db x fix 128 (4 enkee ?)
	  object.listeners.whenKeyPressed[any].push(f);
	}
      } else {
        object.listeners.whenKeyPressed[P.getKeyCode(script[0][1])].push(f);
      }
    } else if (script[0][0] === 'whenSceneStarts') {
      var key = script[0][1].toLowerCase();
      (object.listeners.whenSceneStarts[key] || (object.listeners.whenSceneStarts[key] = [])).push(f);
    } else if (script[0][0] === 'procDef') {
      	// pf initial run only (not game loop) ie when green flag clicked block
      	if (TurboMode) {
      	  that.bWarp = false;
      	  object.procedures[script[0][1]] = {
            inputs: inputs,
            warp: false,
            fn: f
          };       	  
      	} else {
          that.bInProcDef = script[0][4];
      	  object.procedures[script[0][1]] = {
            inputs: inputs,
            warp: script[0][4],
            fn: f
          };        
       }
    } else {
      warn('Undefined event: ' + script[0][0]);
    }
  };

  return function(stage) {

    warnings = Object.create(null);

    compileScripts(stage);

    for (var i = 0; i < stage.children.length; i++) {
      if (!stage.children[i].cmd) {
        compileScripts(stage.children[i]);
      }
    }

    for (var key in warnings) {
      console.warn(key + (warnings[key] > 1 ? ' (repeated ' + warnings[key] + ' times)' : ''));
    }

  };

}());

P.runtime = (function() {
  'use strict';

  var self, S, R, STACK, C, WARP, CALLS, BASE, THREAD, IMMEDIATE, VISUAL;

  var bool = function(v) {
    return +v !== 0 && v !== '' && v !== 'false' && v !== false;
  };

  var DIGIT = /\d/;
  var compare = function(x, y) {
    if ((typeof x === 'number' || DIGIT.test(x)) && (typeof y === 'number' || DIGIT.test(y))) {
      var nx = +x;
      var ny = +y;
      if (nx === nx && ny === ny) {
        return nx < ny ? -1 : nx === ny ? 0 : 1;
      }
    }
    var xs = ('' + x).toLowerCase();
    var ys = ('' + y).toLowerCase();
    return xs < ys ? -1 : xs === ys ? 0 : 1;
  };
  var numLess = function(nx, y) {
    if (typeof y === 'number' || DIGIT.test(y)) {
      var ny = +y;
      if (ny === ny) {
        return nx < ny;
      }
    }
    var ys = ('' + y).toLowerCase();
    return '' + nx < ys;
  };
  var numGreater = function(nx, y) {
    if (typeof y === 'number' || DIGIT.test(y)) {
      var ny = +y;
      if (ny === ny) {
        return nx > ny;
      }
    }
    var ys = ('' + y).toLowerCase();
    return '' + nx > ys;
  };

  var equal = function(x, y) {
    if ((typeof x === 'number' || DIGIT.test(x)) && (typeof y === 'number' || DIGIT.test(y))) {
      var nx = +x;
      var ny = +y;
      if (nx === nx && ny === ny) {
        return nx === ny;
      }
    }
    var xs = ('' + x).toLowerCase();
    var ys = ('' + y).toLowerCase();
    return xs === ys;
  };
  var numEqual = function(nx, y) {
    if (typeof y === 'number' || DIGIT.test(y)) {
      var ny = +y;
      return ny === ny && nx === ny;
    }
    return false;
  };

  var mod = function(x, y) {
    var r = x % y;
    if (r / y < 0) {
      r += y;
    }
    return r;
  };

  var random = function(x, y) {
    x = +x || 0;
    y = +y || 0;
    if (x > y) {
      var tmp = y;
      y = x;
      x = tmp;
    }
    if (x % 1 === 0 && y % 1 === 0) {
      return Math.floor(Math.random() * (y - x + 1)) + x;
    }
    return Math.random() * (y - x) + x;
  };

  var rgb2hsl = function(rgb) {
    var r = (rgb >> 16 & 0xff) / 0xff;
    var g = (rgb >> 8 & 0xff) / 0xff;
    var b = (rgb & 0xff) / 0xff;

    var min = Math.min(r, g, b);
    var max = Math.max(r, g, b);

    if (min === max) {
      return [0, 0, r * 100];
    }

    var c = max - min;
    var l = (min + max) / 2;
    var s = c / (1 - Math.abs(2 * l - 1));

    var h;
    switch (max) {
      case r: h = ((g - b) / c + 6) % 6; break;
      case g: h = (b - r) / c + 2; break;
      case b: h = (r - g) / c + 4; break;
    }
    h *= 60;

    return [h, s * 100, l * 100];
  };

  var clone = function(name) {
    var parent = name === '_myself_' ? S : self.getObject(name);
    if (parent) { // testc
      var c = parent.clone();
      self.children.splice(self.children.indexOf(parent), 0, c);
      self.triggerFor(c, 'whenCloned');
    }
  };

  var epoch = Date.UTC(2000, 0, 1);

  var timeAndDate = P.Watcher.prototype.timeAndDate = function(format) {
    switch (format) {
      case 'year':
        return new Date().getFullYear();
      case 'month':
        return new Date().getMonth() + 1;
      case 'date':
        return new Date().getDate();
      case 'day of week':
        return new Date().getDay() + 1;
      case 'hour':
        return new Date().getHours();
      case 'minute':
        return new Date().getMinutes();
      case 'second':
        return new Date().getSeconds();
    }
    return 0;
  };

  var getVars = function(name) {
    return self.vars[name] !== undefined ? self.vars : S.vars;
  };

  var getLists = function(name) {
    if (self.lists[name] !== undefined) return self.lists;
    if (S.lists[name] === undefined) {
      S.lists[name] = [];
    }
    return S.lists;
  };

  var listIndex = function(list, index, length) {
    var i = index | 0;
    if (i === index) return i > 0 && i <= length ? i - 1 : -1;
    if (index === 'random' || index === 'any') {
      return Math.random() * length | 0;
    }
    if (index === 'last') {
      return length - 1;
    }
    return i > 0 && i <= length ? i - 1 : -1;
  };

  var contentsOfList = function(list) {
    var isSingle = true;
    for (var i = list.length; i--;) {
      if (list[i].length !== 1) {
        isSingle = false;
        break;
      }
    }
    return list.join(isSingle ? '' : ' ');
  };

  var getLineOfList = function(list, index) {
    var i = listIndex(list, index, list.length);
    return i !== -1 ? list[i] : '';
  };

  var listContains = function(list, value) {
    for (var i = list.length; i--;) {
      if (equal(list[i], value)) return true;
    }
    return false;
  };

  var appendToList = function(list, value) {
    list.push(value);
  };

  var deleteLineOfList = function(list, index) {
    if (index === 'all') {
      list.length = 0;
    } else {
      var i = listIndex(list, index, list.length);
      if (i === list.length - 1) {
        list.pop();
      } else if (i !== -1) {
        list.splice(i, 1);
      }
    }
  };

  var insertInList = function(list, index, value) {
    var i = listIndex(list, index, list.length + 1);
    if (i === list.length) {
      list.push(value);
    } else if (i !== -1) {
      list.splice(i, 0, value);
    }
  };

  var setLineOfList = function(list, index, value) {
    var i = listIndex(list, index, list.length);
    if (i !== -1) {
      list[i] = value;
    }
  };

  var mathFunc = function(f, x) {
    switch (f) {
      case 'abs':
        return Math.abs(x);
      case 'floor':
        return Math.floor(x);
      case 'sqrt':
        return Math.sqrt(x);
      case 'ceiling':
        return Math.ceil(x);
      case 'cos':
        return Math.cos(x * Math.PI / 180);
      case 'sin':
        return Math.sin(x * Math.PI / 180);
      case 'tan':
        return Math.tan(x * Math.PI / 180);
      case 'asin':  
      	//return Math.asin(x) * 180 / Math.PI;
        return isNaN(Math.asin(x)) ? Math.asin(x * Math.PI / 180) : Math.asin(x) * 180 / Math.PI; // pf
      case 'acos':
      	//return Math.acos(x) * 180 / Math.PI
        return isNaN(Math.acos(x)) ? Math.acos(x * Math.PI / 180) : Math.acos(x) * 180 / Math.PI; // pf
      case 'atan':
        return Math.atan(x) * 180 / Math.PI;
      case 'ln':
        return Math.log(x);
      case 'log':
        return Math.log(x) / Math.LN10;
      case 'e ^':
        return Math.exp(x);
      case '10 ^':
        return Math.exp(x * Math.LN10);
    }
    return 0;
  };

  var attribute = function(attr, objName) {
    var o = self.getObject(objName);
    if (!o) return 0;
    if (o.isSprite) {
      switch (attr) {
        case 'x position': return o.scratchX;
        case 'y position': return o.scratchY;
        case 'direction': return o.direction;
        case 'costume #': return o.currentCostumeIndex + 1;
        case 'costume name': return o.costumes[o.currentCostumeIndex].costumeName;
        case 'size': return o.scale * 100;
        case 'volume': return 0; // TODO
      }
    } else {
      switch (attr) {
        case 'background #':
        case 'backdrop #': return o.currentCostumeIndex + 1;
        case 'backdrop name': return o.costumes[o.currentCostumeIndex].costumeName;
        case 'volume': return 0; // TODO
      }
    }
    var value = o.vars[attr];
    if (value !== undefined) {
      return value;
    }
    return 0;
  };

  var VOLUME = 0.3;

  var audioContext = P.audioContext;
  if (audioContext) {
    var wavBuffers = P.IO.wavBuffers;

    var volumeNode = audioContext.createGain();
    volumeNode.gain.value = VOLUME;
    volumeNode.connect(audioContext.destination);

    var playNote = function(id, duration) {
      var spans = INSTRUMENTS[S.instrument];
      for (var i = 0, l = spans.length; i < l; i++) {
        var span = spans[i];
        if (span.top >= id || span.top === 128) break;
      }
      playSpan(span, Math.max(0, Math.min(127, id)), duration);
    };

    var playSpan = function(span, id, duration) {
      if (!S.node) {
        S.node = audioContext.createGain();
        S.node.gain.value = S.volume;
        S.node.connect(volumeNode);
      }

      var source = audioContext.createBufferSource();
      var note = audioContext.createGain();
      var buffer = wavBuffers[span.name];
      if (!buffer) return;

      source.buffer = buffer;
      if (source.loop = span.loop) {
        source.loopStart = span.loopStart;
        source.loopEnd = span.loopEnd;
      }

      source.connect(note);
      note.connect(S.node);

      var time = audioContext.currentTime;
      source.playbackRate.value = Math.pow(2, (id - 69) / 12) / span.baseRatio;

      var gain = note.gain;
      gain.value = 0;
      gain.setValueAtTime(0, time);
      if (span.attackEnd < duration) {
        gain.linearRampToValueAtTime(1, time + span.attackEnd);
        if (span.decayTime > 0 && span.holdEnd < duration) {
          gain.linearRampToValueAtTime(1, time + span.holdEnd);
          if (span.decayEnd < duration) {
            gain.linearRampToValueAtTime(0, time + span.decayEnd);
          } else {
            gain.linearRampToValueAtTime(1 - (duration - holdEnd) / span.decayTime, time + duration);
          }
        } else {
          gain.linearRampToValueAtTime(1, time + duration);
        }
      } else {
        gain.linearRampToValueAtTime(1, time + duration);
      }
      gain.linearRampToValueAtTime(0, time + duration + 0.02267573696);

      source.start(time);
      source.stop(time + duration + 0.02267573696);
    };

    var playSound = function(sound) {
      if (!sound.buffer) return;
      if (!sound.node) {
        sound.node = audioContext.createGain();
        sound.node.gain.value = S.volume;
        sound.node.connect(volumeNode);
      }
      sound.target = S;
      sound.node.gain.setValueAtTime(S.volume, audioContext.currentTime);

      if (sound.source) {
        sound.source.disconnect();
      }
      sound.source = audioContext.createBufferSource();
      sound.source.buffer = sound.buffer;
      sound.source.connect(sound.node);

      sound.source.start(audioContext.currentTime);
    };
  }

  var save = function() {
    STACK.push(R);
    R = {};
  };

  var restore = function() {
    R = STACK.pop();
  };

  // var lastCalls = [];
  // PF fn below runs after compile!
  var call = function(spec, id, values) {
    // lastCalls.push(spec);
    // if (lastCalls.length > 10000) lastCalls.shift();
    var procedure = S.procedures[spec];
    if (procedure) {
      STACK.push(R);
      CALLS.push(C);
      C = {
        base: procedure.fn,
        fn: S.fns[id],
        args: values,
        numargs: [],
        boolargs: [],
        stack: STACK = [],
        warp: procedure.warp
      };
      R = {};
      if (C.warp || WARP) {
        WARP++;
        IMMEDIATE = procedure.fn;
      } else {
        for (var i = CALLS.length, j = 5; i-- && j--;) {
          if (CALLS[i].base === procedure.fn) {
            var recursive = true;
            break;
          }
        }
        if (recursive) {
          self.queue[THREAD] = {
            sprite: S,
            base: BASE,
            fn: procedure.fn,
            calls: CALLS
          };
        } else {
          IMMEDIATE = procedure.fn;
        }
      }
    } else {
      IMMEDIATE = S.fns[id];
    }
  };

  var endCall = function() {
    if (CALLS.length) {
      if (WARP) WARP--;
      IMMEDIATE = C.fn;
      C = CALLS.pop();
      STACK = C.stack;
      R = STACK.pop();
    }
    that.bInProcDef = false;
    that.bWarp = false;
  };

  var sceneChange = function() {
    return self.trigger('whenSceneStarts', self.costumes[self.currentCostumeIndex].costumeName);
  };

  var broadcast = function(name) {
    return self.trigger('whenIReceive', name);
  };

  var running = function(bases) {
    for (var j = 0; j < self.queue.length; j++) {
      if (self.queue[j] && bases.indexOf(self.queue[j].base) !== -1) return true;
    }
    return false;
  };

  var queue = function(id) {
    if (WARP) {
      IMMEDIATE = S.fns[id];
    } else {
      forceQueue(id);
    }
  };

  var forceQueue = function(id) {
    self.queue[THREAD] = {
      sprite: S,
      base: BASE,
      fn: S.fns[id],
      calls: CALLS
    };
  };

  // Internal definition
  (function() {
    'use strict';

    P.Stage.prototype.framerate = 30;

    P.Stage.prototype.initRuntime = function() {
      this.queue = [];
      this.onError = this.onError.bind(this);
    };

    P.Stage.prototype.startThread = function(sprite, base) {
      var thread = {
        sprite: sprite,
        base: base,
        fn: base,
        calls: [{args: [], stack: [{}]}]
      };
      for (var i = 0; i < this.queue.length; i++) {
        var q = this.queue[i];
        if (q && q.sprite === sprite && q.base === base) {
          this.queue[i] = thread;
          return;
        }
      }
      this.queue.push(thread);
    };

    P.Stage.prototype.triggerFor = function(sprite, event, arg) {
      var threads;
      if (event === 'whenClicked') {
        threads = sprite.listeners.whenClicked;
      } else if (event === 'whenCloned') {
        threads = sprite.listeners.whenCloned;
      } else if (event === 'whenGreenFlag') {
        threads = sprite.listeners.whenGreenFlag;
      } else if (event === 'whenIReceive') {
        threads = sprite.listeners.whenIReceive[('' + arg).toLowerCase()];
      } else if (event === 'whenKeyPressed') {
        threads = sprite.listeners.whenKeyPressed[arg];
      } else if (event === 'whenSceneStarts') {
        threads = sprite.listeners.whenSceneStarts[('' + arg).toLowerCase()];
      }
      if (threads) {
        for (var i = 0; i < threads.length; i++) {
          this.startThread(sprite, threads[i]);
        }
      }
      return threads || [];
    };

    P.Stage.prototype.trigger = function(event, arg) {
      var threads = [];
      for (var i = this.children.length; i--;) {
        if (this.children[i].isSprite) {
          threads = threads.concat(this.triggerFor(this.children[i], event, arg));
        }
      }
      return threads.concat(this.triggerFor(this, event, arg));  // pf db?
    };

    P.Stage.prototype.triggerGreenFlag = function() {
      this.isTurbo = (typeof this.isTurbo == 'undefined') ? (!!window.location.search.match("turbo=true")) : this.isTurbo; // pf @
      this.timerStart = this.now();
      this.trigger('whenGreenFlag');
    };

    P.Stage.prototype.start = function() {

      // update
      if (this.cloud && !this.cloud.connected) {
        //return this.cloud.autostart = true;
      }

      this.isRunning = true;
      if (this.interval) return;
      addEventListener('error', this.onError);
      this.baseTime = Date.now();
      this.interval = setInterval(this.step.bind(this), 1000 / this.framerate);
    };

    P.Stage.prototype.pause = function() {
      if (this.interval) {
        this.baseNow = this.now();
        clearInterval(this.interval);
        delete this.interval;
        removeEventListener('error', this.onError);
      }
      this.isRunning = false;
    };

    P.Stage.prototype.stopAll = function() {
      this.hidePrompt = false;
      this.prompter.style.display = 'none';
      this.promptId = this.nextPromptId = 0;
      this.queue = [];
      this.resetFilters();
      this.clearFilters(); // pf
      this.stopSounds();
      for (var i = 0; i < this.children.length; i++) {
        var c = this.children[i];
        if (c.isClone) {
          c.remove();
          this.children.splice(i, 1);
          i -= 1;
        } else if (c.isSprite) {
          c.resetFilters();
          if (c.saying) c.say('');
          c.stopSounds();
        }
      }
    };

    P.Stage.prototype.now = function() {
      return this.baseNow + Date.now() - this.baseTime;
    };

    P.Stage.prototype.step = function() {
      self = this;
      TurboMode = true; //self.isTurbo; // pf - only set after loading sb2 file, as 'recompile' required!
      VISUAL = false;
      var start = Date.now();
      do {
	var queue = this.queue;
        for (THREAD = 0; THREAD < queue.length; THREAD++) {
          if (queue[THREAD]) {
            S = queue[THREAD].sprite;
            IMMEDIATE = queue[THREAD].fn;
            BASE = queue[THREAD].base;
            CALLS = queue[THREAD].calls;
            C = CALLS.pop();
            STACK = C.stack;
            R = STACK.pop();
            queue[THREAD] = undefined;
            WARP = 0;
            while (IMMEDIATE) {
              var fn = IMMEDIATE;
              IMMEDIATE = null;
              fn();
            }
            STACK.push(R);
            CALLS.push(C);
          }
        }
        for (var i = queue.length; i--;) {
          if (!queue[i]) queue.splice(i, 1);
        }
      } while ((self.isTurbo || !VISUAL) && Date.now() - start < 1000 / this.framerate && queue.length); // pf removed self.isTurbo || 
      this.draw();
      S = null;
      // PF
      if (this.isRunning && usingGamepad) {
      	//checkGamepad(usingTouch); // todo...
      }
    };

    P.Stage.prototype.onError = function(e) {
      this.handleError(e.error);
      clearInterval(this.interval);
    };

    P.Stage.prototype.handleError = function(e) {
      console.error(e.stack);
    };

  }());

  /*
    copy(JSON.stringify(instruments.map(function(g) {
      return g.map(function(r) {
        var attackTime = r[5] ? r[5][0] * 0.001 : 0;
        var holdTime = r[5] ? r[5][1] * 0.001 : 0;
        var decayTime = r[5] ? r[5][2] : 0;
        var baseRatio = Math.pow(2, (r[2] - 69) / 12);
        if (r[3] !== -1) {
          var length = r[4] - r[3];
          baseRatio = 22050 * Math.round(length * 440 * baseRatio / 22050) / length / 440;
        }
        return {
          top: r[0],
          name: r[1],
          baseRatio: baseRatio,
          loop: r[3] !== -1,
          loopStart: r[3] / 22050,
          loopEnd: r[4] / 22050,
          attackEnd: attackTime,
          holdEnd: attackTime + holdTime,
          decayEnd: attackTime + holdTime + decayTime
        }
      })
    })).replace(/"(\w+)":/g,'$1:').replace(/"/g, '\''));
  */
  var INSTRUMENTS = [[{top:38,name:'AcousticPiano_As3',baseRatio:0.5316313272700484,loop:true,loopStart:0.465578231292517,loopEnd:0.7733786848072562,attackEnd:0,holdEnd:0.1,decayEnd:22.1},{top:44,name:'AcousticPiano_C4',baseRatio:0.5905141892259927,loop:true,loopStart:0.6334693877551021,loopEnd:0.8605442176870748,attackEnd:0,holdEnd:0.1,decayEnd:20.1},{top:51,name:'AcousticPiano_G4',baseRatio:0.8843582887700535,loop:true,loopStart:0.5532879818594104,loopEnd:0.5609977324263039,attackEnd:0,holdEnd:0.08,decayEnd:18.08},{top:62,name:'AcousticPiano_C6',baseRatio:2.3557692307692304,loop:true,loopStart:0.5914739229024943,loopEnd:0.6020861678004535,attackEnd:0,holdEnd:0.08,decayEnd:16.08},{top:70,name:'AcousticPiano_F5',baseRatio:1.5776515151515151,loop:true,loopStart:0.5634920634920635,loopEnd:0.5879818594104308,attackEnd:0,holdEnd:0.04,decayEnd:14.04},{top:77,name:'AcousticPiano_Ds6',baseRatio:2.800762112139358,loop:true,loopStart:0.560907029478458,loopEnd:0.5836281179138322,attackEnd:0,holdEnd:0.02,decayEnd:10.02},{top:85,name:'AcousticPiano_Ds6',baseRatio:2.800762112139358,loop:true,loopStart:0.560907029478458,loopEnd:0.5836281179138322,attackEnd:0,holdEnd:0,decayEnd:8},{top:90,name:'AcousticPiano_Ds6',baseRatio:2.800762112139358,loop:true,loopStart:0.560907029478458,loopEnd:0.5836281179138322,attackEnd:0,holdEnd:0,decayEnd:6},{top:96,name:'AcousticPiano_D7',baseRatio:5.275119617224881,loop:true,loopStart:0.3380498866213152,loopEnd:0.34494331065759637,attackEnd:0,holdEnd:0,decayEnd:3},{top:128,name:'AcousticPiano_D7',baseRatio:5.275119617224881,loop:true,loopStart:0.3380498866213152,loopEnd:0.34494331065759637,attackEnd:0,holdEnd:0,decayEnd:2}],[{top:48,name:'ElectricPiano_C2',baseRatio:0.14870515241435123,loop:true,loopStart:0.6956009070294784,loopEnd:0.7873015873015873,attackEnd:0,holdEnd:0.08,decayEnd:10.08},{top:74,name:'ElectricPiano_C4',baseRatio:0.5945685670261941,loop:true,loopStart:0.5181859410430839,loopEnd:0.5449433106575964,attackEnd:0,holdEnd:0.04,decayEnd:8.04},{top:128,name:'ElectricPiano_C4',baseRatio:0.5945685670261941,loop:true,loopStart:0.5181859410430839,loopEnd:0.5449433106575964,attackEnd:0,holdEnd:0,decayEnd:6}],[{top:128,name:'Organ_G2',baseRatio:0.22283731584620914,loop:true,loopStart:0.05922902494331066,loopEnd:0.1510204081632653,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:40,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:15},{top:56,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:13.5},{top:60,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:12},{top:67,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:8.5},{top:72,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:7},{top:83,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:5.5},{top:128,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:4.5}],[{top:40,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:15},{top:56,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:13.5},{top:60,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:12},{top:67,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:8.5},{top:72,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:7},{top:83,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:5.5},{top:128,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:4.5}],[{top:34,name:'ElectricBass_G1',baseRatio:0.11111671034065712,loop:true,loopStart:1.9007709750566892,loopEnd:1.9212244897959183,attackEnd:0,holdEnd:0,decayEnd:17},{top:48,name:'ElectricBass_G1',baseRatio:0.11111671034065712,loop:true,loopStart:1.9007709750566892,loopEnd:1.9212244897959183,attackEnd:0,holdEnd:0,decayEnd:14},{top:64,name:'ElectricBass_G1',baseRatio:0.11111671034065712,loop:true,loopStart:1.9007709750566892,loopEnd:1.9212244897959183,attackEnd:0,holdEnd:0,decayEnd:12},{top:128,name:'ElectricBass_G1',baseRatio:0.11111671034065712,loop:true,loopStart:1.9007709750566892,loopEnd:1.9212244897959183,attackEnd:0,holdEnd:0,decayEnd:10}],[{top:38,name:'Pizz_G2',baseRatio:0.21979665071770335,loop:true,loopStart:0.3879365079365079,loopEnd:0.3982766439909297,attackEnd:0,holdEnd:0,decayEnd:5},{top:45,name:'Pizz_G2',baseRatio:0.21979665071770335,loop:true,loopStart:0.3879365079365079,loopEnd:0.3982766439909297,attackEnd:0,holdEnd:0.012,decayEnd:4.012},{top:56,name:'Pizz_A3',baseRatio:0.503654636820466,loop:true,loopStart:0.5197278911564626,loopEnd:0.5287528344671202,attackEnd:0,holdEnd:0,decayEnd:4},{top:64,name:'Pizz_A3',baseRatio:0.503654636820466,loop:true,loopStart:0.5197278911564626,loopEnd:0.5287528344671202,attackEnd:0,holdEnd:0,decayEnd:3.2},{top:72,name:'Pizz_E4',baseRatio:0.7479647218453188,loop:true,loopStart:0.7947845804988662,loopEnd:0.7978231292517007,attackEnd:0,holdEnd:0,decayEnd:2.8},{top:80,name:'Pizz_E4',baseRatio:0.7479647218453188,loop:true,loopStart:0.7947845804988662,loopEnd:0.7978231292517007,attackEnd:0,holdEnd:0,decayEnd:2.2},{top:128,name:'Pizz_E4',baseRatio:0.7479647218453188,loop:true,loopStart:0.7947845804988662,loopEnd:0.7978231292517007,attackEnd:0,holdEnd:0,decayEnd:1.5}],[{top:41,name:'Cello_C2',baseRatio:0.14870515241435123,loop:true,loopStart:0.3876643990929705,loopEnd:0.40294784580498866,attackEnd:0,holdEnd:0,decayEnd:0},{top:52,name:'Cello_As2',baseRatio:0.263755980861244,loop:true,loopStart:0.3385487528344671,loopEnd:0.35578231292517004,attackEnd:0,holdEnd:0,decayEnd:0},{top:62,name:'Violin_D4',baseRatio:0.6664047388781432,loop:true,loopStart:0.48108843537414964,loopEnd:0.5151927437641723,attackEnd:0,holdEnd:0,decayEnd:0},{top:75,name:'Violin_A4',baseRatio:0.987460815047022,loop:true,loopStart:0.14108843537414967,loopEnd:0.15029478458049886,attackEnd:0.07,holdEnd:0.07,decayEnd:0.07},{top:128,name:'Violin_E5',baseRatio:1.4885238523852387,loop:true,loopStart:0.10807256235827664,loopEnd:0.1126530612244898,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:30,name:'BassTrombone_A2_3',baseRatio:0.24981872564125807,loop:true,loopStart:0.061541950113378686,loopEnd:0.10702947845804989,attackEnd:0,holdEnd:0,decayEnd:0},{top:40,name:'BassTrombone_A2_2',baseRatio:0.24981872564125807,loop:true,loopStart:0.08585034013605441,loopEnd:0.13133786848072562,attackEnd:0,holdEnd:0,decayEnd:0},{top:55,name:'Trombone_B3',baseRatio:0.5608240680183126,loop:true,loopStart:0.12,loopEnd:0.17673469387755103,attackEnd:0,holdEnd:0,decayEnd:0},{top:88,name:'Trombone_B3',baseRatio:0.5608240680183126,loop:true,loopStart:0.12,loopEnd:0.17673469387755103,attackEnd:0.05,holdEnd:0.05,decayEnd:0.05},{top:128,name:'Trumpet_E5',baseRatio:1.4959294436906376,loop:true,loopStart:0.1307936507936508,loopEnd:0.14294784580498865,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:128,name:'Clarinet_C4',baseRatio:0.5940193965517241,loop:true,loopStart:0.6594104308390023,loopEnd:0.7014965986394558,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:40,name:'TenorSax_C3',baseRatio:0.2971698113207547,loop:true,loopStart:0.4053968253968254,loopEnd:0.4895238095238095,attackEnd:0,holdEnd:0,decayEnd:0},{top:50,name:'TenorSax_C3',baseRatio:0.2971698113207547,loop:true,loopStart:0.4053968253968254,loopEnd:0.4895238095238095,attackEnd:0.02,holdEnd:0.02,decayEnd:0.02},{top:59,name:'TenorSax_C3',baseRatio:0.2971698113207547,loop:true,loopStart:0.4053968253968254,loopEnd:0.4895238095238095,attackEnd:0.04,holdEnd:0.04,decayEnd:0.04},{top:67,name:'AltoSax_A3',baseRatio:0.49814747876378096,loop:true,loopStart:0.3875736961451247,loopEnd:0.4103854875283447,attackEnd:0,holdEnd:0,decayEnd:0},{top:75,name:'AltoSax_A3',baseRatio:0.49814747876378096,loop:true,loopStart:0.3875736961451247,loopEnd:0.4103854875283447,attackEnd:0.02,holdEnd:0.02,decayEnd:0.02},{top:80,name:'AltoSax_A3',baseRatio:0.49814747876378096,loop:true,loopStart:0.3875736961451247,loopEnd:0.4103854875283447,attackEnd:0.02,holdEnd:0.02,decayEnd:0.02},{top:128,name:'AltoSax_C6',baseRatio:2.3782742681047764,loop:true,loopStart:0.05705215419501134,loopEnd:0.0838095238095238,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:61,name:'Flute_B5_2',baseRatio:2.255113636363636,loop:true,loopStart:0.08430839002267573,loopEnd:0.10244897959183673,attackEnd:0,holdEnd:0,decayEnd:0},{top:128,name:'Flute_B5_1',baseRatio:2.255113636363636,loop:true,loopStart:0.10965986394557824,loopEnd:0.12780045351473923,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:128,name:'WoodenFlute_C5',baseRatio:1.1892952324548416,loop:true,loopStart:0.5181859410430839,loopEnd:0.7131065759637188,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:57,name:'Bassoon_C3',baseRatio:0.29700969827586204,loop:true,loopStart:0.11011337868480725,loopEnd:0.19428571428571428,attackEnd:0,holdEnd:0,decayEnd:0},{top:67,name:'Bassoon_C3',baseRatio:0.29700969827586204,loop:true,loopStart:0.11011337868480725,loopEnd:0.19428571428571428,attackEnd:0.04,holdEnd:0.04,decayEnd:0.04},{top:76,name:'Bassoon_C3',baseRatio:0.29700969827586204,loop:true,loopStart:0.11011337868480725,loopEnd:0.19428571428571428,attackEnd:0.08,holdEnd:0.08,decayEnd:0.08},{top:84,name:'EnglishHorn_F3',baseRatio:0.39601293103448276,loop:true,loopStart:0.341859410430839,loopEnd:0.4049886621315193,attackEnd:0.04,holdEnd:0.04,decayEnd:0.04},{top:128,name:'EnglishHorn_D4',baseRatio:0.6699684005833739,loop:true,loopStart:0.22027210884353743,loopEnd:0.23723356009070296,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:39,name:'Choir_F3',baseRatio:0.3968814788643197,loop:true,loopStart:0.6352380952380953,loopEnd:1.8721541950113378,attackEnd:0,holdEnd:0,decayEnd:0},{top:50,name:'Choir_F3',baseRatio:0.3968814788643197,loop:true,loopStart:0.6352380952380953,loopEnd:1.8721541950113378,attackEnd:0.04,holdEnd:0.04,decayEnd:0.04},{top:61,name:'Choir_F3',baseRatio:0.3968814788643197,loop:true,loopStart:0.6352380952380953,loopEnd:1.8721541950113378,attackEnd:0.06,holdEnd:0.06,decayEnd:0.06},{top:72,name:'Choir_F4',baseRatio:0.7928898424161845,loop:true,loopStart:0.7415419501133786,loopEnd:2.1059410430839,attackEnd:0,holdEnd:0,decayEnd:0},{top:128,name:'Choir_F5',baseRatio:1.5879576065654504,loop:true,loopStart:0.836281179138322,loopEnd:2.0585487528344673,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:38,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0.1,decayEnd:8.1},{top:48,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0.1,decayEnd:7.6},{top:59,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0.06,decayEnd:7.06},{top:70,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0.04,decayEnd:6.04},{top:78,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0.02,decayEnd:5.02},{top:86,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0,decayEnd:4},{top:128,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0,decayEnd:3}],[{top:128,name:'MusicBox_C4',baseRatio:0.5937634640241276,loop:true,loopStart:0.6475283446712018,loopEnd:0.6666666666666666,attackEnd:0,holdEnd:0,decayEnd:2}],[{top:128,name:'SteelDrum_D5',baseRatio:1.3660402567543959,loop:false,loopStart:-0.000045351473922902495,loopEnd:-0.000045351473922902495,attackEnd:0,holdEnd:0,decayEnd:2}],[{top:128,name:'Marimba_C4',baseRatio:0.5946035575013605,loop:false,loopStart:-0.000045351473922902495,loopEnd:-0.000045351473922902495,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:80,name:'SynthLead_C4',baseRatio:0.5942328422565577,loop:true,loopStart:0.006122448979591836,loopEnd:0.06349206349206349,attackEnd:0,holdEnd:0,decayEnd:0},{top:128,name:'SynthLead_C6',baseRatio:2.3760775862068964,loop:true,loopStart:0.005623582766439909,loopEnd:0.01614512471655329,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:38,name:'SynthPad_A3',baseRatio:0.4999105065330231,loop:true,loopStart:0.1910204081632653,loopEnd:3.9917006802721087,attackEnd:0.05,holdEnd:0.05,decayEnd:0.05},{top:50,name:'SynthPad_A3',baseRatio:0.4999105065330231,loop:true,loopStart:0.1910204081632653,loopEnd:3.9917006802721087,attackEnd:0.08,holdEnd:0.08,decayEnd:0.08},{top:62,name:'SynthPad_A3',baseRatio:0.4999105065330231,loop:true,loopStart:0.1910204081632653,loopEnd:3.9917006802721087,attackEnd:0.11,holdEnd:0.11,decayEnd:0.11},{top:74,name:'SynthPad_A3',baseRatio:0.4999105065330231,loop:true,loopStart:0.1910204081632653,loopEnd:3.9917006802721087,attackEnd:0.15,holdEnd:0.15,decayEnd:0.15},{top:86,name:'SynthPad_A3',baseRatio:0.4999105065330231,loop:true,loopStart:0.1910204081632653,loopEnd:3.9917006802721087,attackEnd:0.2,holdEnd:0.2,decayEnd:0.2},{top:128,name:'SynthPad_C6',baseRatio:2.3820424708835755,loop:true,loopStart:0.11678004535147392,loopEnd:0.41732426303854875,attackEnd:0,holdEnd:0,decayEnd:0}]];

  /*
    copy(JSON.stringify(drums.map(function(d) {
      var decayTime = d[4] || 0;
      var baseRatio = Math.pow(2, (60 - d[1] - 69) / 12);
      if (d[2]) {
        var length = d[3] - d[2];
        baseRatio = 22050 * Math.round(length * 440 * baseRatio / 22050) / length / 440;
      }
      return {
        name: d[0],
        baseRatio: baseRatio,
        loop: !!d[2],
        loopStart: d[2] / 22050,
        loopEnd: d[3] / 22050,
        attackEnd: 0,
        holdEnd: 0,
        decayEnd: decayTime
      }
    })).replace(/"(\w+)":/g,'$1:').replace(/"/g, '\''));
  */
  var DRUMS = [{name:'SnareDrum',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'Tom',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'SideStick',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'Crash',baseRatio:0.8908987181403393,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'HiHatOpen',baseRatio:0.9438743126816935,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'HiHatClosed',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'Tambourine',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'Clap',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'Claves',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'WoodBlock',baseRatio:0.7491535384383408,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'Cowbell',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'Triangle',baseRatio:0.8514452780229479,loop:true,loopStart:0.7638548752834468,loopEnd:0.7825396825396825,attackEnd:0,holdEnd:0,decayEnd:2},{name:'Bongo',baseRatio:0.5297315471796477,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'Conga',baseRatio:0.7954545454545454,loop:true,loopStart:0.1926077097505669,loopEnd:0.20403628117913833,attackEnd:0,holdEnd:0,decayEnd:2},{name:'Cabasa',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'GuiroLong',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'Vibraslap',baseRatio:0.8408964152537145,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'Cuica',baseRatio:0.7937005259840998,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0}];

  return {
    scopedEval: function(source) {
      return eval(source); // PF this is where all the magic is run
    }
  };

}());

// PF add touchscreen and joystick controls - EXPERMENTAL (Portrait) testing on nexus 7!
var usingGamepad = false;
// to redefine touch buttons B and A, pause the game and touch button to update...
var g_b = false;
var g_a = false;

function checkGamepad(usingTouch) {
	
	if (!usingTouch) {
		var gp = navigator.getGamepads()[0];
		if (gp) {
			var axeLF = gp.axes[0];
			var axeUF = gp.axes[1];
			var but0 = gp.buttons[0];
			var but1 = gp.buttons[1];
			var start = gp.buttons[11];
		}
	}
	
	if (usingTouch && (!g_b&&!g_a)) { // B,A not yet defined!
		g_b = (document.getElementById("touch_B").value) ? document.getElementById("touch_B").value : 13; // hardcoded to enter
		g_a = (document.getElementById("touch_A").value) ? document.getElementById("touch_A").value : 32; // hardcoded to space
	}

	if(usingTouch == "left" || axeLF < -0.5) { 
		that.keys[37] = true;
		that.keys[39] = false;
		//that.trigger('whenKeyPressed', 37);
	} else if(usingTouch == "right" || axeLF > 0.5) {
		that.keys[39] = true;
		that.keys[37] = false;
		//that.trigger('whenKeyPressed', 39);
	} else {
		if(usingTouch == "left_cancel" || axeLF > -0.5) {
		  that.keys[37] = false;
		}
		if(usingTouch == "right_cancel" || axeLF < 0.5) {  
		  that.keys[39] = false;
		}
	}

	if(usingTouch == "up" || axeUF < -0.5) { 
		that.keys[38] = true;
		that.keys[40] = false;
		//that.trigger('whenKeyPressed', 38);
	} else if(usingTouch == "down" || axeUF > 0.5) {
		that.keys[40] = true;
		that.keys[38] = false;
		//that.trigger('whenKeyPressed', 40);
	} else {
		if(usingTouch == "up_cancel" || axeUF > -0.5) {
		  that.keys[38] = false;
		}
		if(usingTouch == "down_cancel" || axeUF < 0.5) {
		  that.keys[40] = false;
		}
	}
	if(usingTouch == "a" || but0&&but0.pressed) {
	    if(that.isRunning) {
		that.keys[g_a] = true;
		//that.trigger('whenKeyPressed', g_a);
	    } else {
		var g_ac = g_a;
		if (g_ac > 32) {
		    g_ac = String.fromCharCode(g_a);
		} else {
		   if (g_ac == 32) g_ac = "space";
		   if (g_ac == 17) g_ac = "ctrl";
		   if (g_ac == 13) g_ac = "enter";
		}
		var keyDefine = prompt("Button A is currently set to emulate " + g_ac + "\n\nPlease press new key for Button A to emulate (or type ctrl, enter):","");
		if (keyDefine) {
			that.keys[g_a] = false;
			g_a = (keyDefine == "enter") ? 13 : (keyDefine == "ctrl") ? 17 : keyDefine.toUpperCase().charCodeAt(0);
			try {
			    stage.start();
			    document.querySelector('.play').className = 'pause';
			} catch(e){}
		} 
	    }
	} else {
		that.keys[g_a] = false;
	}
	if(usingTouch == "b" || but1&&but1.pressed) {
	    if(that.isRunning) {
		that.keys[g_b] = true;
		//that.trigger('whenKeyPressed', g_b);
	    } else {
		var g_bc = g_b;
		if (g_bc > 32) {
		    g_bc = String.fromCharCode(g_b);
		} else {
		   if (g_bc == 32) g_bc = "space";
		   if (g_bc == 17) g_bc = "ctrl";
		   if (g_bc == 13) g_bc = "enter";
		}
		var keyDefine = prompt("Button B is currently set to emulate " + g_bc + "\n\nPlease press new key for Button B to emulate (or type ctrl, enter):","");
		if (keyDefine) {
			that.keys[g_b] = false;
			g_b = (keyDefine == "enter") ? 13 : (keyDefine == "ctrl") ? 17 : keyDefine.toUpperCase().charCodeAt(0);
			try {
			    stage.start();
			    document.querySelector('.play').className = 'pause';
			} catch(e){}
		} 
	    }
	} else {
		that.keys[g_b] = false;
	}
	if (start&&start.pressed) {
		//window.location.reload();
	}
}
