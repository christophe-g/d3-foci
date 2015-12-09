(function test() {



  var width = 600,
    height = 600,
    colors = d3.scale.cubehelix()
    .domain([0, .5, 1])
    .range([
      d3.hsl(-100, 0.75, 0.35),
      d3.hsl(80, 1.50, 0.80),
      d3.hsl(260, 0.75, 0.35)
    ]);

  var setChar = 'ABCDEFGHIJKLMN',
    charFn = i => setChar[i],
    setLength = 4,
    sets = d3.range(setLength).map(function(d, i) {
      return setChar[i]
    })

  var opts = {
    dataLength: 120,
    setLength: setLength,
    duration: 800,
    circleOpacity: 0.4,
    innerOpacity: 0.2
  };

  var forceOpts = {
    linkDistance: 10,
    linkStrength: 2,

    // charge: -30,
    gravity: 0.1,
    theta: 1

  }

  function resetColorScale() {
    var l = layout.sets().values().length;
    colors = colors.domain([0, l / 2, l])
  }

  // Build simple getter and setter Functions
  for (var key in opts) {
    test[key] = getSet(key, test).bind(opts);
  }
  for (var key in forceOpts) {
    test[key] = getSet(key, test).bind(forceOpts);
  }

  function getSet(option, component) {
    return function(_) {
      if (!arguments.length) {
        return this[option];
      }
      this[option] = _;
      return component;
    };
  }

  function refreshInput() {
    var sel = d3.select(this),
      name = sel.attr("name"),
      value = sel.property("value")
    test[name](value);
    if (name == 'dataLength' || name == 'setLength') {
      if (name == 'setLength') {
        globalData = [] // we reshuffle everything
      }
      return refresh(generateData())
    }
    refresh();
  }

  function refreshForce() {
    var sel = d3.select(this),
      name = sel.attr("name"),
      value = sel.property("value")
    test[name](value);
    if (layout) {
      var force = layout.force();
      if (force[name]) {
        force[name](value);
        layout.start();
        // force.start().on('end.force', function() {
        //     refresh()
        //   })
        // refresh();
      }
    }
  }

  function binder(obj) {
    return function() {
      var sel = d3.select(this),
        name = sel.attr("name");
      if (obj[name]) {
        sel.property("value", obj[name]())
      }
    }
  }



  //set input value accorging to options and handle change of input
  d3.selectAll('#inputs input')
    .each(binder(test))
    .on('input', refreshInput)

  d3.selectAll('#force input')
    .each(binder(test))
    .on('input', refreshForce)

  var layout = d3.layout.foci()
    .size([width, height])

  var svg = d3.select('svg')
    .attr('width', width)
    .attr('height', height),
    isFirstLayout = true;

  var linkNodeContainer = svg.append("g")
    .attr("class", "link-node-container")

  var svgDefs = svg.append("defs")

  var globalData = [],
    generator = 0;

  function generateData() {
    var dataLength = test.dataLength(),
      setLength = test.setLength(),
      diff = dataLength - globalData.length;

    if (diff > 0) {

      globalData = globalData.concat(d3.range(diff).map((d, i) => {
        var l = Math.floor((Math.random() * setLength / 2) + 1),
          set = [],
          c,
          i;
        for (i = -1; ++i < l;) {
          c = charFn(Math.floor((Math.random() * setLength)));
          if (set.indexOf(c) == -1) {
            set.push(c)
          }
        }
        return {
          set: set,
          r: 8,
          name: 'node_' + generator++
        }
      }))
    } else {
      globalData.splice(0, -diff);
    }
    return globalData;
  }

  function refresh(data) {
    if (data) {
      // we recalculate the layout for new data only
      layout.nodes(data)
      resetColorScale();
    }
    var setData = layout.sets().values();
    var vennArea = svg.selectAll("g.venn-area")
      .data(setData, function(d) {
        return d.__key__;
      });

    var vennEnter = vennArea.enter()
      .append('g')
      .attr("class", function(d) {
        return "venn-area venn-" +
          (d.sets.length == 1 ? "circle" : "intersection");
      })
      .attr('fill', function(d, i) {
        return colors(i)
      })

    vennEnter.append('circle')
      .attr('class', 'venn-area-path')
      .attr('r', 25)
      // .call(layout.force().drag)

    vennEnter.append('circle')
      .attr('class', 'inner')
      .attr('fill', 'grey');

    vennEnter.append("text")
      .attr("class", "label")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")

    var link = linkNodeContainer.selectAll('.link')
      .data(layout.fociLinks());

    link.enter().append('line')
      .attr('class', 'link')
      // .attr('stroke', "#AAA")
      .attr('stroke', function(d) {
        return "url(#" + d.source.__key__ + '__' + d.target.__key__ + ")"
      })
      .attr('stroke-dasharray', "10,10")
      .attr("stroke-width", 5);

    link.exit().remove()

    var linkNode = linkNodeContainer.selectAll('.link-node')
      .data(layout.nodeLinks());

    linkNode.enter().append('line')
      .attr('class', 'link-node')
      .attr('stroke', "#bbb")
      .attr("stroke-width", 1);

    linkNode.exit().remove()

    var vennAreaLabel = vennArea.selectAll("text.label").data(function(d) {
      return [d];
    }).text(function(d) {
      return d.__key__;
    })
    var vennAreaCircle = vennArea.selectAll('circle.venn-area-path').data(function(d) {
        return [d];
      }).text(function(d) {
        return d.__key__;
      })
      .attr('opacity', test.circleOpacity())

    layout.on('end', function() {

      vennAreaLabel
        .attr("x", function(d) {
          // return d.x;
          return d.center.x
        })
        .attr("y", function(d) {
          // return d.y
          return d.center.y
        });

      vennAreaCircle.attr("cx", function(d) {
          // return d.x;
          return d.center.x
        })
        .attr("cy", function(d) {
          // return d.y;
          return d.center.y
        });

      link
        .attr('x1', function(d) {
          return d.source.x;
        })
        .attr('y1', function(d) {
          return d.source.y;
        })
        .attr('x2', function(d) {
          return d.target.x;
        })
        .attr('y2', function(d) {
          return d.target.y;
        });


      svgDefs.selectAll('.grad').remove()

      var grad = svgDefs.selectAll('.grad')
        .data(layout.fociLinks());

      var gradEnter = grad.enter()
        .append('linearGradient')
        .attr({
          id: function(d) {
            return d.source.__key__ + '__' + d.target.__key__
          },
          x1: '0%',
          x1: '0%',
          x2: '100%',
          y2: '0%',
        })
      gradEnter.append('stop')
        .attr({
          offset: '0%',
          'stop-color': function(d) {
            return colors(setData.indexOf(d.source.x < d.target.x ? d.source : d.target))
          }
        })

      gradEnter.append('stop')
        .attr({
          offset: '100%',
          'stop-color': function(d) {
            return colors(setData.indexOf(d.source.x <= d.target.x ? d.target : d.source))
              // return colors(setData.indexOf(d.target))
          }
        })


    })

    vennArea.exit().transition()
      .duration(test.duration())

    // .attrTween('d', function(d) {
    //   return d.d
    // })
    .remove()

    // need this so that nodes always on top
    var circleContainer = svg.selectAll("g.venn-circle-container")
      .data(layout.sets().values(), function(d) {
        return d.__key__;
      });

    circleContainer.enter()
      .append('g')
      .attr("class", "venn-circle-container")
      .attr('fill', function(d, i) {
        return colors(i)
      });
    circleContainer.exit().remove();

    // need this so that nodes always on top
    var circleContainer = svg.selectAll("g.venn-circle-container")
      .data(layout.sets().values(), function(d) {
        return d.__key__;
      });

    circleContainer.enter()
      .append('g')
      .attr("class", "venn-circle-container")
      .attr('fill', function(d, i) {
        return colors(i)
      });
    circleContainer.exit().remove();

    var points = circleContainer.selectAll("circle.node")
      .data(function(d) {
        return d.nodes
      }, function(d) {
        return d.name
      })

    var pointsEnter = points.enter()
      .append('circle')
      .attr('r', 0)
      .attr('class', 'node')
      .call(layout.packer().drag)

    points.transition()
      .duration(isFirstLayout ? 0 : test.duration())
      .attr('r', function(d) {
        return d.r
      })

    points.exit().transition()
      .attr('r', 0)
      .remove()

    isFirstLayout = false;

    // var foci = layout.force()
    // foci.nodes()


    //set the force ticker    
    layout.packingConfig({
      ticker: function() {
        points.attr("cx", function(d) {
            return d.x
          })
          .attr("cy", function(d) {
            return d.y
          })
        linkNode
          .attr('x1', function(d) {
            return d.source.x;
          })
          .attr('y1', function(d) {
            return d.source.y;
          })
          .attr('x2', function(d) {
            return d.target.x;
          })
          .attr('y2', function(d) {
            return d.target.y;
          });
      }
    })


    //start the force layout
    // var packer = layout.packer();

    // packer.on('tick', function() {
    //   points.attr("cx", function(d) {
    //       return d.x
    //     })
    //     .attr("cy", function(d) {
    //       return d.y
    //     })

    // }).start()
    // layout.start()
    return test
  }
  return refresh(generateData())
})();
