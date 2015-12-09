! function() {
  function t(t) {
    return function(e, i) {
      e = d3.hsl(e), i = d3.hsl(i);
      var r = (e.h + 120) * a,
        h = (i.h + 120) * a - r,
        s = e.s,
        l = i.s - s,
        o = e.l,
        u = i.l - o;
      return isNaN(l) && (l = 0, s = isNaN(s) ? i.s : s), isNaN(h) && (h = 0, r = isNaN(r) ? i.h : r),
        function(a) {
          var e = r + h * a,
            i = Math.pow(o + u * a, t),
            c = (s + l * a) * i * (1 - i);
          return "#" + n(i + c * (-.14861 * Math.cos(e) + 1.78277 * Math.sin(e))) + n(i + c * (-.29227 * Math.cos(e) - .90649 * Math.sin(e))) + n(i + c * 1.97294 * Math.cos(e))
        }
    }
  }

  function n(t) {
    var n = (t = 0 >= t ? 0 : t >= 1 ? 255 : 0 | 255 * t).toString(16);
    return 16 > t ? "0" + n : n
  }
  var a = Math.PI / 180;
  d3.scale.cubehelix = function() {
    return d3.scale.linear().range([d3.hsl(300, .5, 0), d3.hsl(-240, .5, 1)]).interpolate(d3.interpolateCubehelix)
  }, d3.interpolateCubehelix = t(1), d3.interpolateCubehelix.gamma = t
}();