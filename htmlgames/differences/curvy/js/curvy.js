var ua = navigator.userAgent;
var isIE = ua.match("MSIE");s

var m = !0,
    o = !1,
    s = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
function (g) {
    window.setTimeout(g, 1E3 / 30)
};

function t(g, e, k, i, h) {
    function u(c, a) {
        c.beginPath();
        c.moveTo(a.a[0].x, a.a[0].y);
        c.lineTo(a.a[1].x, a.a[1].y);
        c.lineTo(a.a[2].x, a.a[2].y);
        c.lineTo(a.a[3].x, a.a[3].y);
        c.lineTo(a.a[4].x, a.a[4].y);
        c.lineTo(a.a[5].x, a.a[5].y);
        c.lineTo(a.a[0].x, a.a[0].y);
        c.strokeStyle = e.r;
        c.lineWidth = 2;
        c.stroke()
    }
    function j(c, a, b) {
        a.beginPath();
        a.moveTo(b.a[0].x, b.a[0].y);
        a.lineTo(b.a[1].x, b.a[1].y);
        a.lineTo(b.a[2].x, b.a[2].y);
        a.lineTo(b.a[3].x, b.a[3].y);
        a.lineTo(b.a[4].x, b.a[4].y);
        a.lineTo(b.a[5].x, b.a[5].y);
        a.lineTo(b.a[0].x, b.a[0].y);
        a.fillStyle = e.I;
        a.fill();
        var f = m,
            d = 0,
            g = [-1, -1, -1, -1, -1, -1];
        a.lineWidth = b.lineWidth;
        for (var h = 0; 6 > h; h++) if (f = m, 0 != c.f[h]) {
            for (var i = 1; 4 > i; i++) {
                if (c.f[(h + i) % 6] == c.f[h]) {
                    g[h] = (h + i) % 6;
                    f = o;
                    break
                }
                if (c.f[(6 + h - i) % 6] == c.f[h]) {
                    g[h] = (6 + h - i) % 6;
                    f = o;
                    break
                }
            }
            f && (g[h] = h)
        }
        a.save();
        a.rotate(z(60 * c.orientation));
        a.rotate(z(120));
        for (h = 0; 6 > h; h++) {
            f = (h + c.orientation) % 6;
            if (0 != c.f[f]) if (a.strokeStyle = e.s[c.f[f]], g[f] == f) {
                var i = b.c[4].x * (4 - d) / 6,
                    j = b.c[4].y * (4 - 1.5 * d) / 6;
                a.beginPath();
                a.moveTo(b.c[4].x, b.c[4].y);
                a.lineTo(i, j);
                i = Math.sqrt(Math.pow(i, 2) + Math.pow(j, 2));
                a.moveTo(i, 0);
                a.arc(0, 0, i, 0, 1.5 * Math.PI, o);
                a.stroke();
                a.beginPath();
                a.strokeStyle = e.s[c.f[f]];
                a.arc(0, 0, i, Math.PI, 3 * Math.PI, o);
                a.stroke();
                a.beginPath();
                d++
            } else {
                if (g[(f + 1) % 6] == f || g[f] == (f + 1) % 6) a.save(), a.rotate(z(-60)), B(a, b.a[0].x, b.a[0].y, b.a[3].x + 2, b.a[4].y), a.beginPath(), a.moveTo(b.c[5].x, b.c[5].y), a.quadraticCurveTo(0, 0, b.c[0].x, b.c[0].y), a.stroke(), a.restore();
                if (g[(f + 2) % 6] == f || g[f] == (f + 2) % 6) a.save(), a.rotate(z(60)), B(a, b.c[1].x - b.b / 4, b.c[1].y, b.a[3].x, b.c[4].y), a.beginPath(), a.moveTo(b.c[3].x, b.c[3].y), a.quadraticCurveTo(0, 0, b.c[5].x, b.c[5].y), a.stroke(), a.restore();
                if (g[(f + 3) % 6] == f || g[f] == (f + 3) % 6) a.save(), B(a, b.a[0].x, b.a[0].y - b.b / 8, b.a[4].x, b.a[4].y), a.beginPath(), a.moveTo(b.c[4].x, b.c[4].y), a.quadraticCurveTo(0, 0, b.c[1].x, b.c[1].y), a.stroke(), a.restore();
                if (g[(f + 4) % 6] == f || g[f] == (f + 4) % 6) a.save(), a.rotate(z(-60)), B(a, b.a[0].x, b.c[1].y, b.c[1].x + b.b / 4, b.c[4].y), a.beginPath(), a.moveTo(b.c[5].x, b.c[5].y), a.quadraticCurveTo(0, 0, b.c[3].x, b.c[3].y), a.stroke(), a.restore();
                if (g[(f + 5) % 6] == f || g[f] == (f + 5) % 6) a.save(), a.rotate(z(60)), B(a, b.a[0].x, b.a[0].y - 1, b.a[3].x, b.c[4].y), a.beginPath(), a.moveTo(b.c[3].x, b.c[3].y), a.quadraticCurveTo(0, 0, b.c[2].x, b.c[2].y), a.stroke(), a.restore()
            }
            a.rotate(z(60))
        }
        a.restore()
    }
    function A(c, a, b) {
        a || (a = 0);
        c.save();
        c.translate(0, b.m);
        c.rotate(a);
        c.beginPath();
        c.moveTo(b.a[0].x, b.a[0].y);
        c.lineTo(b.a[1].x, b.a[1].y);
        c.lineTo(b.a[2].x, b.a[2].y);
        c.lineTo(b.a[3].x, b.a[3].y);
        c.lineTo(b.a[4].x, b.a[4].y);
        c.lineTo(b.a[5].x, b.a[5].y);
        c.lineTo(b.a[0].x, b.a[0].y);
        c.fillStyle = e.t;
        c.fill();
        c.strokeStyle = e.r;
        c.stroke();
        c.restore()
    }
    function D(c, a) {
        if (!p) {
            p = m;
            var b = l.d[n[0]][n[1]],
                f = c.getContext("2d"),
                d = a.b + b.k * (3 * a.b / 2),
                g = F(b.k, b.l, a);
            if (!isNaN(q)) {
                f.save();
                f.translate(a.i, a.j);
                f.beginPath();
                f.save();
                B(f, d - 1.5 * a.b, g - 1.5 * a.b, d + 1.5 * a.b, g + 1.5 * a.b);
                f.fillRect(d - a.b, g - a.b - a.m, 2 * a.b, 2 * a.b + a.m);
                for (d = 0; 6 > d; d++) if (b.e[d]) {
                    f.save();
                    var g = b.e[d].k,
                        e = b.e[d].l;
                    f.translate(a.b + 3 * a.h * g + 0.5, a.g * (2 * e + 1 - g) + 0.5);
                    A(f, 0, a);
                    f.restore()
                }
                f.restore();
                for (d = 0; 6 > d; d++) if (b.e[d]) f.save(), g = b.e[d].k, e = b.e[d].l, f.translate(a.b + 3 * a.h * g + 0.5, a.g * (2 * e + 1 - g) + 0.5), j(b.e[d], f, a), u(f, a), f.restore();
                g = b.k;
                e = b.l;
                f.save();
                f.translate(a.b + 3 * a.h * g + 0.5, a.g * (2 * e + 1 - g) + 0.5);
                f.translate(0, -1 * a.m);
                A(f, q, a);
                f.rotate(q);
                j(b, f, a);
                u(f, a);
                f.restore();
                f.restore();
                p = o
            }
        }
    }
    var E = this,
        d = {},
        n, q = 0,
        l = {};
    e.s = e.lineColor;
    e.background = e.background;
    e.I = e.tileBackground;
    e.r = e.edge;
    e.t = e.bevel;
    var x = 0,
        C = 0,
        J = 0,
        y, p = o,
        r = {
            p: o,
            B: function (c) {
                var a;
                a: {
                    a = c.layerX;
                    c = c.layerY;
                    a -= d.i;
                    var c = c - d.j,
                        b = 2 * a / (3 * d.b),
                        f = b | 0,
                        e = b - 1 / 3 | 0,
                        b = c + d.height / (3 * d.b) * a,
                        b = b - d.height / 6,
                        b = b / d.height,
                        h = b | 0,
                        b = b - 1 / 3 | 0;
                    if (!(0 > b || 0 > e || e >= l.d.length || b >= l.d[e].length)) {
                        if (b == h && e == f) {
                            a = [e, b];
                            break a
                        }
                        for (; e <= f; e++) for (var i = b; i <= h; i++) if (Math.sqrt(Math.pow(a - (d.b + e * (3 * d.b / 2)), 2) + Math.pow(c - F(e, i, d), 2)) < d.height / 2 && e < l.d.length && i < l.d[e].length && 0 <= e && 0 <= i) {
                            a = [e, i];
                            break a
                        }
                    }
                    a = void 0
                }
                a && l.d[a[0]] && l.d[a[0]][a[1]] && (n = a, y = [d.b + a[0] * (3 * d.b / 2) + d.i, F(a[0], a[1], d) + d.j], D($(g)[0], d))
            },
            C: function (c) {
                if (y) {
                    var a = y[0] - c.layerX,
                        c = y[1] - c.layerY;
                    r.p ? q = -1 * Math.atan2(a, c) + r.H : Math.abs(a) < d.b / 2.5 && Math.abs(c) < d.b / 2.5 ? q = 0 : (r.H = Math.atan2(a, c), r.p = m)
                }
            },
            D: function () {
                r.p = o;
                y = void 0;
                I(l.d[n[0]][n[1]], Math.round(6 * q / (2 * Math.PI)) % 6)
            }
        };
    this.complete = function (c) {
        this.u = c
    };
    this.newpuzzle = this.A = function (c, a, b) {
        G = o;
        l = {};
        l = K(c, a, b);
        this.o()
    };
    this.prepicon = this.F = function () {
        l.d[0][0].f = [0, 1, 2, 1, 2, 2];
        L(0.45 * x, d);
        d.i = x - d.h * (3 * l.d.length + 1);
        d.i /= 2;
        d.i = Math.floor(d.i);
        d.j = C - d.g * 2 * l.d[0].length - d.m;
        d.j /= 2;
        d.j = Math.floor(d.j);
        n = [0, 0];
        q = 15 * Math.PI / 180;
        $(g).unbind("mouseup", this.n).unbind("mousemove", this.n).unbind("mousedown", this.n);
        D($(g)[0], d)
    };
    var G = o,
        H = o;
    this.q = function () {
        n && (r.C({
            layerX: window.v,
            layerY: window.w
        }), D($(g)[0], d), H && s(E.q))
    };
    this.z = function (c) {
        if (!c.layerX) c.layerX = c.clientX, c.layerY = c.clientY;
        window.v = c.layerX;
        window.w = c.layerY
    };
    this.n = function (c) {
        if (G) return o;
        if (!c.layerX) c.layerX = c.clientX, c.layerY = c.clientY;
        if ("mousemove" != c.type) if ("mousedown" == c.type) H = m, J = (new Date).getTime(), r.B(c), s(E.q);
        else if ("mouseup" == c.type) {
            H = o;
            if (!n) return;
            200 > (new Date).getTime() - J ? I(l.d[n[0]][n[1]], 1) : r.D(c);
            var a = l.d[n[0]][n[1]];
            q = 0;
            n = void 0;
            if (!p) {
                p = m;
                var c = [a.e[0], a.e[1], a.e[2], a, a.e[5], a.e[4], a.e[3]],
                    b = g.getContext("2d");
                b.fillStyle = e.background;
                var f = d.b + a.k * (3 * d.b / 2),
                    a = F(a.k, a.l, d);
                b.save();
                b.translate(d.i, d.j);
                b.save();
                B(b, f - 1.5 * d.b, a - 1.5 * d.b, f + 1.5 * d.b, a + 1.5 * d.b);
                b.fillRect(f - 1.5 * d.b, a - 1.5 * d.b, 3 * d.b, 3 * d.b);
                for (f = 0; 7 > f; f++) c[f] && (b.save(), b.translate(d.b + 3 * d.h * c[f].k + 0.5, d.g * (2 * c[f].l + 1 - c[f].k) + 0.5), A(b, 0, d), b.restore());
                b.restore();
                for (f = 0; f < c.length; f++) if (c[f]) {
                    var a = c[f],
                        h = d,
                        i = void 0,
                        i = g.getContext("2d");
                    i.save();
                    i.translate(h.b + 3 * h.h * a.k + 0.5, h.g * (2 * a.l + 1 - a.k) + 0.5);
                    j(a, i, h);
                    u(i, h);
                    i.restore()
                }
                b.restore();
                p = o
            }
            a: {
                for (c = 0; c < l.d.length; c++) for (b = 0; b < l.d[c].length; b++) if (!M(l.d[c][b])) {
                    c = o;
                    break a
                }
                c = m
            }
            c && (G = m, E.u())
        }
        return o
    };
    this.do_size = this.o = function () {
        var c = $(g),
            a = c.width(),
            c = c.height();
        x = a;
        C = c;
        a = Math.min(2 * a / (3 * l.d.length + 3), c / (2 * l.d[0].length + 1 + Math.sin(Math.PI / 3)) / Math.sin(2 * Math.PI / 6));
        L(a, d);
        d.i = x - d.h * (3 * l.d.length + 1);
        d.i /= 2;
        d.j = C - d.g * (2 * l.d[0].length + 1) - d.m;
        d.j /= 2;
        a = l;
        if (!p) {
            p = m;
            
	    // new
	    if(isIE){ // ie IE
            G_vmlCanvasManager.initElement(g);
	    }        
	    //   
            
            c = g.getContext("2d");
            c.fillStyle = e.background;
            c.fillRect(0, 0, x + 1, C + 1);
            for (var b = 0; b < a.d.length; b++) for (var f = 0; f < a.d[b].length; f++) c.save(), c.translate(d.i, d.j), a.d[b][f] && (c.translate(d.b + 3 * d.h * b + 0.5, d.g * (2 * f + 1 - b) + 0.5), A(c, 0, d)), c.restore();
            for (b = 0; b < a.d.length; b++) for (f = 0; f < a.d[b].length; f++) c.save(), c.translate(d.i, d.j), a.d[b][f] && (c.translate(d.b + 3 * d.h * b + 0.5, d.g * (2 * f + 1 - b) + 0.5), j(a.d[b][f], c, d), u(c, d)), c.restore();
            p = o
        }
    };
    l = K(k, i, h);
    $(g).mouseup(this.n).mousedown(this.n);
    $(g).mousemove(this.z);
    this.o()
}
t.prototype.G = function () {
    this.o()
};
t.redo_size = t.prototype.G;

