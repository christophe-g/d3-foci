/*
lib for node packing algorithm
*/
// import {
//   SMALL,
//   containedInCircles,
//   distance
// }
// from "../venn.js/src/circleintersection.js";
import {
  binder,
  applier
}
from "./getSet.js";


// function called from d3.layout.venn 
// used to pack child nodes insiside inner circle of a venn set.
function pack(layout) {
  // var valueFn = layout.value();
  var packingConfig = layout.packingConfig();

  layout.sets().forEach(function(k, set) {
    // function pack(set, valueFn) {
    var innerRadius = set.innerRadius,
      center = set.center,
      children = set.nodes,
      x = center.x - innerRadius,
      y = center.y - innerRadius;

    applier(d3.layout.pack(), packingConfig)
      .size([innerRadius * 2, innerRadius * 2])
      .nodes({
        children: children
      });
    // translate the notes to the center    
    if (children) {
      children.forEach(function(n) {
        n.x += x;
        n.y += y;
      });
    }
  })
}



// apply a d3.fore layout with foci on venn area center to set foci
// d3.layout.venn.packCircles looks prettier.
function force(layout, data, links) {

  var force = layout.packer()
  if (!force) {
    force = d3.layout.force();
    binder(force, {
      padding: 3,
      maxRadius: 8,
      collider: true,
      ticker: null,
      ender : null,
      starter : null
    });
  }

  var packingConfig = layout.packingConfig(),
    size = layout.size(),
    sets = layout.sets(),

    padding = force.padding(), // separation between nodes
    maxRadius = force.maxRadius(),
    collider = force.collider;
  // foci = d3.map({}, function(d) {
  //   return d.__key__
  // });

  // layout.sets().forEach(function(set) {
  //   foci.set(set.__key__, set.center);
  // })

  applier(force, packingConfig)
    .nodes(data)
    .links(links || [])
    .gravity(0)
    .charge(0)
    .size(size)
    .on('start.__packer__', init)
    .on('tick.__packer__', tick)

  var ender ;
  if(ender = force.ender()) {
    force.on('end.__packer__', ender)
  }  

  function init(e) {
    // if(layout.__ended__) {
    data.forEach(function(d) {
        var center = sets.get(d.__setKey__);
        center = center.center || center;
        d.x = d.x ? d.x * 1 : center.x;
        d.y = d.y ? d.y * 1 : center.y;
      })
      var starter ;
       if(starter = force.starter()) {
        starter(layout)
       }
  }

  function tick(e) {
    var ticker;
    data
      .forEach(gravity(.2 * e.alpha))

    if (collider) {
      data
        .forEach(collide(.5))
    }
    if (ticker = force.ticker()) {
      ticker(layout)
    }
  }
  // Move nodes toward cluster focus.
  function gravity(alpha) {
    return function(d) {
      var center = sets.get(d.__setKey__);
      center = center.center || center;
      d.y += (center.y - d.y) * alpha;
      d.x += (center.x - d.x) * alpha;
    };
  }
  // Resolve collisions between nodes.
  function collide(alpha) {
    var quadtree = d3.geom.quadtree(data);
    return function(d) {
      var r = d.r + maxRadius + padding,
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;
      quadtree.visit(function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== d)) {
          var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = d.r + quad.point.r + (d.__setKey__ !== quad.point.__setKey__) * padding;
          if (l < r) {
            l = (l - r) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    };
  }
  return force;

}

export {
  pack, force
}
