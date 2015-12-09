import {
  binder,
  applier
}
from "./getSet.js";
import {
  force
}
from "./packStrategies.js";


export default function() {
  // d3.layout.foci = function() {

  var opts = {
    sets: null,
    links: [],
    chargeFactor : -70,
    iterationLength: 120,
    setsAccessor: setsAccessorFn,
    setsSize: setsSize,
    packingStragegy: force,
    packingConfig: {
      value: valueFn,
    },
    fociConfig: {
      linkStrength: 0.01,
      gravity: 0.1,
    },
    size: [1, 1]
  };

  var event = d3.dispatch("start", "tick", "end");
  // fociEvent = d3.dispatch("tick");

  var packer,
    centers ,
    nodeLinks,
    nodes;

  // var circles,
  //   nodes,
  //   centres;

  var fociForce = d3.layout.force().charge(function(d){
    return opts.chargeFactor * d.size
  }),
  // var fociForce = d3.layout.force(),
  fociLinks;

  // Build simple getter and setter Functions
  binder(foci, opts);


  //The layout function
  function foci(data) {
    if (!arguments.length) return nodes;
    nodes = compute(data);
    return foci;
  }

  function runForce() {
    event.start({type: "start"});

    var n = foci.iterationLength(),
      sets = foci.sets();

    packer.stop();
    //run the simulation n times
    fociForce.start();
    for (var i = n * n; i > 0; --i) fociForce.tick();
    fociForce.stop();

    sets.forEach(function(k, set) {
      centers.push(set.center = {
        x: set.x,
        y: set.y
      })
    });
    packer.start();
    event.end({type: "end"});
  }


  function compute(data) {
    var sets,
        setsValues,
      // layout = foci.layoutFunction(),
      packingStragegy = foci.packingStragegy();

    // foci.__ended__ = false;   
    centers = [];
    nodeLinks = [];
    fociLinks = [];

    sets = extractSets(data);
    setsValues = sets.values();

    applier(fociForce, opts.fociConfig);

    fociForce
      .size(foci.size())
      .nodes(setsValues)
      .links(fociLinks)


    packer = packingStragegy(foci, data, foci.links());

    // Use a timeout to allow the rest of the page to load first.
    setTimeout(function() {
      // Run the layout a fixed number of times.
      // The ideal number of times scales with graph complexity.
      // Of course, don't run too long—you'll hang the page!
      runForce();
    }, 10);
    
     // solution = layout(setsValues);

    console.info("data: ", data)
    console.info("sets: ", sets)
    console.info("links: ", fociLinks)



    return data
  }

  // loop over data and build the set so that they comply with https://github.com/benfred/foci.js
  /*
  from  data = [
      {"set":["A"],"name":"node_0"},
      {"set":["B"],"name":"node_1"},
      {"set":["B","A"],"name":"node_2"}
      {"set":["B","A"],"name":"node_3"}
      ]

  to sets = [ 
      {sets: ['A'], size: 1, nodes : ['node_0'], __key__: 'A'}, 
      {sets: ['B'], size: 1, nodes : ['node_1'],__key__: 'A'},
      {sets: ['A','B'], size: 2, nodes ['node_2', 'node_3'], __key__: 'A,B'}
      ];
      links : [
        {source: 'A', target: 'A,B', weight : 1}
        {source: 'B', target: 'A,B', weight : 1}
        ]
  */
  function extractSets(data) {
    var oldSets = foci.sets() ,
      sets = d3.map({}, function(d) {
        return d.__key__
      }),
      individualSets = d3.map(),
      accessor = foci.setsAccessor(),
      size = foci.setsSize(),
      set,
      s,
      key,
      i,
      n = data.length;

    //reset fociLink s
    
    for (i = -1; ++i < n;) {
      set = accessor(data[i]);
      if (set.length) {
        key = set.sort().join(','); //so taht we have the same key as in https://github.com/benfred/foci.js
        set.forEach(function(val) {
          if (s = individualSets.get(val)) {
            s.size += 1;
            // s.nodes.push([data[i]]);

          } else {
            individualSets.set(val, {
              __key__: val,
              size: 1,
              sets: [val],
              nodes: []
                // nodes: [data[i]]
            })
          }
        });
        data[i].__setKey__ = key;
        if (s = sets.get(key)) {
          s.size++;
          s.nodes.push(data[i]);
        } else {
          sets.set(key, {
            __key__: key,
            sets: set,
            size: 1,
            nodes: [data[i]]
          });
        }
      }

    }
    individualSets.forEach(function(k, v) {
      if (!sets.get(k)) {
        sets.set(k, v);
      }
    });
    // reset the size for each set. 
    sets.forEach(function(k, v) {
        v.size = size(v.size);
        if ((n = v.sets.length) && n != 1) {
          for (i = -1; ++i < n;) {
            fociLinks.push({
              source: sets.get(v.sets[i]),
              target: sets.get(k)
            })
          }
        }

        if(oldSets && (set = oldSets.get(k))){
          v.center = set.center;
          v.x = set.x;
          v.y = set.y;
        }
        v.nodes.forEach(function(n){
            i = v.sets.length;
            v.sets.forEach(function(v){
              nodeLinks.push({source: sets.get(v), target: n, size: i});
            })
        })

      })
      // sets = sets.values();

    foci.sets(sets);
    return sets;
  }

  function setsSize(size) {
    return size;
  }

  // data accessors 
  function setsAccessorFn(d) {
    return d.set || [];
  }

  function valueFn(d) {
    return d.value;
  }
  
  foci.packingConfig = function(_) {
    var config = opts.packingConfig;
    if (!arguments.length) {
      return config;
    }
    for (var k in _) {
      config[k] = _[k]
    }
    if (packer) {
      applier(packer, _)
    }
    return foci;

  };

  foci.fociConfig = function(_) {
    var config = opts.fociConfig;
    if (!arguments.length) {
      return config;
    }
    for (var k in _) {
      config[k] = _[k]
    }
    if (packer) {
      applier(fociForce, _)
    }
    return foci;
  };

  foci.force = function() {
    return fociForce;
  }

  foci.packer = function() {
    return packer;
  }

  foci.fociLinks = function() {
      return fociLinks;
    }

  foci.centers = function() {
    return centers;
  }
  
  foci.nodeLinks = function() {
    return nodeLinks;
  }

  foci.start = function() {
      runForce();
        // fociForce.start()
    }
  foci.nodes = foci;

  // return foci;
  // d3.rebind(fociForce, endFoci, 'on');
  return d3.rebind(foci, event, "on");
};
export {
  force
};