function L(g, e) {
    e.b = g;
    e.lineWidth = 0.15 * g;
    e.g = e.b * Math.sin(2 * Math.PI / 6);
    e.h = e.b / 2;
    e.width = 2 * e.b;
    e.height = 2 * e.g;
    e.a = {
        "0": {
            x: -1 * e.b,
            y: 0
        },
        1: {
            x: -1 * e.h,
            y: -1 * e.g
        },
        2: {
            x: e.h,
            y: -1 * e.g
        },
        3: {
            x: e.b,
            y: 0
        },
        4: {
            x: e.h,
            y: e.g
        },
        5: {
            x: -1 * e.h,
            y: e.g
        }
    };
    e.c = {};
    for (var k = 0; 6 > k; k++) e.c[k] = {
        x: (e.a[k].x + e.a[(k + 1) % 6].x) / 2,
        y: (e.a[k].y + e.a[(k + 1) % 6].y) / 2
    };
    e.m = Math.min(5, 0.1 * e.height)
}
var N = {
    "0": [0, 1],
    1: [0, 0, 1, 1, 2, 2],
    2: [0, 1, 1, 1, 2, 2, 2, 2]
};

function K(g, e, k) {
    for (var i = [], k = N[k], h = 0; h < g; h++) {
        i[h] = [];
        for (var u = Math.floor((h + 1) / 2) + e, j = Math.floor((h + 1) / 2); j < u; j++) i[h][j] = {}, i[h][j].f = [0, 0, 0, 0, 0, 0], i[h][j].e = [], i[h][j].orientation = 0, i[h][j].k = h, i[h][j].l = j
    }
    for (h = 0; h < i.length; h++) for (j = 0; j < i[h].length; j++) if (g = i[h][j]) 0 != j && i[h][j - 1] && (g.e[1] = i[h][j - 1], g.e[1].e[4] = g), 0 != h && i[h - 1].length > j && i[h - 1][j] && (g.e[5] = i[h - 1][j], g.e[5].e[2] = g), 0 != h && 0 != j && i[h - 1].length > j - 1 && i[h - 1][j - 1] && (g.e[0] = i[h - 1][j - 1], g.e[0].e[3] = g);
    for (h = 0; h < i.length; h++) for (g = 0; g < i[h].length; g++) if (i[h][g]) for (j = 3; 6 > j; j++) i[h][g].e[j] && (e = Math.floor(Math.random() * k.length), i[h][g].f[j] = k[e], i[h][g].e[j].f[(j + 3) % 6] = k[e]);
    for (h = 0; h < i.length; h++) for (j = 0; j < i[h].length; j++) i[h][j] && I(i[h][j], Math.floor(6 * Math.random()) % 6);
    return {
        d: i
    }
}
function M(g) {
    if (!g) return m;
    for (var e = 0; 6 > e; e++) if (g.e[e]) {
        if (g.f[e] != g.e[e].f[(e + 3) % 6]) return o
    } else if (0 < g.f[e]) return o;
    return m
}

function I(g, e) {
    for (var k = [], i = 0; 6 > i; i++) k[i] = g.f[i];
    e = (6 - e % 6) % 6;
    for (i = 0; 6 > i; i++) g.f[i] = k[(i + e) % 6];
    g.orientation -= e;
    g.orientation += 6;
    g.orientation %= 6
}
function z(g) {
    return g / 180 * Math.PI
}
function B(g, e, k, i, h) {
    g.beginPath();
    g.rect(e, k, i - e, h - k);
    g.clip()
}
function F(g, e, k) {
    return k.height / 2 + e * k.height - k.height / 2 * g
}
window.Curvy = t;